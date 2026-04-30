import React from 'react'
import './IntroOverlay.css'

export default function IntroOverlay({ visible = false, onStart, loading = false, title = 'Ready to explore?' }) {
  if (!visible) return null

  return (
    <div className="intro-overlay" aria-hidden={!visible}>
      <div className="intro-overlay__card">
        <div className="intro-overlay__eyebrow">3D Experience</div>
        <h1 className="intro-overlay__title">{title}</h1>
        <p className="intro-overlay__copy">
          The scene will animate into position and controls will unlock after the intro finishes.
        </p>
        <button className="intro-overlay__button" onClick={onStart} disabled={loading}>
          Start Experience
        </button>
      </div>
    </div>
  )
}
