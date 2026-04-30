import { useCallback, useState } from 'react'

export default function useHotspotSelection() {
  const [selectedHotspot, setSelectedHotspot] = useState(null)

  const selectHotspot = useCallback((hotspot) => {
    setSelectedHotspot(hotspot)
  }, [])

  const clearHotspot = useCallback(() => {
    setSelectedHotspot(null)
  }, [])

  return {
    selectedHotspot,
    selectHotspot,
    clearHotspot
  }
}
