import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBooking, fetchEventSeats } from '../api/bookings'
import { formatSeatCode, getRowLabel, SEATS_PER_ROW } from '../utils/seats'

const MAX_SEATS_PER_BOOKING = 10

export default function BookingModal({ event, onClose, onBooked, onGoToBookings }) {
  const [bookedSeats, setBookedSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [confirmedBookings, setConfirmedBookings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const bookedSet = useMemo(() => new Set(bookedSeats), [bookedSeats])
  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats])

  const loadSeatMap = useCallback(async () => {
    const data = await fetchEventSeats(event.id)
    setBookedSeats(data.bookedSeats ?? [])
    return data.bookedSeats ?? []
  }, [event.id])

  useEffect(() => {
    let cancelled = false
    fetchEventSeats(event.id)
      .then((data) => {
        if (!cancelled) {
          setBookedSeats(data.bookedSeats ?? [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [event.id])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  const rows = useMemo(() => {
    const total = event.total_seats
    const rowCount = Math.ceil(total / SEATS_PER_ROW)
    const result = []

    for (let r = 0; r < rowCount; r += 1) {
      const startSeat = r * SEATS_PER_ROW + 1
      const endSeat = Math.min(startSeat + SEATS_PER_ROW - 1, total)
      const seats = []
      for (let s = startSeat; s <= endSeat; s += 1) {
        seats.push(s)
      }
      result.push({ label: getRowLabel(r), seats })
    }
    return result
  }, [event.total_seats])

  function toggleSeat(seatNumber) {
    if (bookedSet.has(seatNumber) || isSubmitting) return

    setError('')
    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((n) => n !== seatNumber)
      }
      if (prev.length >= MAX_SEATS_PER_BOOKING) {
        setError(`You can select up to ${MAX_SEATS_PER_BOOKING} seats per booking.`)
        return prev
      }
      return [...prev, seatNumber].sort((a, b) => a - b)
    })
  }

  async function handleConfirm() {
    if (selectedSeats.length === 0) return

    setError('')
    setIsSubmitting(true)
    try {
      const data = await createBooking({
        eventId: event.id,
        seatNumbers: selectedSeats,
      })
      setConfirmedBookings(data.bookings)
      onBooked(data.bookings)
    } catch (err) {
      setError(err.message)
      try {
        const latestBooked = await loadSeatMap()
        const latestSet = new Set(latestBooked)
        setSelectedSeats((prev) => prev.filter((s) => !latestSet.has(s)))
      } catch {
        // Preserve original booking error if seat map refresh fails
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderSeatCluster(seats) {
    return (
      <div className="booking-seat-cluster">
        {seats.map((seatNumber) => {
          const isBooked = bookedSet.has(seatNumber)
          const isSelected = selectedSet.has(seatNumber)
          const stateClass = isBooked
            ? 'is-booked'
            : isSelected
              ? 'is-selected'
              : 'is-open'

          return (
            <button
              key={seatNumber}
              type="button"
              disabled={isBooked || isSubmitting}
              className={`booking-seat ${stateClass}`}
              onClick={() => toggleSeat(seatNumber)}
              aria-label={`Seat ${formatSeatCode(seatNumber)} (#${seatNumber}), ${
                isBooked ? 'booked' : isSelected ? 'selected' : 'available'
              }`}
              aria-pressed={isSelected}
            >
              {String(((seatNumber - 1) % SEATS_PER_ROW) + 1).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    )
  }

  const availableCount = Math.max(0, event.total_seats - bookedSeats.length)

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="modal-card booking-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="mono-label">SEAT ALLOCATION · {event.venue}</span>
            <h2 id="booking-modal-title">{event.title}</h2>
          </div>
          <button
            type="button"
            className="icon-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close booking dialog"
          >
            ✕
          </button>
        </div>

        {confirmedBookings ? (
          <div className="booking-success-box">
            <span className="status-pill">
              <i className="status-dot" /> Booking Confirmed
            </span>
            <h3>
              {confirmedBookings.length} seat
              {confirmedBookings.length > 1 ? 's' : ''} reserved
            </h3>
            <p>
              Your seats are locked in PostgreSQL for <strong>{event.title}</strong>.
            </p>
            <div className="selected-chips">
              {confirmedBookings.map((b) => (
                <span key={b.id} className="seat-chip">
                  {formatSeatCode(b.seat_number)} · #{b.seat_number}
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                Back to events
              </button>
              <button
                type="button"
                className="submit-btn modal-submit"
                onClick={() => {
                  onClose()
                  onGoToBookings()
                }}
              >
                View My Bookings
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="booking-stats-bar">
              <span>
                <strong>{availableCount}</strong> open
              </span>
              <span>
                <strong>{bookedSeats.length}</strong> booked
              </span>
              <span>
                <strong>{selectedSeats.length}</strong> selected
              </span>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <span className="error-tag">BOOKING NOTICE</span>
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="ledger-state-card compact-state">
                <span className="mono-label metric-label">LOADING FLOORPLAN</span>
                <p>Fetching seat availability…</p>
              </div>
            ) : (
              <div className="floorplan-panel">
                <div className="floorplan-stage">STAGE NORTH</div>
                <div className="floorplan-rows" role="group" aria-label="Venue seats">
                  {rows.map((row) => (
                    <div key={row.label} className="booking-row">
                      <span className="booking-row-label" aria-hidden="true">
                        {row.label}
                      </span>
                      {renderSeatCluster(row.seats.slice(0, 5))}
                      <span className="booking-aisle" aria-hidden="true" />
                      {renderSeatCluster(row.seats.slice(5))}
                    </div>
                  ))}
                </div>
                <div className="floorplan-legend">
                  <span className="legend-item">
                    <i className="box-key key-open" /> Available
                  </span>
                  <span className="legend-item">
                    <i className="box-key key-selected" /> Selected
                  </span>
                  <span className="legend-item">
                    <i className="box-key key-booked" /> Booked
                  </span>
                </div>
              </div>
            )}

            <div className="booking-summary-footer">
              <div className="selected-summary">
                <span className="mono-label metric-label">SELECTED SEATS</span>
                {selectedSeats.length === 0 ? (
                  <p className="summary-placeholder">Select up to 10 open seats above</p>
                ) : (
                  <div className="selected-chips">
                    {selectedSeats.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        className="seat-chip seat-chip-btn"
                        onClick={() => toggleSeat(seat)}
                        title="Click to remove seat"
                      >
                        {formatSeatCode(seat)} ✕
                      </button>
                    ))}
                  </div>
                )}
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
                <button
                  type="button"
                  className="submit-btn modal-submit"
                  disabled={selectedSeats.length === 0 || isSubmitting || isLoading}
                  onClick={handleConfirm}
                >
                  {isSubmitting
                    ? 'Confirming...'
                    : selectedSeats.length > 0
                      ? `Confirm ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`
                      : 'Confirm booking'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
