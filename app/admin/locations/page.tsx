'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { locationsApi, type AdminLocation } from '@/lib/api'

type Status = '' | 'pending' | 'approved' | 'rejected' | 'inactive'

const TABS: { key: Status; label: string }[] = [
  { key: '',         label: 'All' },
  { key: 'pending',  label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'inactive', label: 'Inactive' },
]

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-600',
}

function StatCard({ label, value, tone = '' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${tone || 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function LocationsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [rows, setRows] = useState<AdminLocation[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [stats, setStats] = useState<any>(null)
  const [cats, setCats] = useState<any[]>([])

  const [status, setStatus] = useState<Status>('')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (status) params.status = status
      if (search) params.search = search
      if (city) params.city = city
      if (category) params.category = category

      const res = await locationsApi.list(token, params)
      setRows(res.data ?? [])
      if (res.meta) setMeta(res.meta)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load locations')
    } finally {
      setLoading(false)
    }
  }, [token, page, status, search, city, category])

  const loadAside = useCallback(async () => {
    try { setStats((await locationsApi.stats(token)).data) } catch { /* non-fatal */ }
    try { setCats((await locationsApi.categories(token)).data ?? []) } catch { /* non-fatal */ }
  }, [token])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadAside() }, [loadAside])

  async function act(id: number, fn: () => Promise<any>) {
    setBusy(id)
    try {
      const res = await fn()
      toast.success(res.message ?? 'Done')
      await Promise.all([load(), loadAside()])
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally { setBusy(null) }
  }

  const reject = (l: AdminLocation) => {
    const reason = prompt(`Why is "${l.name}" being rejected?`)
    if (!reason) return
    act(l.id, () => locationsApi.reject(token, l.id, reason))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venue Locations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Only approved venues appear when someone creates an event. Google is the source; you are the gate.
          </p>
        </div>
        <Link href="/admin/locations/new"
          className="px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand">
          + Add Location
        </Link>
      </div>

      {/* Google not being enabled is a server-side fact an admin needs to see
          here — otherwise the import screen just mysteriously returns nothing. */}
      {stats && stats.google_configured === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">Google Places is not configured</p>
          <p className="text-sm text-amber-700 mt-1">
            Importing from Google will not work until the API key is set on the server. Adding venues manually still works.
          </p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} tone={stats.pending > 0 ? 'text-amber-600' : ''} />
          <StatCard label="Approved" value={stats.approved} tone="text-green-600" />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Inactive" value={stats.inactive} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key || 'all'}
              onClick={() => { setStatus(t.key); setPage(1) }}
              className={`shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                status === t.key ? 'bg-pink-50 text-pink-700 border-b-2 border-pink-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key === 'pending' && stats?.pending > 0 && (
                <span className="ml-2 text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-gray-100">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, address or city…"
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <input
            value={city}
            onChange={e => { setCity(e.target.value); setPage(1) }}
            placeholder="City"
            className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
          >
            <option value="">All types</option>
            {cats.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-900 font-semibold">No locations here</p>
            <p className="text-sm text-gray-500 mt-1">
              {status === 'pending' ? 'Nothing is waiting for review.' : 'Try another filter, or add one.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rows.map(l => (
              <div key={l.id} className="px-5 py-4 flex items-center gap-4 flex-wrap hover:bg-gray-50/60">
                {l.photos[0]?.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={l.photos[0].url!} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  : <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 shrink-0" />}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/locations/${l.id}`} className="font-semibold text-gray-900 hover:text-pink-600">
                      {l.name}
                    </Link>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[l.status]}`}>
                      {l.status}
                    </span>
                    {l.is_featured && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Featured</span>}
                    {l.source_type === 'manual' && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Manual</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {l.category ?? 'Uncategorised'}
                    {l.city ? ` · ${l.city}` : ''}
                    {l.rating ? ` · ⭐ ${l.rating} (${l.review_count.toLocaleString()})` : ''}
                    {l.events_count > 0 ? ` · ${l.events_count} event${l.events_count === 1 ? '' : 's'}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {l.status !== 'approved' && (
                    <button onClick={() => act(l.id, () => l.status === 'inactive'
                      ? locationsApi.reactivate(token, l.id)
                      : locationsApi.approve(token, l.id))}
                      disabled={busy === l.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 font-semibold disabled:opacity-50">
                      {l.status === 'inactive' ? 'Reactivate' : 'Approve'}
                    </button>
                  )}
                  {l.status === 'approved' && (
                    <button onClick={() => act(l.id, () => locationsApi.deactivate(token, l.id))}
                      disabled={busy === l.id}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                      Deactivate
                    </button>
                  )}
                  {l.status !== 'rejected' && (
                    <button onClick={() => reject(l)} disabled={busy === l.id}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                      Reject
                    </button>
                  )}
                  <Link href={`/admin/locations/${l.id}`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {meta.page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
