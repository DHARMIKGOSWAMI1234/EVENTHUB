// frontend/src/tests/Events.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { EventCard } from '../components/events/EventCard'
import { EventGrid } from '../components/events/EventGrid'
import type { EventItem } from '../types'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'

const mockEvent: EventItem = {
  id: 101,
  event_id: 101,
  organizer_id: 1,
  category_id: 2,
  venue_id: 3,
  title: 'Global Tech & AI Summit 2026',
  description: 'Premier academic and industry conference covering deep learning and relational database systems.',
  start_time: '2026-11-15T09:00:00Z',
  seating_mode: 'RESERVED',
  status: 'PUBLISHED',
  category_name: 'Technology',
  venue_name: 'Grand Convention Hall',
  venue_city: 'Bengaluru',
  min_price: 1500,
  avg_rating: 4.8,
  review_count: 24,
}

describe('Events Components', () => {
  it('renders EventCard with event details, category pill, and pricing', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <EventCard event={mockEvent} />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Global Tech & AI Summit 2026')).toBeInTheDocument()
    const techElements = screen.getAllByText('Technology')
    expect(techElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/Grand Convention Hall/i)).toBeInTheDocument()
    expect(screen.getByText(/₹1,500/)).toBeInTheDocument()
    expect(screen.getByText('Book Now')).toBeInTheDocument()
  })

  it('renders EventGrid with multiple events', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <EventGrid events={[mockEvent]} />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Global Tech & AI Summit 2026')).toBeInTheDocument()
  })
})
