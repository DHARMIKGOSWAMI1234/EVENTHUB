// frontend/src/pages/admin/AdminAnalyticsPage.tsx
import React, { useState, useEffect } from 'react'
import { 
  IndianRupee, 
  Armchair, 
  Calendar, 
  Star, 
  Building2,
  Database
} from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import type { 
  SalesSummary, 
  OccupancySummary, 
  OrganizerRevenue, 
  MonthlyBooking, 
  RatingSummary 
} from '../../types'
import { SimpleBarChart, ProgressRing } from '../../components/analytics/AnalyticsCharts'
import { formatCurrency } from '../../utils/formatters'
import { LoadingSpinner } from '../../components/common/Feedback'

export const AdminAnalyticsPage: React.FC = () => {
  const [sales, setSales] = useState<SalesSummary[]>([])
  const [occupancy, setOccupancy] = useState<OccupancySummary[]>([])
  const [organizerRev, setOrganizerRev] = useState<OrganizerRevenue[]>([])
  const [monthly, setMonthly] = useState<MonthlyBooking[]>([])
  const [ratings, setRatings] = useState<RatingSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadAllViews = async () => {
      try {
        const [salesRes, occRes, orgRes, monthRes, rateRes] = await Promise.all([
          adminApi.getSalesSummary().catch(() => []),
          adminApi.getOccupancySummary().catch(() => []),
          adminApi.getOrganizerRevenue().catch(() => []),
          adminApi.getMonthlyBookings().catch(() => []),
          adminApi.getRatingSummary().catch(() => []),
        ])

        if (isMounted) {
          setSales(salesRes || [])
          setOccupancy(occRes || [])
          setOrganizerRev(orgRes || [])
          setMonthly(monthRes || [])
          setRatings(rateRes || [])
        }
      } catch (err) {
        console.error('Failed to load views analytics', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAllViews()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Querying 5 PostgreSQL database views..." />
      </div>
    )
  }

  // Monthly chart data
  const monthlyChartData = monthly.map((m) => ({
    label: String(m.booking_month || m.month_label || 'Month'),
    value: Number(m.total_revenue || 0),
  }))

  // Organizer revenue chart data
  const organizerChartData = organizerRev.map((o) => ({
    label: (o.organization_name || o.organizer_name || 'Org').slice(0, 12),
    value: Number(o.total_revenue || 0),
    color: 'bg-gradient-to-t from-rose-600 to-amber-500',
  }))

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
          <Database className="w-3.5 h-3.5" />
          Enterprise DBMS Aggregate Views
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          PostgreSQL Views Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Comprehensive DBMS analytical reporting evaluating multi-table JOINs, window calculations, and financial aggregations.
        </p>
      </div>

      {/* View 1: Monthly Booking Summary (v_monthly_booking_summary) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            1. Monthly Booking Revenue (<code className="text-indigo-300 font-mono">v_monthly_booking_summary</code>)
          </h3>
        </div>
        <SimpleBarChart data={monthlyChartData} isCurrency height={220} />
      </section>

      {/* View 2: Organizer Revenue View (v_organizer_revenue) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white">
            2. Organizer Revenue Distribution (<code className="text-rose-300 font-mono">v_organizer_revenue</code>)
          </h3>
        </div>
        <SimpleBarChart data={organizerChartData} isCurrency height={220} />
      </section>

      {/* View 3: Occupancy Summary (v_event_occupancy) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Armchair className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">
            3. Event Occupancy Rates (<code className="text-purple-300 font-mono">v_event_occupancy</code>)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {occupancy.map((occ) => (
            <ProgressRing
              key={occ.event_id}
              label={occ.event_title}
              percentage={Number(occ.occupancy_percentage || 0)}
              description={`${occ.booked_tickets} / ${occ.total_capacity} booked`}
              color="stroke-rose-500"
            />
          ))}
        </div>
      </section>

      {/* View 4 & 5: Ratings & Sales Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Summary View (v_event_rating_summary) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              4. v_event_rating_summary
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3 text-center">Avg Rating</th>
                  <th className="px-5 py-3 text-right">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {ratings.map((r) => (
                  <tr key={r.event_id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-semibold text-white truncate max-w-[180px]">
                      {r.event_title}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-amber-400 font-mono">
                      ★ {Number(r.average_rating || 0).toFixed(1)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-400">
                      {r.total_reviews}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sales Summary View (v_event_sales_summary) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              5. v_event_sales_summary
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3 text-center">Sold</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {sales.map((s) => (
                  <tr key={s.event_id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-semibold text-white truncate max-w-[180px]">
                      {s.event_title}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-indigo-400">
                      {s.tickets_sold}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(s.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
