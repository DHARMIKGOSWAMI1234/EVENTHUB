// frontend/src/tests/Booking.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SeatMap } from '../components/bookings/SeatMap'
import { OrderSummary } from '../components/bookings/OrderSummary'
import { PaymentSimulator } from '../components/bookings/PaymentSimulator'
import type { EventSeat, EventItem, TicketType } from '../types'

const mockSeats: EventSeat[] = [
  {
    id: 1,
    event_seat_id: 1,
    event_id: 101,
    status: 'AVAILABLE',
    section: 'VIP',
    row_number: 'A',
    seat_number: 1,
    seat_label: 'VIP-A1',
  },
  {
    id: 2,
    event_seat_id: 2,
    event_id: 101,
    status: 'BOOKED',
    section: 'VIP',
    row_number: 'A',
    seat_number: 2,
    seat_label: 'VIP-A2',
  },
]

const mockEvent: EventItem = {
  id: 101,
  event_id: 101,
  organizer_id: 1,
  category_id: 2,
  venue_id: 3,
  title: 'Dev Conference 2026',
  description: 'Annual gathering of software architects.',
  start_time: '2026-11-20T10:00:00Z',
  seating_mode: 'RESERVED',
  status: 'PUBLISHED',
  venue_name: 'Metro Center',
}

const mockTier: TicketType = {
  id: 10,
  ticket_type_id: 10,
  event_id: 101,
  name: 'VIP Admission',
  price: 2500,
  capacity: 50,
}

describe('Booking Flow Components', () => {
  it('renders interactive SeatMap and toggles seat selection', () => {
    const onToggle = vi.fn()
    render(
      <SeatMap
        seats={mockSeats}
        selectedSeats={[]}
        onToggleSelectSeat={onToggle}
      />
    )

    expect(screen.getByText('Interactive Seat Map')).toBeInTheDocument()
    expect(screen.getByText('STAGE / SCREEN')).toBeInTheDocument()

    // Find and click the available seat button (VIP-A1)
    const availableSeatBtn = screen.getByTitle(/VIP-A1 - AVAILABLE/i)
    fireEvent.click(availableSeatBtn)
    expect(onToggle).toHaveBeenCalledWith(mockSeats[0])
  })

  it('renders OrderSummary with price breakdown and totals', () => {
    render(
      <OrderSummary
        event={mockEvent}
        ticketType={mockTier}
        quantity={2}
        selectedSeats={mockSeats.slice(0, 1)}
      />
    )

    expect(screen.getByText('Dev Conference 2026')).toBeInTheDocument()
    expect(screen.getByText(/VIP Admission/i)).toBeInTheDocument()
    expect(screen.getByText('Order Summary')).toBeInTheDocument()
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument()
  })

  it('renders PaymentSimulator with simulated methods and notice', () => {
    const onComplete = vi.fn()
    render(
      <PaymentSimulator
        amount={5000}
        bookingReference="BK-DEMO-2026"
        onComplete={onComplete}
      />
    )

    expect(screen.getByText(/Demo Payment Simulation/i)).toBeInTheDocument()
    expect(screen.getByText(/No Real Money Processed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Simulate Successful Payment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm & Complete Payment/i })).toBeInTheDocument()
  })
})
