import React, { useState } from 'react'
import { QrCode, Search, CheckCircle2, XCircle, AlertTriangle, Ticket as TicketIcon } from 'lucide-react'
import { ticketApi } from '../../services/ticketApi'
import { useToast } from '../../context/ToastContext'
import type { TicketValidationResponse } from '../../types'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { formatDateTime } from '../../utils/formatters'

export const AdminTicketValidationPage: React.FC = () => {
  const [ticketCode, setTicketCode] = useState('')
  const [qrToken, setQrToken] = useState('')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<TicketValidationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketCode.trim() && !qrToken.trim()) {
      toast('Please enter either a Ticket Code or QR Token', 'warning')
      return
    }

    setValidating(true)
    setError(null)
    setResult(null)
    try {
      const data = await ticketApi.validateTicket({
        ticket_code: ticketCode.trim() || undefined,
        qr_token: qrToken.trim() || undefined,
      })
      setResult(data)
      if (data.valid) {
        toast('Ticket admission approved!', 'success')
      } else {
        toast(`Admission denied: ${data.message || 'Ticket invalid'}`, 'error')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ticket not found or invalid'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleReset = () => {
    setTicketCode('')
    setQrToken('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <QrCode className="w-3.5 h-3.5" />
          Venue Gate Admission Controller
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Gate Ticket Scanner
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Scan QR tokens or enter ticket codes to verify attendee entry. Validation status is determined strictly by the backend engine.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <form onSubmit={handleValidate} className="space-y-4">
          <Input
            label="Ticket Code"
            type="text"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
            placeholder="e.g. TKT-2026-XXXX"
            leftIcon={<TicketIcon className="w-4 h-4" />}
          />

          <div className="relative flex items-center justify-center my-2">
            <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-900 px-3 z-10">
              OR QR TOKEN
            </span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
          </div>

          <Input
            label="Cryptographic QR Token"
            type="text"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            placeholder="e.g. 64-character token hash..."
            leftIcon={<QrCode className="w-4 h-4" />}
          />

          <div className="pt-2 flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={validating}
              className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-500"
            >
              <Search className="w-4 h-4 mr-2" />
              Verify Ticket
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleReset}
            >
              Clear
            </Button>
          </div>
        </form>
      </div>

      {/* Validation Result Box */}
      {result && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
            result.valid
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-500/10'
              : 'bg-rose-950/40 border-rose-500/50 shadow-rose-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                result.valid
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {result.valid ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  result.valid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.valid ? 'ADMISSION PERMITTED' : 'ADMISSION REJECTED'}
              </span>
              <h3 className="text-xl font-black text-white">
                {result.status || (result.valid ? 'VALID' : 'INVALID')}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{result.message}</p>

          {result.ticket && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Pass Code:</span>
                <span className="text-white font-bold">{result.ticket.ticket_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event:</span>
                <span className="text-indigo-400">{result.ticket.event_title || `Event #${result.ticket.ticket_id}`}</span>
              </div>
              {result.ticket.seat_label && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Seat:</span>
                  <span className="text-purple-400 font-bold">{result.ticket.seat_label}</span>
                </div>
              )}
              {result.ticket.checked_in_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Checked In At:</span>
                  <span className="text-amber-400">{formatDateTime(result.ticket.checked_in_at)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-bold text-white uppercase">Ticket Lookup Error</h4>
            <p className="text-slate-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
