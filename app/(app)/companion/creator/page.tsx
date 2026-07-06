'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { companionApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const WITHDRAW_STATUS: Record<string, string> = {
  pending: 'text-amber-600', approved: 'text-blue-600', paid: 'text-emerald-600', rejected: 'text-red-500',
}

function WithdrawModal({ available, onClose, onDone }: { available: number; onClose: () => void; onDone: () => void }) {
  const token = useAuthStore(s => s.token) ?? ''
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit() {
    setSaving(true)
    try { await companionApi.requestWithdraw(token, parseFloat(amount) || 0, note); toast.success('Withdrawal requested'); onDone() }
    catch (e: any) { toast.error(e?.message ?? 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">Request Withdrawal</h3>
        <p className="text-sm text-gray-500">Available: <span className="font-bold text-purple-700">{available} coins</span></p>
        <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Amount in coins" inputMode="decimal"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Payout note (optional)"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
        <button onClick={submit} disabled={saving} className="w-full py-3 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
          {saving ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  )
}

export default function CreatorDashboardPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [withdraws, setWithdraws] = useState<any[]>([])
  const [showWithdraw, setShowWithdraw] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, w, wh] = await Promise.all([companionApi.creatorStats(token), companionApi.creatorWallet(token), companionApi.withdrawHistory(token)])
      setStats(s.stats); setWallet(w.wallet); setReviews(w.reviews ?? []); setWithdraws(wh.withdraws ?? [])
    } catch (e: any) { toast.error(e?.message ?? 'Enable Companion mode first') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" /></div>

  const available = wallet?.available_balance ?? 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
        <Link href="/companion/become" className="text-sm text-gray-500 hover:text-gray-800">Settings</Link>
      </div>

      <div className="gradient-brand rounded-3xl p-6 text-white shadow-brand-lg">
        <p className="text-white/80 text-sm">Withdrawable balance</p>
        <p className="text-4xl font-extrabold mt-1">{available} <span className="text-lg font-bold text-white/80">coins</span></p>
        <div className="grid grid-cols-3 gap-2 mt-5 mb-5">
          <div><p className="text-white/70 text-xs">Today</p><p className="font-bold text-lg">{stats?.today_earnings ?? 0}</p></div>
          <div><p className="text-white/70 text-xs">Total earned</p><p className="font-bold text-lg">{stats?.total_earnings ?? 0}</p></div>
          <div><p className="text-white/70 text-xs">Withdrawn</p><p className="font-bold text-lg">{stats?.total_withdrawn ?? 0}</p></div>
        </div>
        <button onClick={() => setShowWithdraw(true)} className="w-full py-3 rounded-2xl bg-white text-purple-700 font-bold hover:opacity-90">Request Withdrawal</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Requests', value: stats?.pending_requests ?? 0 },
          { label: 'Upcoming', value: stats?.upcoming ?? 0 },
          { label: 'Completed', value: stats?.completed ?? 0 },
          { label: 'Rating', value: Number(stats?.rating_avg ?? 0).toFixed(1) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <Link href="/companion/my-bookings" className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:bg-gray-50">
        <span className="font-bold text-purple-700">Manage bookings & requests</span>
        <span className="text-gray-400">→</span>
      </Link>

      {withdraws.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Withdrawals</h2>
          <div className="space-y-2">
            {withdraws.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-bold text-gray-800">{Math.round(w.amount)} coins</p>
                  <p className="text-xs text-gray-400">{new Date(w.created_at).toDateString()}</p>
                </div>
                <span className={`text-xs font-bold capitalize ${WITHDRAW_STATUS[w.status] ?? 'text-gray-500'}`}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3">Recent reviews</h2>
        {reviews.length === 0 ? <p className="text-sm text-gray-400">No reviews yet.</p> : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{r.user?.name ?? 'User'}</span>
                  <span className="text-amber-500 text-xs font-bold">★ {r.rating}</span>
                </div>
                {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showWithdraw && <WithdrawModal available={available} onClose={() => setShowWithdraw(false)} onDone={() => { setShowWithdraw(false); load() }} />}
    </div>
  )
}
