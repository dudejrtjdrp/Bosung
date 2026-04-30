import { useMemo, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { createIntroController } from './introController'

export default function useIntroController(controlsRef) {
  const { camera } = useThree()

  const controller = useMemo(() => createIntroController({ camera, controlsRef }), [camera, controlsRef])

  useEffect(() => {
    return () => controller.stop()
  }, [controller])

  return controller
}
