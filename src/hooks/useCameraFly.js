import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'

// Hook: useCameraFly(controlsRef?) -> returns flyTo({ position, lookAt, duration, offset })
export default function useCameraFly(controlsRef) {
  const { camera } = useThree()
  const tweenRef = useRef(null)

  useEffect(() => {
    return () => { if (tweenRef.current) { tweenRef.current.kill(); tweenRef.current = null } }
  }, [])

  function flyTo({ position, lookAt = null, duration = 1.4, offset = [0.6, 0.4, 0.6], easing = 'power2.inOut' } = {}) {
    if (!position) return Promise.resolve()
    // compute target camera position (offset from hotspot)
    const posVec = new THREE.Vector3(...position)
    const offsetVec = new THREE.Vector3(...offset)
    const targetPos = posVec.clone().add(offsetVec)

    const controls = controlsRef?.current
    const startCam = camera.position.clone()
    const startTarget = controls ? controls.target.clone() : new THREE.Vector3().copy(lookAt ? new THREE.Vector3(...lookAt) : posVec)
    const endTarget = lookAt ? new THREE.Vector3(...lookAt) : posVec.clone()

    // kill previous tween
    if (tweenRef.current) tweenRef.current.kill()

    return new Promise((resolve) => {
      const tl = gsap.timeline({ defaults: { ease: easing } })
      tweenRef.current = tl

      tl.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration,
        onUpdate: () => {
          // ensure camera matrices update
          camera.updateMatrixWorld()
        }
      }, 0)

      if (controls) {
        tl.to(controls.target, {
          x: endTarget.x,
          y: endTarget.y,
          z: endTarget.z,
          duration,
          onUpdate: () => controls.update()
        }, 0)
      } else {
        // if no controls, animate camera lookAt via a proxy and call lookAt onUpdate
        const proxy = { x: startTarget.x, y: startTarget.y, z: startTarget.z }
        tl.to(proxy, {
          x: endTarget.x,
          y: endTarget.y,
          z: endTarget.z,
          duration,
          onUpdate: () => {
            camera.lookAt(proxy.x, proxy.y, proxy.z)
          }
        }, 0)
      }

      tl.call(() => { tweenRef.current = null; resolve() })
    })
  }

  return flyTo
}
