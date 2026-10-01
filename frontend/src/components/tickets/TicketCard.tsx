// frontend/src/components/tickets/TicketCard.tsx
import React, { useState } from 'react'
import { Calendar, MapPin, QrCode, Armchair } from 'lucide-react'
import type { Ticket } from '../../types'
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters'
import { Badge } from '../common/Badge'
import { DigitalTicketModal } from './DigitalTicketModal'

interface TicketCardProps {
  ticket: Ticket
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between">
        {/* Ticket Top Section */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-1">
                Pass #{ticket.ticket_id}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {ticket.event_title || 'Admission Pass'}
              </h3>
            </div>
            <Badge status={ticket.status} size="sm" />
          </div>

          {/* Details Grid */}
          <div className="space-y-2 text-xs text-slate-300">
            {ticket.start_time && (
              <div className="flex items-center gap-2 text-indigo-300">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{formatDate(ticket.start_time)} &bull; {formatTime(ticket.start_time)}</span>
              </div>
            )}

            {ticket.venue_name && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ticket.venue_name}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Tier:</span>
              <span className="font-semibold text-slate-200">
                {ticket.ticket_type_name || 'Standard'}
              </span>
            </div>

            {ticket.seat_label && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Armchair className="w-3 h-3 text-purple-400" />
                  Reserved Seat:
                </span>
                <span className="font-mono font-bold text-purple-300">{ticket.seat_label}</span>
              </div>
            )}

            {ticket.price !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Paid:</span>
                <span className="font-mono font-semibold text-white">
                  {formatCurrency(ticket.price)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Perforation Divider */}
        <div className="relative flex items-center justify-between px-2 py-1">
          <div className="w-4 h-4 rounded-full bg-slate-950 -ml-4 border-r border-slate-800" />
          <div className="flex-1 border-t-2 border-dashed border-slate-800" />
          <div className="w-4 h-4 rounded-full bg-slate-950 -mr-4 border-l border-slate-800" />
        </div>

        {/* Ticket Bottom Section */}
        <div className="p-4 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Ticket Code</span>
            <span className="text-xs font-mono font-bold text-indigo-300 truncate block">
              {ticket.ticket_code}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Pass</span>
          </button>
        </div>
      </div>

      {showModal && (
        <DigitalTicketModal ticket={ticket} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
