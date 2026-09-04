'use client'

// User reports queue.
//
// Reporting existed in the app as an alert that thanked the user and sent
// nothing anywhere — nothing was recorded, so nothing could be reviewed. This
// is the other end of that: every report now lands here.
//
// The number that matters on each row is `reported_count`. One complaint is a
// disagreement; the same person reported five times is a pattern, and that is
// what decides whether to act.

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { reportsApi } from '@/lib/api'

const STATUSES = ['pending', 'reviewing', 'actioned', 'dismissed'] as const

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-red-100 text-red-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    actioned: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

export default function ReportsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [reports, setReports] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [suspend, setSuspend] = useState(false)
  const [saving, setSaving] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      const res = await reportsApi.list(token, params)
      setReports(res.data ?? [])
      if (res.meta) setMeta(res.meta)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    reportsApi.stats(token).then(r => setStats(r.stats)).catch(() => {})
  }, [token])

  async function save(id: number, status: string) {
    setSaving(id)
    try {
      await reportsApi.update(token, id, { status, admin_note: note, suspend })
      toast.success(suspend ? 'Report updated and account suspended' : 'Report updated')
      setOpenId(null); setNote(''); setSuspend(false)
      load()
      reportsApi.stats(token).then(r => setStats(r.stats)).catch(() => {})
    } catch (err: any) {
      toast.error(err.message || 'Could not update this report')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">User Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Profiles reported from the app. Newest unhandled first.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { k: 'total', label: 'Total' },
            { k: 'pending', label: 'Pending' },
            { k: 'reviewing', label: 'Reviewing' },
            { k: 'actioned', label: 'Actioned' },
            { k: 'dismissed', label: 'Dismissed' },
          ].map(c => (
            <div key={c.k} className="rounded-xl border bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{c.label}</div>
              <div className="text-2xl font-semibold mt-1">{stats[c.k] ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize border ${
              statusFilter === s ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search reported user…"
          className="ml-auto px-3 py-1.5 rounded-lg border text-sm w-64"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-gray-400">No reports here.</div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.reported?.name ?? 'Deleted user'}</span>
                    <StatusBadge status={r.status} />
                    {r.reported_count > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        reported {r.reported_count}×
                      </span>
                    )}
                    {r.reported?.is_suspended && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white">
                        suspended
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mt-1.5">
                    <span className="font-medium">{r.reason_label}</span>
                    {r.details ? <span className="text-gray-500"> — {r.details}</span> : null}
                  </div>
                  <div className="text-xs text-gray-400 mt-1.5">
                    by {r.reporter?.name ?? 'deleted user'} · {new Date(r.created_at).toLocaleString()}
                    {r.reviewed_by ? ` · reviewed by ${r.reviewed_by}` : ''}
                  </div>
                  {r.admin_note ? (
                    <div className="text-xs text-gray-500 mt-1 italic">Note: {r.admin_note}</div>
                  ) : null}
                </div>

                <button
                  onClick={() => {
                    setOpenId(openId === r.id ? null : r.id)
                    setNote(r.admin_note ?? ''); setSuspend(false)
                  }}
                  className="px-3 py-1.5 rounded-lg border text-sm"
                >
                  {openId === r.id ? 'Close' : 'Review'}
                </button>
              </div>

              {openId === r.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Internal note (optional)"
                    maxLength={500}
                    className="w-full rounded-lg border px-3 py-2 text-sm min-h-[70px]"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={suspend} onChange={e => setSuspend(e.target.checked)} />
                    Also suspend {r.reported?.name ?? 'this account'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        disabled={saving === r.id}
                        onClick={() => save(r.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-sm capitalize border disabled:opacity-50 ${
                          s === 'actioned' ? 'bg-green-600 text-white border-green-600'
                            : s === 'dismissed' ? 'bg-gray-100 text-gray-700'
                            : 'bg-white text-gray-700'
                        }`}
                      >
                        Mark {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {meta.page} of {meta.last_page}</span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
