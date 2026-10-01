// frontend/src/pages/organizer/CreateEventPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, PlusCircle, ShieldCheck } from 'lucide-react'
import { organizerApi } from '../../services/organizerApi'
import { categoryApi, venueApi } from '../../services/catalogApi'
import { useToast } from '../../context/ToastContext'
import type { Category, Venue, SeatingMode } from '../../types'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { Select } from '../../components/common/Select'

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [venueId, setVenueId] = useState<number | ''>('')
  const [seatingMode, setSeatingMode] = useState<SeatingMode>('RESERVED')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadCatalogs = async () => {
      try {
        const [cats, vens] = await Promise.all([
          categoryApi.getCategories(),
          venueApi.getVenues(),
        ])
        if (isMounted) {
          setCategories(cats || [])
          setVenues(vens || [])
          if (cats && cats.length > 0) setCategoryId(cats[0].id ?? cats[0].category_id ?? '')
          if (vens && vens.length > 0) setVenueId(vens[0].id ?? vens[0].venue_id ?? '')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !categoryId || !venueId || !startTime || !endTime) {
      setError('Please fill in all required fields.')
      return
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setError('Event end time must be after the start time.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const created = await organizerApi.createEvent({
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        venue_id: Number(venueId),
        seating_mode: seatingMode,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      })

      toast('Draft event created! Now configure ticket tiers.', 'success')
      navigate(`/organizer/events/${created.event_id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/organizer/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
            Step 1 of 2
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            Create Event (Draft)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fill in the event logistics. Once created as a Draft, you can add ticket pricing tiers before publishing.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Event Title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. National Symphony Orchestra 2026"
          />

          <Textarea
            label="Event Description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the artists, agenda, parking guidelines, and event experience..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event Category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              options={categories.map((c) => ({
                value: c.category_id ?? c.id,
                label: c.category_name || c.name || 'Category',
              }))}
            />

            <Select
              label="Auditorium / Venue"
              required
              value={venueId}
              onChange={(e) => setVenueId(Number(e.target.value))}
              options={venues.map((v) => ({
                value: v.venue_id ?? v.id,
                label: `${v.name}${v.city ? ` (${v.city})` : ''}`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Seating Arrangement Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  seatingMode === 'RESERVED'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="seatingMode"
                  value="RESERVED"
                  checked={seatingMode === 'RESERVED'}
                  onChange={() => setSeatingMode('RESERVED')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="text-xs font-bold">Reserved Seating</div>
                  <div className="text-[11px] text-slate-400">Interactive seat map with row/seat locks</div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  seatingMode === 'GENERAL'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="seatingMode"
                  value="GENERAL"
                  checked={seatingMode === 'GENERAL'}
                  onChange={() => setSeatingMode('GENERAL')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="text-xs font-bold">General Admission</div>
                  <div className="text-[11px] text-slate-400">Open seating with capacity tracking</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Start Date & Time"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <Input
              label="Event End Date & Time"
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link to="/organizer/events">
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Draft Event
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>New events are created as DRAFT until explicitly published by organizer</span>
        </div>
      </div>
    </div>
  )
}
