const API_BASE = 'https://api.geduma.com'

const AUTH = {
  name: 'gnotes',
  user: 'geduma',
  key: import.meta.env.VITE_API_AUTH_KEY
}

async function getToken() {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(AUTH)
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data.token
}

export async function fetchNotes(owner, query) {
  const token = await getToken()
  const params = new URLSearchParams()
  if (owner) params.set('owner', owner)
  if (query) params.set('q', query)
  const qs = params.toString()
  const url = qs ? `${API_BASE}/gnotes?${qs}` : `${API_BASE}/gnotes`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.status === 204) return []
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data
}

export async function createNote({ slug, title, body, tags, updated, owner }) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/gnotes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ slug, title, body, tags, updated, owner })
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data
}

export async function updateNote(slug, fields) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/gnotes/${slug}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fields)
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data
}

export async function deleteNote(slug, owner) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/gnotes/${slug}?owner=${encodeURIComponent(owner)}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data
}
