// frontend/src/pages/customer/ProfilePage.tsx
import React, { useState } from 'react'
import { User, Mail, Phone, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../services/userActionsApi'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Badge } from '../../components/common/Badge'

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast('Full name is required', 'warning')
      return
    }

    setLoading(true)
    try {
      await userApi.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      })
      await refreshUser()
      toast('Profile updated successfully!', 'success')
    } catch {
      toast('Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Account Profile</h2>
        <p className="text-xs text-slate-400">
          Manage your personal information and contact details.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Account Status Pill Banner */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-slate-400">Account Role</span>
            <div className="font-bold text-white text-sm">{user?.role}</div>
          </div>
          <div>
            <Badge status={user?.is_active ? 'ACTIVE' : 'BLOCKED'} size="sm" />
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            disabled
            value={user?.email || ''}
            helperText="Account email cannot be modified directly."
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={loading}>
              Save Profile Changes
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>User identity verified under PostgreSQL RBAC schema</span>
        </div>
      </div>
    </div>
  )
}
