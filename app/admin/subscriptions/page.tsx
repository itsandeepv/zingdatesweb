'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { subscriptionsApi, attentionApi } from '@/lib/api'
import GrantPlanModal, { type GrantPlanTarget } from '@/components/admin/GrantPlanModal'

function SubStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-600',
    cancelled: 'bg-gray-100 text-gray-500',
    paused: 'bg-blue-100 text-blue-600',
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

// Shows the plan's real name from the API — plans are admin-defined, so a
// fixed list of keys here goes stale the moment one is added or renamed.
function PlanTypeBadge({ type, name }: { type?: string | null; name?: string | null }) {
  if (!type || type === 'free') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
  const label = name || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const cls = type.includes('vip') ? 'bg-purple-100 text-purple-700' : type.includes('trial') ? 'bg-amber-100 text-amber-700' : 'gradient-brand text-white'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>{label}</span>
}

/** Date on one line, local time under it — not a raw ISO string. */
function DateCell({ iso }: { iso?: string | null }) {
  if (!iso) return <span className="text-gray-300">—</span>
  const d = new Date(iso)
  if (isNaN(d.getTime())) return <span className="text-gray-300">—</span>
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="text-gray-800 font-medium">{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      <span className="text-[11px] text-gray-400">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
    </span>
  )
}

function TimeLeft({ days }: { days?: number | null }) {
  if (days == null) return <span className="text-gray-300">—</span>
  if (days < 0) return <span className="text-xs font-semibold text-red-500">Expired {Math.abs(days)}d ago</span>
  if (days === 0) return <span className="text-xs font-semibold text-orange-600">Ends today</span>
  if (days <= 7) return <span className="text-xs font-semibold text-amber-600">{days}d left</span>
  return <span className="text-xs font-medium text-gray-600">{days}d left</span>
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  return <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials}</div>
}

export default function SubscriptionsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [subs, setSubs] = useState<any[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [endsFrom, setEndsFrom] = useState('')
  const [endsTo, setEndsTo] = useState('')
  const [sort, setSort] = useState('ends_desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [planTarget, setPlanTarget] = useState<GrantPlanTarget | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), sort }
      if (statusFilter !== 'all') params.status = statusFilter
      if (planFilter !== 'all') params.plan = planFilter
      if (debounced) params.search = debounced
      if (endsFrom) params.ends_from = endsFrom
      if (endsTo) params.ends_to = endsTo
      const [subsRes, plansRes] = await Promise.all([
        subscriptionsApi.list(token, params),
        subscriptionsApi.listPlans(token).catch(() => ({ plans: [] })),
      ])
      setSubs(subsRes.data ?? subsRes ?? [])
      if (subsRes.meta) setMeta(subsRes.meta)
      // /admin/plans answers { plans: [...] }; the old `.data` read left this empty.
      setPlans(plansRes.plans ?? plansRes.data ?? [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
      attentionApi.markSeen(token, 'subscriptions').catch(() => {})
    }
  }, [token, page, statusFilter, planFilter, debounced, endsFrom, endsTo, sort])

  useEffect(() => { loadData() }, [loadData])

  async function handleCancel(id: number) {
    if (!confirm('Cancel this subscription?')) return
    setActionLoading(id)
    try {
      await subscriptionsApi.cancel(token, id)
      toast.success('Subscription cancelled')
      loadData()
    } catch (err: any) { toast.error(err.message || 'Failed to cancel') }
    finally { setActionLoading(null) }
  }

  const mrr = subs.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amount ?? 0), 0)

  return (
    <div className="space-y-6">
      {planTarget && (
        <GrantPlanModal user={planTarget} token={token}
          onClose={() => setPlanTarget(null)}
          onSuccess={() => { setPlanTarget(null); loadData() }} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage plans, active subscriptions, and billing cycles.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Subscriptions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{meta.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{subs.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">MRR (page)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{Number(mrr || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Active Subscriptions</h2>
            <p className="text-xs text-gray-400 mt-0.5">{subs.length} records shown</p>
          </div>
        </div>

        {/* Filters: who, which plan, where it stands, when it ends. The plan
            list is the real catalog, so a new plan is filterable the day it
            is created. */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative basis-full lg:basis-auto lg:flex-1 min-w-[220px]">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200" />
          </div>
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700 bg-white">
            <option value="all">All plans</option>
            {plans.map((p: any) => <option key={p.key} value={p.key}>{p.name}{p.is_active === false ? ' (inactive)' : ''}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700 bg-white">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring in 7 days</option>
            <option value="expired">Expired</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
            Ends
            <input type="date" value={endsFrom} max={endsTo || undefined} onChange={e => { setEndsFrom(e.target.value); setPage(1) }}
              className="px-2 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700" />
            to
            <input type="date" value={endsTo} min={endsFrom || undefined} onChange={e => { setEndsTo(e.target.value); setPage(1) }}
              className="px-2 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700" />
          </label>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700 bg-white">
            <option value="ends_desc">Ending last first</option>
            <option value="ends_asc">Ending soonest first</option>
            <option value="name">Name A–Z</option>
          </select>
          {(search || planFilter !== 'all' || statusFilter !== 'all' || endsFrom || endsTo || sort !== 'ends_desc') && (
            <button onClick={() => { setSearch(''); setPlanFilter('all'); setStatusFilter('all'); setEndsFrom(''); setEndsTo(''); setSort('ends_desc'); setPage(1) }}
              className="text-xs text-pink-600 font-semibold hover:text-pink-800 whitespace-nowrap">
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['User','Plan','Duration','Amount','Started','Ends','Time left','Status',''].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subs.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-14 text-gray-400 text-sm">No subscriptions match the current filters.</td></tr>
                ) : subs.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={sub.user_name ?? sub.userName ?? 'U'} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[140px]">{sub.user_name ?? sub.userName}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{sub.user_email ?? sub.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><PlanTypeBadge type={sub.plan_type ?? sub.planType} name={sub.plan_name} /></td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{sub.duration_days ? `${sub.duration_days} ${sub.duration_days === 1 ? 'day' : 'days'}` : (sub.billing_cycle ?? '—')}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">₹{Number(sub.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap"><DateCell iso={sub.start_date ?? sub.startDate} /></td>
                    <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap"><DateCell iso={sub.end_date ?? sub.endDate} /></td>
                    <td className="px-4 py-4 whitespace-nowrap"><TimeLeft days={sub.days_left} /></td>
                    <td className="px-4 py-4"><SubStatusBadge status={sub.status} /></td>
                    <td className="pr-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPlanTarget({ id: sub.user_id ?? sub.id, name: sub.user_name ?? sub.userName ?? 'User', subscription_plan: sub.plan_type, plan_expires_at: sub.end_date })}
                          className="px-2 py-1 text-xs rounded border border-purple-200 text-purple-600 hover:bg-purple-50">
                          {sub.status === 'active' ? 'Change' : 'Give plan'}
                        </button>
                        {sub.status === 'active' && (
                          <button onClick={() => handleCancel(sub.id)} disabled={actionLoading === sub.id}
                            className="px-2 py-1 text-xs rounded border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                            {actionLoading === sub.id ? '...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {meta.last_page}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(meta.last_page,p+1))} disabled={page===meta.last_page}
                className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
