'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { eventsApi } from '@/lib/api'

type EventStatus = 'published' | 'pending_approval' | 'draft' | 'cancelled' | 'completed'

/**
 * The backend keeps approval and lifecycle as two columns and flattens them
 * into this one string on the way out, so these five values are the whole
 * vocabulary. A rejected event arrives as 'cancelled' — its reason is on the
 * detail view.
 */
type EventRow = {
  id: number
  name: string
  title: string
  status: EventStatus
  category: string | null
  category_label: string | null
  organizer_name: string | null
  organizer_verified: boolean
  venue_city: string | null
  venue_name: string | null
  cover_url: string | null
  starts_at: string | null
  price: number
  is_free: boolean
  capacity: number
  attendees: number
  reports_count: number
}

type Category = { key: string; label: string; icon: string | null; is_active: boolean; events: number }

type Stats = {
  total: number
  pending_approval: number
  published: number
  completed: number
  cancelled: number
  total_participants: number
}

/** The module's rollout switches, in the order they get turned on. */
const SETTING_LABELS: { key: string; label: string; hint: string }[] = [
  { key: 'events_enabled',          label: 'Events',            hint: 'Show the Events tab in the app. Everything below needs this on.' },
  { key: 'event_creation_enabled',  label: 'User-created events', hint: 'Let users host their own. Off = admin-seeded events only.' },
  { key: 'event_host_requires_kyc', label: 'Hosts must be verified', hint: 'Require a completed KYC before someone can host.' },
  { key: 'event_auto_approval',     label: 'Skip moderation',   hint: 'Publish user events without review. Leave off at launch.' },
  { key: 'paid_events_enabled',     label: 'Paid tickets',      hint: 'Needs the Razorpay webhook and scheduled reconciliation first.' },
]

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { label: string; cls: string }> = {
    published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
    pending_approval: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
    completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
  }
  const { label, cls } = map[status] ?? map.draft
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="min-w-[80px]">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1"><span>{used}</span><span className="text-gray-400">/{total}</span></div>
      <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-brand">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

const Icon = {
  calendar: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  clock: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  check: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  users: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
}

