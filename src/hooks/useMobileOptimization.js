import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

function getIsMobile() {
  if (typeof navigator === 'undefined') return false
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
  const smallScreen = window.matchMedia?.('(max-width: 900px)')?.matches ?? false
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  return mobileUA || coarsePointer || smallScreen
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export default function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(getIsMobile())

  useEffect(() => {
    const update = () => setIsMobile(getIsMobile())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  const settings = useMemo(() => {
    const baseDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const maxDpr = isMobile ? 1.5 : 2
    const dpr = clamp(baseDpr, 1, maxDpr)

    return {
      isMobile,
      dpr,
      fpsLimit: isMobile ? 30 : 60,
      shadowEnabled: !isMobile,
      splatSizeFactor: isMobile ? 0.8 : 1.0,
      splatMaxConcurrent: isMobile ? 1 : 2,
      orbitTouchConfig: {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }
    }
  }, [isMobile])

  return settings
}
