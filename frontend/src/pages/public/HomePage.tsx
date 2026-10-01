// frontend/src/pages/public/HomePage.tsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Ticket, 
  Database
} from 'lucide-react'
import { eventApi } from '../../services/eventApi'
import { categoryApi, venueApi } from '../../services/catalogApi'
import type { EventItem, Category, Venue } from '../../types'
import { EventGrid } from '../../components/events/EventGrid'
import { Button } from '../../components/common/Button'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadHomeData = async () => {
      try {
        const [eventsRes, catsRes, venuesRes] = await Promise.all([
          eventApi.getEvents({ status: 'PUBLISHED', limit: 6 }),
          categoryApi.getCategories(),
          venueApi.getVenues(),
        ])

        if (isMounted) {
          setFeaturedEvents(eventsRes.items || [])
          setCategories(catsRes || [])
          setVenues(venuesRes || [])
        }
      } catch (err) {
        console.error('Failed to load homepage data', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadHomeData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/events')
    }
  }

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>High-Concurrency Relational Event Booking</span>
          </div>

          {/* Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Live Experiences,{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                Guaranteed Seats.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Explore concerts, tech summits, theatrical performances, and campus festivals backed by ACID transactions and real-time seat lock protection.
            </p>
          </div>

          {/* Search Bar in Hero */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-2xl mx-auto p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, tech summits, comedy shows..."
                className="w-full pl-12 pr-4 py-3 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto px-6 py-3">
              Explore Events
            </Button>
          </form>

          {/* Quick Stats Banner */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">16</div>
              <div className="text-[11px] text-slate-400 font-medium">PostgreSQL Tables</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">0.0%</div>
              <div className="text-[11px] text-slate-400 font-medium">Double-Bookings</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
                {venues.length || '10+'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Partner Venues</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">100%</div>
              <div className="text-[11px] text-slate-400 font-medium">ACID Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Handpicked Selection
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Featured Events
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View all upcoming events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <EventGrid
          events={featuredEvents}
          loading={loading}
          emptyMessage="No events are currently scheduled. Check back shortly!"
        />
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <Ticket className="w-3.5 h-3.5" />
              Explore by Interest
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Top Categories
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Browse all categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.category_id}
              to={`/events?category_id=${cat.category_id}`}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-center group flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-colors">
                <Ticket className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                {cat.category_name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why EVENTHUB — DBMS Foundation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Engineering Excellence
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              Why EVENTHUB Delivers Unbreakable Reliability
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Most booking websites fail during viral drops. EVENTHUB implements strict DBMS concurrency controls inside the relational engine itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Row-Level SELECT FOR UPDATE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When seats or capacity are selected, records are exclusively locked within a database transaction, eliminating double-booking race conditions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Automated Hold Expirations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Held seats automatically revert to available inventory after timeout via PostgreSQL functions, ensuring fair seat release.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Immutable Audit Logging</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every ticket issuance, booking state transition, and payment callback triggers automated JSONB audit logging for strict traceability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Streamlined Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            How EVENTHUB Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-indigo-500/30 font-mono">01</span>
            <h4 className="text-sm font-bold text-white">Find Your Event</h4>
            <p className="text-xs text-slate-400">
              Browse concerts, auditoriums, and venues with live real-time filtering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-indigo-500/30 font-mono">02</span>
            <h4 className="text-sm font-bold text-white">Pick Seats or Quantity</h4>
            <p className="text-xs text-slate-400">
              Interactive visual seat maps for auditoriums or instant quantity selectors for general admission.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-indigo-500/30 font-mono">03</span>
            <h4 className="text-sm font-bold text-white">Simulate Payment</h4>
            <p className="text-xs text-slate-400">
              Complete simulated payments with UPI, Card, or Net Banking in a safe test sandbox.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
            <span className="text-3xl font-black text-indigo-500/30 font-mono">04</span>
            <h4 className="text-sm font-bold text-white">Get Digital QR Passes</h4>
            <p className="text-xs text-slate-400">
              Access your digital ticket instantly with high-contrast QR tokens ready for venue gate scanning.
            </p>
          </div>
        </div>
      </section>

      {/* Organizer Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
              For Event Organizers
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Host Your Event on EVENTHUB
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Create multi-tier ticketing, assign auditorium seating maps, track real-time occupancy summaries, and monitor revenue with built-in DBMS views.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/organizer/events/new">
              <Button variant="primary" size="lg" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500">
                Publish an Event
              </Button>
            </Link>
            <Link to="/organizer">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Organizer Console
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
