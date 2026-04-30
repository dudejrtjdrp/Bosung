import React, { useState } from 'react'
import HotspotMarker from './HotspotMarker'

export default function HotspotLayer({ hotspots = [], onSelect, disabled = false }) {
  const [hoveredId, setHoveredId] = useState(null)

  function handlePointerOver(id) {
    if (disabled) return
    setHoveredId(id)
    document.body.style.cursor = 'pointer'
  }

  function handlePointerOut() {
    if (disabled) return
    setHoveredId(null)
    document.body.style.cursor = 'default'
  }

  return hotspots.map((hotspot) => (
    <HotspotMarker
      key={hotspot.id}
      hotspot={hotspot}
      hovered={hoveredId === hotspot.id}
      onPointerOver={(e) => {
        if (disabled) return
        e.stopPropagation()
        handlePointerOver(hotspot.id)
      }}
      onPointerOut={(e) => {
        if (disabled) return
        e.stopPropagation()
        handlePointerOut()
      }}
      onClick={(e) => {
        if (disabled) return
        e.stopPropagation()
        onSelect?.(hotspot)
      }}
    />
  ))
}
