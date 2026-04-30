import React from 'react'
import './TourProgressBar.css'

export default function TourProgressBar({ active = false, progress = 0, currentTitle = '', currentIndex = -1, total = 0, steps = [] }) {
  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0

  return (
    <div className={`tour-progress ${active ? 'tour-progress--active' : 'tour-progress--idle'}`} aria-hidden={!active}>
      <div className="tour-progress__top">
        <div className="tour-progress__label">Tour progress</div>
        <div className="tour-progress__count">{currentIndex + 1} / {total}</div>
      </div>

      <div className="tour-progress__title">{currentTitle || 'Starting tour'}</div>

      <div className="tour-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeProgress}>
        <div className="tour-progress__bar-fill" style={{ width: `${safeProgress}%` }} />
      </div>

      <div className="tour-progress__dots" aria-label="Tour steps">
        {steps.map((step, index) => (
          <div
            key={step.hotspotId || index}
            className={`tour-progress__dot ${index === currentIndex ? 'tour-progress__dot--current' : ''} ${index < currentIndex ? 'tour-progress__dot--done' : ''}`}
            title={step.title || step.hotspotId}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
