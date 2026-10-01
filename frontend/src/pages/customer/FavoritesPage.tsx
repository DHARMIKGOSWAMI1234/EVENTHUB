// frontend/src/pages/customer/FavoritesPage.tsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { favoriteApi } from '../../services/userActionsApi'
import { useToast } from '../../context/ToastContext'
import type { Favorite } from '../../types'
import { formatDate } from '../../utils/formatters'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const data = await favoriteApi.getFavorites()
      setFavorites(data || [])
    } catch (err) {
      console.error('Failed to load favorites', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  const handleRemove = async (eventId: number) => {
    try {
      await favoriteApi.removeFavorite(eventId)
      setFavorites((prev) => prev.filter((f) => f.event_id !== eventId))
      toast('Removed from saved events', 'info')
    } catch {
      toast('Failed to remove favorite', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Saved Events</h2>
        <p className="text-xs text-slate-400">
          Events you have bookmarked for quick access and updates.
        </p>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading saved events..." />
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No Saved Events"
          description="You haven't bookmarked any events yet. Explore events and click the heart icon to save them here."
          actionText="Browse Events"
          onAction={() => {
            window.location.href = '/events'
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.favorite_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-base line-clamp-1">
                    {fav.event_title || `Event #${fav.event_id}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleRemove(fav.event_id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  {fav.start_time && (
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(fav.start_time)}</span>
                    </div>
                  )}
                  {fav.venue_name && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{fav.venue_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <Link
                  to={`/events/${fav.event_id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>View Event</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
