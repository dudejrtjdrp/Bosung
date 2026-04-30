import React from 'react'

export default function LoadingOverlay({ progress = 0, active = true }) {
  if (!active) return null

  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0

  return (
    <div className="loading-overlay" aria-live="polite" aria-busy="true">
      <div className="loading-overlay__card">
        <div className="loading-overlay__title">Loading scene</div>
        <div className="loading-overlay__meta">{safeProgress}%</div>
        <div className="loading-overlay__bar">
          <div className="loading-overlay__bar-fill" style={{ width: `${safeProgress}%` }} />
        </div>
      </div>
    </div>
  )
}
