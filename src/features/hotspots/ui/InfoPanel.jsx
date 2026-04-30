import React from 'react'
import './InfoPanel.css'

export default function InfoPanel({ hotspot, onClose }) {
  if (!hotspot) return null

  const { title, description, media } = hotspot

  return (
    <aside className="info-panel">
      <button className="info-panel__close" onClick={onClose} aria-label="Close hotspot details">
        ×
      </button>
      <h2 className="info-panel__title">{title}</h2>
      <p className="info-panel__description">{description}</p>

      {media?.type === 'image' && (
        <img src={media.src} alt={media.caption || title} className="info-panel__media" />
      )}

      {media?.type === 'video' && (
        <video controls className="info-panel__media" poster={media.poster}>
          <source src={media.src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </aside>
  )
}
