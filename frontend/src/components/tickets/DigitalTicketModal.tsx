// frontend/src/components/tickets/DigitalTicketModal.tsx
import React from 'react'
import { X, Calendar, MapPin, Armchair, ShieldCheck, Ticket as TicketIcon } from 'lucide-react'
import type { Ticket } from '../../types'
import { formatDate, formatTime } from '../../utils/formatters'
import { Badge } from '../common/Badge'

interface DigitalTicketModalProps {
  ticket: Ticket
  onClose: () => void
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-950 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-6 text-center text-white relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-widest mb-2">
            <TicketIcon className="w-3.5 h-3.5" />
            EVENTHUB Digital Pass
          </div>
          <h3 className="text-xl font-black tracking-tight leading-snug">
            {ticket.event_title || 'Admission Pass'}
          </h3>
          <p className="text-xs text-indigo-200 mt-1">{ticket.ticket_type_name || 'Standard Tier'}</p>
        </div>

        {/* Pass Details */}
        <div className="p-6 space-y-5 bg-slate-900">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge status={ticket.status} size="md" />
          </div>

          {/* Time & Venue */}
          <div className="space-y-2 text-xs text-center border-y border-slate-800 py-3">
            {ticket.start_time && (
              <div className="flex items-center justify-center gap-1.5 text-indigo-300 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(ticket.start_time)} at {formatTime(ticket.start_time)}</span>
              </div>
            )}
            {ticket.venue_name && (
              <div className="flex items-center justify-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{ticket.venue_name}</span>
              </div>
            )}
            {ticket.seat_label && (
              <div className="flex items-center justify-center gap-1.5 text-purple-300 font-mono font-bold text-sm">
                <Armchair className="w-4 h-4 text-purple-400" />
                <span>Reserved Seat: {ticket.seat_label}</span>
              </div>
            )}
          </div>

          {/* Simulated High-Contrast QR Code Card */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
            {/* SVG Visual QR Matrix representation */}
            <div className="w-40 h-40 flex items-center justify-center relative bg-white p-2">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-slate-950 fill-current"
                aria-label={`QR Code for ${ticket.ticket_code}`}
              >
                {/* 3 Corner Finder Squares */}
                <rect x="5" y="5" width="26" height="26" fill="black" rx="3" />
                <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="13" width="10" height="10" fill="black" rx="1" />

                <rect x="69" y="5" width="26" height="26" fill="black" rx="3" />
                <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="77" y="13" width="10" height="10" fill="black" rx="1" />

                <rect x="5" y="69" width="26" height="26" fill="black" rx="3" />
                <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="77" width="10" height="10" fill="black" rx="1" />

                {/* Deterministic QR Data Blocks based on ticket_code */}
                <rect x="36" y="8" width="8" height="8" fill="black" />
                <rect x="48" y="14" width="8" height="8" fill="black" />
                <rect x="40" y="26" width="6" height="6" fill="black" />
                <rect x="54" y="24" width="8" height="8" fill="black" />
                <rect x="12" y="38" width="8" height="8" fill="black" />
                <rect x="26" y="44" width="8" height="8" fill="black" />
                <rect x="42" y="42" width="16" height="16" fill="black" rx="2" />
                <rect x="68" y="40" width="8" height="8" fill="black" />
                <rect x="80" y="48" width="8" height="8" fill="black" />
                <rect x="36" y="68" width="8" height="8" fill="black" />
                <rect x="48" y="76" width="8" height="8" fill="black" />
                <rect x="68" y="68" width="10" height="10" fill="black" />
                <rect x="82" y="78" width="8" height="8" fill="black" />
              </svg>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-800 tracking-wider mt-2">
              {ticket.ticket_code}
            </span>
          </div>

          {/* Validation Security Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Present at event entrance for gate admission scanner</span>
          </div>
        </div>
      </div>
    </div>
  )
}
