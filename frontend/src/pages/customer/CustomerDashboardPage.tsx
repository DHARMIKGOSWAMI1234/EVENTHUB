// frontend/src/pages/customer/CustomerDashboardPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ShoppingBag, 
  Ticket as TicketIcon, 
  Heart, 
  Bell, 
  ArrowRight, 
  Search
} from 'lucide-react'
import { bookingApi } from '../../services/bookingApi'
import { ticketApi } from '../../services/ticketApi'
import { favoriteApi, notificationApi } from '../../services/userActionsApi'
import type { Booking, Ticket, Favorite, Notification } from '../../types'
import { StatCard } from '../../components/analytics/AnalyticsCharts'
import { TicketCard } from '../../components/tickets/TicketCard'
import { Badge } from '../../components/common/Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { LoadingSpinner } from '../../components/common/Feedback'

export const CustomerDashboardPage: React.FC = () => {

  const [bookings, setBookings] = useState<Booking[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadCustomerData = async () => {
      try {
        const [bookingsRes, ticketsRes, favsRes, notifsRes] = await Promise.all([
          bookingApi.getMyBookings({ limit: 5 }),
          ticketApi.getMyTickets({ limit: 4 }),
          favoriteApi.getFavorites(),
          notificationApi.getNotifications({ limit: 5 }),
        ])

        if (isMounted) {
          setBookings(bookingsRes.items || [])
          setTickets(ticketsRes.items || [])
          setFavorites(favsRes || [])
          setNotifications(notifsRes.items || [])
        }
      } catch (err) {
        console.error('Failed to load customer dashboard', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCustomerData()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading customer dashboard..." />
      </div>
    )
  }

  const unreadNotifs = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-10">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={bookings.length}
          subtitle="Orders placed"
          icon={ShoppingBag}
          color="indigo"
        />
        <StatCard
          title="Active Tickets"
          value={tickets.filter((t) => t.status === 'ISSUED').length}
          subtitle="Valid admission passes"
          icon={TicketIcon}
          color="purple"
        />
        <StatCard
          title="Saved Events"
          value={favorites.length}
          subtitle="In your wishlist"
          icon={Heart}
          color="rose"
        />
        <StatCard
          title="Notifications"
          value={unreadNotifs}
          subtitle={unreadNotifs === 1 ? 'Unread update' : 'Unread updates'}
          icon={Bell}
          color="amber"
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/events"
          className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-indigo-900/20 to-slate-900 border border-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">
                Browse New Events
              </h4>
              <p className="text-xs text-slate-400">Discover what’s happening</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/my-tickets"
          className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-900/20 to-slate-900 border border-purple-500/20 hover:border-purple-500/40 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300">
                View Digital Passes
              </h4>
              <p className="text-xs text-slate-400">Present at venue entrance</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/favorites"
          className="p-5 rounded-2xl bg-gradient-to-r from-rose-900/40 via-rose-900/20 to-slate-900 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-rose-300">
                Saved Wishlist
              </h4>
              <p className="text-xs text-slate-400">Events you care about</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Tickets Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Passes</h3>
          </div>
          <Link
            to="/my-tickets"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>All Passes ({tickets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            You don’t have any active admission passes yet.{' '}
            <Link to="/events" className="text-indigo-400 font-semibold hover:underline">
              Explore events and book tickets
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tickets.map((t) => (
              <TicketCard key={t.ticket_id} ticket={t} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Bookings Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Bookings</h3>
          </div>
          <Link
            to="/my-bookings"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>All Bookings ({bookings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            No bookings recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Booking Ref</th>
                  <th className="px-5 py-3">Event Title</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {bookings.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-400">
                      {b.booking_reference}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white max-w-xs truncate">
                      {b.event_title || `Event #${b.event_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-white">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={b.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/booking/detail/${b.booking_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
