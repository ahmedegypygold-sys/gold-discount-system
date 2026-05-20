import { getStore } from '@netlify/blobs'

const DEFAULT_USERS = [
  { username: 'admin', password: 'Eg@2026', role: 'admin' },
  { username: 'nader', password: '1234', role: 'user' },
]

function mergeDefaultUsers(users) {
  const merged = Array.isArray(users) ? users.filter(u => u && u.username && u.password) : []
  for (const builtin of DEFAULT_USERS) {
    if (!merged.some(u => String(u.username).toLowerCase() === builtin.username.toLowerCase())) {
      merged.push(builtin)
    }
  }
  return merged
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export const handler = async function (event) {
  const rawPath = event.path || ''
  // Path looks like: /.netlify/functions/api/sales-db
  const route = rawPath.split('/').filter(Boolean).pop() || ''
  const method = event.httpMethod

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS }
  }

  // Single site-level store with strong consistency so data is immediately
  // visible to all devices after any write.
  const store = getStore({ name: 'app-data', consistency: 'strong' })

  try {
    // ── GET /api/sales-db ──────────────────────────────────────────────────
    if (route === 'sales-db' && method === 'GET') {
      const data = await store.get('sales-db', { type: 'json' })
      if (!data) return { statusCode: 404, headers: JSON_HEADERS, body: 'null' }
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(data) }
    }

    // ── POST /api/sales-db ─────────────────────────────────────────────────
    if (route === 'sales-db' && method === 'POST') {
      const data = JSON.parse(event.body || '{}')
      await store.setJSON('sales-db', data)
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(data) }
    }

    // ── GET /api/users ─────────────────────────────────────────────────────
    if (route === 'users' && method === 'GET') {
      const stored = await store.get('users', { type: 'json' })
      const users = mergeDefaultUsers(stored || [])
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(users) }
    }

    // ── POST /api/users ────────────────────────────────────────────────────
    if (route === 'users' && method === 'POST') {
      const incoming = JSON.parse(event.body || '[]')
      const users = mergeDefaultUsers(incoming)
      await store.setJSON('users', users)
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(users) }
    }

    // ── POST /api/login ────────────────────────────────────────────────────
    if (route === 'login' && method === 'POST') {
      const { username, password } = JSON.parse(event.body || '{}')
      const stored = await store.get('users', { type: 'json' })
      const allUsers = mergeDefaultUsers(stored || [])
      const user = allUsers.find(
        u =>
          String(u.username).trim().toLowerCase() ===
            String(username || '').trim().toLowerCase() &&
          String(u.password).trim() === String(password || '').trim()
      )
      if (!user) {
        return {
          statusCode: 401,
          headers: JSON_HEADERS,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        }
      }
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(user) }
    }

    return {
      statusCode: 404,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Route not found' }),
    }
  } catch (err) {
    console.error('[api]', err)
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
