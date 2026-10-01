// frontend/src/components/bookings/SeatMap.tsx
import React, { useMemo } from 'react'
import type { EventSeat } from '../../types'
import { Seat } from './Seat'
import { SeatLegend } from './SeatLegend'
import { Monitor, RefreshCw } from 'lucide-react'

interface SeatMapProps {
  seats: EventSeat[]
  selectedSeats: EventSeat[]
  onToggleSelectSeat: (seat: EventSeat) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  maxSeats?: number
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onToggleSelectSeat,
  onRefresh,
  isRefreshing = false,
  maxSeats = 6,
}) => {
  // Group seats by section and row
  const groupedSeats = useMemo(() => {
    const sections: Record<string, Record<string, EventSeat[]>> = {}
    
    // Sort seats deterministically by section, row, then seat number
    const sorted = [...seats].sort((a, b) => {
      const secA = a.section || a.section_name || 'Standard'
      const secB = b.section || b.section_name || 'Standard'
      if (secA !== secB) return secA.localeCompare(secB)
      const rowA = a.row_number || a.row_label || 'A'
      const rowB = b.row_number || b.row_label || 'A'
      if (rowA !== rowB) return rowA.localeCompare(rowB)
      return parseInt(String(a.seat_number), 10) - parseInt(String(b.seat_number), 10)
    })

    for (const seat of sorted) {
      const section = seat.section || seat.section_name || 'Standard'
      const row = seat.row_number || seat.row_label || 'A'
      if (!sections[section]) {
        sections[section] = {}
      }
      if (!sections[section][row]) {
        sections[section][row] = []
      }
      sections[section][row].push(seat)
    }

    return sections
  }, [seats])

  const selectedSeatIds = useMemo(
    () => new Set(selectedSeats.map((s) => s.event_seat_id ?? s.id)),
    [selectedSeats]
  )

  const handleSeatClick = (seat: EventSeat) => {
    const seatId = seat.event_seat_id ?? seat.id
    if (!selectedSeatIds.has(seatId) && selectedSeats.length >= maxSeats) {
      return
    }
    onToggleSelectSeat(seat)
  }

  const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length

  return (
    <div className="space-y-6">
      {/* Top Controls & Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Interactive Seat Map</h3>
          <p className="text-xs text-slate-400">
            {availableCount} available &bull; Max {maxSeats} seats per booking
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh Availability</span>
            </button>
          )}
        </div>
      </div>

      <SeatLegend />

      {/* Stage Visual */}
      <div className="relative mx-auto max-w-lg text-center pt-2">
        <div className="w-full h-8 bg-gradient-to-b from-indigo-500/20 to-transparent border-t-2 border-indigo-400/80 rounded-t-3xl flex items-center justify-center text-xs font-semibold tracking-widest uppercase text-indigo-300">
          <Monitor className="w-3.5 h-3.5 mr-2 inline" />
          STAGE / SCREEN
        </div>
      </div>

      {/* Main Seat Layout */}
      <div className="overflow-x-auto p-4 sm:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl max-w-full">
        <div className="min-w-[500px] flex flex-col items-center gap-8">
          {Object.entries(groupedSeats).map(([sectionName, rows]) => (
            <div key={sectionName} className="w-full flex flex-col items-center gap-3">
              {/* Section Header */}
              <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {sectionName} Section
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-2 w-full items-center">
                {Object.entries(rows).map(([rowLabel, rowSeats]) => (
                  <div key={rowLabel} className="flex items-center gap-2">
                    {/* Row Label */}
                    <span className="w-6 text-center text-xs font-mono font-semibold text-slate-500">
                      {rowLabel}
                    </span>

                    {/* Seats in this row */}
                    <div className="flex items-center gap-1.5">
                      {rowSeats.map((seat) => {
                        const sid = seat.event_seat_id ?? seat.id
                        return (
                          <Seat
                            key={sid}
                            seat={seat}
                            isSelected={selectedSeatIds.has(sid)}
                            onToggleSelect={handleSeatClick}
                          />
                        )
                      })}
                    </div>

                    {/* Right Row Label */}
                    <span className="w-6 text-center text-xs font-mono font-semibold text-slate-500">
                      {rowLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Seats summary */}
      {selectedSeats.length > 0 && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Selected ({selectedSeats.length}):</span>
            {selectedSeats.map((s) => {
              const sid = s.event_seat_id ?? s.id
              const label = s.seat_label || `${s.row_number || s.row_label || ''}${s.seat_number}`
              return (
                <span
                  key={sid}
                  className="px-2 py-0.5 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-mono font-bold"
                >
                  {label}
                </span>
              )
            })}
          </div>
          <span className="text-indigo-400 font-semibold text-[11px]">
            {selectedSeats.length === maxSeats ? 'Maximum selected' : `Pick up to ${maxSeats}`}
          </span>
        </div>
      )}
    </div>
  )
}
