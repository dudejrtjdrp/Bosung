import React, { useMemo } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import * as THREE from 'three'

const vertexShader = `
precision highp float;
attribute float aRadius;
attribute vec3 aColor;
varying vec3 vColor;
uniform float sizeFactor;
void main() {
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // perspective-correct point size using projection matrix
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
  // gl_PointCoord ranges [0,1]
  vec2 uv = gl_PointCoord - vec2(0.5);
  float r2 = dot(uv, uv) * 4.0; // normalize to [0,1]
  // Gaussian falloff
  float g = exp(-r2 * sharpness);
  if (g < 0.01) discard;
  gl_FragColor = vec4(vColor * g, g * opacity);
}
`

export default function SplatLoader({ url = '/models/sample.ply', sizeFactor = 1.0, sharpness = 3.0, defaultRadius = 0.02, opacity = 1.0 }) {
  const { size } = useThree()
  // useLoader is async-friendly in r3f; it caches results
  const geometry = useLoader(PLYLoader, url)

  const { bufferGeometry, material } = useMemo(() => {
    const geom = geometry.clone()

    // Ensure position attribute exists
    const posAttr = geom.getAttribute('position')
    if (!posAttr) return { bufferGeometry: geom }

    // Colors: try common attribute names
    let colorAttr = geom.getAttribute('color') || geom.getAttribute('colors')
    if (!colorAttr) {
      // if missing, create a default white color array
      const count = posAttr.count
      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        colors[i * 3 + 0] = 1.0
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      }
      colorAttr = new THREE.Float32BufferAttribute(colors, 3)
      geom.setAttribute('color', colorAttr)
    } else {
      // normalize color if in 0-255 range
      const arr = colorAttr.array
      let max = 0
      for (let i = 0; i < arr.length; i++) max = Math.max(max, arr[i])
      if (max > 1.1) {
        // convert to 0..1 floats
        const normalized = new Float32Array(arr.length)
        for (let i = 0; i < arr.length; i++) normalized[i] = arr[i] / 255.0
        geom.setAttribute('color', new THREE.Float32BufferAttribute(normalized, 3))
      }
    }

    // Radius attribute: try common names from Gaussian PLY exports
    let radiusAttr = geom.getAttribute('radius') || geom.getAttribute('r') || geom.getAttribute('sigma') || geom.getAttribute('s')
    if (!radiusAttr) {
      // fallback: create attribute with defaultRadius
      const count = posAttr.count
      const radii = new Float32Array(count)
      for (let i = 0; i < count; i++) radii[i] = defaultRadius
      geom.setAttribute('aRadius', new THREE.Float32BufferAttribute(radii, 1))
    } else {
      // ensure attribute is named `aRadius` and convert if needed
      if (radiusAttr.itemSize !== 1) {
        // try to extract scalar from vec3
        const count = posAttr.count
        const radii = new Float32Array(count)
        for (let i = 0; i < count; i++) radii[i] = radiusAttr.array[i]
        geom.setAttribute('aRadius', new THREE.Float32BufferAttribute(radii, 1))
      } else {
        geom.setAttribute('aRadius', new THREE.Float32BufferAttribute(new Float32Array(radiusAttr.array), 1))
      }
    }

    // Build shader material
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true,
      uniforms: {
        sizeFactor: { value: sizeFactor },
        sharpness: { value: sharpness },
        opacity: { value: opacity }
      }
    })

    // improve performance
    geom.computeBoundingSphere()

    return { bufferGeometry: geom, material: mat }
  }, [geometry, sizeFactor, sharpness, opacity, defaultRadius])

  return (
    <points geometry={bufferGeometry} frustumCulled={true}>
      <primitive object={material} attach="material" />
    </points>
  )
}
