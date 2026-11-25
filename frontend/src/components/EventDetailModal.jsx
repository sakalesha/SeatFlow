import { useEffect } from 'react'

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function EventDetailModal({ event, isAdmin, onClose, onEdit }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className={`event-status-badge status-${event.status}`}>
              {event.status}
            </span>
            <h2 id="detail-modal-title" className="detail-title">
              {event.title}
            </h2>
          </div>
          <button
            type="button"
            className="icon-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            ✕
          </button>
        </div>

        <p className="detail-description">
          {event.description || 'No description provided for this event.'}
        </p>

        <dl className="account-details">
          <div className="detail-row">
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
          <div className="detail-row">
            <dt>Seat capacity</dt>
            <dd className="mono-val">{event.total_seats} seats</dd>
          </div>
          <div className="detail-row">
            <dt>Starts</dt>
            <dd>{formatDateTime(event.starts_at)}</dd>
          </div>
          <div className="detail-row">
            <dt>Ends</dt>
            <dd>{formatDateTime(event.ends_at)}</dd>
          </div>
          <div className="detail-row">
            <dt>Event ID</dt>
            <dd className="mono-val">{event.id}</dd>
          </div>
        </dl>

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
          {isAdmin && (
            <button
              type="button"
              className="submit-btn modal-submit"
              onClick={() => {
                onClose()
                onEdit(event)
              }}
            >
              Edit event
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
