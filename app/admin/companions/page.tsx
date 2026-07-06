'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { companionAdminApi } from '@/lib/api'

const TABS = ['companions', 'bookings', 'withdrawals', 'settings'] as const
type Tab = typeof TABS[number]

const STATUS_CLS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-600', rejected: 'bg-red-100 text-red-600',
  completed: 'bg-green-100 text-green-700', in_progress: 'bg-purple-100 text-purple-700',
  accepted: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500',
  paid: 'bg-green-100 text-green-700',
}

function Badge({ s }: { s: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_CLS[s] ?? 'bg-gray-100 text-gray-500'}`}>{s?.replace('_', ' ')}</span>
}

export default function AdminCompanionsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [tab, setTab] = useState<Tab>('companions')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [commission, setCommission] = useState({ commission_percent: '', min_withdraw: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = statusFilter !== 'all' ? { status: statusFilter } : {}
      if (tab === 'companions') setRows((await companionAdminApi.list(token, params)).data ?? [])
      else if (tab === 'bookings') setRows((await companionAdminApi.bookings(token, params)).data ?? [])
      else if (tab === 'withdrawals') setRows((await companionAdminApi.withdrawals(token, params)).data ?? [])
      else {
        const s = await companionAdminApi.settings(token)
        setCommission({ commission_percent: String(s.commission_percent ?? 20), min_withdraw: String(s.min_withdraw ?? 100) })
      }
    } catch (e: any) { toast.error(e?.message ?? 'Failed to load') }
    finally { setLoading(false) }
  }, [tab, token, statusFilter])

  useEffect(() => { load() }, [load])

  async function act(id: number, fn: () => Promise<any>, msg: string) {
    setBusy(id)
    try { await fn(); toast.success(msg); await load() }
    catch (e: any) { toast.error(e?.message ?? 'Action failed') }
    finally { setBusy(null) }
  }

  async function saveCommission() {
    try {
      await companionAdminApi.updateSettings(token, {
        commission_percent: parseFloat(commission.commission_percent) || 0,
        min_withdraw: parseFloat(commission.min_withdraw) || 0,
      })
      toast.success('Commission updated')
    } catch (e: any) { toast.error(e?.message ?? 'Failed') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Companion Management</h1>
        <p className="text-gray-500 text-sm">Approve companions, review bookings, and process payouts.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setStatusFilter('all') }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px capitalize ${tab === t ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab !== 'settings' && (
        <div className="flex gap-2 flex-wrap">
          {(tab === 'companions' ? ['all', 'pending', 'approved', 'suspended', 'rejected']
            : tab === 'bookings' ? ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled']
            : ['all', 'pending', 'approved', 'paid', 'rejected']).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${statusFilter === s ? 'gradient-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-60"><div className="w-9 h-9 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" /></div>
      ) : tab === 'settings' ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-md space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Platform commission (%)</label>
            <input value={commission.commission_percent} onChange={e => setCommission(c => ({ ...c, commission_percent: e.target.value.replace(/[^0-9.]/g, '') }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Minimum withdrawal (coins)</label>
            <input value={commission.min_withdraw} onChange={e => setCommission(c => ({ ...c, min_withdraw: e.target.value.replace(/[^0-9.]/g, '') }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
          </div>
          <button onClick={saveCommission} className="gradient-brand text-white font-bold px-6 py-2.5 rounded-xl shadow-brand hover:opacity-90">Save</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Nothing here.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            {tab === 'companions' && (
              <>
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">City</th>
                  <th className="text-left px-4 py-3">Price/min</th><th className="text-left px-4 py-3">Rating</th>
                  <th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{rows.map(c => (
                  <tr key={c.id} className="border-t border-gray-50">
                    <td className="px-4 py-3"><p className="font-semibold text-gray-800">{c.name}</p><p className="text-xs text-gray-400">{c.email ?? c.phone}</p></td>
                    <td className="px-4 py-3 text-gray-600">{c.city ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.coins_per_min}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(c.rating_avg).toFixed(1)} ({c.rating_count})</td>
                    <td className="px-4 py-3"><Badge s={c.status} /></td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {c.status !== 'approved' && <button disabled={busy === c.id} onClick={() => act(c.id, () => companionAdminApi.approve(token, c.id), 'Approved')} className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">Approve</button>}
                      {c.status !== 'suspended' && <button disabled={busy === c.id} onClick={() => act(c.id, () => companionAdminApi.suspend(token, c.id), 'Suspended')} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">Suspend</button>}
                      {c.status !== 'rejected' && <button disabled={busy === c.id} onClick={() => act(c.id, () => companionAdminApi.reject(token, c.id), 'Rejected')} className="px-3 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-bold">Reject</button>}
                    </td>
                  </tr>
                ))}</tbody>
              </>
            )}
            {tab === 'bookings' && (
              <>
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3">#</th><th className="text-left px-4 py-3">Client</th><th className="text-left px-4 py-3">Companion</th>
                  <th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Coins</th><th className="text-left px-4 py-3">Status</th>
                </tr></thead>
                <tbody>{rows.map(b => (
                  <tr key={b.id} className="border-t border-gray-50">
                    <td className="px-4 py-3 text-gray-500">{b.id}</td><td className="px-4 py-3 text-gray-700">{b.client}</td>
                    <td className="px-4 py-3 text-gray-700">{b.companion}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{b.session_type} · {b.duration_min}m</td>
                    <td className="px-4 py-3 font-semibold">{Math.round(b.coins_total)}{b.refunded ? <span className="text-[10px] text-green-600 ml-1">refunded</span> : ''}</td>
                    <td className="px-4 py-3"><Badge s={b.status} /></td>
                  </tr>
                ))}</tbody>
              </>
            )}
            {tab === 'withdrawals' && (
              <>
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3">Creator</th><th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{rows.map(w => (
                  <tr key={w.id} className="border-t border-gray-50">
                    <td className="px-4 py-3"><p className="font-semibold text-gray-800">{w.user}</p><p className="text-xs text-gray-400">{w.email}</p></td>
                    <td className="px-4 py-3 font-semibold">{Math.round(w.amount)} coins</td>
                    <td className="px-4 py-3"><Badge s={w.status} /></td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {['pending', 'approved'].includes(w.status) && <>
                        {w.status === 'pending' && <button disabled={busy === w.id} onClick={() => act(w.id, () => companionAdminApi.approveWithdraw(token, w.id), 'Approved')} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">Approve</button>}
                        <button disabled={busy === w.id} onClick={() => act(w.id, () => companionAdminApi.payWithdraw(token, w.id), 'Marked paid')} className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">Mark paid</button>
                        <button disabled={busy === w.id} onClick={() => act(w.id, () => companionAdminApi.rejectWithdraw(token, w.id), 'Rejected')} className="px-3 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-bold">Reject</button>
                      </>}
                    </td>
                  </tr>
                ))}</tbody>
              </>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
