// frontend/src/components/bookings/SeatLegend.tsx
import React from 'react'

export const SeatLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-md bg-slate-800 border border-slate-600 inline-block" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-md bg-indigo-600 border border-indigo-400 inline-block shadow-sm shadow-indigo-500/50" />
        <span className="font-semibold text-indigo-300">Selected</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-md bg-amber-950/60 border border-amber-700/60 inline-block" />
        <span>Held</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-md bg-slate-900 border border-slate-800 opacity-50 inline-block" />
        <span>Booked</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-md bg-rose-950/40 border border-rose-900/60 opacity-50 inline-block" />
        <span>Blocked</span>
      </div>
    </div>
  )
}
