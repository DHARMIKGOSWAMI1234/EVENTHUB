// frontend/src/components/events/EventGrid.tsx
import React from 'react'
import { EventCard } from './EventCard'
import type { EventItem } from '../../types'
import { SkeletonCard, EmptyState } from '../common/Feedback'
import { Calendar } from 'lucide-react'

interface EventGridProps {
  events: EventItem[]
  loading?: boolean
  emptyMessage?: string
  emptyActionText?: string
  onEmptyAction?: () => void
  favoriteIds?: Set<number>
  onFavoriteChange?: (eventId: number, favorited: boolean) => void
}

export const EventGrid: React.FC<EventGridProps> = ({
  events,
  loading = false,
  emptyMessage = 'No events found matching your criteria.',
  emptyActionText,
  onEmptyAction,
  favoriteIds = new Set(),
  onFavoriteChange,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No Events Found"
        description={emptyMessage}
        actionText={emptyActionText}
        onAction={onEmptyAction}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => {
        const eventId = event.event_id ?? event.id
        return (
          <EventCard
            key={eventId}
            event={event}
            isFavorited={favoriteIds.has(eventId)}
            onFavoriteChange={onFavoriteChange}
          />
        )
      })}
    </div>
  )
}
