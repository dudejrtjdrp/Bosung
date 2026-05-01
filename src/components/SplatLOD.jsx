import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'

const vertexShader = `
precision highp float;
attribute float aRadius;
attribute vec3 aColor;
varying vec3 vColor;
uniform float sizeFactor;
void main() {
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float projScale = projectionMatrix[1][1];
  gl_PointSize = aRadius * (projScale / -mvPosition.z) * sizeFactor;
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = `
precision highp float;
varying vec3 vColor;
uniform float sharpness;
uniform float opacity;
void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float r2 = dot(uv, uv) * 4.0;
  float g = exp(-r2 * sharpness);
  if (g < 0.01) discard;
  
  vec3 color = vColor * 1.3;
  gl_FragColor = vec4(color, g * opacity);
}
`

function createMaterial({ sizeFactor = 1.0, sharpness = 3.0, opacity = 1.0 }) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      sizeFactor: { value: sizeFactor },
      sharpness: { value: sharpness },
      opacity: { value: opacity }
    }
  })
}

export default function SplatLOD({ tilesUrl = '/data/tiles.json', maxConcurrent = 2, sizeFactor = 1.0, manager, reducedGpu = false, fileMode = 'ply' }) {
  const { camera, scene } = useThree()
  const [tiles, setTiles] = useState([])
  const tilesRef = useRef(new Map())
  const workerRef = useRef(null)
  const loadingSet = useRef(new Set())
  const queue = useRef([])

  useEffect(() => {
    let mounted = true
    manager?.itemStart(tilesUrl)
    console.log('📦 Fetching tiles from:', tilesUrl)
    fetch(tilesUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (mounted) {
          console.log('✅ Tiles loaded:', data.length, 'tiles')
          // If fileMode requests SPZ, map .ply urls to .spz (or use id-specific mapping)
          const mapped = data.map(t => {
            const copy = { ...t }
            if (fileMode === 'spz') {
              // ID-based explicit mapping for SPZ files (fallback to extension swap)
              const idMap = {
                cactus: '/models/test.spz'
              }
              if (idMap[copy.id]) {
                copy.url = idMap[copy.id]
              } else if (copy.url && copy.url.endsWith('.ply')) {
                copy.url = copy.url.replace(/\.ply$/, '.spz')
              }
            }
            return copy
          })
          setTiles(mapped)
        }
      })
      .catch(err => {
        console.error('❌ Failed to load tiles:', err)
      })
      .finally(() => {
        manager?.itemEnd(tilesUrl)
      })
    return () => { mounted = false }
  }, [tilesUrl, manager, fileMode])

  // if fileMode changes we should clear any loaded objects and reset state
  useEffect(() => {
    // remove any existing objects from scene
    for (const [id, t] of tilesRef.current.entries()) {
      if (t && t.object) {
        scene.remove(t.object)
        if (t.object.geometry) t.object.geometry.dispose()
        if (t.object.material) t.object.material.dispose()
      }
    }
    tilesRef.current.clear()
    loadingSet.current.clear()
    queue.current = []
    setTiles([])
    loggedOnce.current = false
  }, [fileMode])

  useEffect(() => {
    // create worker
    workerRef.current = new Worker(new URL('../workers/ply.worker.js', import.meta.url), { type: 'module' })
    const w = workerRef.current
    w.onmessage = (e) => {
      const msg = e.data
      if (msg.success) {
        const id = msg.id
        const tile = tilesRef.current.get(id)
        if (!tile) return
        console.log(`✅ Loaded ${id}:`, msg.count, 'splats (after sampling)')
        // reconstruct typed arrays from transferred buffers
        const positions = new Float32Array(msg.positions)
        const colors = new Float32Array(msg.colors)
        const radii = new Float32Array(msg.radii)

        const geom = new THREE.BufferGeometry()
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
        geom.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1))
        geom.computeBoundingSphere()

        const material = createMaterial({ sizeFactor: reducedGpu ? sizeFactor * 0.82 : sizeFactor, sharpness: reducedGpu ? 2.4 : 3.0, opacity: reducedGpu ? 1.5 : 1.5 })
        const points = new THREE.Points(geom, material)
        points.frustumCulled = true
        points.userData = { id }
        tile.object = points
        scene.add(points)
        loadingSet.current.delete(id)
        manager?.itemEnd(tile.meta.url)
        processQueue()
      } else {
        console.error(`❌ Failed to load ${msg.id}:`, msg.message)
        // mark failed
        const failedTile = tilesRef.current.get(msg.id)
        if (failedTile?.meta?.url) {
          manager?.itemError(failedTile.meta.url)
          manager?.itemEnd(failedTile.meta.url)
        }
        loadingSet.current.delete(msg.id)
        processQueue()
      }
    }
    w.onerror = (err) => {
      console.error('🔴 Worker error:', err)
    }
    return () => { w.terminate(); workerRef.current = null }
  }, [scene, sizeFactor])

  function processQueue() {
    while (loadingSet.current.size < maxConcurrent && queue.current.length > 0) {
      const next = queue.current.shift()
      if (!next) break
      loadTile(next)
    }
  }

  function loadTile(tileMeta) {
    if (!workerRef.current) {
      console.warn('⚠️ Worker not ready for tile', tileMeta.id)
      return
    }
    const id = tileMeta.id
    if (loadingSet.current.has(id) || (tilesRef.current.get(id) && tilesRef.current.get(id).object)) return
    console.log(`📌 Requesting tile ${id}:`, tileMeta.url)
    loadingSet.current.add(id)
    manager?.itemStart(tileMeta.url)
    // register tile placeholder
    tilesRef.current.set(id, { meta: tileMeta, object: null })
    workerRef.current.postMessage({ id, url: tileMeta.url })
  }

  // frustum helper
  const frustum = useRef(new THREE.Frustum())
  const projScreenMatrix = useRef(new THREE.Matrix4())
  const loggedOnce = useRef(false)

  useFrame(() => {
    if (!tiles || tiles.length === 0) return
    
    // Log once on first frame
    if (!loggedOnce.current) {
      console.log('🎯 Camera at:', camera.position)
      console.log('📍 Tiles:', tiles)
      loggedOnce.current = true
    }
    
    // update frustum
    projScreenMatrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.current.setFromProjectionMatrix(projScreenMatrix.current)

    const camPos = camera.position
    for (const meta of tiles) {
      const id = meta.id
      const tile = tilesRef.current.get(id)
      // distance-based LOD: load when within radius * factor
      const center = new THREE.Vector3(meta.center[0], meta.center[1], meta.center[2])
      const dist = camPos.distanceTo(center)
      const threshold = Math.max(4, meta.radius * 3)
      if (dist < threshold) {
        // enqueue for load if not present
        if (!tile || !tile.object) {
          if (!loadingSet.current.has(id) && !queue.current.find(t => t.id === id)) {
            console.log(`📍 Tile ${id} in range (dist=${dist.toFixed(2)}, threshold=${threshold.toFixed(2)})`)
            queue.current.push(meta)
          }
        }
      } else {
        // optionally unload distant tiles to save memory
        if (tile && tile.object) {
          scene.remove(tile.object)
          if (tile.object.geometry) tile.object.geometry.dispose()
          if (tile.object.material) tile.object.material.dispose()
          tilesRef.current.set(id, { meta, object: null })
        }
      }

      // frustum culling per-tile
      if (tile && tile.object && tile.object.geometry && tile.object.geometry.boundingSphere) {
        const sphere = tile.object.geometry.boundingSphere.clone()
        sphere.applyMatrix4(tile.object.matrixWorld)
        const visible = frustum.current.intersectsSphere(sphere)
        tile.object.visible = visible
      }
    }

    processQueue()
  })

  return null
}
