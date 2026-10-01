// frontend/src/pages/admin/AdminUsersPage.tsx
import React, { useState, useEffect } from 'react'
import { Users, Search, CheckCircle, XCircle } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { User, UserRole } from '../../types'
import { Badge } from '../../components/common/Badge'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Pagination } from '../../components/common/Pagination'
import { formatDate } from '../../utils/formatters'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  // Actions
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'role' | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('CUSTOMER')
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * pageSize
      const params: Record<string, unknown> = {
        limit: pageSize,
        offset,
      }
      if (search.trim()) params.search = search.trim()
      if (roleFilter) params.role = roleFilter
      if (statusFilter !== '') params.is_active = statusFilter === 'active'

      const res = await adminApi.getUsers(params)
      setUsers(res.items || [])
      setTotalCount(res.total || 0)
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [page, pageSize, search, roleFilter, statusFilter])

  const handleConfirmAction = async () => {
    if (!targetUser || !actionType) return

    const targetId = targetUser.user_id ?? targetUser.id
    const currentAdminId = currentAdmin?.user_id ?? currentAdmin?.id

    // Defensive check: prevent self-deactivation or self-demotion
    if (targetId === currentAdminId) {
      if (actionType === 'deactivate') {
        toast('Cannot deactivate your own administrator account!', 'error')
        setTargetUser(null)
        setActionType(null)
        return
      }
      if (actionType === 'role' && newRole !== 'ADMIN') {
        toast('Cannot self-demote your own administrator account!', 'error')
        setTargetUser(null)
        setActionType(null)
        return
      }
    }

    setActionLoading(true)
    try {
      if (actionType === 'activate') {
        await adminApi.activateUser(targetId)
        toast(`User ${targetUser.email} activated`, 'success')
      } else if (actionType === 'deactivate') {
        await adminApi.deactivateUser(targetId)
        toast(`User ${targetUser.email} deactivated`, 'info')
      } else if (actionType === 'role') {
        await adminApi.changeUserRole(targetId, newRole)
        toast(`User role updated to ${newRole}`, 'success')
      }
      setTargetUser(null)
      setActionType(null)
      loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      toast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">User Account Management</h2>
        <p className="text-xs text-slate-400">
          Enforce Role-Based Access Control (RBAC), activate or suspend customer and organizer accounts.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ORGANIZER">Organizer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading users..." />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No Users Found" description="No accounts matched the filters." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map((u) => {
                  const uId = u.user_id ?? u.id
                  return (
                    <tr key={uId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-400">#{uId}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{u.full_name}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-mono">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                            : u.role === 'ORGANIZER'
                            ? 'bg-purple-950/60 border border-purple-500/40 text-purple-300'
                            : 'bg-indigo-950/60 border border-indigo-500/40 text-indigo-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={u.is_active ? 'ACTIVE' : 'BLOCKED'} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Change Role Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setTargetUser(u)
                            setNewRole(u.role === 'CUSTOMER' ? 'ORGANIZER' : u.role === 'ORGANIZER' ? 'ADMIN' : 'CUSTOMER')
                            setActionType('role')
                          }}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                          title="Change Role"
                        >
                          Role
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        {u.is_active ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(u)
                              setActionType('deactivate')
                            }}
                            className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            title="Deactivate Account"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(u)
                              setActionType('activate')
                            }}
                            className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            title="Activate Account"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(targetUser && actionType)}
        title={
          actionType === 'activate'
            ? 'Activate User Account?'
            : actionType === 'deactivate'
            ? 'Deactivate User Account?'
            : `Change Role to ${newRole}?`
        }
        message={
          actionType === 'activate'
            ? `Enable account access for ${targetUser?.email}.`
            : actionType === 'deactivate'
            ? `Suspending ${targetUser?.email} will revoke active login sessions and block reservations.`
            : `Are you sure you want to update the role of ${targetUser?.email} from ${targetUser?.role} to ${newRole}?`
        }
        confirmText={
          actionType === 'activate'
            ? 'Activate'
            : actionType === 'deactivate'
            ? 'Deactivate'
            : 'Update Role'
        }
        confirmVariant={actionType === 'deactivate' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => {
          setTargetUser(null)
          setActionType(null)
        }}
      />
    </div>
  )
}
