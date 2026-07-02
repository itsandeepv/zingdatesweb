'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { socialApi } from '@/lib/api'

const ACTIONS = [
  { key: 'dismiss', label: 'Dismiss', cls: 'border-gray-200 text-gray-600 hover:bg-gray-50' },
  { key: 'warn', label: 'Warn User', cls: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' },
  { key: 'ban', label: 'Ban User', cls: 'border-red-200 text-red-600 hover:bg-red-50' },
]

export default function SocialPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await socialApi.reports(token, params)
      setReports(res.data ?? res ?? [])
    } catch (err: any) { toast.error(err.message || 'Failed to load reports') }
    finally { setLoading(false) }
  }, [token, statusFilter])

  useEffect(() => { loadReports() }, [loadReports])

  async function handleAction(id: number, action: string) {
    setActionLoading(id)
    try {
      await socialApi.handleReport(token, id, action)
      toast.success(`Report ${action === 'dismiss' ? 'dismissed' : action === 'warn' ? 'warned' : 'banned'} successfully`)
      loadReports()
    } catch (err: any) { toast.error(err.message || 'Failed to process report') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and take action on user reports</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {['pending','reviewed','all'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === s ? 'gradient-brand text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No reports found.</div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                      {report.report_type ?? report.type ?? 'report'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">{report.reason ?? report.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span>Reported by: <strong>{report.reporter_name ?? report.reporterName ?? 'Unknown'}</strong></span>
                    <span>Against: <strong>{report.reported_name ?? report.reportedName ?? 'Unknown'}</strong></span>
                    <span>{report.created_at ?? report.createdAt}</span>
                  </div>
                  {report.content_preview && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">{report.content_preview}</p>
                  )}
                </div>
                {report.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ACTIONS.map(action => (
                      <button key={action.key} onClick={() => handleAction(report.id, action.key)} disabled={actionLoading === report.id}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-medium disabled:opacity-50 ${action.cls}`}>
                        {actionLoading === report.id ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
