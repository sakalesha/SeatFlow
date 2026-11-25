import { useState } from 'react'
import { loginUser, registerUser } from '../api/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthForm({ mode, onModeChange, onSuccess }) {
  const isRegister = mode === 'register'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function switchMode(nextMode) {
    setError('')
    onModeChange(nextMode)
  }

  function validate() {
    if (isRegister && !fullName.trim()) {
      return 'Please enter your full name.'
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Please enter a valid email address.'
    }
    if (isRegister && password.length < 8) {
      return 'Password must be at least 8 characters long.'
    }
    if (!isRegister && !password) {
      return 'Please enter your password.'
    }
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const payload = isRegister
        ? await registerUser({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
          })
        : await loginUser({
            email: email.trim(),
            password,
          })

      onSuccess(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-panel">
      <div className="mode-tabs" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          aria-selected={!isRegister}
          className={`mode-tab ${!isRegister ? 'is-active' : ''}`}
          onClick={() => switchMode('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isRegister}
          className={`mode-tab ${isRegister ? 'is-active' : ''}`}
          onClick={() => switchMode('register')}
        >
          Create account
        </button>
      </div>

      <div className="auth-heading">
        <h2>{isRegister ? 'Create your SeatFlow account' : 'Welcome back to SeatFlow'}</h2>
        <p>
          {isRegister
            ? 'Register to manage floorplans, hold seats, and track reservations.'
            : 'Sign in with your email and password to access your workspace.'}
        </p>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-tag">AUTH ERROR</span>
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {isRegister && (
          <div className="field">
            <label htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Aarav Mehta"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Work or personal email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="field">
          <div className="field-label-row">
            <label htmlFor="password">Password</label>
            {isRegister && <span className="field-hint">Minimum 8 characters</span>}
          </div>
          <div className="password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'Create a strong password' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting
            ? isRegister
              ? 'Creating account...'
              : 'Signing in...'
            : isRegister
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch-copy">
        {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
        <button
          type="button"
          className="inline-link-btn"
          onClick={() => switchMode(isRegister ? 'login' : 'register')}
        >
          {isRegister ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  )
}
