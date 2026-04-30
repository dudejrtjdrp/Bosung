import { useMemo, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { createCameraMoveController } from './cameraController'

export default function useCameraMove(controlsRef) {
  const { camera } = useThree()

  const controller = useMemo(() => {
    return createCameraMoveController({ camera, controlsRef })
  }, [camera, controlsRef])

  useEffect(() => {
    return () => controller.stop()
  }, [controller])

  return controller
}
