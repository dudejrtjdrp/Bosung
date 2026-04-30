import { gsap } from 'gsap'
import * as THREE from 'three'

function toVector3(input, fallback = [0, 0, 0]) {
  if (!input) return new THREE.Vector3(...fallback)
  if (input.isVector3) return input.clone()
  if (Array.isArray(input)) return new THREE.Vector3(input[0], input[1], input[2])
  return new THREE.Vector3(input.x ?? fallback[0], input.y ?? fallback[1], input.z ?? fallback[2])
}

function getLookAtPosition(camera, targetPosition, lookAt, offset) {
  const target = toVector3(lookAt ?? targetPosition)

  if (offset) {
    return toVector3(offset).add(target)
  }

  const direction = camera.position.clone().sub(target)
  if (direction.lengthSq() < 1e-6) {
    direction.set(0.6, 0.35, 0.6)
  }
  direction.normalize()

  const distance = Math.max(camera.position.distanceTo(target), 1.2)
  return target.clone().add(direction.multiplyScalar(distance))
}

export function createCameraMoveController({ camera, controlsRef }) {
  let activeTween = null

  function stop() {
    if (activeTween) {
      activeTween.kill()
      activeTween = null
    }
  }

  function moveTo({
    position,
    lookAt,
    offset,
    duration = 1.4,
    ease = 'power2.inOut',
    onComplete
  } = {}) {
    if (!position) return Promise.resolve(false)

    stop()

    const controls = controlsRef?.current ?? null
    const targetPosition = toVector3(position)
    const destination = getLookAtPosition(camera, targetPosition, lookAt, offset)
    const targetLookAt = toVector3(lookAt ?? targetPosition)

    const cameraState = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const targetState = controls
      ? { x: controls.target.x, y: controls.target.y, z: controls.target.z }
      : { x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z }

    return new Promise((resolve) => {
      const proxy = { x: targetState.x, y: targetState.y, z: targetState.z }
      activeTween = gsap.timeline({ defaults: { duration, ease }, overwrite: 'auto' })

      activeTween.to(cameraState, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        onUpdate: () => {
          camera.position.set(cameraState.x, cameraState.y, cameraState.z)
          if (!controls) {
            camera.lookAt(proxy.x, proxy.y, proxy.z)
          }
        }
      }, 0)

      activeTween.to(proxy, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        onUpdate: () => {
          if (controls) {
            controls.target.set(proxy.x, proxy.y, proxy.z)
            controls.update()
          } else {
            camera.lookAt(proxy.x, proxy.y, proxy.z)
          }
        }
      }, 0)

      activeTween.call(() => {
        activeTween = null
        camera.updateMatrixWorld()
        if (controls) controls.update()
        onComplete?.()
        resolve(true)
      })
    })
  }

  function isMoving() {
    return activeTween !== null
  }

  return {
    moveTo,
    stop,
    isMoving
  }
}
