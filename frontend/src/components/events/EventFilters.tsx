// frontend/src/components/events/EventFilters.tsx
import React, { useState } from 'react'
import { Search, Filter, X, RefreshCw, Calendar, Tag, Armchair } from 'lucide-react'
import type { Category, Venue, SeatingMode } from '../../types'

interface EventFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  selectedCategory: number | ''
  onCategoryChange: (catId: number | '') => void
  selectedVenue: number | ''
  onVenueChange: (venueId: number | '') => void
  selectedSeatingMode: SeatingMode | ''
  onSeatingModeChange: (mode: SeatingMode | '') => void
  startDate: string
  onStartDateChange: (date: string) => void
  endDate: string
  onEndDateChange: (date: string) => void
  categories: Category[]
  venues: Venue[]
  onReset: () => void
  activeFilterCount: number
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedVenue,
  onVenueChange,
  selectedSeatingMode,
  onSeatingModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  categories,
  venues,
  onReset,
  activeFilterCount,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Primary Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events by title, performer, or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:text-white"
        >
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Filter Bar Controls (Desktop always visible, mobile toggleable) */}
      <div
        className={`${
          mobileDrawerOpen ? 'block' : 'hidden'
        } sm:block p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Dropdown */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-400" />
              Venue
            </label>
            <select
              value={selectedVenue}
              onChange={(e) => onVenueChange(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Venues</option>
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.name} ({v.city})
                </option>
              ))}
            </select>
          </div>

          {/* Seating Mode */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Armchair className="w-3 h-3 text-indigo-400" />
              Seating Mode
            </label>
            <select
              value={selectedSeatingMode}
              onChange={(e) => onSeatingModeChange(e.target.value as SeatingMode | '')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Modes</option>
              <option value="RESERVED">Reserved Seating</option>
              <option value="GENERAL">General Admission</option>
            </select>
          </div>

          {/* Date range start */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date range end */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Mobile Reset Action */}
        {activeFilterCount > 0 && (
          <div className="sm:hidden pt-2 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg"
            >
              <RefreshCw className="w-3 h-3" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
