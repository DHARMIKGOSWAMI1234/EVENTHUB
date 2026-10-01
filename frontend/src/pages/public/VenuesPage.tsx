// frontend/src/pages/public/VenuesPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, Armchair, Building2 } from 'lucide-react'
import { venueApi } from '../../services/catalogApi'
import type { Venue } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const VenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadVenues = async () => {
      try {
        const res = await venueApi.getVenues()
        if (isMounted) setVenues(res || [])
      } catch (err) {
        console.error('Failed to load venues', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadVenues()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading venues..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5" />
          Partner Venues &amp; Auditoriums
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Venues &amp; Stadiums
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore world-class auditoriums, stadiums, and concert halls equipped with reserved seat layouts.
        </p>
      </div>

      {venues.length === 0 ? (
        <EmptyState icon={MapPin} title="No venues found" description="No venues are currently listed." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((v) => (
            <div
              key={v.venue_id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300">
                  {v.name}
                </h3>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>{v.address}</div>
                  <div className="text-slate-300 font-semibold">{v.city}</div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300">
                    <Armchair className="w-3 h-3" />
                    Capacity: {v.capacity.toLocaleString()} seats
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to={`/events?venue_id=${v.venue_id}`}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                >
                  <span>Events at this Venue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
