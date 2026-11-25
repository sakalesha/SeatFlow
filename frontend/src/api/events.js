import { getStoredToken } from './auth'
import { apiRequest } from './client'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function fetchEvents(status) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
  return apiRequest(`/api/events${query}`, { method: 'GET' })
}

export function fetchEventById(id) {
  return apiRequest(`/api/events/${encodeURIComponent(id)}`, { method: 'GET' })
}

export function createEvent(payload) {
  return apiRequest('/api/events', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function updateEvent(id, payload) {
  return apiRequest(`/api/events/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function deleteEvent(id) {
  return apiRequest(`/api/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
