import { getStoredToken } from './auth'
import { apiRequest } from './client'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function fetchEventSeats(eventId) {
  return apiRequest(`/api/events/${encodeURIComponent(eventId)}/seats`, {
    method: 'GET',
  })
}

export function createBooking({ eventId, seatNumbers }) {
  return apiRequest('/api/bookings', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ eventId, seatNumbers }),
  })
}

export function fetchMyBookings() {
  return apiRequest('/api/bookings/me', {
    method: 'GET',
    headers: authHeaders(),
  })
}

export function cancelBooking(bookingId) {
  return apiRequest(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
}
