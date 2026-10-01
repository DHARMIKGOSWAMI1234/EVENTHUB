// frontend/src/components/events/EventCard.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Tag, Star, Heart, Armchair, Users } from 'lucide-react'
import type { EventItem } from '../../types'
import { formatCurrency, formatDate, formatTime, truncate, getCategoryGradient } from '../../utils/formatters'
import { Badge } from '../common/Badge'
import { useAuth } from '../../context/AuthContext'
import { favoriteApi } from '../../services/userActionsApi'
import { useToast } from '../../context/ToastContext'

interface EventCardProps {
  event: EventItem
  isFavorited?: boolean
  onFavoriteChange?: (eventId: number, favorited: boolean) => void
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isFavorited = false,
  onFavoriteChange,
}) => {
  const { isAuthenticated, isCustomer } = useAuth()
  const { toast } = useToast()
  const [favorited, setFavorited] = useState(isFavorited)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const eventId = event.event_id ?? event.id

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast('Please log in to save events', 'info')
      return
    }

    if (!isCustomer) {
      toast('Only customers can save favorites', 'warning')
      return
    }

    setFavoriteLoading(true)
    try {
      if (favorited) {
        await favoriteApi.removeFavorite(eventId)
        setFavorited(false)
        onFavoriteChange?.(eventId, false)
        toast('Removed from saved events', 'info')
      } else {
        await favoriteApi.addFavorite(eventId)
        setFavorited(true)
        onFavoriteChange?.(eventId, true)
        toast('Added to saved events', 'success')
      }
    } catch {
      toast('Failed to update favorite', 'error')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const gradient = getCategoryGradient(event.category_name ?? undefined)

  return (
    <div className="group relative flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
      {/* Banner / Poster */}
      <div className={`relative h-48 w-full bg-gradient-to-br ${gradient} overflow-hidden flex items-center justify-center`}>
        {/* Decorative Grid / Accent */}
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/80 pointer-events-none" />
        
        {/* Category & Status Pill */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          {event.category_name && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              {event.category_name}
            </span>
          )}
          {event.seating_mode === 'RESERVED' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Armchair className="w-3 h-3" />
              Reserved
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Users className="w-3 h-3" />
              General
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${
            favorited
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-slate-950/70 text-slate-400 border border-slate-700/60 hover:text-rose-400 hover:bg-slate-900'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Center Graphic */}
        <div className="text-center p-4 z-0 group-hover:scale-105 transition-transform duration-300">
          <Calendar className="w-12 h-12 mx-auto text-indigo-400/40 mb-2" />
          <span className="text-xs font-mono text-indigo-200/60 uppercase tracking-widest">
            {event.category_name || 'EVENT'}
          </span>
        </div>

        {/* Status indicator if not PUBLISHED */}
        {event.status !== 'PUBLISHED' && (
          <div className="absolute bottom-3 right-3 z-10">
            <Badge status={event.status} size="sm" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 mb-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(event.start_time)}</span>
            <span className="text-slate-600">&bull;</span>
            <span>{formatTime(event.start_time)}</span>
          </div>

          {/* Title */}
          <Link to={`/events/${eventId}`} className="group-hover:text-indigo-400 transition-colors">
            <h3 className="font-bold text-lg text-white tracking-tight line-clamp-1 mb-2">
              {event.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {truncate(event.description, 120)}
          </p>
        </div>

        <div>
          {/* Venue & Rating */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3 mb-4">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">
                {event.venue_name || 'Venue'}
                {event.venue_city ? `, ${event.venue_city}` : ''}
              </span>
            </div>
            {event.avg_rating !== undefined && event.avg_rating !== null && Number(event.avg_rating) > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 font-semibold shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{Number(event.avg_rating).toFixed(1)}</span>
                {event.review_count !== undefined && (
                  <span className="text-[10px] text-slate-500">({event.review_count})</span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500">New</span>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-medium text-slate-500 block">Starts from</span>
              <span className="text-base font-extrabold text-white">
                {event.min_price !== undefined ? formatCurrency(event.min_price) : 'Free'}
              </span>
            </div>

            <Link
              to={`/events/${eventId}`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
