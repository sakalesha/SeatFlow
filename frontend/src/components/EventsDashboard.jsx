import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from '../api/events'
import EventDetailModal from './EventDetailModal'
import EventFormModal from './EventFormModal'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
]

function formatSchedule(startsAt, endsAt) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const sameDay = start.toDateString() === end.toDateString()

  const datePart = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const startTime = start.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = end.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (sameDay) {
    return `${datePart} · ${startTime} – ${endTime}`
  }

  const endDatePart = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${datePart}, ${startTime} – ${endDatePart}, ${endTime}`
}

export default function EventsDashboard({ user, onSignOut }) {
  const isAdmin = user.role === 'admin'

  const [events, setEvents] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [inspectingEvent, setInspectingEvent] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const refreshEvents = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchEvents()
      setEvents(data.events ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data.events ?? [])
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
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
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
          <div className="brand-mark">
            <span className="brand-glyph brand-glyph-dark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="brand-name">SeatFlow</span>
            <span className="topbar-divider" aria-hidden="true" />
            <span className="topbar-section">Event Ledger</span>
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
        <section className="workspace-header">
          <div>
            <p className="eyebrow">VENUE SCHEDULE &amp; CAPACITY</p>
            <h1 className="workspace-title">Event management</h1>
            <p className="workspace-sub">
              {isAdmin
                ? 'Create schedules, allocate hall capacities, and publish events for booking.'
                : 'Browse scheduled events and inspect venue capacity. Admin role required for edits.'}
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={refreshEvents}
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
            <button type="button" className="secondary-btn compact-btn" onClick={refreshEvents}>
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
    </div>
  )
}
