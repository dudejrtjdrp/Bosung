/* eslint-disable no-restricted-globals */
// Binary + ASCII PLY parser for Gaussian Splatting

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const txt = await res.text()
  return { txt, status: res.status, contentType: res.headers.get('content-type') }
}

async function fetchArrayBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const buf = await res.arrayBuffer()
  // Provide diagnostic info if empty or unexpected
  if (!buf || buf.byteLength === 0) {
    const ct = res.headers.get('content-type') || 'unknown'
    throw new Error(`Empty response (0 bytes). HTTP ${res.status}. Content-Type: ${ct}`)
  }
  return { buf, status: res.status, contentType: res.headers.get('content-type') }
}

function parsePLYHeader(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  let i = 0
  if (!lines[i] || !lines[i].startsWith('ply')) throw new Error('Not a PLY file')

  let format = 'ascii'
  let vertexCount = 0
  const properties = []
  
  // Parse header
  for (i = 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (l.startsWith('format')) {
      format = l.split(/\s+/)[1]
    } else if (l.startsWith('element vertex')) {
      vertexCount = parseInt(l.split(/\s+/)[2])
    } else if (l.startsWith('property')) {
      const parts = l.split(/\s+/)
      properties.push({ type: parts[1], name: parts[2] })
    } else if (l === 'end_header') {
      i++
      break
    }
  }

  return { format, vertexCount, properties, headerEndLine: i }
}

function parsePLYBinary(arrayBuffer, headerText, samplingRate = 1) {
  const { format, vertexCount, properties } = parsePLYHeader(headerText)
  
  // Calculate property offsets and element size
  const propIndices = {}
  let stride = 0
  for (let i = 0; i < properties.length; i++) {
    propIndices[properties[i].name] = { index: i, offset: stride, type: properties[i].type }
    stride += 4 // All floats are 4 bytes
  }

  const headerLines = headerText.split('\n')
  let headerByteLength = 0
  for (const line of headerLines) {
    headerByteLength += line.length + 1 // +1 for newline
    if (line.trim() === 'end_header') break
  }

  const view = new DataView(arrayBuffer)
  const positions = []
  const colors = []
  const radii = []

  const xIdx = propIndices['x']?.offset ?? 0
  const yIdx = propIndices['y']?.offset ?? 4
  const zIdx = propIndices['z']?.offset ?? 8
  const f_dc_0_idx = propIndices['f_dc_0']?.offset ?? -1
  const f_dc_1_idx = propIndices['f_dc_1']?.offset ?? -1
  const f_dc_2_idx = propIndices['f_dc_2']?.offset ?? -1
  const opacityIdx = propIndices['opacity']?.offset ?? -1
  const scale_0_idx = propIndices['scale_0']?.offset ?? -1

  let offset = headerByteLength
  const isLittleEndian = format.includes('little')

  // f_dc 범위: -8 ~ 4
  // opacity 범위: -8 ~ 4
  const f_dc_min = -8, f_dc_max = 4

  for (let v = 0; v < vertexCount; v++) {
    if (v % samplingRate === 0) {
      // Position (Y 반전)
      const x = view.getFloat32(offset + xIdx, isLittleEndian)
      const y = -view.getFloat32(offset + yIdx, isLittleEndian) // Y 반전
      const z = view.getFloat32(offset + zIdx, isLittleEndian)

      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        positions.push(x, y, z)

        // Color from f_dc (정규화: -8~4 → 0~1)
        let r = 0.5, g = 0.5, b = 0.5
        if (f_dc_0_idx >= 0) {
          const val = view.getFloat32(offset + f_dc_0_idx, isLittleEndian)
          r = Math.max(0, Math.min(1, (val - f_dc_min) / (f_dc_max - f_dc_min)))
        }
        if (f_dc_1_idx >= 0) {
          const val = view.getFloat32(offset + f_dc_1_idx, isLittleEndian)
          g = Math.max(0, Math.min(1, (val - f_dc_min) / (f_dc_max - f_dc_min)))
        }
        if (f_dc_2_idx >= 0) {
          const val = view.getFloat32(offset + f_dc_2_idx, isLittleEndian)
          b = Math.max(0, Math.min(1, (val - f_dc_min) / (f_dc_max - f_dc_min)))
        }
        colors.push(r, g, b)

        // Radius from scale (exp of scale value)
        let rad = 0.01
        if (scale_0_idx >= 0) {
          const logScale = view.getFloat32(offset + scale_0_idx, isLittleEndian)
          rad = Math.exp(logScale) * 0.1
        }
        radii.push(Math.max(0.002, Math.min(0.5, rad)))
      }
    }

    offset += stride
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    radii: new Float32Array(radii),
    count: positions.length / 3
  }
}

