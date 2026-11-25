import { useEffect, useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

function toLocalInputValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function defaultWindow() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  return {
    startsAt: toLocalInputValue(start.toISOString()),
    endsAt: toLocalInputValue(end.toISOString()),
  }
}

export default function EventFormModal({ initialEvent, onClose, onSave }) {
  const isEditing = Boolean(initialEvent)
  const defaults = defaultWindow()

  const [title, setTitle] = useState(initialEvent?.title ?? '')
  const [venue, setVenue] = useState(initialEvent?.venue ?? '')
  const [startsAt, setStartsAt] = useState(
    initialEvent ? toLocalInputValue(initialEvent.starts_at) : defaults.startsAt,
  )
  const [endsAt, setEndsAt] = useState(
    initialEvent ? toLocalInputValue(initialEvent.ends_at) : defaults.endsAt,
  )
  const [totalSeats, setTotalSeats] = useState(
    initialEvent ? String(initialEvent.total_seats) : '120',
  )
  const [status, setStatus] = useState(initialEvent?.status ?? 'draft')
  const [description, setDescription] = useState(initialEvent?.description ?? '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedVenue = venue.trim()
    const startDate = new Date(startsAt)
    const endDate = new Date(endsAt)
    const seatsNum = Number(totalSeats)

    if (!trimmedTitle) {
      setError('Event title is required.')
      return
    }
    if (!trimmedVenue) {
      setError('Venue is required.')
      return
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Please provide valid start and end timestamps.')
      return
    }
    if (endDate <= startDate) {
      setError('End time must be after start time.')
      return
    }
    if (!Number.isInteger(seatsNum) || seatsNum <= 0) {
      setError('Total seats must be a positive whole number.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await onSave({
        title: trimmedTitle,
        venue: trimmedVenue,
        startsAt: startDate.toISOString(),
        endsAt: endDate.toISOString(),
        totalSeats: seatsNum,
        status,
        description: description.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="mono-label">
              {isEditing ? 'EDIT EVENT RECORD' : 'NEW EVENT RECORD'}
            </span>
            <h2 id="event-modal-title">
              {isEditing ? `Update "${initialEvent.title}"` : 'Schedule a new event'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-tag">VALIDATION / API ERROR</span>
            <span>{error}</span>
          </div>
        )}

        <form className="event-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="event-title">Event title</label>
            <input
              id="event-title"
              type="text"
              placeholder="SeatFlow Architecture Summit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-two-col">
            <div className="field">
              <label htmlFor="event-venue">Venue / Hall</label>
              <input
                id="event-venue"
                type="text"
                placeholder="Main Auditorium · Hall A"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="event-seats">Total seats</label>
              <input
                id="event-seats"
                type="number"
                min="1"
                step="1"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-two-col">
            <div className="field">
              <label htmlFor="event-starts">Starts at</label>
              <input
                id="event-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="event-ends">Ends at</label>
              <input
                id="event-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="event-status">Status</label>
            <select
              id="event-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSubmitting}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="event-description">
              Description <span className="field-hint">(optional)</span>
            </label>
            <textarea
              id="event-description"
              rows="3"
              placeholder="Notes on seating layout, doors open time, or entry rules."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn modal-submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? 'Saving changes...'
                  : 'Creating event...'
                : isEditing
                  ? 'Save changes'
                  : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
