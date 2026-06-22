const API_BASE = 'https://api.geduma.com'

const AUTH = {
  name: 'gnotes',
  user: 'geduma',
  key: import.meta.env.VITE_AUTH_KEY
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

export async function fetchNotes(query) {
  const token = await getToken()
  const url = query
    ? `${API_BASE}/gnotes?q=${encodeURIComponent(query)}`
    : `${API_BASE}/gnotes`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.status === 204) return []
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data
}

export async function createNote({ slug, title, body, tags, updated }) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/gnotes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ slug, title, body, tags, updated })
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

export async function deleteNote(slug) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/gnotes/${slug}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.msg)
  return json.data
}
