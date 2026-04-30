import React from 'react'
import './TourControls.css'

export default function TourControls({ controllerRef, path, disabled = false }) {
  return (
    <div className="tour-controls" aria-disabled={disabled} style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.45 : 1 }}>
      <button disabled={disabled} onClick={() => controllerRef.current?.play()}>Play</button>
      <button disabled={disabled} onClick={() => controllerRef.current?.pause()}>Pause</button>
      <button disabled={disabled} onClick={() => controllerRef.current?.prev()}>Prev</button>
      <button disabled={disabled} onClick={() => controllerRef.current?.next()}>Next</button>
      <div className="tour-items">
        {path?.map((p, i) => (
          <button key={i} className="tour-item" disabled={disabled} onClick={() => controllerRef.current?.goto(i)}>{p.title || `#${i+1}`}</button>
        ))}
      </div>
    </div>
  )
}
