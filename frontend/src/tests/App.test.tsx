// frontend/src/tests/App.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { App } from '../App'

// Mock API modules
vi.mock('../services/eventApi', () => ({
  eventApi: {
    getEvents: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getEvent: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../services/catalogApi', () => ({
  categoryApi: {
    getCategories: vi.fn().mockResolvedValue([]),
  },
  venueApi: {
    getVenues: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../services/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
  },
}))

describe('App Component', () => {
  it('renders EVENTHUB brand and public header navigation', async () => {
    window.history.pushState({}, 'Home', '/')
    render(<App />)

    // Check for brand name
    const brands = await screen.findAllByText(/EVENTHUB/i)
    expect(brands.length).toBeGreaterThan(0)
  })

  it('renders not found page on unknown routes', async () => {
    window.history.pushState({}, 'Not Found', '/non-existent-route-404')
    render(<App />)

    const notFoundText = await screen.findByText(/404 — Page Not Found/i)
    expect(notFoundText).toBeInTheDocument()
  })
})
