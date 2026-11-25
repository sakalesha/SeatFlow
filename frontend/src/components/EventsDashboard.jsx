import { useCallback, useEffect, useMemo, useState } from 'react'
import { cancelBooking, fetchMyBookings } from '../api/bookings'
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from '../api/events'
import { formatSchedule, formatSeatCode } from '../utils/seats'
import BookingModal from './BookingModal'
import EventDetailModal from './EventDetailModal'
import EventFormModal from './EventFormModal'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
]

export default function EventsDashboard({ user, onSignOut }) {
  const isAdmin = user.role === 'admin'

  const [activeTab, setActiveTab] = useState('events')
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [inspectingEvent, setInspectingEvent] = useState(null)
  const [bookingEvent, setBookingEvent] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState(null)
  const [cancellingBookingId, setCancellingBookingId] = useState(null)

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [eventsData, bookingsData] = await Promise.all([
        fetchEvents(),
        fetchMyBookings(),
      ])
      setEvents(eventsData.events ?? [])
      setBookings(bookingsData.bookings ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchEvents(), fetchMyBookings()])
      .then(([eventsData, bookingsData]) => {
        if (!cancelled) {
          setEvents(eventsData.events ?? [])
          setBookings(bookingsData.bookings ?? [])
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
  }, [])

  const counts = useMemo(() => {
    const summary = {
      all: events.length,
      published: 0,
      draft: 0,
      cancelled: 0,
      completed: 0,
      totalSeats: 0,
    }
    for (const ev of events) {
      if (summary[ev.status] !== undefined) {
        summary[ev.status] += 1
      }
      if (ev.status !== 'cancelled') {
        summary.totalSeats += Number(ev.total_seats) || 0
      }
    }
    return summary
  }, [events])

  const bookingCounts = useMemo(() => {
    let confirmed = 0
    let cancelled = 0
    for (const b of bookings) {
      if (b.status === 'confirmed') confirmed += 1
      else cancelled += 1
    }
    return { total: bookings.length, confirmed, cancelled }
  }, [bookings])

  const visibleEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return events.filter((ev) => {
      const matchesStatus = statusFilter === 'all' || ev.status === statusFilter
      const matchesSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [events, searchQuery, statusFilter])

  async function handleSaveEvent(payload) {
    if (editingEvent) {
      const data = await updateEvent(editingEvent.id, payload)
      setEvents((prev) =>
        prev.map((item) => (item.id === editingEvent.id ? data.event : item)),
      )
    } else {
      const data = await createEvent(payload)
      setEvents((prev) =>
        [...prev, data.event].sort(
          (a, b) => new Date(a.starts_at) - new Date(b.starts_at),
        ),
      )
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    setError('')
    try {
      await deleteEvent(id)
      setEvents((prev) => prev.filter((item) => item.id !== id))
      setBookings((prev) => prev.filter((b) => b.event_id !== id))
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBookingsCreated() {
    try {
      const bookingsData = await fetchMyBookings()
      setBookings(bookingsData.bookings ?? [])
    } catch {
      // Non-blocking refresh
    }
  }

  async function handleCancelBooking(bookingId) {
    setCancellingBookingId(bookingId)
    setError('')
    try {
      const data = await cancelBooking(bookingId)
      setBookings((prev) =>
        prev.map((item) =>
          item.id === bookingId ? { ...item, status: data.booking.status } : item,
        ),
      )
      setConfirmCancelBookingId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setCancellingBookingId(null)
    }
  }

  function openCreateModal() {
    setEditingEvent(null)
    setIsFormOpen(true)
  }

  function openEditModal(ev) {
    setEditingEvent(ev)
    setIsFormOpen(true)
  }

  return (
    <div className="workspace-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <div className="brand-mark">
              <span className="brand-glyph brand-glyph-dark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="brand-name">SeatFlow</span>
            </div>

            <nav className="topbar-nav" aria-label="Workspace sections">
              <button
                type="button"
                className={`nav-pill ${activeTab === 'events' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                Events
              </button>
              <button
                type="button"
                className={`nav-pill ${activeTab === 'bookings' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <span>My Bookings</span>
                <span className="nav-badge">{bookingCounts.confirmed}</span>
              </button>
            </nav>
          </div>

          <div className="topbar-user">
            <div className="user-chip">
              <span className="user-name">{user.full_name}</span>
              <span className="role-pill">{user.role}</span>
            </div>
            <button type="button" className="secondary-btn compact-btn" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="workspace-main">
        {activeTab === 'events' ? (
          <>
            <section className="workspace-header">
              <div>
                <p className="eyebrow">VENUE SCHEDULE &amp; CAPACITY</p>
                <h1 className="workspace-title">Event management</h1>
                <p className="workspace-sub">
                  {isAdmin
                    ? 'Create schedules, allocate hall capacities, publish events, and book seats.'
                    : 'Browse published events, inspect floorplans, and reserve your seats.'}
                </p>
              </div>

              <div className="header-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={refreshData}
                  disabled={isLoading}
                >
                  Refresh
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="submit-btn create-event-btn"
                    onClick={openCreateModal}
                  >
                    + New event
                  </button>
                )}
              </div>
            </section>

            <section className="metrics-strip" aria-label="Event summary">
              <div className="metric-cell">
                <span className="mono-label metric-label">TOTAL EVENTS</span>
                <strong className="metric-value">{counts.all}</strong>
              </div>
              <div className="metric-cell">
                <span className="mono-label metric-label">PUBLISHED</span>
                <strong className="metric-value metric-sage">{counts.published}</strong>
              </div>
              <div className="metric-cell">
                <span className="mono-label metric-label">DRAFTS</span>
                <strong className="metric-value">{counts.draft}</strong>
              </div>
              <div className="metric-cell">
                <span className="mono-label metric-label">ACTIVE SEAT CAPACITY</span>
                <strong className="metric-value">{counts.totalSeats.toLocaleString()}</strong>
              </div>
            </section>

            <section className="toolbar" aria-label="Filter events">
              <div className="filter-tabs" role="tablist" aria-label="Filter by status">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === tab.key}
                    className={`filter-tab ${statusFilter === tab.key ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    <span>{tab.label}</span>
                    <span className="tab-count">{counts[tab.key]}</span>
                  </button>
                ))}
              </div>

              <div className="search-box">
                <label htmlFor="event-search" className="sr-only">
                  Search events by title or venue
                </label>
                <input
                  id="event-search"
                  type="search"
                  placeholder="Search title or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </section>

            {error && (
              <div className="error-banner workspace-error" role="alert">
                <div>
                  <span className="error-tag">REQUEST ERROR</span>
                  <div>{error}</div>
                </div>
                <button
                  type="button"
                  className="secondary-btn compact-btn"
                  onClick={refreshData}
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="ledger-state-card">
                <span className="mono-label metric-label">LOADING SCHEDULE</span>
                <p>Fetching events from PostgreSQL…</p>
              </div>
            ) : visibleEvents.length === 0 ? (
              <div className="ledger-state-card">
                <span className="mono-label metric-label">
                  {events.length === 0 ? 'NO EVENTS SCHEDULED' : 'NO MATCHING EVENTS'}
                </span>
                <p>
                  {events.length === 0
                    ? isAdmin
                      ? 'Create your first event to start managing hall schedules and seat capacity.'
                      : 'No events have been scheduled yet.'
                    : 'No events match your current status filter or search query.'}
                </p>
                {events.length === 0 && isAdmin ? (
                  <button
                    type="button"
                    className="submit-btn create-event-btn"
                    onClick={openCreateModal}
                  >
                    + Create first event
                  </button>
                ) : events.length > 0 ? (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setStatusFilter('all')
                      setSearchQuery('')
                    }}
                  >
                    Reset filters
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="events-ledger" role="list">
                {visibleEvents.map((ev) => {
                  const isConfirming = confirmDeleteId === ev.id
                  const isDeleting = deletingId === ev.id
                  const isBookable = ev.status === 'published'
                  return (
                    <article key={ev.id} className="event-row-card" role="listitem">
                      <div className="event-main">
                        <div className="event-badges">
                          <span className={`event-status-badge status-${ev.status}`}>
                            {ev.status}
                          </span>
                          <span className="mono-meta">{ev.total_seats} seats</span>
                        </div>

                        <h2 className="event-title">{ev.title}</h2>
                        {ev.description && (
                          <p className="event-desc">{ev.description}</p>
                        )}

                        <div className="event-meta-row">
                          <span>{ev.venue}</span>
                          <span aria-hidden="true">·</span>
                          <span className="mono-meta">
                            {formatSchedule(ev.starts_at, ev.ends_at)}
                          </span>
                        </div>
                      </div>

                      <div className="event-actions">
                        {isBookable && (
                          <button
                            type="button"
                            className="submit-btn compact-btn book-btn"
                            onClick={() => setBookingEvent(ev)}
                          >
                            Book seats
                          </button>
                        )}

                        <button
                          type="button"
                          className="secondary-btn compact-btn"
                          onClick={() => setInspectingEvent(ev)}
                        >
                          Inspect
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="secondary-btn compact-btn"
                              onClick={() => openEditModal(ev)}
                            >
                              Edit
                            </button>

                            {isConfirming ? (
                              <div className="delete-confirm-group">
                                <button
                                  type="button"
                                  className="danger-btn compact-btn"
                                  disabled={isDeleting}
                                  onClick={() => handleDelete(ev.id)}
                                >
                                  {isDeleting ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  className="secondary-btn compact-btn"
                                  disabled={isDeleting}
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="danger-outline-btn compact-btn"
                                onClick={() => setConfirmDeleteId(ev.id)}
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="workspace-header">
              <div>
                <p className="eyebrow">SEAT RESERVATIONS</p>
                <h1 className="workspace-title">My bookings</h1>
                <p className="workspace-sub">
                  Review your confirmed seat holds or release seats back to the floorplan.
                </p>
              </div>

              <div className="header-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={refreshData}
                  disabled={isLoading}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  className="submit-btn create-event-btn"
                  onClick={() => setActiveTab('events')}
                >
                  Browse events
                </button>
              </div>
            </section>

            <section className="metrics-strip bookings-metrics" aria-label="Booking summary">
              <div className="metric-cell">
                <span className="mono-label metric-label">CONFIRMED SEATS</span>
                <strong className="metric-value metric-sage">
                  {bookingCounts.confirmed}
                </strong>
              </div>
              <div className="metric-cell">
                <span className="mono-label metric-label">CANCELLED</span>
                <strong className="metric-value">{bookingCounts.cancelled}</strong>
              </div>
              <div className="metric-cell">
                <span className="mono-label metric-label">TOTAL RESERVATIONS</span>
                <strong className="metric-value">{bookingCounts.total}</strong>
              </div>
            </section>

            {error && (
              <div className="error-banner workspace-error" role="alert">
                <div>
                  <span className="error-tag">REQUEST ERROR</span>
                  <div>{error}</div>
                </div>
                <button
                  type="button"
                  className="secondary-btn compact-btn"
                  onClick={refreshData}
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="ledger-state-card">
                <span className="mono-label metric-label">LOADING RESERVATIONS</span>
                <p>Fetching your bookings from PostgreSQL…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="ledger-state-card">
                <span className="mono-label metric-label">NO BOOKINGS YET</span>
                <p>
                  Select any published event in the Events tab to pick seats and create a
                  reservation.
                </p>
                <button
                  type="button"
                  className="submit-btn create-event-btn"
                  onClick={() => setActiveTab('events')}
                >
                  Browse published events
                </button>
              </div>
            ) : (
              <div className="events-ledger" role="list">
                {bookings.map((booking) => {
                  const isConfirmed = booking.status === 'confirmed'
                  const isConfirmingCancel = confirmCancelBookingId === booking.id
                  const isCancelling = cancellingBookingId === booking.id

                  return (
                    <article key={booking.id} className="event-row-card" role="listitem">
                      <div className="event-main">
                        <div className="event-badges">
                          <span
                            className={`event-status-badge ${
                              isConfirmed ? 'status-published' : 'status-cancelled'
                            }`}
                          >
                            {booking.status}
                          </span>
                          <span className="seat-ticket-badge">
                            {formatSeatCode(booking.seat_number)} · Seat #{booking.seat_number}
                          </span>
                        </div>

                        <h2 className="event-title">{booking.event_title}</h2>
                        <div className="event-meta-row">
                          <span>{booking.event_venue}</span>
                          <span aria-hidden="true">·</span>
                          <span className="mono-meta">
                            {formatSchedule(booking.event_starts_at, booking.event_ends_at)}
                          </span>
                        </div>
                      </div>

                      <div className="event-actions">
                        {isConfirmed &&
                          (isConfirmingCancel ? (
                            <div className="delete-confirm-group">
                              <button
                                type="button"
                                className="danger-btn compact-btn"
                                disabled={isCancelling}
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                {isCancelling ? 'Cancelling...' : 'Confirm cancel'}
                              </button>
                              <button
                                type="button"
                                className="secondary-btn compact-btn"
                                disabled={isCancelling}
                                onClick={() => setConfirmCancelBookingId(null)}
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="danger-outline-btn compact-btn"
                              onClick={() => setConfirmCancelBookingId(booking.id)}
                            >
                              Cancel seat
                            </button>
                          ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {isFormOpen && (
        <EventFormModal
          initialEvent={editingEvent}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveEvent}
        />
      )}

      {inspectingEvent && (
        <EventDetailModal
          event={inspectingEvent}
          isAdmin={isAdmin}
          onClose={() => setInspectingEvent(null)}
          onEdit={openEditModal}
        />
      )}

      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          onClose={() => setBookingEvent(null)}
          onBooked={handleBookingsCreated}
          onGoToBookings={() => setActiveTab('bookings')}
        />
      )}
    </div>
  )
}
