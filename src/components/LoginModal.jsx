import { useState, useEffect, useRef } from 'react'
import { fetchProviders, startLogin } from '../hooks/useAuth'

function LoginModal({ onClose }) {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loggingIn, setLoggingIn] = useState(null)
  const loggingInRef = useRef(null)

  useEffect(() => {
    fetchProviders()
      .then(data => {
        setProviders(data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load login providers')
        setLoading(false)
      })
  }, [])

  const handleLogin = async (providerId) => {
    setLoggingIn(providerId)
    loggingInRef.current = providerId
    setError(null)
    try {
      await startLogin(providerId)
    } catch (err) {
      if (loggingInRef.current === providerId) {
        setError(err.message)
        setLoggingIn(null)
        loggingInRef.current = null
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={loggingIn ? undefined : onClose}>
      <div className="modal-content login-modal" onClick={e => e.stopPropagation()}>
        <h2 className="login-title">Login</h2>
        <p className="login-subtitle">Choose a provider to sign in</p>
        {error && <p className="login-error">{error}</p>}
        <div className="login-providers">
          {loading ? (
            <div className="login-providers-loading">
              <div className="spinner" />
            </div>
          ) : providers.length === 0 && !error ? (
            <p className="login-empty">No providers available</p>
          ) : (
            providers.map(p => (
              <button
                key={p.providerId}
                className="provider-button"
                disabled={!!loggingIn}
                onClick={() => handleLogin(p.providerId)}
              >
                {loggingIn === p.providerId ? (
                  <span className="provider-spinner" />
                ) : (
                  <img src={p.icon} alt="" className="provider-icon" width="20" height="20" />
                )}
                <span>
                  {loggingIn === p.providerId ? 'Signing in...' : `Login with ${p.displayName}`}
                </span>
              </button>
            ))
          )}
        </div>
        <button className="modal-cancel login-cancel" onClick={onClose} disabled={!!loggingIn}>Cancel</button>
      </div>
    </div>
  )
}

export default LoginModal
