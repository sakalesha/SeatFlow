import { useEffect, useState } from 'react'
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  setStoredToken,
} from './api/auth'
import './App.css'
import AuthForm from './components/AuthForm'
import SeatingPreview from './components/SeatingPreview'
import SessionPanel from './components/SessionPanel'

function App() {
  const [mode, setMode] = useState('login')
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
  }

  function handleSignOut() {
    clearStoredToken()
    setUser(null)
    setMode('login')
  }

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
          ) : user ? (
            <SessionPanel user={user} onSignOut={handleSignOut} />
          ) : (
            <AuthForm mode={mode} onModeChange={setMode} onSuccess={handleAuthSuccess} />
          )}
        </div>
      </section>
    </main>
  )
}

export default App
