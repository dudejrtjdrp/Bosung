import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

export default function useSceneLoadingManager() {
  const manager = useMemo(() => new THREE.LoadingManager(), [])
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let hasCompletedOnce = false

    manager.onStart = () => {
      if (hasCompletedOnce) return
      setActive(true)
    }

    manager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      if (hasCompletedOnce) return
      const percent = itemsTotal > 0 ? Math.round((itemsLoaded / itemsTotal) * 100) : 0
      setProgress(percent)
      setActive(true)
    }

    manager.onLoad = () => {
      if (!hasCompletedOnce) {
        hasCompletedOnce = true
        setProgress(100)
        setReady(true)
        setActive(false)
      }
    }

    manager.onError = () => {
      if (hasCompletedOnce) return
      // Keep UI responsive even if one asset fails. The manager still continues counting.
      setActive(true)
    }

    return () => {
      manager.onStart = null
      manager.onProgress = null
      manager.onLoad = null
      manager.onError = null
    }
  }, [manager])

  return {
    manager,
    progress,
    active,
    ready
  }
}
