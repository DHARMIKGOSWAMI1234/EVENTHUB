import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Calendar, 
  MapPin, 
  Tag, 
  Star, 
  Armchair, 
  Users, 
  ShieldCheck, 
  Heart, 
  Share2, 
  ArrowLeft,
  Building,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { eventApi } from '../../services/eventApi'
import { reviewApi, favoriteApi } from '../../services/userActionsApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { EventDetail, EventAvailability, Review } from '../../types'
import { formatCurrency, formatDate, formatTime, getCategoryGradient } from '../../utils/formatters'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/Feedback'

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const numericId = Number(eventId)
  const { isAuthenticated, isCustomer } = useAuth()
  const { toast } = useToast()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [availability, setAvailability] = useState<EventAvailability | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Favorite state
  const [favorited, setFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (isNaN(numericId)) {
      setError('Invalid event identifier')
      setLoading(false)
      return
    }

    let isMounted = true

    const loadEventData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [eventData, availData, reviewsData] = await Promise.all([
          eventApi.getEvent(numericId),
          eventApi.getAvailability(numericId).catch(() => null),
          eventApi.getReviews(numericId).catch(() => []),
        ])

        if (isMounted) {
          setEvent(eventData)
          setAvailability(availData)
          setReviews(reviewsData || [])
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError('Failed to load event details. The event may not exist or has been removed.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadEventData()
    return () => {
      isMounted = false
    }
  }, [numericId])

  // Check if already favorited
  useEffect(() => {
    if (!isAuthenticated || !isCustomer || !event) return
    let isMounted = true
    const checkFavorite = async () => {
      try {
        const favs = await favoriteApi.getFavorites()
        if (isMounted) {
          setFavorited(favs.some((f) => f.event_id === numericId))
        }
      } catch {
        // silent
      }
    }
    checkFavorite()
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, isCustomer, event, numericId])

  const handleFavoriteToggle = async () => {
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
        await favoriteApi.removeFavorite(numericId)
        setFavorited(false)
        toast('Removed from favorites', 'info')
      } else {
        await favoriteApi.addFavorite(numericId)
        setFavorited(true)
        toast('Saved to favorites', 'success')
      }
    } catch {
      toast('Failed to update favorite', 'error')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !isCustomer) {
      toast('Please log in as a customer to leave a review', 'info')
      return
    }
    if (!reviewComment.trim()) {
      toast('Please enter a review comment', 'warning')
      return
    }

    setSubmittingReview(true)
    try {
      const newReview = await reviewApi.createReview(numericId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      setReviews((prev) => [newReview, ...prev])
      setReviewComment('')
      setReviewRating(5)
      toast('Review submitted successfully!', 'success')
    } catch (err: unknown) {
      toast('Could not submit review. You may have already reviewed this event.', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'EVENTHUB',
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast('Event link copied to clipboard!', 'info')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p className="text-slate-400 text-sm">{error || 'This event could not be found.'}</p>
        <Link to="/events">
          <Button variant="primary" size="md">
            Return to Event Catalog
          </Button>
        </Link>
      </div>
    )
  }

  const isSoldOut = availability?.is_sold_out || false
  const gradient = getCategoryGradient(event.category_name ?? undefined)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Banner Backdrop */}
        <div className={`h-64 sm:h-80 w-full bg-gradient-to-r ${gradient} relative flex items-center justify-center p-6 text-center`}>
          <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/90 pointer-events-none" />

          {/* Floating Actions */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                favorited
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-950/70 text-slate-400 border border-slate-700/60 hover:text-rose-400'
              }`}
              title={favorited ? 'Saved' : 'Save Event'}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-full bg-slate-950/70 text-slate-400 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all"
              title="Share Event"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {event.category_name || 'Event'}
              </span>
              <Badge status={event.status} size="sm" />
              {event.seating_mode === 'RESERVED' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Armchair className="w-3.5 h-3.5" />
                  Reserved Seating Map
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  General Admission
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Quick Info Bar below Banner */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Date &amp; Time</span>
              <span className="text-sm font-bold text-white">
                {formatDate(event.start_time)} &bull; {formatTime(event.start_time)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Venue</span>
              <span className="text-sm font-bold text-white truncate block">
                {event.venue_name || 'Auditorium'} ({event.venue_city || 'India'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Organizer</span>
              <span className="text-sm font-bold text-white">
                {event.organizer_name || 'Verified Host'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout (2 columns: left details, right booking card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* About Event */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">About this Event</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </section>

          {/* Venue Location Details */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Venue &amp; Location
            </h2>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="font-semibold text-white">{event.venue_name}</div>
              <div className="text-slate-400">{event.venue_address || 'Auditorium Campus'}</div>
              <div className="text-slate-400">{event.venue_city}, India</div>
            </div>
          </section>

          {/* Ticket Tiers Breakdown */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-400" />
              Ticket Tiers &amp; Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.ticket_types && event.ticket_types.length > 0 ? (
                event.ticket_types.map((tier) => (
                  <div
                    key={tier.ticket_type_id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{tier.name}</h4>
                      <span className="text-xs text-slate-400">
                        Capacity: {tier.capacity} tickets
                      </span>
                    </div>
                    <span className="text-base font-extrabold text-indigo-400 font-mono">
                      {formatCurrency(tier.price)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Tier pricing is being configured.</p>
              )}
            </div>
          </section>

          {/* Customer Reviews Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Attendee Reviews ({reviews.length})
                </h2>
              </div>
            </div>

            {/* Submit Review Form for logged in customers */}
            {isAuthenticated && isCustomer ? (
              <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Leave an Verified Rating &amp; Review
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience at this event..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submittingReview}
                  >
                    Submit Review
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                <span>Sign in as a customer to post your event rating.</span>
                <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4 pt-2">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.review_id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {r.user_name || 'Customer Attendee'}
                        </span>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{r.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No reviews have been submitted for this event yet. Be the first to share your experience!
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div>
              <span className="text-xs text-slate-400 block">Admission Starting From</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {event.ticket_types && event.ticket_types.length > 0
                  ? formatCurrency(Math.min(...event.ticket_types.map((t) => Number(t.price))))
                  : 'Free'}
              </div>
            </div>

            {/* Availability Indicator */}
            {availability && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Available Seats / Passes:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {availability.available_tickets} / {availability.total_capacity}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        ((availability.total_reserved || 0) / (availability.total_capacity || 1)) * 100
                      )}%`,
                    }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Seating Mode info */}
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
              {event.seating_mode === 'RESERVED' ? (
                <>
                  <Armchair className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Interactive auditorium seat map enabled for this event.</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>General admission standing / open seating.</span>
                </>
              )}
            </div>

            {/* Booking Button */}
            {isSoldOut ? (
              <Button variant="secondary" size="lg" disabled className="w-full justify-center">
                Sold Out
              </Button>
            ) : event.status !== 'PUBLISHED' ? (
              <Button variant="secondary" size="lg" disabled className="w-full justify-center">
                Booking Not Open ({event.status})
              </Button>
            ) : (
              <Link to={`/booking/${event.event_id}`} className="block">
                <Button variant="primary" size="lg" className="w-full justify-center">
                  Book Tickets Now
                </Button>
              </Link>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant seat hold &bull; Zero double bookings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
