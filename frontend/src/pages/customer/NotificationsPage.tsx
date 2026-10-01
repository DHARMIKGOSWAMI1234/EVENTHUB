// frontend/src/pages/customer/NotificationsPage.tsx
import React, { useState, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationApi } from '../../services/userActionsApi'
import { useToast } from '../../context/ToastContext'
import type { Notification } from '../../types'
import { formatDateTime } from '../../utils/formatters'
import { Button } from '../../components/common/Button'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const { toast } = useToast()

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getNotifications({ limit: 50 })
      setNotifications(res.items || [])
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      toast('Failed to mark notification as read', 'error')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast('All notifications marked as read', 'info')
    } catch {
      toast('Failed to mark all as read', 'error')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Notifications</h2>
          <p className="text-xs text-slate-400">
            System announcements, booking updates, and gate admission notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            isLoading={markingAll}
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading notifications..." />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You are completely caught up! We'll alert you here when tickets or bookings change."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.notification_id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  : 'bg-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-500/5 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 ${
                    n.is_read ? 'bg-slate-800 text-slate-400' : 'bg-indigo-600/20 text-indigo-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id ?? n.notification_id ?? 0)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
