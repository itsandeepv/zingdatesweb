'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { companionAdminApi } from '@/lib/api'

const TABS = ['companions', 'bookings', 'withdrawals', 'categories', 'settings'] as const
type Tab = typeof TABS[number]

const STATUS_CLS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-600', rejected: 'bg-red-100 text-red-600',
  completed: 'bg-green-100 text-green-700', in_progress: 'bg-purple-100 text-purple-700',
  accepted: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500',
  paid: 'bg-green-100 text-green-700', refunded: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-600', expired: 'bg-gray-100 text-gray-500',
}

/**
 * The destination for this payout, with copy buttons — an admin is about to
 * retype these into a banking app, and a mistyped account number sends real
 * money to a stranger.
 */
function PayoutCell({ payout, note }: { payout: any; note?: string }) {
  const copy = (v: string) => {
    navigator.clipboard?.writeText(v)
    toast.success('Copied')
  }

  if (!payout) {
    return (
      <div className="text-xs">
        <span className="text-red-600 font-semibold">No payout details</span>
        {note ? <p className="text-gray-400 mt-0.5">note: {note}</p> : null}
      </div>
    )
  }

  if (payout.method === 'upi') {
    return (
      <button onClick={() => copy(payout.upi)}
        className="text-left text-xs font-mono text-gray-800 hover:text-pink-600" title="Click to copy">
        <span className="block text-[10px] font-sans font-bold text-gray-400 uppercase">UPI</span>
        {payout.upi}
      </button>
    )
  }

  return (
    <div className="text-xs space-y-0.5">
      <p className="text-gray-700 font-semibold">{payout.account_name}</p>
      <button onClick={() => copy(payout.account_number)}
        className="font-mono text-gray-800 hover:text-pink-600 block" title="Click to copy">
        {payout.account_number}
      </button>
      <button onClick={() => copy(payout.ifsc)}
        className="font-mono text-gray-500 hover:text-pink-600 block" title="Click to copy">
        {payout.ifsc}
      </button>
    </div>
  )
}

function Badge({ s }: { s: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_CLS[s] ?? 'bg-gray-100 text-gray-500'}`}>{s?.replace('_', ' ')}</span>
}

/**
 * Shows what the configured rates do to a sample booking, so the admin can see
 * the split before saving rather than discovering it on a live transaction.
 */
function Split({ commission, gst }: { commission: number; gst: number }) {
  const base = 1000
  const gstAmt = +(base * gst / 100).toFixed(2)
  const comAmt = +(base * commission / 100).toFixed(2)
  const creator = +(base - comAmt).toFixed(2)
  const money = (n: number) => `₹${n.toFixed(2)}`

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">On a {money(base)} booking</p>
      <Line label="Base fee" value={money(base)} />
      <Line label={`GST (${gst}%)`} value={money(gstAmt)} />
      <div className="h-px bg-gray-200 my-2" />
      <Line label="Client pays" value={money(base + gstAmt)} strong />
      <div className="h-px bg-gray-200 my-2" />
      <Line label={`Platform commission (${commission}%)`} value={money(comAmt)} />
      <Line label="Creator receives" value={money(creator)} strong />
      <p className="text-[11px] text-gray-400 mt-2">GST is collected for the government — it is not platform revenue.</p>
    </div>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={strong ? 'font-bold text-gray-800' : 'text-gray-500'}>{label}</span>
      <span className={strong ? 'font-bold text-pink-600' : 'text-gray-700'}>{value}</span>
    </div>
  )
}

/**
 * How a session ended.
 *
 * Most rows are unremarkable — it ran its time, or the two of them finished
 * early. The ones that matter are where someone stopped a session because they
 * felt unsafe or the other person behaved badly. That report is the only signal
 * anyone gets that something went wrong between two people, so it is loud here
 * rather than folded into a status badge.
 */
function EndedCell({ b }: { b: any }) {
  if (b.status !== 'completed' && !b.ended_early) {
    return <span className="text-xs text-gray-400">—</span>
  }

  if (!b.ended_early) {
    return (
      <div className="text-xs">
        <span className="text-gray-500">Ran full time</span>
        <span className="block text-[10px] text-gray-400">
          {b.ended_by === 'system' ? 'closed automatically' : `ended by ${b.ended_by ?? '—'}`}
        </span>
      </div>
    )
  }

  return (
    <div className="text-xs max-w-[15rem]">
      <span className={`inline-block px-2 py-0.5 rounded-lg font-bold ${
        b.flagged ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {b.flagged ? '⚠ ' : ''}{b.end_reason_label ?? 'Ended early'}
      </span>
      <span className="block text-[10px] text-gray-400 mt-0.5">
        cut short by {b.ended_by ?? '—'}
      </span>
      {b.end_remark ? (
        <p className="text-gray-600 mt-1 leading-snug italic">“{b.end_remark}”</p>
      ) : null}
    </div>
  )
}

