// frontend/src/pages/customer/BookingDetailPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Ticket as TicketIcon, 
  XCircle, 
  CreditCard
} from 'lucide-react'
import { bookingApi } from '../../services/bookingApi'
import { useToast } from '../../context/ToastContext'
import type { BookingDetail, PaymentMethod, PaymentStatus } from '../../types'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PaymentSimulator } from '../../components/bookings/PaymentSimulator'
import { LoadingSpinner } from '../../components/common/Feedback'

export const BookingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const numericId = Number(bookingId)
  const { toast } = useToast()

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const loadBooking = async () => {
    if (isNaN(numericId)) {
      setError('Invalid booking identifier')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await bookingApi.getBooking(numericId)
      setBooking(data)
    } catch (err: unknown) {
      setError('Unable to load booking details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [numericId])

  const handleCancelBooking = async () => {
    setCancelling(true)
    try {
      await bookingApi.cancelBooking(numericId)
      toast('Booking has been cancelled. Released seats/inventory have been restored.', 'info')
      setShowCancelModal(false)
      loadBooking()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking'
      toast(msg, 'error')
    } finally {
      setCancelling(false)
    }
  }

  const handleSimulatePayment = async (method: PaymentMethod, status: PaymentStatus) => {
    setProcessingPayment(true)
    try {
      await bookingApi.simulatePayment(numericId, {
        payment_method: method,
        status,
        gateway_response: { sim_provider: 'EVENTHUB_PG', timestamp: new Date().toISOString() },
      })
      if (status === 'COMPLETED') {
        toast('Payment completed successfully! Admission tickets have been generated.', 'success')
      } else {
        toast('Payment failed as simulated.', 'error')
      }
      setShowPaymentModal(false)
      loadBooking()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment simulation failed'
      toast(msg, 'error')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading booking reservation..." />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Booking reservation not found.'}</p>
        <Link to="/my-bookings">
          <Button variant="primary" size="sm">
            Back to My Bookings
          </Button>
        </Link>
      </div>
    )
  }

  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED'
  const isPending = booking.status === 'PENDING'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        to="/my-bookings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Bookings</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">
              Reservation Reference
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {booking.booking_reference}
            </h2>
            <span className="text-xs text-slate-400 mt-1 block">
              Created on {formatDateTime(booking.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge status={booking.status} size="lg" />
          </div>
        </div>

        {/* Event Quick Details */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">{booking.event_title || `Event #${booking.event_id}`}</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              {booking.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {booking.venue_name}
                </span>
              )}
              {booking.start_time && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {formatDateTime(booking.start_time)}
                </span>
              )}
            </div>
          </div>

          {/* Pending Payment Action */}
          {isPending && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setShowPaymentModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Complete Payment ({formatCurrency(booking.total_amount)})
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Items & Seats Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TicketIcon className="w-4 h-4 text-indigo-400" />
          Booked Admission Items ({booking.items?.length || 0})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
              <tr>
                <th className="py-2.5">Item / Tier</th>
                <th className="py-2.5">Seat Label</th>
                <th className="py-2.5 text-center">Quantity</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {booking.items?.map((item) => (
                <tr key={item.booking_item_id}>
                  <td className="py-3 font-semibold text-white">
                    {item.ticket_type_name || `Tier #${item.ticket_type_id}`}
                  </td>
                  <td className="py-3 font-mono">
                    {item.seat_label ? (
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold">
                        {item.seat_label}
                      </span>
                    ) : (
                      <span className="text-slate-500">General</span>
                    )}
                  </td>
                  <td className="py-3 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Order Math Breakdown */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Financial Breakdown
        </h4>
        <div className="max-w-md ml-auto space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono text-slate-200">{formatCurrency(booking.subtotal)}</span>
          </div>
          {Number(booking.discount_amount) > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span className="font-mono">-{formatCurrency(booking.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Taxes &amp; Fees (GST 18%)</span>
            <span className="font-mono text-slate-200">{formatCurrency(booking.tax_amount)}</span>
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-white">Total Amount</span>
            <span className="text-xl font-black text-indigo-400 font-mono">
              {formatCurrency(booking.total_amount)}
            </span>
          </div>
        </div>
      </section>

      {/* Payment Details if available */}
      {booking.payment && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Payment Transaction
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase block">Payment ID</span>
              <span className="font-mono text-slate-200">#{booking.payment.payment_id}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block">Method</span>
              <span className="font-semibold text-white">{booking.payment.payment_method}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block">Transaction Ref</span>
              <span className="font-mono text-indigo-300 truncate block">
                {booking.payment.transaction_reference}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block">Status</span>
              <Badge status={booking.payment.status} size="sm" />
            </div>
          </div>
        </section>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <Link to="/my-tickets">
          <Button variant="outline" size="md">
            <TicketIcon className="w-4 h-4 mr-2" />
            View Digital Tickets
          </Button>
        </Link>

        {canCancel && (
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => setShowCancelModal(true)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Booking
          </Button>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelModal}
        title="Cancel This Booking?"
        message="Are you sure you want to cancel this reservation? All held or booked seats will be immediately released back to available inventory."
        confirmText="Yes, Cancel Booking"
        confirmVariant="danger"
        isLoading={cancelling}
        onConfirm={handleCancelBooking}
        onClose={() => setShowCancelModal(false)}
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <PaymentSimulator
              amount={Number(booking.total_amount)}
              bookingReference={booking.booking_reference}
              onComplete={handleSimulatePayment}
              isLoading={processingPayment}
            />
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
