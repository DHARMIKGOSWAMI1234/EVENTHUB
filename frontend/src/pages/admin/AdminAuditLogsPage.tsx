// frontend/src/pages/admin/AdminAuditLogsPage.tsx
import React, { useState, useEffect } from 'react'
import { History, ShieldCheck, Eye, X } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import type { AuditLog } from '../../types'
import { formatDateTime } from '../../utils/formatters'
import { Pagination } from '../../components/common/Pagination'
import { LoadingSpinner, EmptyState } from '../../components/common/Feedback'

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(15)
  const [loading, setLoading] = useState(true)

  // JSON viewer modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * pageSize
      const params: Record<string, unknown> = {
        limit: pageSize,
        offset,
      }
      if (actionFilter) params.action = actionFilter
      if (entityFilter) params.entity_name = entityFilter

      const res = await adminApi.getAuditLogs(params)
      setLogs(res.items || [])
      setTotalCount(res.total || 0)
    } catch (err) {
      console.error('Failed to load audit logs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLogs()
  }, [page, pageSize, actionFilter, entityFilter])

  // Defensive sanitizer: never render password hashes
  const sanitizeAuditJson = (data: Record<string, unknown> | null | undefined) => {
    if (!data) return null
    const sanitized = { ...data }
    for (const key of Object.keys(sanitized)) {
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('hash') ||
        key.toLowerCase().includes('secret')
      ) {
        sanitized[key] = '[MASKED BY DEFENSIVE AUDIT CONTROLS]'
      }
    }
    return sanitized
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Database Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Immutable JSONB mutation records recorded by PostgreSQL row triggers on critical tables.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value)
              setPage(1)
            }}
            placeholder="Entity (e.g. bookings)"
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <LoadingSpinner size="md" text="Loading audit log entries..." />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="No Audit Records" description="No audit log entries found matching criteria." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="px-5 py-3">Audit ID</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity Table</th>
                  <th className="px-5 py-3">Record ID</th>
                  <th className="px-5 py-3">Actor ID</th>
                  <th className="px-5 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {logs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">#{log.audit_id}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'INSERT'
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                            : log.action === 'UPDATE'
                            ? 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                            : 'bg-rose-950/60 border border-rose-500/40 text-rose-400'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">{log.entity_name}</td>
                    <td className="px-5 py-3.5 text-indigo-400">#{log.entity_id}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {log.user_id ? `User #${log.user_id}` : 'System'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect JSON</span>
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Audit Entry #{selectedLog.audit_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {selectedLog.action} ON {selectedLog.entity_name}
                  </span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Old Data */}
              {selectedLog.old_data && (
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1 font-mono">
                    Before Mutation (OLD DATA)
                  </h4>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(sanitizeAuditJson(selectedLog.old_data), null, 2)}
                  </pre>
                </div>
              )}

              {/* New Data */}
              {selectedLog.new_data && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 font-mono">
                    After Mutation (NEW DATA)
                  </h4>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(sanitizeAuditJson(selectedLog.new_data), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sensitive tokens &amp; hashes automatically masked</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
