function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

export default function buildTourSteps(sequence = [], hotspots = []) {
  const safeSequence = normalizeArray(sequence)
  const safeHotspots = normalizeArray(hotspots)
  const hotspotMap = new Map(safeHotspots.filter(Boolean).map((hotspot) => [hotspot?.id, hotspot]))

  return safeSequence
    .filter(Boolean)
    .map((step, index) => {
      const hotspot = hotspotMap.get(step?.hotspotId)
      if (!hotspot) return null

      return {
        ...step,
        index,
        hotspot,
        title: step.title || hotspot.title,
        description: step.description || hotspot.description
      }
    })
    .filter(Boolean)
}
