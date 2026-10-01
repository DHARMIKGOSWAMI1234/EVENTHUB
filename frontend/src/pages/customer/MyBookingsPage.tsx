// frontend/src/pages/customer/MyBookingsPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight, Filter } from 'lucide-react'
import { bookingApi } from '../../services/bookingApi'
import type { Booking } from '../../types'
import { Badge } from '../../components/common/Badge'
import { Pagination } from '../../components/common/Pagination'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setLoading(true)
      try {
        const offset = (page - 1) * pageSize
        const params: Record<string, unknown> = {
          limit: pageSize,
          offset,
        }
        if (statusFilter) {
          params.status = statusFilter
        }
        const res = await bookingApi.getMyBookings(params)
        if (isMounted) {
          setBookings(res.items || [])
          setTotalCount(res.total || 0)
        }
      } catch (err) {
        console.error('Failed to load bookings', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadBookings()
    return () => {
      isMounted = false
    }
  }, [page, pageSize, statusFilter])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Booking History</h2>
          <p className="text-xs text-slate-400">
            View order details, transaction references, and payment statuses.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending Payment</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading bookings..." />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Bookings Found"
          description={
            statusFilter
              ? `No bookings with status "${statusFilter}" were found.`
              : 'You have not made any event bookings yet.'
          }
          actionText={statusFilter ? 'Clear Filter' : 'Explore Events'}
          onAction={() => {
            if (statusFilter) setStatusFilter('')
            else window.location.href = '/events'
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Date Booked</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {bookings.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-400">
                      {b.booking_reference}
                    </td>
                    <td className="px-5 py-4 font-medium text-white max-w-xs truncate">
                      {b.event_title || `Event #${b.event_id}`}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {formatDateTime(b.created_at)}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={b.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/booking/detail/${b.booking_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
    </div>
  )
}
