import React, { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

// Lightweight SPZ viewer: fetches a .spz (gzip), decompresses, scans for a long
// run of float triples, and renders them as Points. Uses DecompressionStream if
// available, otherwise falls back to pako (if present on window).

function useFetchAndExtract(url) {
  const [state, setState] = useState({ status: 'idle', count: 0, positions: null, error: null })

  useEffect(() => {
    let cancelled = false
    async function run() {
      setState({ status: 'loading', count: 0, positions: null, error: null })
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const ab = await res.arrayBuffer()
        const bytes = new Uint8Array(ab)
        // Detect gzip header
        let decompressed
        if (bytes[0] === 0x1f && bytes[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
          // use streaming API
          const ds = new DecompressionStream('gzip')
          const decompressedStream = new Response(new Blob([ab]).stream().pipeThrough(ds))
          const db = await decompressedStream.arrayBuffer()
          decompressed = new Uint8Array(db)
        } else if (window.pako && bytes[0] === 0x1f && bytes[1] === 0x8b) {
          // pako available
          decompressed = window.pako.ungzip(bytes)
        } else if (bytes[0] === 0x50 && bytes[1] === 0x4c && bytes[2] === 0x59) {
          // already PLY-like
          decompressed = bytes
        } else {
          throw new Error('No gzip support and not a plain PLY')
        }

        // scan for longest run of valid float triples (little-endian)
        const dv = new DataView(decompressed.buffer)
        const len = decompressed.length
        const step = 4096
        const block_triples = 2000
        const block_bytes = block_triples * 12
        let best = { start: -1, count: 0 }

        function isValidFloat(v) {
          return Number.isFinite(v) && Math.abs(v) < 1e4
        }

        for (let offset = 0; offset + block_bytes < len; offset += step) {
          let ok = 0
          for (let s = 0; s < 10; s++) {
            const i = offset + Math.floor((s * block_bytes) / 10)
            if (i + 12 > len) break
            const a = dv.getFloat32(i, true)
            const b = dv.getFloat32(i + 4, true)
            const c = dv.getFloat32(i + 8, true)
            if (isValidFloat(a) && isValidFloat(b) && isValidFloat(c)) ok++
          }
          if (ok >= 8) {
            // deeper scan inside block
            let pos = offset
            const limit = Math.min(offset + block_bytes, len)
            let cnt = 0
            let maxCnt = 0
            let maxStart = -1
            let startPos = -1
            while (pos + 12 <= limit) {
              const x = dv.getFloat32(pos, true)
              const y = dv.getFloat32(pos + 4, true)
              const z = dv.getFloat32(pos + 8, true)
              if (isValidFloat(x) && isValidFloat(y) && isValidFloat(z)) {
                if (cnt === 0) startPos = pos
                cnt++
                pos += 12
              } else {
                if (cnt > maxCnt) {
                  maxCnt = cnt
                  maxStart = startPos
                }
                cnt = 0
                pos += 12
              }
            }
            if (cnt > maxCnt) {
              maxCnt = cnt
              maxStart = startPos
            }
            if (maxCnt > best.count) {
              best = { start: maxStart, count: maxCnt }
            }
          }
        }

        if (best.count <= 0 || best.start < 0) throw new Error('No point-run found')

        // extract triples
        const positions = new Float32Array(best.count * 3)
        let p = 0
        for (let i = 0; i < best.count; i++) {
          const base = best.start + i * 12
          positions[p++] = dv.getFloat32(base, true)
          positions[p++] = dv.getFloat32(base + 4, true)
          positions[p++] = dv.getFloat32(base + 8, true)
        }

        if (!cancelled) setState({ status: 'done', count: best.count, positions, error: null })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', count: 0, positions: null, error: String(err) })
      }
    }
    run()
    return () => { cancelled = true }
  }, [url])

  return state
}

function PointsMesh({ positions }) {
  const count = positions.length / 3
  const posAttr = useMemo(() => positions, [positions])
  return (
    <Points positions={posAttr} limit={count} range={count}>
      <PointMaterial size={0.02} vertexColors={false} />
    </Points>
  )
}

export default function SPZViewer({ url = '/models/test.spz' }) {
  const { status, count, positions, error } = useFetchAndExtract(url)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 10, color: '#fff' }}>
        <div>SPZ Viewer — {status}</div>
        <div>{count} points</div>
        {error && <div style={{ color: 'salmon' }}>{error}</div>}
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        {positions && <PointsMesh positions={positions} />}
      </Canvas>
    </div>
  )
}
