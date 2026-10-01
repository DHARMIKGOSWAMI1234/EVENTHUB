// frontend/src/tests/ProtectedRoute.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute, RoleRoute } from '../components/common/RouteGuards'
import * as AuthContext from '../context/AuthContext'

describe('Route Guards', () => {
  it('redirects unauthenticated users to login', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      isCustomer: false,
      isOrganizer: false,
      isAdmin: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Customer Secret Area</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument()
    expect(screen.queryByText('Customer Secret Area')).not.toBeInTheDocument()
  })

  it('allows access to role route when user has matching role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 2,
        email: 'admin@eventhub.test',
        full_name: 'Sys Admin',
        role: 'ADMIN',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
      role: 'ADMIN',
      token: 'admin-token',
      isAuthenticated: true,
      isCustomer: false,
      isOrganizer: false,
      isAdmin: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <div>Admin Portal Dashboard</div>
              </RoleRoute>
            }
          />
          <Route path="/" element={<div>Home Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Admin Portal Dashboard')).toBeInTheDocument()
  })
})
