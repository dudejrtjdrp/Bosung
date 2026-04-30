import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export default function MobileFrameLimiter({ enabled = false, fps = 30 }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!enabled) return undefined

    const frameDuration = 1000 / Math.max(1, fps)
    const timer = window.setInterval(() => {
      invalidate()
    }, frameDuration)

    return () => window.clearInterval(timer)
  }, [enabled, fps, invalidate])

  return null
}
