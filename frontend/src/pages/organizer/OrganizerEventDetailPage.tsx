import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  CalendarDays, 
  MapPin, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Ticket as TicketIcon,
  AlertCircle
} from 'lucide-react'
import { eventApi } from '../../services/eventApi'
import { organizerApi } from '../../services/organizerApi'
import { useToast } from '../../context/ToastContext'
import type { EventDetail } from '../../types'
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/Feedback'

export const OrganizerEventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const numericId = Number(eventId)
  const { toast } = useToast()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ticket tier modal
  const [showTierModal, setShowTierModal] = useState(false)
  const [tierName, setTierName] = useState('')
  const [tierPrice, setTierPrice] = useState<number | ''>('')
  const [tierCapacity, setTierCapacity] = useState<number | ''>('')
  const [savingTier, setSavingTier] = useState(false)

  // Status actions
  const [actionType, setActionType] = useState<'publish' | 'cancel' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadEvent = async () => {
    if (isNaN(numericId)) {
      setError('Invalid event identifier')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await eventApi.getEvent(numericId)
      setEvent(data)
    } catch {
      setError('Failed to load event console')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvent()
  }, [numericId])

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tierName.trim() || tierPrice === '' || tierCapacity === '') {
      toast('Please fill all tier fields', 'warning')
      return
    }

    setSavingTier(true)
    try {
      await organizerApi.createTicketType(numericId, {
        name: tierName.trim(),
        price: Number(tierPrice),
        capacity: Number(tierCapacity),
      })
      toast('Ticket tier added successfully!', 'success')
      setShowTierModal(false)
      setTierName('')
      setTierPrice('')
      setTierCapacity('')
      loadEvent()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add ticket tier'
      toast(msg, 'error')
    } finally {
      setSavingTier(false)
    }
  }

  const handleStatusAction = async () => {
    if (!actionType) return

    setActionLoading(true)
    try {
      if (actionType === 'publish') {
        if (!event?.ticket_types || event.ticket_types.length === 0) {
          toast('You must add at least one ticket tier before publishing', 'warning')
          setActionLoading(false)
          return
        }
        await organizerApi.publishEvent(numericId)
        toast('Event has been successfully published!', 'success')
      } else if (actionType === 'cancel') {
        await organizerApi.cancelEvent(numericId)
        toast('Event has been cancelled.', 'info')
      }
      setActionType(null)
      loadEvent()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      toast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading event console..." />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-white">Event Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Unable to access event.'}</p>
        <Link to="/organizer/events">
          <Button variant="primary" size="sm">
            Back to My Events
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/organizer/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">
                Event Console #{event.event_id}
              </span>
              <Badge status={event.status} size="sm" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {event.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-purple-300">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(event.start_time)} at {formatTime(event.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.venue_name} ({event.venue_city})
              </span>
              <span className="font-mono text-purple-300">
                Mode: {event.seating_mode}
              </span>
            </div>
          </div>

          {/* Action buttons based on status */}
          <div className="flex items-center gap-2">
            {event.status === 'DRAFT' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setActionType('publish')}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish Event
              </Button>
            )}

            {event.status === 'PUBLISHED' && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setActionType('cancel')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Event
              </Button>
            )}
          </div>
        </div>

        {/* Description summary */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Description
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>
        </div>
      </div>

      {/* Ticket Tier Management Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-purple-400" />
              Ticket Tiers &amp; Pricing
            </h3>
            <p className="text-xs text-slate-400">
              Configure admission tiers, prices, and ticket capacities for this event.
            </p>
          </div>

          {event.status === 'DRAFT' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTierModal(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Tier
            </Button>
          )}
        </div>

        {/* Tiers List */}
        {!event.ticket_types || event.ticket_types.length === 0 ? (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-3">
            <p>No ticket tiers configured. You must add at least one tier to publish this event.</p>
            {event.status === 'DRAFT' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowTierModal(true)}
                className="bg-purple-600 hover:bg-purple-500"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Ticket Tier
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {event.ticket_types.map((tier) => (
              <div
                key={tier.ticket_type_id}
                className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{tier.name}</h4>
                  <div className="text-xs text-slate-400">
                    Capacity: <span className="font-mono text-slate-200">{tier.capacity} passes</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-purple-400 font-mono">
                    {formatCurrency(tier.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Tier Modal */}
      <Modal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        title="Add Ticket Pricing Tier"
        description="Define a new tier such as General Admission, VIP Pass, or Student Discount."
      >
        <form onSubmit={handleAddTier} className="space-y-4">
          <Input
            label="Tier Name"
            type="text"
            required
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            placeholder="e.g. VIP Balcony Pass"
          />

          <Input
            label="Price (INR)"
            type="number"
            required
            min="0"
            step="1"
            value={tierPrice}
            onChange={(e) => setTierPrice(Number(e.target.value))}
            placeholder="e.g. 1499"
          />

          <Input
            label="Capacity"
            type="number"
            required
            min="1"
            value={tierCapacity}
            onChange={(e) => setTierCapacity(Number(e.target.value))}
            placeholder="e.g. 100"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowTierModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingTier}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Add Tier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(actionType)}
        title={actionType === 'publish' ? 'Publish Event?' : 'Cancel Event?'}
        message={
          actionType === 'publish'
            ? 'Publishing will immediately open this event for customer seat booking and ticket purchases.'
            : 'Cancelling this event will flag all existing bookings as cancelled and notify attendees.'
        }
        confirmText={actionType === 'publish' ? 'Yes, Publish' : 'Yes, Cancel Event'}
        confirmVariant={actionType === 'publish' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleStatusAction}
        onClose={() => setActionType(null)}
      />
    </div>
  )
}