function parsePLYASCII(text, samplingRate = 1) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  let i = 0
  if (!lines[i] || !lines[i].startsWith('ply')) throw new Error('Not a PLY file')

  let vertexCount = 0
  const properties = []
  
  // Parse header
  for (i = 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (l.startsWith('element vertex')) {
      vertexCount = parseInt(l.split(/\s+/)[2])
    } else if (l.startsWith('property')) {
      const parts = l.split(/\s+/)
      properties.push(parts[2])
    } else if (l === 'end_header') {
      i++
      break
    }
  }

  if (vertexCount === 0 || properties.length === 0) {
    throw new Error('Invalid PLY: no vertices or properties')
  }

  // Find property indices
  const idx = {
    x: properties.indexOf('x'),
    y: properties.indexOf('y'),
    z: properties.indexOf('z'),
    red: properties.indexOf('red'),
    green: properties.indexOf('green'),
    blue: properties.indexOf('blue'),
    r: properties.indexOf('r'),
    radius: properties.indexOf('radius'),
    sigma: properties.indexOf('sigma')
  }

  // Parse vertices with sampling
  const positions = []
  const colors = []
  const radii = []

  for (let v = 0; v < vertexCount && i < lines.length; v++, i++) {
    const line = lines[i].trim()
    if (!line) { v--; continue } // skip empty lines
    
    const parts = line.split(/\s+/).map(p => parseFloat(p))
    
    // Sample every Nth vertex
    if (v % samplingRate === 0) {
      // Position
      const px = parts[idx.x] ?? parts[0] ?? 0
      const py = parts[idx.y] ?? parts[1] ?? 0
      const pz = parts[idx.z] ?? parts[2] ?? 0
      
      if (!isNaN(px) && !isNaN(py) && !isNaN(pz)) {
        positions.push(px, py, pz)
        
        // Color
        let cr = 1, cg = 1, cb = 1
        if (idx.red >= 0 && idx.green >= 0 && idx.blue >= 0) {
          cr = Math.min(1, (parts[idx.red] ?? 255) / 255)
          cg = Math.min(1, (parts[idx.green] ?? 255) / 255)
          cb = Math.min(1, (parts[idx.blue] ?? 255) / 255)
        } else if (idx.r >= 0) {
          cr = cg = cb = Math.min(1, (parts[idx.r] ?? 255) / 255)
        } else if (parts.length >= 6) {
          cr = parts[3] > 1 ? parts[3] / 255 : parts[3]
          cg = parts[4] > 1 ? parts[4] / 255 : parts[4]
          cb = parts[5] > 1 ? parts[5] / 255 : parts[5]
        }
        colors.push(Math.max(0, Math.min(1, cr)), Math.max(0, Math.min(1, cg)), Math.max(0, Math.min(1, cb)))
        
        // Radius
        let rad = 0.02
        if (idx.radius >= 0) rad = parts[idx.radius] ?? 0.02
        else if (idx.sigma >= 0) rad = parts[idx.sigma] ?? 0.02
        radii.push(Math.max(0.001, Math.min(0.1, rad)))
      }
    }
  }

  const count = positions.length / 3
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    radii: new Float32Array(radii),
    count
  }
}

