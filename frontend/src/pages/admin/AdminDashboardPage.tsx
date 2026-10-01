// frontend/src/pages/admin/AdminDashboardPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  CalendarDays, 
  IndianRupee, 
  History, 
  RefreshCw, 
  ArrowRight, 
  PieChart, 
  MapPin, 
  QrCode,
  Database
} from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import { useToast } from '../../context/ToastContext'
import type { AuditLog, SalesSummary, MonthlyBooking } from '../../types'
import { StatCard, SimpleBarChart } from '../../components/analytics/AnalyticsCharts'
import { Button } from '../../components/common/Button'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { LoadingSpinner } from '../../components/common/Feedback'

export const AdminDashboardPage: React.FC = () => {
  const [sales, setSales] = useState<SalesSummary[]>([])
  const [monthly, setMonthly] = useState<MonthlyBooking[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [userCount, setUserCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [releasingHolds, setReleasingHolds] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    const loadAdminDashboard = async () => {
      try {
        const [salesRes, monthlyRes, auditRes, usersRes] = await Promise.all([
          adminApi.getSalesSummary().catch(() => []),
          adminApi.getMonthlyBookings().catch(() => []),
          adminApi.getAuditLogs({ limit: 5 }).catch(() => ({ items: [] })),
          adminApi.getUsers({ limit: 1 }).catch(() => ({ total: 0 })),
        ])

        if (isMounted) {
          setSales(salesRes || [])
          setMonthly(monthlyRes || [])
          setAuditLogs(auditRes.items || [])
          setUserCount(usersRes.total || 0)
        }
      } catch (err) {
        console.error('Failed to load admin overview', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAdminDashboard()
    return () => {
      isMounted = false
    }
  }, [])

  const handleReleaseHolds = async () => {
    setReleasingHolds(true)
    try {
      const res = await adminApi.releaseExpiredHolds()
      toast(`Executed DBMS hold sweep: ${res.released_count} expired holds released.`, 'success')
    } catch {
      toast('Failed to run expired hold maintenance', 'error')
    } finally {
      setReleasingHolds(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading administrative dashboard..." />
      </div>
    )
  }

  const totalPlatformRevenue = sales.reduce((acc, s) => acc + Number(s.total_revenue || 0), 0)
  const totalPlatformTickets = sales.reduce((acc, s) => acc + Number(s.tickets_sold || 0), 0)

  // Monthly trends chart data
  const monthlyChartData = monthly.slice(0, 6).map((m) => ({
    label: String(m.booking_month || m.month_label || 'Month'),
    value: Number(m.total_revenue || 0),
  }))

  return (
    <div className="space-y-10">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Platform Users"
          value={userCount}
          subtitle="Registered accounts"
          icon={Users}
          color="rose"
        />
        <StatCard
          title="Gross Revenue"
          value={formatCurrency(totalPlatformRevenue)}
          subtitle="PostgreSQL aggregate"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Tickets Issued"
          value={totalPlatformTickets.toLocaleString()}
          subtitle="Across all events"
          icon={CalendarDays}
          color="indigo"
        />
        <StatCard
          title="Audit Trail Entries"
          value={auditLogs.length > 0 ? 'Active' : 'Empty'}
          subtitle="Immutable DBMS logs"
          icon={History}
          color="amber"
        />
      </div>

      {/* DBMS Maintenance Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>DBMS Stored Function Trigger</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Execute <code className="text-rose-300 font-mono">fn_release_expired_holds()</code>
          </h3>
          <p className="text-xs text-slate-400">
            Sweeps the database for held seats past their TTL and reverts their state to AVAILABLE atomically.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          isLoading={releasingHolds}
          onClick={handleReleaseHolds}
          className="whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Sweep Expired Holds
        </Button>
      </div>

      {/* Monthly Trends Chart */}
      {monthlyChartData.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Monthly Booking Revenue (v_monthly_booking_summary)
              </h3>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <span>View All 5 DBMS Views</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <SimpleBarChart data={monthlyChartData} isCurrency height={220} />
        </section>
      )}

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-rose-300">User Management</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">RBAC roles &amp; activation</p>
          </div>
        </Link>

        <Link
          to="/admin/venues"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300">Venues &amp; Seats</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Auditoriums &amp; seat layout</p>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-300">Audit Logs</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">PostgreSQL JSONB triggers</p>
          </div>
        </Link>

        <Link
          to="/admin/tickets/validate"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">Gate Scanner</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Admission token validator</p>
          </div>
        </Link>
      </div>

      {/* Recent Audit Logs Preview */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Recent PostgreSQL Trigger Audits
          </h4>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity Type</th>
                <th className="px-5 py-3">Entity ID</th>
                <th className="px-5 py-3">Actor ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.audit_id} className="hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-400">{formatDateTime(log.created_at)}</td>
                  <td className="px-5 py-3 font-bold text-amber-400">{log.action}</td>
                  <td className="px-5 py-3 text-white">{log.entity_name}</td>
                  <td className="px-5 py-3 text-slate-300">#{log.entity_id}</td>
                  <td className="px-5 py-3 text-slate-400">{log.user_id ? `#${log.user_id}` : 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
