import React from 'react'
import { useLoader } from '@react-three/fiber'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'

export default function GaussianLoader({ url = '/models/sample.ply', pointSize = 0.02 }) {
  const geometry = useLoader(PLYLoader, url)

  return (
    <points geometry={geometry} position={[0, 0, 0]}>
      <pointsMaterial size={pointSize} vertexColors sizeAttenuation={true} />
    </points>
  )
}
