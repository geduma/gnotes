import { useState, useEffect } from 'react'
import { fetchProviders, startLogin } from '../hooks/useAuth'

function LoginModal({ onClose }) {
  const [providers, setProviders] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch(() => setError('Could not load login providers'))
  }, [])

  const handleLogin = async (providerId) => {
    try {
      await startLogin(providerId)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content login-modal" onClick={e => e.stopPropagation()}>
        <h2 className="login-title">Login</h2>
        <p className="login-subtitle">Choose a provider to sign in</p>
        {error && <p className="login-error">{error}</p>}
        <div className="login-providers">
          {providers.length === 0 && !error && (
            <p className="login-empty">No providers available</p>
          )}
          {providers.map(p => (
            <button
              key={p.providerId}
              className="provider-button"
              onClick={() => handleLogin(p.providerId)}
            >
              <img src={p.icon} alt="" className="provider-icon" width="20" height="20" />
              <span>Login with {p.displayName}</span>
            </button>
          ))}
        </div>
        <button className="modal-cancel login-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

export default LoginModal
