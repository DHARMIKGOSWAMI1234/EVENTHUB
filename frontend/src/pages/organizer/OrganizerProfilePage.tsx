import React, { useState, useEffect } from 'react'
import { Building2, Mail, Phone, Globe, ShieldCheck } from 'lucide-react'
import { organizerApi } from '../../services/organizerApi'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { LoadingSpinner } from '../../components/common/Feedback'

export const OrganizerProfilePage: React.FC = () => {
  const [orgName, setOrgName] = useState('')
  const [bio, setBio] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadProfile = async () => {
    setLoading(true)
    try {
      const data = await organizerApi.getOrganizerProfile()
      setOrgName(data.organization_name || '')
      setBio(data.bio || '')
      setContactEmail(data.contact_email || '')
      setContactPhone(data.contact_phone || '')
      setWebsiteUrl(data.website_url || '')
    } catch (err) {
      console.error('Failed to load organizer profile', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await organizerApi.updateOrganizerProfile({
        organization_name: orgName.trim() || undefined,
        bio: bio.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
      })
      toast('Organizer profile updated successfully!', 'success')
      loadProfile()
    } catch {
      toast('Failed to update organizer profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading organizer profile..." />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Organization Profile</h2>
        <p className="text-xs text-slate-400">
          This organization info is presented on your published event detail pages.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Organization / Production Company Name"
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Entertainment Productions"
            leftIcon={<Building2 className="w-4 h-4" />}
          />

          <Textarea
            label="Organizer Bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your organization, past festivals, and experience..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="events@organization.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Contact Phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Official Website URL"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            leftIcon={<Globe className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saving}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Save Organization Profile
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Organizer records validated by relational DBMS foreign-key constraints</span>
        </div>
      </div>
    </div>
  )
}
