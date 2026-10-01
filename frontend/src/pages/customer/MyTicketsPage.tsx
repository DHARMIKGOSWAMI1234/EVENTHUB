// frontend/src/pages/customer/MyTicketsPage.tsx
import React, { useState, useEffect } from 'react'
import { Ticket as TicketIcon, Filter } from 'lucide-react'
import { ticketApi } from '../../services/ticketApi'
import type { Ticket } from '../../types'
import { TicketCard } from '../../components/tickets/TicketCard'
import { Pagination } from '../../components/common/Pagination'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const MyTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadTickets = async () => {
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
        const res = await ticketApi.getMyTickets(params)
        if (isMounted) {
          setTickets(res.items || [])
          setTotalCount(res.total || 0)
        }
      } catch (err) {
        console.error('Failed to load tickets', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTickets()
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
          <h2 className="text-xl font-bold text-white tracking-tight">My Admission Passes</h2>
          <p className="text-xs text-slate-400">
            View active passes, seat details, and digital QR codes for venue admission.
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
            <option value="">All Passes</option>
            <option value="ISSUED">Active (Issued)</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading tickets..." />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No Tickets Found"
          description={
            statusFilter
              ? `No tickets with status "${statusFilter}" were found.`
              : 'You do not have any admission tickets yet.'
          }
          actionText={statusFilter ? 'Clear Filter' : 'Explore Events'}
          onAction={() => {
            if (statusFilter) setStatusFilter('')
            else window.location.href = '/events'
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((t) => (
              <TicketCard key={t.ticket_id} ticket={t} />
            ))}
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
