import { useMemo } from 'react'
import buildTourSteps from '../utils/buildTourSteps'

export default function useTourProgress({ tourState, sequence = [], hotspots = [] }) {
  const steps = useMemo(() => buildTourSteps(sequence, hotspots), [sequence, hotspots])

  return useMemo(() => {
    const total = steps.length
    const currentIndex = tourState?.currentIndex ?? -1
    const currentStep = tourState?.currentStep ?? null
    const active = !!tourState?.active
    const progress = total > 0 && currentIndex >= 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0

    return {
      active,
      progress,
      currentIndex,
      currentStep,
      total,
      steps,
      currentTitle: currentStep?.title ?? '',
      currentDescription: currentStep?.description ?? ''
    }
  }, [steps, tourState])
}
