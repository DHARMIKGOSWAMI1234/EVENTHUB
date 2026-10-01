// frontend/src/pages/customer/BookingFlowPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Ticket as TicketIcon, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag
} from 'lucide-react'
import { eventApi } from '../../services/eventApi'
import { bookingApi } from '../../services/bookingApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { 
  EventDetail, 
  EventSeat, 
  TicketType, 
  Booking, 
  PaymentMethod, 
  PaymentStatus 
} from '../../types'
import { SeatMap } from '../../components/bookings/SeatMap'
import { OrderSummary } from '../../components/bookings/OrderSummary'
import { PaymentSimulator } from '../../components/bookings/PaymentSimulator'
import { Button } from '../../components/common/Button'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { LoadingSpinner } from '../../components/common/Feedback'

type Step = 1 | 2 | 3 | 4

export const BookingFlowPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const numericId = Number(eventId)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>(1)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [seats, setSeats] = useState<EventSeat[]>([])
  const [selectedTier, setSelectedTier] = useState<TicketType | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<EventSeat[]>([])
  const [generalQuantity, setGeneralQuantity] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [refreshingSeats, setRefreshingSeats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Booking result after creation
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast('Please log in as a customer to book tickets', 'info')
      navigate('/login', { state: { from: { pathname: `/booking/${eventId}` } } })
    }
  }, [loading, isAuthenticated, navigate, eventId, toast])

  // Load Event and Seats data
  const loadEventAndSeats = async () => {
    if (isNaN(numericId)) {
      setError('Invalid event identifier')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const eventData = await eventApi.getEvent(numericId)
      setEvent(eventData)

      // Set default ticket tier if available
      if (eventData.ticket_types && eventData.ticket_types.length > 0) {
        setSelectedTier(eventData.ticket_types[0])
      }

      // If reserved, load seats
      if (eventData.seating_mode === 'RESERVED') {
        const seatsData = await eventApi.getSeats(numericId)
        setSeats(seatsData || [])
      }
    } catch (err: unknown) {
      setError('Failed to load event for booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventAndSeats()
  }, [numericId])

  const refreshSeats = async () => {
    if (!event || event.seating_mode !== 'RESERVED') return
    setRefreshingSeats(true)
    try {
      const seatsData = await eventApi.getSeats(numericId)
      setSeats(seatsData || [])
      // Remove any previously selected seat that is no longer AVAILABLE
      const availableIds = new Set(seatsData.filter((s) => s.status === 'AVAILABLE').map((s) => s.event_seat_id))
      setSelectedSeats((prev) => prev.filter((s) => availableIds.has(s.event_seat_id)))
    } catch {
      toast('Could not refresh seat availability', 'error')
    } finally {
      setRefreshingSeats(false)
    }
  }

  const handleToggleSelectSeat = (seat: EventSeat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.event_seat_id === seat.event_seat_id)
      if (exists) {
        return prev.filter((s) => s.event_seat_id !== seat.event_seat_id)
      } else {
        return [...prev, seat]
      }
    })
  }

  // STEP 1 -> STEP 2 (Proceed to Order Review)
  const handleProceedToReview = () => {
    if (!selectedTier) {
      toast('Please select a ticket tier', 'warning')
      return
    }

    if (event?.seating_mode === 'RESERVED') {
      if (selectedSeats.length === 0) {
        toast('Please select at least one seat from the seat map', 'warning')
        return
      }
    } else {
      if (generalQuantity <= 0) {
        toast('Quantity must be at least 1', 'warning')
        return
      }
    }

    setStep(2)
  }

  // STEP 2 -> STEP 3 (Create Booking with Row-Level Lock on Backend)
  const handleConfirmReservation = async () => {
    if (!event || !selectedTier) return

    setSubmittingBooking(true)
    try {
      const eventIdNum = event.event_id ?? event.id
      const ticketTypeId = selectedTier.ticket_type_id ?? selectedTier.id

      const items: { ticket_type_id: number; event_seat_id?: number; quantity: number }[] =
        event.seating_mode === 'RESERVED'
          ? selectedSeats.map((seat) => ({
              ticket_type_id: ticketTypeId,
              event_seat_id: seat.event_seat_id ?? seat.id,
              quantity: 1,
            }))
          : [
              {
                ticket_type_id: ticketTypeId,
                quantity: generalQuantity,
              },
            ]

      const bookingResult = await bookingApi.createBooking({
        event_id: eventIdNum,
        items,
      })

      setCreatedBooking(bookingResult)
      toast('Seat hold reservation established! Please complete payment.', 'success')
      setStep(3)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('409') || errMsg.toLowerCase().includes('seat') || errMsg.toLowerCase().includes('conflict')) {
        toast('This seat was just booked by another customer. Please choose another seat.', 'error')
        await refreshSeats()
        setStep(1)
      } else {
        toast(errMsg || 'Failed to establish booking reservation. Please try again.', 'error')
      }
    } finally {
      setSubmittingBooking(false)
    }
  }

  // STEP 3 -> STEP 4 (Simulate Payment)
  const handlePaymentComplete = async (method: PaymentMethod, status: PaymentStatus) => {
    if (!createdBooking) return

    setProcessingPayment(true)
    try {
      const bookingIdNum = createdBooking.booking_id ?? createdBooking.id
      await bookingApi.simulatePayment(bookingIdNum, {
        payment_method: method,
        status,
        gateway_response: { sim: true, ts: new Date().toISOString() },
      })

      if (status === 'COMPLETED') {
        toast('Payment confirmed! Digital tickets are ready.', 'success')
        setStep(4)
      } else {
        toast('Payment failed as simulated. You can retry with another method.', 'error')
      }
    } catch (err: unknown) {
      toast('Payment simulation failed. Please try again.', 'error')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading booking session..." />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-white">Booking Unavailable</h3>
        <p className="text-xs text-slate-400">{error || 'This event is not available for booking.'}</p>
        <Link to="/events">
          <Button variant="primary" size="sm">
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  const effectiveQuantity =
    event.seating_mode === 'RESERVED' ? selectedSeats.length : generalQuantity

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      {step < 4 && (
        <Link
          to={`/events/${event.event_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Details</span>
        </Link>
      )}

      {/* Step Tracker Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: 'Tickets & Seats' },
            { num: 2, label: 'Review Order' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'Confirmation' },
          ].map((s, idx) => {
            const isCompleted = step > s.num
            const isCurrent = step === s.num
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-4 ring-indigo-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:block ${
                      isCurrent ? 'text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                      step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* STEP 1: Select Ticket & Seat */}
      {step === 1 && (
        <div className="space-y-8">
          {/* Ticket Tier Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-indigo-400" />
              1. Select Ticket Tier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {event.ticket_types?.map((tier) => {
                const isSelected = selectedTier?.ticket_type_id === tier.ticket_type_id
                return (
                  <button
                    key={tier.ticket_type_id}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-white">{tier.name}</span>
                      <span className="text-base font-mono font-black text-indigo-400">
                        {formatCurrency(tier.price)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-1">
                      Tier Capacity: {tier.capacity} tickets
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reserved Seating vs General Admission Selection */}
          {event.seating_mode === 'RESERVED' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <SeatMap
                seats={seats}
                selectedSeats={selectedSeats}
                onToggleSelectSeat={handleToggleSelectSeat}
                onRefresh={refreshSeats}
                isRefreshing={refreshingSeats}
                maxSeats={6}
              />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-indigo-400" />
                2. Select General Admission Quantity
              </h3>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-white block">Number of Tickets</span>
                  <span className="text-xs text-slate-400">Max 10 passes per transaction</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGeneralQuantity((q) => Math.max(1, q - 1))}
                    disabled={generalQuantity <= 1}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-mono font-bold text-white">
                    {generalQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGeneralQuantity((q) => Math.min(10, q + 1))}
                    disabled={generalQuantity >= 10}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 Bottom Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Selected passes:{' '}
              <strong className="text-white font-mono">{effectiveQuantity}</strong>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={effectiveQuantity === 0}
              onClick={handleProceedToReview}
            >
              <span>Review Order</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Review Order */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <OrderSummary
                event={event}
                ticketType={selectedTier || undefined}
                quantity={effectiveQuantity}
                selectedSeats={selectedSeats}
                isProcessing={submittingBooking}
              />
            </div>

            <div className="md:col-span-1 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  PostgreSQL ACID Protection
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clicking Proceed locks these seats exclusively for your account using row-level locking.
                </p>
                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    isLoading={submittingBooking}
                    onClick={handleConfirmReservation}
                    className="w-full justify-center"
                  >
                    Proceed to Payment
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    disabled={submittingBooking}
                    onClick={() => setStep(1)}
                    className="w-full justify-center"
                  >
                    Modify Selection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Simulation */}
      {step === 3 && createdBooking && (
        <div className="max-w-2xl mx-auto">
          <PaymentSimulator
            amount={Number(createdBooking.total_amount)}
            bookingReference={createdBooking.booking_reference}
            onComplete={handlePaymentComplete}
            isLoading={processingPayment}
          />
        </div>
      )}

      {/* STEP 4: Confirmation */}
      {step === 4 && createdBooking && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Booking Confirmed
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              You&apos;re Going!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Your admission tickets have been generated with digital QR tokens.
            </p>
          </div>

          {/* Details summary */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Booking Reference:</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                {createdBooking.booking_reference}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Event:</span>
              <span className="font-semibold text-white truncate max-w-[240px]">
                {event.title}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Venue:</span>
              <span className="text-slate-300">{event.venue_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Date:</span>
              <span className="text-slate-300">{formatDate(event.start_time)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800/80 pt-2">
              <span className="text-slate-400 font-semibold">Total Paid:</span>
              <span className="font-mono font-black text-white text-base">
                {formatCurrency(createdBooking.total_amount)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/my-tickets" className="flex-1">
              <Button variant="primary" size="lg" className="w-full justify-center">
                <TicketIcon className="w-4 h-4 mr-2" />
                View My Tickets
              </Button>
            </Link>
            <Link to={`/booking/detail/${createdBooking.booking_id}`} className="flex-1">
              <Button variant="outline" size="lg" className="w-full justify-center">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Booking Receipt
              </Button>
            </Link>
          </div>

          <div>
            <Link to="/events" className="text-xs text-indigo-400 hover:underline">
              Browse More Events
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
