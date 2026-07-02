'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { eventsApi } from '@/lib/api'

type EventStatus = 'published' | 'pending_approval' | 'draft' | 'cancelled' | 'completed'

const eventCategories = [
  { name: 'Networking', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: '🤝' },
  { name: 'Social', color: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', icon: '🎉' },
  { name: 'Sports', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', icon: '⚽' },
  { name: 'Arts', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', icon: '🎨' },
  { name: 'Tech', color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '💻' },
  { name: 'Wellness', color: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', icon: '🧘' },
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
  const pct = Math.min(Math.round((used / total) * 100), 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="min-w-[80px]">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1"><span>{used}</span><span className="text-gray-400">/{total}</span></div>
      <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

const coverColors = ['bg-gradient-to-br from-pink-400 to-rose-600','bg-gradient-to-br from-purple-400 to-indigo-600','bg-gradient-to-br from-blue-400 to-cyan-600','bg-gradient-to-br from-green-400 to-teal-600','bg-gradient-to-br from-orange-400 to-amber-600']

export default function EventsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [events, setEvents] = useState<any[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
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
      setEvents(res.data ?? res)
      if (res.meta) setMeta(res.meta)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, category, status])

  useEffect(() => { loadEvents() }, [loadEvents])

  async function handleApprove(id: number) {
    setActionLoading(id)
    try {
      await eventsApi.approve(token, id)
      toast.success('Event approved')
      loadEvents()
    } catch (err: any) { toast.error(err.message || 'Failed to approve') }
    finally { setActionLoading(null) }
  }

  async function handleReject(id: number) {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    setActionLoading(id)
    try {
      await eventsApi.cancel(token, id, reason)
      toast.success('Event rejected')
      loadEvents()
    } catch (err: any) { toast.error(err.message || 'Failed to reject') }
    finally { setActionLoading(null) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setActionLoading(id)
    try {
      await eventsApi.delete(token, id)
      toast.success('Event deleted')
      loadEvents()
    } catch (err: any) { toast.error(err.message || 'Failed to delete') }
    finally { setActionLoading(null) }
  }

  const pendingEvents = events.filter(e => e.status === 'pending_approval')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review, approve, and manage all events on the platform</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-brand">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Total Events</p><p className="text-xl font-bold text-gray-900">{meta.total.toLocaleString()}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-brand">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Pending Approval</p><p className="text-xl font-bold text-gray-900">{pendingEvents.length}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-brand">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Published</p><p className="text-xl font-bold text-gray-900">{events.filter(e => e.status === 'published').length}</p></div>
        </div>
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
                  <p className="font-semibold text-gray-900 text-sm truncate">{e.name ?? e.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">by {e.organizer_name ?? e.organizerName} &middot; {e.venue_city ?? e.venue?.city}</p>
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
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none text-gray-700">
            <option value="">All Categories</option>
            {['Networking','Social','Tech','Wellness','Sports','Arts'].map(c => <option key={c} value={c}>{c}</option>)}
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
                {events.map((event, i) => (
                  <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><div className={`w-10 h-10 rounded-lg ${coverColors[i % coverColors.length]}`} /></td>
                    <td className="px-4 py-3 min-w-[180px]">
                      <div className="font-semibold text-gray-900 text-sm">{event.name ?? event.title}</div>
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block">{event.category}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-800 text-sm">{event.organizer_name ?? event.organizerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm">{event.date ?? event.start_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-700 text-sm">{event.venue_city ?? event.venue?.city}</div>
                      <div className="text-xs text-gray-400">{event.venue_name ?? event.venue?.name}</div>
                    </td>
                    <td className="px-4 py-3"><CapacityBar used={event.registration_count ?? event.registrationCount ?? 0} total={event.capacity ?? 100} /></td>
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
                            Reject
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Event Categories Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {eventCategories.map(cat => (
            <div key={cat.name} className={`${cat.bg} rounded-xl p-4 flex flex-col items-center text-center`}>
              <span className="text-2xl mb-2">{cat.icon}</span>
              <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
