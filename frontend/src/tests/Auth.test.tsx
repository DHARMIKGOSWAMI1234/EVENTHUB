// frontend/src/tests/Auth.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { authApi } from '../services/authApi'

vi.mock('../services/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn().mockRejectedValue(new Error('No token')),
  },
}))

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login page with email and password fields', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('renders register page with name, email, phone, and password inputs', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <RegisterPage />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/Aarav Sharma/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/\+91 98765 43210/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument()
  })

  it('submits login credentials through authApi', async () => {
    const mockUser = {
      id: 1,
      user_id: 1,
      email: 'customer@example.com',
      full_name: 'Demo Customer',
      role: 'CUSTOMER' as const,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(authApi.login).mockResolvedValueOnce({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      token_type: 'bearer',
      expires_in_seconds: 3600,
    })
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser)

    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText(/name@example.com/i)
    const passInput = screen.getByPlaceholderText(/••••••••/i)
    const submitBtn = screen.getByRole('button', { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: 'customer@example.com' } })
    fireEvent.change(passInput, { target: { value: 'CustomerPass123!' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'customer@example.com',
        password: 'CustomerPass123!',
      })
    })
  })
})
