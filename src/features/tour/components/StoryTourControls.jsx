import React from 'react'
import './StoryTourControls.css'

export default function StoryTourControls({ tourState, onStart, onNext, onExit, disabled = false }) {
  const hasSteps = (tourState?.total ?? 0) > 0
  const active = !!tourState?.active
  const currentStep = tourState?.currentStep

  return (
    <div className="story-tour-controls">
      {!active ? (
        <div className="story-tour-controls__idle">
          <div className="story-tour-controls__eyebrow">Story Mode</div>
          <div className="story-tour-controls__title">Guided tour</div>
          <div className="story-tour-controls__text">Move through the scene in a defined order with short pauses between stops.</div>
          <button disabled={disabled || !hasSteps} onClick={onStart} className="story-tour-controls__button">
            Start Tour
          </button>
        </div>
      ) : (
        <div className="story-tour-controls__active">
          <div className="story-tour-controls__eyebrow">Step {currentStep?.index + 1} of {tourState.total}</div>
          <div className="story-tour-controls__title">{currentStep?.title}</div>
          <div className="story-tour-controls__text">{currentStep?.description}</div>
          <div className="story-tour-controls__actions">
            <button disabled={disabled} onClick={onNext} className="story-tour-controls__button story-tour-controls__button--secondary">
              Next
            </button>
            <button disabled={disabled} onClick={onExit} className="story-tour-controls__button">
              Exit Tour
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
