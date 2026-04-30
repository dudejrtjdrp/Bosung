import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { gsap } from 'gsap'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const CameraTour = forwardRef(function CameraTour({ path = [], autoplay = false, loop = false }, ref) {
  const { camera, controls } = useThree()
  const tl = useRef(null)
  const timesRef = useRef([])

  useEffect(() => {
    if (!path || path.length === 0) return
    if (tl.current) {
      tl.current.kill()
      tl.current = null
    }

    const timeline = gsap.timeline({ paused: !autoplay, repeat: loop ? -1 : 0 })
    let cum = 0
    const times = []

    path.forEach((node, idx) => {
      const dur = typeof node.duration === 'number' ? node.duration : 2.0
      times.push(cum)
      // animate camera.position
      timeline.to(camera.position, {
        x: node.position[0],
        y: node.position[1],
        z: node.position[2],
        duration: dur,
        ease: 'power2.inOut',
        onUpdate: () => {
          // nothing else required; camera updates automatically
        }
      }, cum)

      // animate controls.target if available
      if (controls) {
        // ensure controls.target exists
        if (!controls.target) controls.target = new THREE.Vector3()
        timeline.to(controls.target, {
          x: node.target[0],
          y: node.target[1],
          z: node.target[2],
          duration: dur,
          ease: 'power2.inOut',
          onUpdate: () => controls.update()
        }, cum)
      }

      cum += dur
    })

    // final time marker
    times.push(cum)
    timesRef.current = times
    tl.current = timeline

    return () => {
      timeline.kill()
      tl.current = null
    }
  }, [path, autoplay, loop, camera, controls])

  // helper to find next/prev times
  function findNextTime(offset = 0.0001) {
    const t = tl.current?.time() ?? 0
    const times = timesRef.current
    for (let i = 0; i < times.length; i++) {
      if (times[i] > t + offset) return times[i]
    }
    return times[times.length - 1]
  }

  function findPrevTime(offset = 0.0001) {
    const t = tl.current?.time() ?? 0
    const times = timesRef.current
    for (let i = times.length - 1; i >= 0; i--) {
      if (times[i] < t - offset) return times[i]
    }
    return 0
  }

  useImperativeHandle(ref, () => ({
    play() { tl.current?.play() },
    pause() { tl.current?.pause() },
    stop() { tl.current?.pause(0) },
    next() {
      if (!tl.current) return
      const nt = findNextTime()
      tl.current.tweenTo(nt)
    },
    prev() {
      if (!tl.current) return
      const pt = findPrevTime()
      tl.current.tweenTo(pt)
    },
    goto(index) {
      const times = timesRef.current
      if (!times || index < 0 || index >= times.length - 1) return
      tl.current.tweenTo(times[index])
    },
    isPlaying() { return !!tl.current && !tl.current.paused() }
  }))

  return null
})

export default CameraTour
