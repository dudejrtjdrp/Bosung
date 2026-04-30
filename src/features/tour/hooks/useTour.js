import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useCameraMove from '../../../hooks/useCameraMove'
import buildTourSteps from '../utils/buildTourSteps'

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

export default function useTour({ controlsRef, sequence = [], hotspots = [], onChange }) {
  const cameraMove = useCameraMove(controlsRef)
  const timerRef = useRef(null)
  const stateRef = useRef(null)
  const safeSequence = useMemo(() => normalizeArray(sequence), [sequence])
  const safeHotspots = useMemo(() => normalizeArray(hotspots), [hotspots])
  const steps = useMemo(() => buildTourSteps(safeSequence, safeHotspots), [safeSequence, safeHotspots])
  const [state, setState] = useState({
    active: false,
    phase: 'idle',
    currentIndex: -1,
    currentStep: null,
    total: steps.length
  })

  const emit = useCallback((nextState) => {
    stateRef.current = nextState
    setState(nextState)
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const finish = useCallback(() => {
    clearTimer()
    cameraMove.stop()
    emit({
      active: false,
      phase: 'idle',
      currentIndex: -1,
      currentStep: null,
      total: steps.length
    })
  }, [cameraMove, clearTimer, emit, steps.length])

  useEffect(() => {
    setState((current) => {
      if (current.total === steps.length) return current
      return {
        ...current,
        total: steps.length,
        currentStep: current.currentIndex >= 0 ? steps[current.currentIndex] ?? null : null
      }
    })
  }, [steps])

  const runStep = useCallback(async (index) => {
    const step = steps[index]
    if (!step) {
      finish()
      return
    }

    clearTimer()

    const nextState = {
      active: true,
      phase: 'moving',
      currentIndex: index,
      currentStep: step,
      total: steps.length
    }
    emit(nextState)

    await cameraMove.moveTo({
      position: step.hotspot.position,
      lookAt: step.hotspot.position,
      offset: step.offset ?? [0.7, 0.45, 0.7],
      duration: step.duration ?? 1.35,
      ease: 'power2.inOut'
    })

    const holdingState = {
      active: true,
      phase: 'holding',
      currentIndex: index,
      currentStep: step,
      total: steps.length
    }
    emit(holdingState)

    const holdDuration = typeof step.delay === 'number' ? step.delay : 1400
    timerRef.current = window.setTimeout(() => {
      if (!stateRef.current?.active) return
      if (index + 1 < steps.length) {
        runStep(index + 1)
      } else {
        finish()
      }
    }, holdDuration)
  }, [cameraMove, clearTimer, emit, finish, steps])

  const start = useCallback(() => {
    if (!steps.length) return
    clearTimer()
    cameraMove.stop()
    runStep(0)
  }, [cameraMove, clearTimer, runStep, steps.length])

  const next = useCallback(() => {
    const currentIndex = stateRef.current?.currentIndex ?? -1
    if (currentIndex + 1 >= steps.length) {
      finish()
      return
    }

    clearTimer()
    cameraMove.stop()
    runStep(currentIndex + 1)
  }, [cameraMove, clearTimer, finish, runStep, steps.length])

  const exit = useCallback(() => {
    finish()
  }, [finish])

  useEffect(() => {
    onChange?.(state)
  }, [onChange, state])

  useEffect(() => {
    return () => {
      clearTimer()
      cameraMove.stop()
    }
  }, [cameraMove, clearTimer])

  return {
    steps,
    state,
    start,
    next,
    exit,
    isActive: state.active
  }
}
