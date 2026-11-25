import { useState } from 'react'

const ROWS = [
  {
    row: 'A',
    tier: 'Front Tier',
    seats: [
      { id: 'A-01', status: 'reserved' },
      { id: 'A-02', status: 'reserved' },
      { id: 'A-03', status: 'available' },
      { id: 'A-04', status: 'available' },
      { id: 'A-05', status: 'reserved' },
      { id: 'A-06', status: 'available' },
    ],
  },
  {
    row: 'B',
    tier: 'Main Floor',
    seats: [
      { id: 'B-01', status: 'available' },
      { id: 'B-02', status: 'available' },
      { id: 'B-03', status: 'reserved' },
      { id: 'B-04', status: 'available' },
      { id: 'B-05', status: 'available' },
      { id: 'B-06', status: 'reserved' },
    ],
  },
  {
    row: 'C',
    tier: 'Main Floor',
    seats: [
      { id: 'C-01', status: 'reserved' },
      { id: 'C-02', status: 'available' },
      { id: 'C-03', status: 'available' },
      { id: 'C-04', status: 'reserved' },
      { id: 'C-05', status: 'available' },
      { id: 'C-06', status: 'available' },
    ],
  },
]

const STATUS_LABELS = {
  available: 'Open for allocation',
  reserved: 'Allocated',
  selected: 'Preview selected',
}

export default function SeatingPreview() {
  const [selectedSeatId, setSelectedSeatId] = useState('B-04')

  const selectedSeat =
    ROWS.flatMap((r) => r.seats.map((s) => ({ ...s, tier: r.tier }))).find(
      (s) => s.id === selectedSeatId,
    ) ?? { id: 'B-04', status: 'available', tier: 'Main Floor' }

  function renderSeatGroup(seats) {
    return (
      <div className="seat-pair">
        {seats.map((seat) => {
          const isSelected = seat.id === selectedSeatId
          const state = isSelected ? 'selected' : seat.status
          return (
            <button
              key={seat.id}
              type="button"
              disabled={seat.status === 'reserved'}
              className={`seat-cell seat-${state}`}
              onClick={() => setSelectedSeatId(seat.id)}
              aria-label={`Seat ${seat.id}, ${STATUS_LABELS[state]}`}
              aria-pressed={isSelected}
            >
              {seat.id.split('-')[1]}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="schematic-card" aria-label="Interactive seating layout preview">
      <div className="schematic-header">
        <div>
          <span className="mono-label">FLOORPLAN PREVIEW · HALL 01</span>
          <p className="schematic-sub">Click any open seat to inspect coordinates</p>
        </div>
        <span className="stage-pill">STAGE NORTH</span>
      </div>

      <div className="stage-arc" aria-hidden="true">
        <div className="stage-line" />
      </div>

      <div className="seat-grid" role="group" aria-label="Seat rows">
        {ROWS.map((rowGroup) => (
          <div key={rowGroup.row} className="seat-row">
            <span className="row-badge" aria-hidden="true">
              {rowGroup.row}
            </span>
            {renderSeatGroup(rowGroup.seats.slice(0, 3))}
            <span className="aisle-gap" aria-hidden="true" />
            {renderSeatGroup(rowGroup.seats.slice(3))}
          </div>
        ))}
      </div>

      <div className="schematic-footer">
        <div className="seat-inspector">
          <span className="mono-label">SELECTED COORDINATE</span>
          <div className="inspector-value">
            <strong>{selectedSeat.id}</strong>
            <span>{selectedSeat.tier}</span>
          </div>
        </div>
        <div className="legend" aria-label="Seat status legend">
          <span className="legend-item">
            <i className="dot dot-available" /> Open
          </span>
          <span className="legend-item">
            <i className="dot dot-selected" /> Selected
          </span>
          <span className="legend-item">
            <i className="dot dot-reserved" /> Held
          </span>
        </div>
      </div>
    </div>
  )
}