/** Server sends ISO; show it in the admin's own locale, date + time. */
function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [events, setEvents] = useState<EventRow[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [stats, setStats] = useState<Stats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Record<string, boolean> | null>(null)
  const [savingSetting, setSavingSetting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (category) params.category = category
      if (status) params.status = status
      const res = await eventsApi.list(token, params)
      setEvents(res.data ?? [])
      if (res.meta) setMeta(res.meta)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, category, status])

  // Totals come from the server, not from the page currently on screen — the
  // old version counted "Published" out of whichever 20 rows had loaded.
  const loadStats = useCallback(async () => {
    try { setStats((await eventsApi.stats(token)).data) } catch { /* the table still works without them */ }
  }, [token])

  const loadAside = useCallback(async () => {
    try { setCategories((await eventsApi.categories(token)).data ?? []) } catch { /* non-fatal */ }
    try { setSettings((await eventsApi.settings(token)).data ?? null) } catch { /* non-fatal */ }
  }, [token])

  useEffect(() => { loadEvents() }, [loadEvents])
  useEffect(() => { loadStats(); loadAside() }, [loadStats, loadAside])

  async function refresh() {
    await Promise.all([loadEvents(), loadStats()])
  }

  async function handleApprove(id: number) {
    setActionLoading(id)
    try {
      await eventsApi.approve(token, id)
      toast.success('Event approved')
      await refresh()
    } catch (err: any) { toast.error(err.message || 'Failed to approve') }
    finally { setActionLoading(null) }
  }

  async function handleReject(id: number) {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    setActionLoading(id)
    try {
      await eventsApi.cancel(token, id, reason)
      toast.success('Event updated')
      await refresh()
    } catch (err: any) { toast.error(err.message || 'Failed to reject') }
    finally { setActionLoading(null) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this event? Participants are notified and this cannot be undone.')) return
    setActionLoading(id)
    try {
      await eventsApi.delete(token, id)
      toast.success('Event deleted')
      await refresh()
    } catch (err: any) { toast.error(err.message || 'Failed to delete') }
    finally { setActionLoading(null) }
  }

  async function toggleSetting(key: string, next: boolean) {
    setSavingSetting(key)
    try {
      const res = await eventsApi.updateSettings(token, { [key]: next })
      setSettings(res.data)
      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally { setSavingSetting(null) }
  }

  const pendingEvents = events.filter(e => e.status === 'pending_approval')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review, approve, and manage all events on the platform</p>
        </div>
        <Link
          href="/admin/events/new"
          className="px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand"
        >
          + Create Event
        </Link>
      </div>

      {/* Rollout switches. Shown first because while Events is off, nothing
          below it is visible to a single user in the app. */}
      {settings && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Rollout</h2>
              <p className="text-xs text-gray-500 mt-0.5">Turn the module on in stages. Admin tools here keep working either way.</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${settings.events_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {settings.events_enabled ? 'Live for users' : 'Hidden from users'}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {SETTING_LABELS.map(s => (
              <div key={s.key} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.hint}</p>
                </div>
                <button
                  onClick={() => toggleSetting(s.key, !settings[s.key])}
                  disabled={savingSetting === s.key}
                  aria-pressed={!!settings[s.key]}
                  aria-label={s.label}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${settings[s.key] ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[s.key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events"  value={stats?.total ?? meta.total} icon={Icon.calendar} />
        <StatCard label="Pending Approval" value={stats?.pending_approval ?? pendingEvents.length} icon={Icon.clock} />
        <StatCard label="Published"     value={stats?.published ?? 0} icon={Icon.check} />
        <StatCard label="Participants"  value={stats?.total_participants ?? 0} icon={Icon.users} />
      </div>

      {pendingEvents.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-yellow-300 shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-yellow-200 bg-yellow-50 rounded-t-xl">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-yellow-800">Awaiting Approval ({pendingEvents.length})</h2>
          </div>
          <div className="divide-y divide-yellow-100">
            {pendingEvents.map(e => (
              <div key={e.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap hover:bg-yellow-50/40">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/events/${e.id}`} className="font-semibold text-gray-900 text-sm truncate hover:text-pink-600">{e.name}</Link>
                  <p className="text-xs text-gray-500 mt-0.5">by {e.organizer_name ?? '—'} &middot; {e.venue_city ?? '—'} &middot; {formatDate(e.starts_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(e.id)} disabled={actionLoading === e.id}
                    className="px-3 py-1.5 text-xs rounded-lg bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 font-semibold disabled:opacity-50">
                    {actionLoading === e.id ? '...' : 'Approve'}
                  </button>
                  <button onClick={() => handleReject(e.id)} disabled={actionLoading === e.id}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 font-semibold disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search events..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 w-full" />
          </div>
          {/* Categories come from the server — the app's filter chips read the
              same list, so the two can no longer drift apart. */}
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none text-gray-700">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none text-gray-700">
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">All Events</h2>
          <span className="text-xs text-gray-400">{events.length} shown</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Cover','Event','Organizer','Date','Venue','Capacity','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {event.cover_url
                        ? <img src={event.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        : <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600" />}
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      <Link href={`/admin/events/${event.id}`} className="font-semibold text-gray-900 text-sm hover:text-pink-600">{event.name}</Link>
                      <div className="flex items-center gap-1.5 mt-1">
                        {event.category_label && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{event.category_label}</span>}
                        {event.is_free
                          ? <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Free</span>
                          : <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">₹{event.price}</span>}
                        {event.reports_count > 0 && (
                          <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">{event.reports_count} report{event.reports_count > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-800 text-sm">
                      <span className="inline-flex items-center gap-1">
                        {event.organizer_name ?? '—'}
                        {event.organizer_verified && <span title="Verified" className="text-blue-500">✓</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm">{formatDate(event.starts_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-700 text-sm">{event.venue_city ?? '—'}</div>
                      <div className="text-xs text-gray-400">{event.venue_name ?? ''}</div>
                    </td>
                    <td className="px-4 py-3"><CapacityBar used={event.attendees ?? 0} total={event.capacity ?? 0} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={event.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {event.status === 'pending_approval' && (
                          <button onClick={() => handleApprove(event.id)} disabled={actionLoading === event.id}
                            className="px-2 py-1 text-xs rounded border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 font-semibold disabled:opacity-50">
                            {actionLoading === event.id ? '...' : 'Approve'}
                          </button>
                        )}
                        {event.status !== 'cancelled' && event.status !== 'completed' && (
                          <button onClick={() => handleReject(event.id)} disabled={actionLoading === event.id}
                            className="px-2 py-1 text-xs rounded border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                            {event.status === 'pending_approval' ? 'Reject' : 'Cancel'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(event.id)} disabled={actionLoading === event.id}
                          className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-red-500 disabled:opacity-50">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No events match your filters.</div>}
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {meta.page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p+1))} disabled={page === meta.last_page}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Event Categories</h2>
            <Link href="/admin/events/categories" className="text-sm font-semibold text-pink-600 hover:text-pink-700">
              Manage &rsaquo;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setCategory(cat.key); setPage(1) }}
                className={`rounded-xl p-4 flex flex-col items-center text-center transition-colors ${category === cat.key ? 'bg-pink-100 ring-2 ring-pink-300' : 'bg-gray-50 hover:bg-pink-50'} ${cat.is_active ? '' : 'opacity-50'}`}
              >
                <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.events} event{cat.events === 1 ? '' : 's'}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
