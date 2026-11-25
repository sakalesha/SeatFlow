import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  setStoredToken,
} from './api/auth'
import './App.css'
import AuthForm from './components/AuthForm'
import EventsDashboard from './components/EventsDashboard'
import SeatingPreview from './components/SeatingPreview'

function AuthLayout({ mode, checkingSession, onModeChange, onSuccess }) {
  return (
    <main className="auth-shell">
      <section className="brand-column">
        <header className="brand-top">
          <div className="brand-mark">
            <span className="brand-glyph" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="brand-name">SeatFlow</span>
          </div>
          <span className="edition-tag">SEATING ENGINE · V1</span>
        </header>

        <div className="brand-hero">
          <p className="eyebrow">SPATIAL ALLOCATION &amp; ACCESS</p>
          <h1>
            Every seat accounted for,
            <em> before doors open.</em>
          </h1>
          <p className="hero-copy">
            Coordinate venue capacity, lock reservations without double-booking, and manage
            operator permissions from one unified ledger.
          </p>
        </div>

        <SeatingPreview />

        <footer className="brand-footer">
          <span>Row-level reservation locking</span>
          <span aria-hidden="true">/</span>
          <span>Role-based access control</span>
        </footer>
      </section>

      <section className="form-column" aria-label="Account access">
        <div className="form-container">
          {checkingSession ? (
            <div className="auth-panel session-loading">
              <span className="mono-label">VERIFYING SESSION</span>
              <p>Checking your saved SeatFlow credentials…</p>
            </div>
          ) : (
            <AuthForm mode={mode} onModeChange={onModeChange} onSuccess={onSuccess} />
          )}
        </div>
      </section>
    </main>
  )
}

function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getStoredToken()))

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    let cancelled = false
    fetchCurrentUser(token)
      .then((data) => {
        if (!cancelled) {
          setUser(data.user)
        }
      })
      .catch(() => {
        clearStoredToken()
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingSession(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleAuthSuccess({ user: authenticatedUser, token }) {
    setStoredToken(token)
    setUser(authenticatedUser)
    navigate('/events', { replace: true })
  }

  function handleSignOut() {
    clearStoredToken()
    setUser(null)
    navigate('/login', { replace: true })
  }

  function handleModeChange(nextMode) {
    navigate(nextMode === 'register' ? '/register' : '/login')
  }

  if (checkingSession) {
    return <AuthLayout mode="login" checkingSession onModeChange={handleModeChange} onSuccess={handleAuthSuccess} />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/events" replace />
          ) : (
            <AuthLayout
              mode="login"
              checkingSession={false}
              onModeChange={handleModeChange}
              onSuccess={handleAuthSuccess}
            />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/events" replace />
          ) : (
            <AuthLayout
              mode="register"
              checkingSession={false}
              onModeChange={handleModeChange}
              onSuccess={handleAuthSuccess}
            />
          )
        }
      />
      <Route
        path="/events"
        element={
          user ? (
            <EventsDashboard user={user} onSignOut={handleSignOut} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? '/events' : '/login'} replace />} />
    </Routes>
  )
}

export default App
