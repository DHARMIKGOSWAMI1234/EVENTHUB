// frontend/src/layouts/CustomerLayout.tsx
import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Ticket, 
  Heart, 
  Bell, 
  User as UserIcon,
  Sparkles
} from 'lucide-react'

export const CustomerLayout: React.FC = () => {
  const { user } = useAuth()

  const tabs = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/my-bookings', label: 'My Bookings', icon: ShoppingBag },
    { to: '/my-tickets', label: 'My Tickets', icon: Ticket },
    { to: '/favorites', label: 'Saved Events', icon: Heart },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My Profile', icon: UserIcon },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      {/* Customer Header Banner */}
      <section className="bg-gradient-to-b from-indigo-950/40 via-slate-900/50 to-slate-950 border-b border-slate-800/80 pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Customer Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome back, {user?.full_name || 'Member'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Manage your event bookings, digital QR tickets, and saved experiences.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/60" aria-label="Customer Tabs">
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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
