// frontend/src/pages/auth/LoginPage.tsx
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // From state or redirect param
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const loggedInUser = await login(email, password)
      toast(`Welcome back, ${loggedInUser.full_name}!`, 'success')

      // Smart redirection based on role if no explicit 'from'
      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else {
        if (loggedInUser.role === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else if (loggedInUser.role === 'ORGANIZER') {
          navigate('/organizer', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fast 1-click Demo Account Logins
  const handleQuickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('DemoUser@2026')
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            EVENT<span className="text-indigo-400">HUB</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your credentials to access tickets, bookings, and console tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full justify-center mt-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* 1-Click Demo Accounts Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Demo Accounts (1-Click Fill)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('aarav.mehta@example.com')}
                className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 transition-colors text-center"
              >
                <span className="font-bold block">Customer</span>
                <span className="text-[10px] text-slate-400 block truncate">Aarav M.</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('vikram.malhotra@example.com')}
                className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 transition-colors text-center"
              >
                <span className="font-bold block">Organizer</span>
                <span className="text-[10px] text-slate-400 block truncate">Vikram M.</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('priya.nair.admin@example.com')}
                className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 transition-colors text-center"
              >
                <span className="font-bold block">Admin</span>
                <span className="text-[10px] text-slate-400 block truncate">Priya N.</span>
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="pt-2 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Stateless JWT Authentication with PostgreSQL RBAC</span>
        </div>
      </div>
    </div>
  )
}
