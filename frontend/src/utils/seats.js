export const SEATS_PER_ROW = 10

export function getRowLabel(rowIndex) {
  if (rowIndex < 26) {
    return String.fromCharCode(65 + rowIndex)
  }
  const first = String.fromCharCode(65 + Math.floor(rowIndex / 26) - 1)
  const second = String.fromCharCode(65 + (rowIndex % 26))
  return `${first}${second}`
}

export function formatSeatCode(seatNumber) {
  const zeroBased = seatNumber - 1
  const rowIndex = Math.floor(zeroBased / SEATS_PER_ROW)
  const col = (zeroBased % SEATS_PER_ROW) + 1
  return `${getRowLabel(rowIndex)}-${String(col).padStart(2, '0')}`
}

export function formatSchedule(startsAt, endsAt) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const sameDay = start.toDateString() === end.toDateString()

  const datePart = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const startTime = start.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = end.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (sameDay) {
    return `${datePart} · ${startTime} – ${endTime}`
  }

  const endDatePart = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${datePart}, ${startTime} – ${endDatePart}, ${endTime}`
}
