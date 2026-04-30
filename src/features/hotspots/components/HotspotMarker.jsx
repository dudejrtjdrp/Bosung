import React, { useMemo, useRef } from 'react'
import { Billboard, Html, useCursor } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './HotspotMarker.css'

export default function HotspotMarker({
  hotspot,
  hovered = false,
  size = 0.06,
  onPointerOver,
  onPointerOut,
  onClick
}) {
  const { position, title } = hotspot
  const groupRef = useRef()
  const meshRef = useRef()
  const tooltipRef = useRef()
  const clickPulse = useRef(0)
  const basePosition = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position])
  const baseScale = hovered ? 1.2 : 1

  useCursor(hovered)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !meshRef.current) return

    const t = clock.getElapsedTime()
    const floatOffset = Math.sin(t * 2.1) * 0.035
    const hoverBoost = hovered ? 0.08 : 0
    clickPulse.current = Math.max(0, clickPulse.current - delta * 2.6)
    const clickBoost = clickPulse.current * 0.22

    groupRef.current.position.set(basePosition.x, basePosition.y + floatOffset, basePosition.z)
    const scale = baseScale + hoverBoost + clickBoost
    meshRef.current.scale.setScalar(scale)

    const material = meshRef.current.material
    if (material) {
      material.emissiveIntensity = hovered ? 1.0 : 0.55
      material.opacity = 1
    }

    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = hovered ? '1' : '0'
      tooltipRef.current.style.transform = hovered
        ? 'translate3d(0,0,0) scale(1)'
        : 'translate3d(0,-4px,0) scale(0.98)'
    }
  })

  function handleClick(e) {
    e.stopPropagation()
    clickPulse.current = 1
    onClick?.(e)
  }

  return (
    <group ref={groupRef} position={position}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <mesh
          ref={meshRef}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={handleClick}
        >
          <sphereGeometry args={[size, 16, 16]} />
          <meshStandardMaterial
            color={hovered ? '#ffd24d' : '#ffcc00'}
            emissive={hovered ? '#ffb347' : '#ff8800'}
            emissiveIntensity={0.55}
            transparent
            toneMapped={false}
          />
        </mesh>

        <mesh position={[0, 0, 0]} visible={hovered} scale={1.65}>
          <sphereGeometry args={[size * 1.35, 16, 16]} />
          <meshBasicMaterial
            color="#ffe08a"
            transparent
            opacity={hovered ? 0.18 : 0}
            depthWrite={false}
          />
        </mesh>

        <Html position={[0, size + 0.055, 0]} center style={{ pointerEvents: 'none' }}>
          <div ref={tooltipRef} className="hotspot-marker__tooltip">
            {title}
          </div>
        </Html>
      </Billboard>
    </group>
  )
}