self.onmessage = async (e) => {
  const { id, url } = e.data
  try {
    console.log(`[Worker] 📥 Loading ${id} from ${url}`)
    
    // Fetch file
    const fetched = await fetchArrayBuffer(url)
    const arrayBuffer = fetched.buf
    console.log(`[Worker] 📄 Fetched ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB — Content-Type: ${fetched.contentType}`)

    // Handle possible compressed SPZ (gzip) files before parsing header
    let processedBuffer = arrayBuffer
    let view = new Uint8Array(processedBuffer)
    const isGzip = view[0] === 0x1f && view[1] === 0x8b
    if (isGzip || (typeof url === 'string' && url.toLowerCase().endsWith('.spz'))) {
      console.log('[Worker] 🗜️ Detected gzip/SPZ — attempting decompression')
      if (typeof DecompressionStream !== 'undefined') {
        try {
          const ds = new DecompressionStream('gzip')
          const decompressedStream = new Response(processedBuffer).body.pipeThrough(ds)
          processedBuffer = await new Response(decompressedStream).arrayBuffer()
          console.log(`[Worker] 🗜️ Decompressed to ${(processedBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`)
          view = new Uint8Array(processedBuffer)
        } catch (dErr) {
          throw new Error(`Failed to decompress gzip/SPZ: ${dErr.message}`)
        }
      } else {
        throw new Error('SPZ/gzip detected but DecompressionStream not available in this environment. Add pako or enable DecompressionStream.')
      }
    }

    // Parse header to check format
    // Decode a sufficiently large portion (or full buffer) so 'end_header' is found
    let headerDecoded
    try {
      headerDecoded = new TextDecoder().decode(view)
    } catch (e) {
      // Fallback to partial decode if full decode fails for any reason
      headerDecoded = new TextDecoder().decode(view.slice(0, Math.min(1024 * 1024, view.length)))
    }
    const headerIdx = headerDecoded.toLowerCase().indexOf('end_header')
    let headerText = headerIdx >= 0 ? headerDecoded.slice(0, headerIdx + 'end_header'.length) : headerDecoded
    
    // Quick validation: find 'ply' signature. it may not be at byte 0 (container wrapper).
    let plyOffsetInView = -1
    const headerLower = headerDecoded.toLowerCase()
    if (headerLower.includes('ply')) {
      plyOffsetInView = headerDecoded.toLowerCase().indexOf('ply')
    } else {
      // search whole buffer for ASCII 'ply' sequence
      const needle = [0x70, 0x6c, 0x79] // 'p','l','y'
      function indexOfSequence(hay, seq) {
        for (let i = 0; i <= hay.length - seq.length; i++) {
          let ok = true
          for (let j = 0; j < seq.length; j++) {
            if (hay[i + j] !== seq[j]) { ok = false; break }
          }
          if (ok) return i
        }
        return -1
      }
      plyOffsetInView = indexOfSequence(view, needle)
    }

    if (plyOffsetInView > 0) {
      console.log(`[Worker] 🔎 Found 'ply' signature at offset ${plyOffsetInView} — slicing buffer to start there`)
      // slice the processedBuffer from the ply signature forward for parsing
      processedBuffer = processedBuffer.slice(plyOffsetInView)
      view = new Uint8Array(processedBuffer)
      // Re-decode header from sliced buffer
      try {
        headerDecoded = new TextDecoder().decode(view)
      } catch (e) {
        headerDecoded = new TextDecoder().decode(view.slice(0, Math.min(1024 * 1024, view.length)))
      }
      const newHeaderIdx = headerDecoded.toLowerCase().indexOf('end_header')
      headerText = newHeaderIdx >= 0 ? headerDecoded.slice(0, newHeaderIdx + 'end_header'.length) : headerDecoded
    } else if (plyOffsetInView === -1) {
      const snippet = headerDecoded.slice(0, 256)
      throw new Error(`Not a PLY file — 'ply' signature not found. Snippet: ${snippet.replace(/\n/g, "\\n").slice(0,200)}`)
    }

    let parsed
    if (headerText.toLowerCase().includes('binary')) {
      console.log('[Worker] 🔄 Parsing BINARY PLY...')
      parsed = parsePLYBinary(processedBuffer, headerText, 2) // 50% sampling
    } else {
      console.log('[Worker] 🔄 Parsing ASCII PLY...')
      const text = new TextDecoder().decode(view)
      parsed = parsePLYASCII(text, 2)
    }
    
    console.log(`[Worker] ✅ Parsed ${parsed.count} splats`)
    
    // transfer buffers
    self.postMessage({ 
      id, 
      success: true, 
      count: parsed.count, 
      positions: parsed.positions.buffer, 
      colors: parsed.colors.buffer, 
      radii: parsed.radii.buffer 
    }, [parsed.positions.buffer, parsed.colors.buffer, parsed.radii.buffer])
  } catch (err) {
    console.error(`[Worker] ❌ Error: ${err.message}`)
    self.postMessage({ id, success: false, message: err.message })
  }
}
