// frontend/src/components/layout/Footer.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Shield, Database, Sparkles, Heart } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                EVENT<span className="text-indigo-400">HUB</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise-grade Event &amp; Ticket Booking Platform. Built with high-integrity PostgreSQL relational guarantees, row-level concurrency control, and fast API integration.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              <Database className="w-3 h-3" />
              Academic DBMS Showcase
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/events" className="hover:text-indigo-400 transition-colors">
                  Explore All Events
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-indigo-400 transition-colors">
                  Event Categories
                </Link>
              </li>
              <li>
                <Link to="/venues" className="hover:text-indigo-400 transition-colors">
                  Venues &amp; Auditoriums
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-indigo-400 transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Portal Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/organizer" className="hover:text-indigo-400 transition-colors">
                  Organizer Console
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-400 transition-colors">
                  Admin Management
                </Link>
              </li>
              <li>
                <Link to="/organizer/events/new" className="hover:text-indigo-400 transition-colors">
                  Host an Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & DBMS Details */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">DBMS Architecture</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Row-Level Seat Locking</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>16 Relational Tables &amp; Triggers</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Simulated Demo Payments</span>
              </li>
            </ul>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 mb-0.5">Notice</p>
              This is an academic DBMS demonstration. Payments and bookings run safely in sandbox mode.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} EVENTHUB Inc. DBMS Demonstration Platform.
          </p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Engineered with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for Relational DBMS Integrity</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
