import React, { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import Scene from './components/Scene'
import LoadingOverlay from './components/LoadingOverlay'
import './components/LoadingOverlay.css'
import IntroOverlay from './components/IntroOverlay'
import './components/IntroOverlay.css'
import MobileFrameLimiter from './components/MobileFrameLimiter'
import { InfoPanel, useHotspots, useHotspotSelection } from './features/hotspots'
import { StoryTourControls, TourProgressBar, useTourProgress } from './features/tour'
import useSceneLoadingManager from './hooks/useSceneLoadingManager'
import useMobileOptimization from './hooks/useMobileOptimization'
import cameraPath from './data/cameraPath.json'
import tourSequence from './features/tour/data/tourSequence.json'

export default function App() {
  const sceneRef = useRef()
  const hotspots = useHotspots()
  const { selectedHotspot, selectHotspot, clearHotspot } = useHotspotSelection()
  const { manager, progress, active, ready } = useSceneLoadingManager()
  const [introStarted, setIntroStarted] = useState(false)
  const [introFinished, setIntroFinished] = useState(false)
  const [tourState, setTourState] = useState({ active: false, phase: 'idle', currentIndex: -1, currentStep: null, total: tourSequence.length })
  const [fileMode, setFileMode] = useState('ply') // 'ply' or 'spz'
  const [xrPresenting, setXrPresenting] = useState(false)
  const mobile = useMobileOptimization()
  const tourProgress = useTourProgress({ tourState, sequence: tourSequence, hotspots })

  const introConfig = {
    startPosition: [-4, 3, 5],
    startLookAt: [-2, 0, 0],
    endPosition: [-3, 1.5, 4],
    endLookAt: [-2, 0, 0],
    duration: 2.4,
    ease: 'power3.inOut'
  }

  async function handleStartExperience() {
    if (introStarted) return
    setIntroStarted(true)
    await sceneRef.current?.startIntro?.()
    setIntroFinished(true)
  }

  return (
    <div className={`app-root ${ready ? 'app-root--ready' : 'app-root--loading'}`}>
      <LoadingOverlay progress={progress} active={active} />
      <IntroOverlay
        visible={ready && !introStarted}
        onStart={handleStartExperience}
        loading={!ready}
      />
      <Canvas
        camera={{ position: [-3, 1.5, 4], fov: 50 }}
        shadows
        dpr={1.0}
        frameloop="always"
        style={{ opacity: ready ? 1 : 0, pointerEvents: ready && introFinished ? 'auto' : 'none', transition: 'opacity 500ms ease' }}
        onCreated={({ gl }) => {
          // enable WebXR on the renderer and add the VR button
          gl.xr.enabled = true
          gl.setPixelRatio(mobile.dpr)
          gl.shadowMap.enabled = mobile.shadowEnabled
          try {
            // prefer local-floor reference space when available
            if (gl.xr.setReferenceSpaceType) gl.xr.setReferenceSpaceType('local-floor')
          } catch (e) {}
          const handleSessionStart = () => setXrPresenting(true)
          const handleSessionEnd = () => setXrPresenting(false)
          gl.xr.addEventListener('sessionstart', handleSessionStart)
          gl.xr.addEventListener('sessionend', handleSessionEnd)
          const btn = VRButton.createButton(gl)
          document.body.appendChild(btn)
        }}
      >
        <MobileFrameLimiter enabled={ready && !xrPresenting} fps={60} />
        <Suspense fallback={null}>
          <Scene
            ref={sceneRef}
            hotspots={hotspots}
            fileMode={fileMode}
            onHotspotSelect={selectHotspot}
            loadingManager={manager}
            onTourChange={setTourState}
            interactionsEnabled={introFinished}
            xrPresenting={xrPresenting}
            intro={introConfig}
            tourSequence={tourSequence}
            reducedGpu={true}
            splatSizeFactor={3.5}
            splatMaxConcurrent={1}
            orbitTouchConfig={mobile.orbitTouchConfig}
            path={cameraPath}
            autoplay={false}
            loop={false}
          />
        </Suspense>
      </Canvas>
      {/* Simple floating control to toggle PLY/SPZ rendering */}
      <div style={{ position: 'absolute', left: 16, top: 16, zIndex: 40 }}>
        <button
          onClick={() => setFileMode(m => (m === 'ply' ? 'spz' : 'ply'))}
          style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}
        >
          {fileMode === 'ply' ? 'View SPZ' : 'View PLY'}
        </button>
      </div>
      <InfoPanel hotspot={selectedHotspot} onClose={clearHotspot} />
      <TourProgressBar
        active={tourProgress.active}
        progress={tourProgress.progress}
        currentTitle={tourProgress.currentTitle}
        currentIndex={tourProgress.currentIndex}
        total={tourProgress.total}
        steps={tourProgress.steps}
      />
      <StoryTourControls
        tourState={tourState}
        onStart={() => sceneRef.current?.startTour?.()}
        onNext={() => sceneRef.current?.nextTourStep?.()}
        onExit={() => sceneRef.current?.exitTour?.()}
        disabled={!introFinished || xrPresenting}
      />
    </div>
  )
}
