import React from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'

export default function Hotspot({ hotspot, onClick }) {
  const { position, title } = hotspot

  return (
    <group position={position}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(hotspot) }}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color="#ff6" emissive="#553" emissiveIntensity={0.4} />
      </mesh>
      <Html distanceFactor={8} style={{ pointerEvents: 'none' }} position={[0, 0.08, 0]}>
        <div style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
          {title}
        </div>
      </Html>
    </group>
  )
}
