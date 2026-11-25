export default function SessionPanel({ user, onSignOut }) {
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Just now'

  return (
    <div className="auth-panel session-panel">
      <div className="session-status-row">
        <span className="status-pill">
          <i className="status-dot" /> Authenticated
        </span>
        <span className="role-pill">{user.role}</span>
      </div>

      <div className="auth-heading">
        <h2>Signed in as {user.full_name}</h2>
        <p>Your SeatFlow session is active and verified against PostgreSQL.</p>
      </div>

      <dl className="account-details">
        <div className="detail-row">
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="detail-row">
          <dt>Account status</dt>
          <dd className="mono-val">{user.account_status}</dd>
        </div>
        <div className="detail-row">
          <dt>Email verification</dt>
          <dd>{user.email_verified_at ? 'Verified' : 'Unverified'}</dd>
        </div>
        <div className="detail-row">
          <dt>Member since</dt>
          <dd>{joinedDate}</dd>
        </div>
      </dl>

      <button type="button" className="signout-btn" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  )
}
