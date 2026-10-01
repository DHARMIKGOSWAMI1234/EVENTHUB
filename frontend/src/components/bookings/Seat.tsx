// frontend/src/components/bookings/Seat.tsx
import React from 'react'
import type { EventSeat } from '../../types'

interface SeatProps {
  seat: EventSeat
  isSelected: boolean
  onToggleSelect: (seat: EventSeat) => void
}

export const Seat: React.FC<SeatProps> = ({ seat, isSelected, onToggleSelect }) => {
  const isAvailable = seat.status === 'AVAILABLE'

  let statusStyles = ''
  let statusTitle = ''

  if (isSelected) {
    statusStyles = 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/50 scale-110 z-10'
    statusTitle = `${seat.seat_label} (Selected)`
  } else {
    switch (seat.status) {
      case 'AVAILABLE':
        statusStyles = 'bg-slate-800/80 hover:bg-indigo-700/60 border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white cursor-pointer active:scale-95'
        statusTitle = `${seat.seat_label} - Available`
        break
      case 'HELD':
        statusStyles = 'bg-amber-950/60 border-amber-700/60 text-amber-400/80 cursor-not-allowed opacity-70'
        statusTitle = `${seat.seat_label} - Held by another customer`
        break
      case 'BOOKED':
        statusStyles = 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
        statusTitle = `${seat.seat_label} - Booked`
        break
      case 'BLOCKED':
        statusStyles = 'bg-rose-950/40 border-rose-900/60 text-rose-500/60 cursor-not-allowed opacity-40'
        statusTitle = `${seat.seat_label} - Blocked`
        break
    }
  }

  return (
    <button
      type="button"
      disabled={!isAvailable && !isSelected}
      onClick={() => isAvailable && onToggleSelect(seat)}
      title={statusTitle}
      aria-label={statusTitle}
      className={`relative w-8 h-8 rounded-lg border text-[10px] font-mono font-medium flex items-center justify-center transition-all duration-150 ${statusStyles}`}
    >
      {seat.seat_number}
    </button>
  )
}
