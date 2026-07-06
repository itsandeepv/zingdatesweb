'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { companionApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'requests', label: 'Requests' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700' },
  accepted: { label: 'Accepted', cls: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'In progress', cls: 'bg-purple-50 text-purple-700' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
  rejected: { label: 'Declined', cls: 'bg-red-50 text-red-600' },
  expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-500' },
  no_show: { label: 'No show', cls: 'bg-red-50 text-red-600' },
}

function RateModal({ booking, onClose, onDone }: { booking: any; onClose: () => void; onDone: () => void }) {
  const token = useAuthStore(s => s.token) ?? ''
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit() {
    setSaving(true)
    try { await companionApi.rate(token, booking.id, rating, text); toast.success('Thanks for your feedback!'); onDone() }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 text-center">Rate your session</h3>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} className={`text-3xl ${rating >= s ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
          ))}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share a few words (optional)"
          className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
        <button onClick={submit} disabled={saving} className="w-full py-3 rounded-2xl gradient-brand text-white font-bold shadow-brand hover:opacity-90 disabled:opacity-50">
          {saving ? 'Submitting…' : 'Submit rating'}
        </button>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const router = useRouter()
  const [tab, setTab] = useState('upcoming')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [rateTarget, setRateTarget] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'upcoming') res = await companionApi.upcoming(token)
      else if (tab === 'requests') res = await companionApi.incoming(token)
      else res = await companionApi.history(token, tab)
      setItems(res.bookings ?? [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [tab, token])

  useEffect(() => { load() }, [load])

  async function act(id: number, fn: () => Promise<any>) {
    setBusy(id)
    try { await fn(); await load() }
    catch (e: any) { toast.error(e?.message ?? 'Action failed') }
    finally { setBusy(null) }
  }

  async function startSession(b: any) {
    setBusy(b.id)
    try {
      const res = await companionApi.start(token, b.id)
      if (res.session_type === 'chat') router.push('/chat')
      else { toast.message('Session started — open the chat to connect'); router.push('/chat') }
    } catch (e: any) { toast.error(e?.message ?? 'Could not start') }
    finally { setBusy(null) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link href="/companion" className="text-sm text-gray-500 hover:text-gray-800">← Companions</Link>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60"><div className="w-9 h-9 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><div className="text-5xl mb-3">📅</div>Nothing here yet</div>
      ) : (
        <div className="space-y-3">
          {items.map(b => {
            const other = b.companion || b.client || {}
            const meta = STATUS[b.status] ?? STATUS.pending
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {other.photo ? <img src={other.photo} className="w-12 h-12 rounded-full object-cover" alt="" /> :
                    <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white font-bold">{other.name?.[0]?.toUpperCase() ?? 'C'}</div>}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{other.name ?? 'Companion'}</p>
                    <p className="text-xs text-purple-600 font-medium capitalize">{b.session_type} · {b.duration_label || `${b.duration_min} min`}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
                    <p className="text-sm font-bold text-gray-800 mt-1">{Math.round(b.coins_total || 0)} coins</p>
                    {b.refunded ? <p className="text-[10px] text-emerald-600 font-semibold">refunded</p> : null}
                  </div>
                </div>

                {busy === b.id ? (
                  <div className="mt-3 flex justify-center"><div className="w-6 h-6 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" /></div>
                ) : tab === 'requests' ? (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => act(b.id, () => companionApi.reject(token, b.id))} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Decline</button>
                    <button onClick={() => act(b.id, () => companionApi.accept(token, b.id))} className="flex-1 py-2 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand hover:opacity-90">Accept</button>
                  </div>
                ) : tab === 'upcoming' ? (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => act(b.id, () => companionApi.cancel(token, b.id))} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    {(b.status === 'accepted' || b.status === 'in_progress') ? (
                      <button onClick={() => startSession(b)} className="flex-1 py-2 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand hover:opacity-90">Start session</button>
                    ) : (
                      <div className="flex-1 py-2 rounded-xl bg-purple-50 text-purple-400 text-sm font-semibold text-center">Waiting for accept…</div>
                    )}
                  </div>
                ) : tab === 'completed' && b.status === 'completed' && !b.rated ? (
                  <button onClick={() => setRateTarget(b)} className="mt-3 w-full py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100">★ Rate this session</button>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {rateTarget && <RateModal booking={rateTarget} onClose={() => setRateTarget(null)} onDone={() => { setRateTarget(null); load() }} />}
    </div>
  )
}
