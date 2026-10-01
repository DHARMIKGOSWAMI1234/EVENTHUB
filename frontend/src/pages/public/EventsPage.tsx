// frontend/src/pages/public/EventsPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventApi } from '../../services/eventApi'
import { categoryApi, venueApi } from '../../services/catalogApi'
import { favoriteApi } from '../../services/userActionsApi'
import { useAuth } from '../../context/AuthContext'
import type { EventItem, Category, Venue, SeatingMode } from '../../types'
import { EventGrid } from '../../components/events/EventGrid'
import { EventFilters } from '../../components/events/EventFilters'
import { Pagination } from '../../components/common/Pagination'
import { Calendar } from 'lucide-react'

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, isCustomer } = useAuth()

  // State from URL query or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState<number | ''>(
    searchParams.get('category_id') ? Number(searchParams.get('category_id')) : ''
  )
  const [selectedVenue, setSelectedVenue] = useState<number | ''>(
    searchParams.get('venue_id') ? Number(searchParams.get('venue_id')) : ''
  )
  const [selectedSeatingMode, setSelectedSeatingMode] = useState<SeatingMode | ''>(
    (searchParams.get('seating_mode') as SeatingMode) || ''
  )
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '')
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '')
  const [page, setPage] = useState(
    searchParams.get('page') ? Number(searchParams.get('page')) : 1
  )

  const [events, setEvents] = useState<EventItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(9)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())

  // Load categories and venues metadata once
  useEffect(() => {
    let isMounted = true
    const loadCatalogs = async () => {
      try {
        const [catsRes, venuesRes] = await Promise.all([
          categoryApi.getCategories(),
          venueApi.getVenues(),
        ])
        if (isMounted) {
          setCategories(catsRes || [])
          setVenues(venuesRes || [])
        }
      } catch (err) {
        console.error('Failed to load catalogs', err)
      }
    }
    loadCatalogs()
    return () => {
      isMounted = false
    }
  }, [])

  // Load user favorites if customer is logged in
  useEffect(() => {
    if (!isAuthenticated || !isCustomer) return
    let isMounted = true
    const loadFavorites = async () => {
      try {
        const favs = await favoriteApi.getFavorites()
        if (isMounted) {
          setFavoriteIds(new Set(favs.map((f) => f.event_id)))
        }
      } catch {
        // silent fail
      }
    }
    loadFavorites()
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, isCustomer])

  // Count active filters
  const activeFilterCount =
    (search ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedVenue ? 1 : 0) +
    (selectedSeatingMode ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0)

  // Fetch events based on current state
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * pageSize
      const params: Record<string, unknown> = {
        limit: pageSize,
        offset,
        status: 'PUBLISHED',
      }
      if (search.trim()) params.search = search.trim()
      if (selectedCategory) params.category_id = selectedCategory
      if (selectedVenue) params.venue_id = selectedVenue
      if (selectedSeatingMode) params.seating_mode = selectedSeatingMode
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const res = await eventApi.getEvents(params)
      setEvents(res.items || [])
      setTotalCount(res.total || 0)
    } catch (err) {
      console.error('Error fetching events:', err)
      setEvents([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, selectedCategory, selectedVenue, selectedSeatingMode, startDate, endDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('category_id', String(selectedCategory))
    if (selectedVenue) params.set('venue_id', String(selectedVenue))
    if (selectedSeatingMode) params.set('seating_mode', selectedSeatingMode)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (page > 1) params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }, [search, selectedCategory, selectedVenue, selectedSeatingMode, startDate, endDate, page, setSearchParams])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedVenue('')
    setSelectedSeatingMode('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleFavoriteChange = (eventId: number, favorited: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (favorited) next.add(eventId)
      else next.delete(eventId)
      return next
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Calendar className="w-3.5 h-3.5" />
          Event Discovery Catalog
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Explore All Events
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Find and reserve tickets for concerts, theater productions, and conferences across the country.
        </p>
      </div>

      {/* Filters Component */}
      <EventFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        selectedCategory={selectedCategory}
        onCategoryChange={(v) => {
          setSelectedCategory(v)
          setPage(1)
        }}
        selectedVenue={selectedVenue}
        onVenueChange={(v) => {
          setSelectedVenue(v)
          setPage(1)
        }}
        selectedSeatingMode={selectedSeatingMode}
        onSeatingModeChange={(v) => {
          setSelectedSeatingMode(v)
          setPage(1)
        }}
        startDate={startDate}
        onStartDateChange={(v) => {
          setStartDate(v)
          setPage(1)
        }}
        endDate={endDate}
        onEndDateChange={(v) => {
          setEndDate(v)
          setPage(1)
        }}
        categories={categories}
        venues={venues}
        onReset={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <span>
          Showing <strong className="text-white font-mono">{events.length}</strong> of{' '}
          <strong className="text-white font-mono">{totalCount}</strong> published events
        </span>
        {activeFilterCount > 0 && (
          <span className="text-indigo-400">Filtered results</span>
        )}
      </div>

      {/* Event Grid */}
      <EventGrid
        events={events}
        loading={loading}
        emptyMessage="No events matched your search or filters. Try adjusting your criteria."
        emptyActionText={activeFilterCount > 0 ? 'Clear Filters' : undefined}
        onEmptyAction={handleResetFilters}
        favoriteIds={favoriteIds}
        onFavoriteChange={handleFavoriteChange}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6 border-t border-slate-800">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}
    </div>
  )
}
