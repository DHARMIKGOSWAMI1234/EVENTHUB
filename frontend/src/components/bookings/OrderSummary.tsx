// frontend/src/components/bookings/OrderSummary.tsx
import React from 'react'
import { Calendar, MapPin, Ticket, ShieldCheck, Armchair } from 'lucide-react'
import type { EventItem, TicketType, EventSeat } from '../../types'
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters'

interface OrderSummaryProps {
  event: EventItem
  ticketType?: TicketType
  quantity: number
  selectedSeats?: EventSeat[]
  subtotal?: number
  discount?: number
  tax?: number
  total?: number
  isProcessing?: boolean
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  event,
  ticketType,
  quantity,
  selectedSeats = [],
  subtotal,
  discount = 0,
  tax,
  total,
  isProcessing = false,
}) => {
  // If backend totals are provided, use them; otherwise compute preview safely
  const unitPrice = ticketType ? Number(ticketType.price) : 0
  const computedSubtotal = subtotal !== undefined ? Number(subtotal) : unitPrice * quantity
  // 18% standard GST tax preview if not yet calculated by backend
  const computedTax = tax !== undefined ? Number(tax) : Number((computedSubtotal * 0.18).toFixed(2))
  const computedTotal = total !== undefined ? Number(total) : computedSubtotal - Number(discount) + computedTax

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Ticket className="w-4 h-4 text-indigo-400" />
          Order Summary
        </h3>
        <p className="text-xs text-slate-400 mt-1">Review event &amp; admission details</p>
      </div>

      {/* Event Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white leading-snug">{event.title}</h4>
        
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-indigo-300">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(event.start_time)} at {formatTime(event.start_time)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{event.venue_name || 'Venue'}, {event.venue_city || ''}</span>
          </div>

          {selectedSeats.length > 0 && (
            <div className="flex items-start gap-2 text-slate-300 pt-1">
              <Armchair className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400">Seats: </span>
                <span className="font-mono font-semibold text-purple-300">
                  {selectedSeats.map((s) => s.seat_label).join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-300">
          <span>
            {ticketType?.name || 'Admission Ticket'} &times; {quantity}
          </span>
          <span className="font-mono">{formatCurrency(computedSubtotal)}</span>
        </div>

        {Number(discount) > 0 && (
          <div className="flex justify-between items-center text-emerald-400">
            <span>Discount / Promo</span>
            <span className="font-mono">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-400">
          <span>GST / Platform Fee (18%)</span>
          <span className="font-mono">{formatCurrency(computedTax)}</span>
        </div>

        {/* Total Price */}
        <div className="border-t border-slate-800/80 pt-3 flex justify-between items-baseline">
          <div>
            <span className="text-sm font-bold text-white block">Total Amount</span>
            <span className="text-[10px] text-slate-500">Includes all taxes</span>
          </div>
          <span className="text-xl font-extrabold text-indigo-400 font-mono">
            {formatCurrency(computedTotal)}
          </span>
        </div>
      </div>

      {/* Assurance Note */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Authoritative PostgreSQL row-level locks protect this reservation.</span>
      </div>

      {isProcessing && (
        <div className="text-center text-xs text-indigo-400 animate-pulse font-medium">
          Processing booking reservation...
        </div>
      )}
    </div>
  )
}
