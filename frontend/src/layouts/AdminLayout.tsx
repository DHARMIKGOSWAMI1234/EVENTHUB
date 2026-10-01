// frontend/src/layouts/AdminLayout.tsx
import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { 
  ShieldAlert, 
  Users, 
  Tag, 
  MapPin, 
  History, 
  PieChart, 
  QrCode,
  LayoutDashboard
} from 'lucide-react'

export const AdminLayout: React.FC = () => {
  const tabs = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: Tag },
    { to: '/admin/venues', label: 'Venues & Seats', icon: MapPin },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/admin/analytics', label: 'DBMS Analytics', icon: PieChart },
    { to: '/admin/tickets/validate', label: 'Gate Scanner', icon: QrCode },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-rose-500/30">
      <Navbar />

      {/* Admin Header Banner */}
      <section className="bg-gradient-to-b from-rose-950/40 via-slate-900/50 to-slate-950 border-b border-slate-800/80 pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Administrative &amp; DBMS Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                System Administration
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Manage global platform entities, inspect triggers &amp; audit trails, verify tickets, and inspect DBMS aggregate views.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/60" aria-label="Admin Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </section>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
