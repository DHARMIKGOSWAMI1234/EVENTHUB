// frontend/src/pages/organizer/OrganizerAnalyticsPage.tsx
import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, IndianRupee, Armchair } from 'lucide-react'
import { organizerApi } from '../../services/organizerApi'
import type { SalesSummary, OccupancySummary, OrganizerRevenue } from '../../types'
import { SimpleBarChart, StatCard, ProgressRing } from '../../components/analytics/AnalyticsCharts'
import { formatCurrency } from '../../utils/formatters'
import { LoadingSpinner } from '../../components/common/Feedback'

export const OrganizerAnalyticsPage: React.FC = () => {
  const [sales, setSales] = useState<SalesSummary[]>([])
  const [occupancy, setOccupancy] = useState<OccupancySummary[]>([])
  const [revenue, setRevenue] = useState<OrganizerRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadAnalytics = async () => {
      try {
        const [salesRes, occRes, revRes] = await Promise.all([
          organizerApi.getOrganizerSales().catch(() => []),
          organizerApi.getOrganizerOccupancy().catch(() => []),
          organizerApi.getOrganizerRevenue().catch(() => []),
        ])

        if (isMounted) {
          setSales(salesRes || [])
          setOccupancy(occRes || [])
          setRevenue(revRes || [])
        }
      } catch (err) {
        console.error('Failed to load organizer analytics', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAnalytics()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Querying DBMS analytics views..." />
      </div>
    )
  }

  const totalRevenue = revenue.reduce((acc, r) => acc + Number(r.total_revenue || 0), 0)
  const totalTickets = sales.reduce((acc, s) => acc + Number(s.tickets_sold || 0), 0)
  const totalBookings = sales.reduce((acc, s) => acc + Number(s.total_bookings || 0), 0)

  // Chart data
  const revenueChartData = sales.map((s) => ({
    label: s.event_title.length > 10 ? s.event_title.slice(0, 10) + '...' : s.event_title,
    value: Number(s.total_revenue || 0),
  }))

  const ticketChartData = sales.map((s) => ({
    label: s.event_title.length > 10 ? s.event_title.slice(0, 10) + '...' : s.event_title,
    value: Number(s.tickets_sold || 0),
    color: 'bg-gradient-to-t from-purple-600 to-indigo-500',
  }))

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Sales &amp; Occupancy Analytics</h2>
        <p className="text-xs text-slate-400">
          Powered directly by PostgreSQL material views: <code className="text-purple-300">v_organizer_revenue</code>, <code className="text-purple-300">v_event_sales_summary</code>, and <code className="text-purple-300">v_event_occupancy</code>.
        </p>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="All hosted events"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Total Tickets Sold"
          value={totalTickets.toLocaleString()}
          subtitle="Issued passes"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Total Bookings"
          value={totalBookings.toLocaleString()}
          subtitle="Completed transactions"
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <SimpleBarChart
            title="Revenue by Event (v_event_sales_summary)"
            data={revenueChartData}
            isCurrency
            height={220}
          />
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <SimpleBarChart
            title="Tickets Sold by Event (v_event_sales_summary)"
            data={ticketChartData}
            valuePrefix=""
            height={220}
          />
        </div>
      </div>

      {/* Occupancy Summary Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Armchair className="w-5 h-5 text-purple-400" />
            Auditorium &amp; Capacity Occupancy (v_event_occupancy)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time percentage utilization calculated by DBMS aggregation over active seat records.
          </p>
        </div>

        {occupancy.length === 0 ? (
          <p className="text-xs text-slate-500">No occupancy records available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {occupancy.map((occ) => (
              <ProgressRing
                key={occ.event_id}
                label={occ.event_title}
                percentage={Number(occ.occupancy_percentage || 0)}
                description={`${occ.booked_tickets} / ${occ.total_capacity} seats taken`}
                color="stroke-purple-500"
              />
            ))}
          </div>
        )}
      </section>

      {/* Detailed Sales Summary Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Detailed Performance Records
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
              <tr>
                <th className="px-5 py-3">Event Title</th>
                <th className="px-5 py-3 text-center">Bookings</th>
                <th className="px-5 py-3 text-center">Tickets Sold</th>
                <th className="px-5 py-3 text-right">Gross Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {sales.map((s) => (
                <tr key={s.event_id} className="hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-bold text-white max-w-xs truncate">
                    {s.event_title}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono">
                    {s.total_bookings}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono">
                    {s.tickets_sold}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-purple-400">
                    {formatCurrency(s.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
