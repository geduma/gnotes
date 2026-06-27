import { useState, useEffect, useCallback } from 'react'
import { sha256 } from '../utils/hash'

const APP_ID = import.meta.env.VITE_APP_ID
const API_BASE = 'https://api.geduma.com'
const STORAGE_KEY = 'gnotes_user'

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function useAuth() {
  const [user, setUser] = useState(loadUser)
  const [providers, setProviders] = useState([])

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const sessionToken = params.get('session_token')
    if (sessionToken) {
      window.history.replaceState({}, '', window.location.pathname)
      fetch(`${API_BASE}/auth/session/${sessionToken}`)
        .then(res => res.json())
        .then(async json => {
          if (json.ok) {
            const { email, displayName, picture, provider } = json.data
            const ownerHash = await sha256(email)
            const userData = { email, displayName, picture, provider, ownerHash }
            setUser(userData)
            saveUser(userData)
          }
        })
        .catch(console.error)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    saveUser(null)
  }, [])

  return { user, providers, setProviders, logout }
}

export async function fetchProviders() {
  const res = await fetch(`${API_BASE}/auth/providers/${APP_ID}`)
  if (!res.ok || res.status === 204) return []
  const json = await res.json()
  return json.data || []
}

export async function startLogin(providerId) {
  const res = await fetch(`${API_BASE}/auth/login/${APP_ID}/${providerId}`, {
    method: 'POST'
  })
  const json = await res.json()
  if (json.ok && json.data.redirect) {
    window.location.href = json.data.redirect
  } else {
    throw new Error(json.msg)
  }
}
