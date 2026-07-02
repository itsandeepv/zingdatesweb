'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { subscriptionsApi, plansApi } from '@/lib/api'

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

function PlanTypeBadge({ type }: { type: string }) {
  if (type === 'premium') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold gradient-brand text-white">Premium</span>
  if (type === 'vip') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">VIP</span>
  if (type === 'corporate') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-white">Corporate</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
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
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (statusFilter !== 'all') params.status = statusFilter
      if (planFilter !== 'all') params.plan = planFilter
      const [subsRes, plansRes] = await Promise.all([
        subscriptionsApi.list(token, params),
        plansApi.list(token).catch(() => []),
      ])
      setSubs(subsRes.data ?? subsRes ?? [])
      if (subsRes.meta) setMeta(subsRes.meta)
      setPlans(plansRes.data ?? plansRes ?? [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter, planFilter])

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
          <p className="text-2xl font-bold text-gray-900 mt-1">${(mrr / 100).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Active Subscriptions</h2>
            <p className="text-xs text-gray-400 mt-0.5">{subs.length} records shown</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
              <option value="corporate">Corporate</option>
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-700">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['User','Plan','Billing','Amount','Start Date','End Date','Auto Renew','Status',''].map(col => (
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
                    <td className="px-4 py-4"><PlanTypeBadge type={sub.plan_type ?? sub.planType ?? 'free'} /></td>
                    <td className="px-4 py-4 capitalize text-gray-600 whitespace-nowrap">{sub.billing_cycle ?? sub.billingCycle}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">${((sub.amount ?? 0)/100).toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{sub.start_date ?? sub.startDate}</td>
                    <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{sub.end_date ?? sub.endDate}</td>
                    <td className="px-4 py-4">
                      {(sub.auto_renew ?? sub.autoRenew) ? (
                        <span className="text-xs font-medium text-green-700">✓ On</span>
                      ) : (
                        <span className="text-xs font-medium text-gray-400">✗ Off</span>
                      )}
                    </td>
                    <td className="px-4 py-4"><SubStatusBadge status={sub.status} /></td>
                    <td className="pr-4 py-4">
                      {sub.status === 'active' && (
                        <button onClick={() => handleCancel(sub.id)} disabled={actionLoading === sub.id}
                          className="px-2 py-1 text-xs rounded border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                          {actionLoading === sub.id ? '...' : 'Cancel'}
                        </button>
                      )}
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
