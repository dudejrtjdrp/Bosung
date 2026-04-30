import { gsap } from 'gsap'
import * as THREE from 'three'

function toVector3(input, fallback = [0, 0, 0]) {
  if (!input) return new THREE.Vector3(...fallback)
  if (input.isVector3) return input.clone()
  if (Array.isArray(input)) return new THREE.Vector3(input[0], input[1], input[2])
  return new THREE.Vector3(input.x ?? fallback[0], input.y ?? fallback[1], input.z ?? fallback[2])
}

export function createIntroController({ camera, controlsRef }) {
  let activeTween = null

  function stop() {
    if (activeTween) {
      activeTween.kill()
      activeTween = null
    }
  }

  function start({
    startPosition = [0.5, 1.9, 6.0],
    startLookAt = [0, 1.2, 0],
    endPosition = [0, 1.6, 3.2],
    endLookAt = [0, 1.2, 0],
    duration = 2.4,
    ease = 'power3.inOut',
    onComplete
  } = {}) {
    stop()

    const controls = controlsRef?.current ?? null
    const cameraStart = toVector3(startPosition)
    const cameraEnd = toVector3(endPosition)
    const lookStart = toVector3(startLookAt)
    const lookEnd = toVector3(endLookAt)

    camera.position.copy(cameraStart)
    if (controls) {
      controls.target.copy(lookStart)
      controls.enabled = false
      controls.update()
    } else {
      camera.lookAt(lookStart)
    }

    const cameraState = { x: cameraStart.x, y: cameraStart.y, z: cameraStart.z }
    const targetState = { x: lookStart.x, y: lookStart.y, z: lookStart.z }

    return new Promise((resolve) => {
      activeTween = gsap.timeline({ defaults: { duration, ease }, overwrite: 'auto' })

      activeTween.to(cameraState, {
        x: cameraEnd.x,
        y: cameraEnd.y,
        z: cameraEnd.z,
        onUpdate: () => {
          camera.position.set(cameraState.x, cameraState.y, cameraState.z)
          if (!controls) {
            camera.lookAt(targetState.x, targetState.y, targetState.z)
          }
        }
      }, 0)

      activeTween.to(targetState, {
        x: lookEnd.x,
        y: lookEnd.y,
        z: lookEnd.z,
        onUpdate: () => {
          if (controls) {
            controls.target.set(targetState.x, targetState.y, targetState.z)
            controls.update()
          } else {
            camera.lookAt(targetState.x, targetState.y, targetState.z)
          }
        }
      }, 0)

      activeTween.call(() => {
        activeTween = null
        if (controls) {
          controls.enabled = true
          controls.update()
        }
        camera.updateMatrixWorld()
        onComplete?.()
        resolve(true)
      })
    })
  }

  function isPlaying() {
    return activeTween !== null
  }

  return {
    start,
    stop,
    isPlaying
  }
}
