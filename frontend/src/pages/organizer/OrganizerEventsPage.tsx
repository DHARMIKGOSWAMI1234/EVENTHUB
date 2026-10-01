// frontend/src/pages/organizer/OrganizerEventsPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  CalendarDays, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Filter,
  Edit
} from 'lucide-react'
import { organizerApi } from '../../services/organizerApi'
import { useToast } from '../../context/ToastContext'
import type { EventItem } from '../../types'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Pagination } from '../../components/common/Pagination'
import { formatDate } from '../../utils/formatters'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const OrganizerEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Modals for actions
  const [targetEvent, setTargetEvent] = useState<EventItem | null>(null)
  const [actionType, setActionType] = useState<'publish' | 'cancel' | 'delete' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * pageSize
      const params: Record<string, unknown> = {
        limit: pageSize,
        offset,
      }
      if (statusFilter) params.status = statusFilter
      const res = await organizerApi.getMyEvents(params)
      setEvents(res.items || [])
      setTotalCount(res.total || 0)
    } catch (err) {
      console.error('Failed to load events', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [page, pageSize, statusFilter])

  const handleConfirmAction = async () => {
    if (!targetEvent || !actionType) return

    setActionLoading(true)
    try {
      const eventId = targetEvent.event_id ?? targetEvent.id
      if (actionType === 'publish') {
        await organizerApi.publishEvent(eventId)
        toast(`"${targetEvent.title}" has been published to the public catalog!`, 'success')
      } else if (actionType === 'cancel') {
        await organizerApi.cancelEvent(eventId)
        toast(`"${targetEvent.title}" has been cancelled.`, 'info')
      } else if (actionType === 'delete') {
        await organizerApi.deleteDraftEvent(eventId)
        toast(`Draft event "${targetEvent.title}" has been deleted.`, 'info')
      }
      setTargetEvent(null)
      setActionType(null)
      loadEvents()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      toast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manage Events</h2>
          <p className="text-xs text-slate-400">
            Publish draft events, manage ticketing tiers, and monitor attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <Link to="/organizer/events/new">
            <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading events..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No Events Found"
          description={
            statusFilter
              ? `No events found matching status "${statusFilter}".`
              : "You haven't created any events yet."
          }
          actionText={statusFilter ? 'Clear Filter' : 'Create First Event'}
          onAction={() => {
            if (statusFilter) setStatusFilter('')
            else window.location.href = '/organizer/events/new'
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Event Title</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {events.map((e) => {
                  const eventId = e.event_id ?? e.id
                  return (
                    <tr key={eventId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-white max-w-xs truncate">
                        {e.title}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {e.venue_name || 'Auditorium'}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {formatDate(e.start_time)}
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-purple-300">
                        {e.seating_mode}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={e.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/organizer/events/${eventId}`}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Edit Event & Tiers"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                        {e.status === 'DRAFT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetEvent(e)
                                setActionType('publish')
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              title="Publish Event"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetEvent(e)
                                setActionType('delete')
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {e.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetEvent(e)
                              setActionType('cancel')
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                            title="Cancel Event"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(targetEvent && actionType)}
        title={
          actionType === 'publish'
            ? 'Publish Event to Public?'
            : actionType === 'cancel'
            ? 'Cancel This Event?'
            : 'Delete Draft Event?'
        }
        message={
          actionType === 'publish'
            ? `Publishing "${targetEvent?.title}" will make it visible to customers for instant seat booking.`
            : actionType === 'cancel'
            ? `Are you sure you want to cancel "${targetEvent?.title}"? All existing bookings will be marked as cancelled.`
            : `Are you sure you want to delete draft "${targetEvent?.title}"? This cannot be undone.`
        }
        confirmText={
          actionType === 'publish'
            ? 'Yes, Publish Event'
            : actionType === 'cancel'
            ? 'Yes, Cancel Event'
            : 'Yes, Delete Draft'
        }
        confirmVariant={actionType === 'publish' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => {
          setTargetEvent(null)
          setActionType(null)
        }}
      />
    </div>
  )
}
