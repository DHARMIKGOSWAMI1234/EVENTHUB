// frontend/src/pages/customer/TicketDetailPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Armchair, ShieldCheck } from 'lucide-react'
import { ticketApi } from '../../services/ticketApi'
import type { Ticket } from '../../types'
import { formatDate, formatTime } from '../../utils/formatters'
import { Badge } from '../../components/common/Badge'
import { LoadingSpinner } from '../../components/common/Feedback'

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const numericId = Number(ticketId)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNaN(numericId)) {
      setError('Invalid ticket identifier')
      setLoading(false)
      return
    }

    let isMounted = true
    const loadTicket = async () => {
      setLoading(true)
      try {
        const data = await ticketApi.getTicket(numericId)
        if (isMounted) setTicket(data)
      } catch (err: unknown) {
        if (isMounted) setError('Unable to load ticket pass')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTicket()
    return () => {
      isMounted = false
    }
  }, [numericId])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading ticket pass..." />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Ticket not found.'}</p>
        <Link to="/my-tickets" className="text-xs text-indigo-400 hover:underline">
          Back to Tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link
        to="/my-tickets"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Tickets</span>
      </Link>

      {/* Ticket Pass Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-6 text-center text-white">
          <span className="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full font-bold">
            Pass #{ticket.ticket_id}
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-2 leading-tight">
            {ticket.event_title || 'Admission Pass'}
          </h2>
          <p className="text-xs text-indigo-200 mt-1">{ticket.ticket_type_name || 'Standard Tier'}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <Badge status={ticket.status} size="md" />
          </div>

          <div className="space-y-2 text-xs text-center border-y border-slate-800 py-3">
            {ticket.start_time && (
              <div className="flex items-center justify-center gap-1.5 text-indigo-300">
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
              <div className="flex items-center justify-center gap-1.5 text-purple-300 font-mono font-bold">
                <Armchair className="w-4 h-4 text-purple-400" />
                <span>Seat: {ticket.seat_label}</span>
              </div>
            )}
          </div>

          {/* QR representation */}
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl">
            <div className="w-44 h-44 flex items-center justify-center relative bg-white p-2">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
                <rect x="5" y="5" width="26" height="26" fill="black" rx="3" />
                <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="13" width="10" height="10" fill="black" rx="1" />

                <rect x="69" y="5" width="26" height="26" fill="black" rx="3" />
                <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                <rect x="77" y="13" width="10" height="10" fill="black" rx="1" />

                <rect x="5" y="69" width="26" height="26" fill="black" rx="3" />
                <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                <rect x="13" y="77" width="10" height="10" fill="black" rx="1" />

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
            <span className="text-xs font-mono font-bold text-slate-900 tracking-wider mt-2">
              {ticket.ticket_code}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Ticket Admission Token</span>
          </div>
        </div>
      </div>
    </div>
  )
}
