import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import SplatLOD from './SplatLOD'
import CameraTour from './CameraTour'
import useCameraMove from '../hooks/useCameraMove'
import useIntroController from '../hooks/useIntroController'
import { HotspotLayer } from '../features/hotspots'
import * as THREE from 'three'
import { useTour } from '../features/tour'

const Scene = forwardRef(function Scene(props, ref) {
  const controlsRef = useRef()
  const cameraMove = useCameraMove(controlsRef)
  const intro = useIntroController(controlsRef)
  const tourRef = useRef()
  const { camera, scene } = useThree()
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  
  const tour = useTour({
    controlsRef,
    hotspots: props.hotspots,
    sequence: props.tourSequence,
    onChange: props.onTourChange
  })

  // Raycasting click handler
  useEffect(() => {
    const handleCanvasClick = (event) => {
      // Normalize mouse coordinates to NDC (Normalized Device Coordinates)
      const canvas = event.target
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      mouseRef.current.x = (x / rect.width) * 2 - 1
      mouseRef.current.y = -(y / rect.height) * 2 + 1

      // Perform raycasting
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const point = intersects[0].point
        console.log(
          `🎯 Click at: x=${point.x.toFixed(3)}, y=${point.y.toFixed(3)}, z=${point.z.toFixed(3)}`,
          {
            x: point.x,
            y: point.y,
            z: point.z,
            distance: intersects[0].distance,
            objectName: intersects[0].object.name || 'unnamed'
          }
        )
      }
    }

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick)
      return () => canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [camera, scene])

  useImperativeHandle(ref, () => ({
    flyTo(position) { cameraMove.moveTo({ position }) },
    startIntro: () => intro.start(props.intro),
    isIntroPlaying: () => intro.isPlaying(),
    startTour: () => tour.start(),
    nextTourStep: () => tour.next(),
    exitTour: () => tour.exit(),
    isTourActive: () => tour.isActive,
    playTour() { tourRef.current?.play() },
    pauseTour() { tourRef.current?.pause() },
    nextTour() { tourRef.current?.next() },
    prevTour() { tourRef.current?.prev() }
  }))

  function handleHotspotClick(hs) {
    cameraMove.moveTo({
      position: hs.position,
      lookAt: hs.position,
      offset: [0.7, 0.45, 0.7],
      duration: 1.45,
      ease: 'power2.inOut'
    })
    props.onHotspotSelect?.(hs)
  }

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <SplatLOD tilesUrl="/data/tiles.json" sizeFactor={props.splatSizeFactor ?? 1.0} reducedGpu={!!props.reducedGpu} maxConcurrent={props.splatMaxConcurrent ?? 2} manager={props.loadingManager} fileMode={props.fileMode ?? 'ply'} />
      <HotspotLayer hotspots={props.hotspots} onSelect={handleHotspotClick} disabled={!props.interactionsEnabled || tour.isActive || props.xrPresenting} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!!props.interactionsEnabled && !tour.isActive && !props.xrPresenting}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={!!props.interactionsEnabled && !props.xrPresenting}
        dampingFactor={0.08}
        touches={props.orbitTouchConfig ?? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <CameraTour ref={tourRef} path={props.path} autoplay={props.autoplay} loop={props.loop} />
      <Environment preset="sunset" />
    </>
  )
})

export default Scene
