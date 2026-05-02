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
      // For SPZ-only mode: do heuristic scan for float32 (x,y,z) runs and render those
      console.log('[Worker] 🔎 SPZ-only mode: scanning buffer for float32 runs')
      const dv = new DataView(processedBuffer)
      const totalLen = processedBuffer.byteLength
      const step = 4096
      const blockTriples = 2000
      const blockBytes = blockTriples * 12
      let best = { start: -1, count: 0 }

      function isValid(v) { return Number.isFinite(v) && Math.abs(v) < 1e4 }

      for (let offset = 0; offset + blockBytes < totalLen; offset += step) {
        let ok = 0
        for (let s = 0; s < 10; s++) {
          const i = offset + Math.floor((s * blockBytes) / 10)
          if (i + 12 > totalLen) break
          const a = dv.getFloat32(i, true)
          const b = dv.getFloat32(i + 4, true)
          const c = dv.getFloat32(i + 8, true)
          if (isValid(a) && isValid(b) && isValid(c)) ok++
        }
        if (ok >= 8) {
          let pos = offset
          const limit = Math.min(offset + blockBytes, totalLen)
          let cnt = 0, maxCnt = 0, maxStart = -1, startPos = -1
          while (pos + 12 <= limit) {
            const x = dv.getFloat32(pos, true)
            const y = dv.getFloat32(pos + 4, true)
            const z = dv.getFloat32(pos + 8, true)
            if (isValid(x) && isValid(y) && isValid(z)) {
              if (cnt === 0) startPos = pos
              cnt++
              pos += 12
            } else {
              if (cnt > maxCnt) { maxCnt = cnt; maxStart = startPos }
              cnt = 0
              pos += 12
            }
          }
          if (cnt > maxCnt) { maxCnt = cnt; maxStart = startPos }
          if (maxCnt > best.count) best = { start: maxStart, count: maxCnt }
        }
      }

      if (best.count <= 0 || best.start < 0) {
        throw new Error('SPZ-only mode: no valid float-run found')
      }

      console.log(`[Worker] 🧩 Found float-run at ${best.start} with ${best.count} triples — extracting`)
      const positions = new Float32Array(best.count * 3)
      const colors = new Float32Array(best.count * 3)
      const radii = new Float32Array(best.count)
      for (let i = 0; i < best.count; i++) {
        const base = best.start + i * 12
        const x = dv.getFloat32(base, true)
        const y = -dv.getFloat32(base + 4, true)
        const z = dv.getFloat32(base + 8, true)
        positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z
        colors[i*3] = 0.8; colors[i*3+1] = 0.8; colors[i*3+2] = 0.8
        radii[i] = 0.03
      }
      self.postMessage({ id, success: true, count: best.count, positions: positions.buffer, colors: colors.buffer, radii: radii.buffer }, [positions.buffer, colors.buffer, radii.buffer])
      return

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
