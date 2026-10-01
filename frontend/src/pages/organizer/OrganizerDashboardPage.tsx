// frontend/src/pages/organizer/OrganizerDashboardPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  CalendarDays, 
  IndianRupee, 
  Ticket as TicketIcon, 
  Users, 
  PlusCircle, 
  ArrowRight, 
  TrendingUp
} from 'lucide-react'
import { organizerApi } from '../../services/organizerApi'
import type { EventItem, SalesSummary, OrganizerRevenue } from '../../types'
import { StatCard, SimpleBarChart } from '../../components/analytics/AnalyticsCharts'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { LoadingSpinner } from '../../components/common/Feedback'

export const OrganizerDashboardPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([])
  const [sales, setSales] = useState<SalesSummary[]>([])
  const [revenue, setRevenue] = useState<OrganizerRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      try {
        const [eventsRes, salesRes, revRes] = await Promise.all([
          organizerApi.getMyEvents({ limit: 6 }),
          organizerApi.getOrganizerSales().catch(() => []),
          organizerApi.getOrganizerRevenue().catch(() => []),
        ])

        if (isMounted) {
          setEvents(eventsRes.items || [])
          setSales(salesRes || [])
          setRevenue(revRes || [])
        }
      } catch (err) {
        console.error('Failed to load organizer dashboard', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading organizer analytics..." />
      </div>
    )
  }

  // Aggregate stats
  const totalRevenue = revenue.reduce((acc, r) => acc + Number(r.total_revenue || 0), 0)
  const totalTicketsSold = sales.reduce((acc, s) => acc + Number(s.tickets_sold || 0), 0)
  const totalBookings = sales.reduce((acc, s) => acc + Number(s.total_bookings || 0), 0)

  // Chart data from top sales
  const chartData = sales.slice(0, 6).map((s) => ({
    label: s.event_title.length > 12 ? s.event_title.slice(0, 12) + '...' : s.event_title,
    value: Number(s.total_revenue || 0),
  }))

  return (
    <div className="space-y-10">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={events.length}
          subtitle="Hosted events"
          icon={CalendarDays}
          color="purple"
        />
        <StatCard
          title="Gross Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="From ticket sales"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Tickets Sold"
          value={totalTicketsSold.toLocaleString()}
          subtitle="Admissions issued"
          icon={TicketIcon}
          color="indigo"
        />
        <StatCard
          title="Total Orders"
          value={totalBookings.toLocaleString()}
          subtitle="Completed reservations"
          icon={Users}
          color="amber"
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-3xl">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Ready to host your next event?
          </h3>
          <p className="text-xs text-slate-300">
            Configure ticketing tiers, select auditorium venues, and publish directly to the public catalog.
          </p>
        </div>
        <Link to="/organizer/events/new">
          <Button variant="primary" size="md" className="bg-purple-600 hover:bg-purple-500 whitespace-nowrap">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
        </Link>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Event Revenue Distribution (DBMS v_event_sales_summary)
              </h3>
            </div>
            <Link
              to="/organizer/analytics"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <SimpleBarChart data={chartData} isCurrency height={220} />
        </section>
      )}

      {/* Managed Events Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Your Events</h3>
          </div>
          <Link
            to="/organizer/events"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>All Events ({events.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-3">
            <p>You have not created any events yet.</p>
            <Link to="/organizer/events/new">
              <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500">
                Create First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Event Title</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Start Date</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {events.map((e) => (
                  <tr key={e.event_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-white max-w-xs truncate">
                      {e.title}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {e.venue_name || 'Auditorium'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {formatDate(e.start_time)}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      <span className="text-purple-300 font-semibold">{e.seating_mode}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={e.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/organizer/events/${e.event_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
                      >
                        <span>Console</span>
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
