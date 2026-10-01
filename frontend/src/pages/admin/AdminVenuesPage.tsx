import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Edit, Trash2, Armchair, X } from 'lucide-react'
import { venueApi } from '../../services/catalogApi'
import { adminApi } from '../../services/adminApi'
import { useToast } from '../../context/ToastContext'
import type { Venue, VenueSeat } from '../../types'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { LoadingSpinner } from '../../components/common/Feedback'

export const AdminVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Venue Modal
  const [showVenueModal, setShowVenueModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [savingVenue, setSavingVenue] = useState(false)

  // Delete Venue
  const [deletingVenue, setDeletingVenue] = useState<Venue | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Seat Management Modal
  const [activeVenueForSeats, setActiveVenueForSeats] = useState<Venue | null>(null)
  const [seats, setSeats] = useState<VenueSeat[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [showAddSeatForm, setShowAddSeatForm] = useState(false)
  const [section, setSection] = useState('MAIN')
  const [rowNumber, setRowNumber] = useState('A')
  const [seatNumber, setSeatNumber] = useState('1')
  const [seatLabel, setSeatLabel] = useState('A1')
  const [addingSeat, setAddingSeat] = useState(false)

  const loadVenues = async () => {
    setLoading(true)
    try {
      const data = await venueApi.getVenues()
      setVenues(data || [])
    } catch {
      toast('Failed to load venues', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVenues()
  }, [])

  const handleOpenCreateVenue = () => {
    setEditingVenue(null)
    setName('')
    setAddress('')
    setCity('')
    setCapacity('')
    setShowVenueModal(true)
  }

  const handleOpenEditVenue = (v: Venue) => {
    setEditingVenue(v)
    setName(v.name)
    setAddress(v.address || '')
    setCity(v.city || '')
    setCapacity(v.capacity ?? '')
    setShowVenueModal(true)
  }

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !address.trim() || !city.trim() || capacity === '') {
      toast('Please fill all venue fields', 'warning')
      return
    }

    setSavingVenue(true)
    try {
      if (editingVenue) {
        const vId = editingVenue.venue_id ?? editingVenue.id
        await adminApi.updateVenue(vId, {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          capacity: Number(capacity),
        })
        toast('Venue updated successfully!', 'success')
      } else {
        await adminApi.createVenue({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          capacity: Number(capacity),
        })
        toast('Venue created successfully!', 'success')
      }
      setShowVenueModal(false)
      loadVenues()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save venue'
      toast(msg, 'error')
    } finally {
      setSavingVenue(false)
    }
  }

  const handleDeleteVenue = async () => {
    if (!deletingVenue) return
    setDeleting(true)
    try {
      const vId = deletingVenue.venue_id ?? deletingVenue.id
      await adminApi.deleteVenue(vId)
      toast('Venue deleted successfully', 'info')
      setDeletingVenue(null)
      loadVenues()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('foreign key') || msg.includes('constraint') || msg.includes('409')) {
        toast('Cannot delete venue: existing events or seats reference it in PostgreSQL.', 'error')
      } else {
        toast(msg || 'Failed to delete venue', 'error')
      }
    } finally {
      setDeleting(false)
    }
  }

  // Load venue seats
  const handleOpenSeats = async (v: Venue) => {
    setActiveVenueForSeats(v)
    setLoadingSeats(true)
    setShowAddSeatForm(false)
    try {
      const vId = v.venue_id ?? v.id
      const data = await adminApi.getVenueSeats(vId)
      setSeats(data || [])
    } catch {
      toast('Failed to load venue seats', 'error')
    } finally {
      setLoadingSeats(false)
    }
  }

  const handleAddSeat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeVenueForSeats) return

    setAddingSeat(true)
    try {
      const vId = activeVenueForSeats.venue_id ?? activeVenueForSeats.id
      await adminApi.addVenueSeat(vId, {
        section: section.trim().toUpperCase(),
        row_number: rowNumber.trim().toUpperCase(),
        seat_number: seatNumber.trim(),
        seat_label: seatLabel.trim().toUpperCase() || `${section}-${rowNumber}${seatNumber}`,
      })
      toast('Seat added to auditorium layout!', 'success')
      // Refresh seats
      const refreshed = await adminApi.getVenueSeats(vId)
      setSeats(refreshed || [])
      setShowAddSeatForm(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Duplicate seat or failed insertion'
      toast(msg, 'error')
    } finally {
      setAddingSeat(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Venues &amp; Auditoriums</h2>
          <p className="text-xs text-slate-400">
            Manage performance facilities and physical seat layout definitions.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenCreateVenue}
          className="bg-rose-600 hover:bg-rose-500"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Venue
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading venues..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((v) => {
            const vId = v.venue_id ?? v.id
            return (
              <div
                key={vId}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
              >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">{v.name}</h3>
                      <span className="text-xs text-purple-400 font-semibold">{v.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditVenue(v)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Edit Venue"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingVenue(v)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      title="Delete Venue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{v.address}</p>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300">
                    <Armchair className="w-3.5 h-3.5" />
                    Capacity: {v.capacity.toLocaleString()} seats
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono">ID #{vId}</span>
                <button
                  type="button"
                  onClick={() => handleOpenSeats(v)}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Armchair className="w-3.5 h-3.5" />
                  <span>Configure Seats</span>
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Venue Modal */}
      <Modal
        isOpen={showVenueModal}
        onClose={() => setShowVenueModal(false)}
        title={editingVenue ? 'Edit Venue' : 'Create New Venue'}
      >
        <form onSubmit={handleSaveVenue} className="space-y-4">
          <Input
            label="Venue Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Opera House"
          />

          <Input
            label="Address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. MG Road, Near Metro Station"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
            />
            <Input
              label="Auditorium Capacity"
              type="number"
              required
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              placeholder="e.g. 500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowVenueModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={savingVenue} className="bg-rose-600 hover:bg-rose-500">
              {editingVenue ? 'Save Changes' : 'Create Venue'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Venue Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingVenue)}
        title="Delete Venue?"
        message={`Are you sure you want to delete "${deletingVenue?.name}"? If existing events are associated, deletion will be rejected by foreign key constraints.`}
        confirmText="Yes, Delete Venue"
        confirmVariant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteVenue}
        onClose={() => setDeletingVenue(null)}
      />

      {/* Seat Management Drawer / Modal */}
      {activeVenueForSeats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Auditorium Layout — {activeVenueForSeats.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {seats.length} registered seats in database
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVenueForSeats(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Registered Physical Seats
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSeatForm(!showAddSeatForm)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {showAddSeatForm ? 'Hide Form' : 'Add Seat'}
                </Button>
              </div>

              {/* Add Seat Sub-form */}
              {showAddSeatForm && (
                <form
                  onSubmit={handleAddSeat}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                >
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Add Single Physical Seat
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      label="Section"
                      type="text"
                      required
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                    <Input
                      label="Row"
                      type="text"
                      required
                      value={rowNumber}
                      onChange={(e) => setRowNumber(e.target.value)}
                    />
                    <Input
                      label="Number"
                      type="text"
                      required
                      value={seatNumber}
                      onChange={(e) => setSeatNumber(e.target.value)}
                    />
                    <Input
                      label="Label"
                      type="text"
                      required
                      value={seatLabel}
                      onChange={(e) => setSeatLabel(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={addingSeat}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      Save Seat
                    </Button>
                  </div>
                </form>
              )}

              {/* Seats Grid */}
              {loadingSeats ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="md" text="Loading seat configuration..." />
                </div>
              ) : seats.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No seats registered for this venue yet.
                </p>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {seats.map((s) => (
                    <div
                      key={s.seat_id}
                      className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-center font-mono text-[10px]"
                    >
                      <span className="font-bold text-purple-300 block">{s.seat_label}</span>
                      <span className="text-slate-500 text-[9px]">{s.section}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setActiveVenueForSeats(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