export default function AdminCompanionsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [tab, setTab] = useState<Tab>('companions')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [commission, setCommission] = useState({ commission_percent: '', gst_percent: '', min_withdraw: '' })
  const [newCat, setNewCat] = useState({ label: '', icon: '' })
  // Icon names the app can actually draw, served with the list so the picker
  // and the server's validator can never drift apart.
  const [icons, setIcons] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = statusFilter !== 'all' ? { status: statusFilter } : {}
      if (tab === 'companions') setRows((await companionAdminApi.list(token, params)).data ?? [])
      else if (tab === 'bookings') setRows((await companionAdminApi.bookings(token, params)).data ?? [])
      else if (tab === 'withdrawals') setRows((await companionAdminApi.withdrawals(token, params)).data ?? [])
      else if (tab === 'categories') {
        const res = await companionAdminApi.categories(token)
        setRows(res.data ?? [])
        setIcons(res.icons ?? [])
      }
      else {
        const s = await companionAdminApi.settings(token)
        setCommission({
          commission_percent: String(s.commission_percent ?? 20),
          gst_percent:        String(s.gst_percent ?? 18),
          min_withdraw:       String(s.min_withdraw ?? 100),
        })
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

  async function saveCategory() {
    const label = newCat.label.trim()
    if (!label) return
    try {
      await companionAdminApi.saveCategory(token, { label, icon: newCat.icon.trim() || undefined })
      toast.success('Category saved — it is live in the app now')
      setNewCat({ label: '', icon: '' })
      await load()
    } catch (e: any) { toast.error(e?.message ?? 'Failed') }
  }

  async function saveCommission() {
    try {
      await companionAdminApi.updateSettings(token, {
        commission_percent: parseFloat(commission.commission_percent) || 0,
        gst_percent: parseFloat(commission.gst_percent) || 0,
        min_withdraw: parseFloat(commission.min_withdraw) || 0,
      })
      toast.success('Settings updated')
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

      {tab !== 'settings' && tab !== 'categories' && (
        <div className="flex gap-2 flex-wrap">
          {(tab === 'companions' ? ['all', 'pending', 'approved', 'suspended', 'rejected']
            : tab === 'bookings' ? ['all', 'flagged', 'ended_early', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled']
            : ['all', 'pending', 'approved', 'paid', 'rejected']).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                statusFilter === s ? 'gradient-brand text-white'
                  : s === 'flagged' ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-60"><div className="w-9 h-9 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" /></div>
      ) : tab === 'settings' ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Platform commission (%)</label>
            <input value={commission.commission_percent} onChange={e => setCommission(c => ({ ...c, commission_percent: e.target.value.replace(/[^0-9.]/g, '') }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            <p className="text-xs text-gray-400 mt-1.5">Taken from the base fee only. Applies to every new booking immediately.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">GST charged to client (%)</label>
            <input value={commission.gst_percent} onChange={e => setCommission(c => ({ ...c, gst_percent: e.target.value.replace(/[^0-9.]/g, '') }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            <p className="text-xs text-gray-400 mt-1.5">Added on top of the base fee. Never shared with the creator or counted as commission.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Minimum withdrawal (₹)</label>
            <input value={commission.min_withdraw} onChange={e => setCommission(c => ({ ...c, min_withdraw: e.target.value.replace(/[^0-9.]/g, '') }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
          </div>

          <Split commission={parseFloat(commission.commission_percent) || 0} gst={parseFloat(commission.gst_percent) || 0} />

          <button onClick={saveCommission} className="gradient-brand text-white font-bold px-6 py-2.5 rounded-xl shadow-brand hover:opacity-90">Save</button>
        </div>
      ) : tab === 'categories' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-1">Add or rename a category</h2>
            <p className="text-xs text-gray-400 mb-4">
              Categories are stored server-side, so a new one appears in the app straight away —
              in the feed row, the booking sheet, a companion&apos;s “Available for” list and the filters.
              Renaming an existing label keeps its key, so companions who already picked it keep it.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[12rem]">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Label</label>
                <input value={newCat.label} onChange={e => setNewCat(c => ({ ...c, label: e.target.value }))}
                  placeholder="e.g. Board Games"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
              <div className="flex-1 min-w-[12rem]">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Icon</label>
                <select value={newCat.icon} onChange={e => setNewCat(c => ({ ...c, icon: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-pink-200">
                  <option value="">Default (plain tag)</option>
                  {icons.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Only names the app can draw. This panel uses a different icon set, so it
                  cannot preview the glyph — the list is the guarantee instead.
                </p>
              </div>
              <button onClick={saveCategory} disabled={!newCat.label.trim()}
                className="gradient-brand text-white font-bold px-6 py-2.5 rounded-xl shadow-brand hover:opacity-90 disabled:opacity-40">
                Save
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No categories yet.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Key</th>
                  <th className="text-left px-4 py-3">Icon</th><th className="text-left px-4 py-3">Companions</th>
                  <th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{rows.map((c, i) => (
                  <tr key={c.id} className="border-t border-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.label}</td>
                    <td className="px-4 py-3"><code className="text-xs text-gray-500">{c.key}</code></td>
                    <td className="px-4 py-3"><code className="text-xs text-gray-500">{c.icon ?? '—'}</code></td>
                    <td className="px-4 py-3 text-gray-600">{c.companions}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {/* Order here is the order users see in the app. */}
                      <button disabled={busy === c.id || i === 0} title="Move up"
                        onClick={() => act(c.id, () => companionAdminApi.moveCategory(token, c.id, 'up'), 'Moved up')}
                        className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold disabled:opacity-30">↑</button>
                      <button disabled={busy === c.id || i === rows.length - 1} title="Move down"
                        onClick={() => act(c.id, () => companionAdminApi.moveCategory(token, c.id, 'down'), 'Moved down')}
                        className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold disabled:opacity-30">↓</button>
                      <button onClick={() => { setNewCat({ label: c.label, icon: c.icon ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">Rename</button>
                      <button disabled={busy === c.id}
                        onClick={() => act(c.id, () => companionAdminApi.toggleCategory(token, c.id), c.is_active ? 'Hidden from the app' : 'Live in the app')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${c.is_active ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {c.is_active ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
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
                  <th className="text-left px-4 py-3">Rate</th><th className="text-left px-4 py-3">Rating</th>
                  <th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{rows.map(c => (
                  <tr key={c.id} className="border-t border-gray-50">
                    <td className="px-4 py-3"><p className="font-semibold text-gray-800">{c.name}</p><p className="text-xs text-gray-400">{c.email ?? c.phone}</p></td>
                    <td className="px-4 py-3 text-gray-600">{c.city ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">₹{Math.round(c.price_per_hour ?? 0)}/hr</td>
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
                  <th className="text-left px-4 py-3">Slot</th><th className="text-left px-4 py-3">Client paid</th><th className="text-left px-4 py-3">Creator</th><th className="text-left px-4 py-3">Payment</th><th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">How it ended</th>
                </tr></thead>
                <tbody>{rows.map(b => (
                  <tr key={b.id} className="border-t border-gray-50">
                    <td className="px-4 py-3 text-gray-500">{b.id}</td><td className="px-4 py-3 text-gray-700">{b.client}</td>
                    <td className="px-4 py-3 text-gray-700">{b.companion}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p className="capitalize">{b.session_type} · {b.hours}h</p>
                      <p className="text-xs text-gray-400">{b.starts_at ? new Date(b.starts_at).toLocaleString() : '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      ₹{Number(b.total_amount ?? 0).toFixed(0)}
                      <span className="block text-[10px] font-normal text-gray-400">
                        ₹{Number(b.amount ?? 0).toFixed(0)} + ₹{Number(b.gst_amount ?? 0).toFixed(0)} GST
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      ₹{Number(b.creator_amount ?? 0).toFixed(0)}
                      <span className="block text-[10px] text-gray-400">fee ₹{Number(b.commission_amount ?? 0).toFixed(0)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge s={b.payment_status ?? 'pending'} />
                      {b.refunded ? <span className="block text-[10px] text-green-600 mt-0.5">refunded</span> : null}
                    </td>
                    <td className="px-4 py-3"><Badge s={b.status} /></td>
                    <td className="px-4 py-3"><EndedCell b={b} /></td>
                  </tr>
                ))}</tbody>
              </>
            )}
            {tab === 'withdrawals' && (
              <>
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                  <th className="text-left px-4 py-3">Creator</th><th className="text-left px-4 py-3">Amount</th>
                  {/* This heading was missing, so every column below it read
                      under the wrong title — amounts appeared under "Status". */}
                  <th className="text-left px-4 py-3">Payout to</th>
                  <th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>{rows.map(w => (
                  <tr key={w.id} className="border-t border-gray-50">
                    <td className="px-4 py-3"><p className="font-semibold text-gray-800">{w.user}</p><p className="text-xs text-gray-400">{w.email}</p></td>
                    <td className="px-4 py-3 font-semibold">₹{Number(w.amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><PayoutCell payout={w.payout} note={w.note} /></td>
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
