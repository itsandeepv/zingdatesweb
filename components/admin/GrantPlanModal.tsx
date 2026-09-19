'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { subscriptionsApi, usersApi } from '@/lib/api'

interface PlanOption {
  key: string
  name: string
  price: number
  duration_days: number
  tag?: string | null
  is_active?: boolean
}

export interface GrantPlanTarget {
  id: number
  name: string
  subscription_plan?: string | null
  plan_expires_at?: string | null
}

/**
 * Put a user on a plan from the admin panel, no payment involved.
 *
 * Same rule as a purchase: more days on the plan they are already on extend
 * it; a different plan starts a fresh term today. The API tells the user.
 */
export default function GrantPlanModal({ user, token, onClose, onSuccess }: {
  user: GrantPlanTarget; token: string; onClose: () => void; onSuccess: () => void
}) {
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [planKey, setPlanKey] = useState('')
  const [days, setDays] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const onPlan = user.subscription_plan && user.plan_expires_at && new Date(user.plan_expires_at) > new Date()

  useEffect(() => {
    let alive = true
    subscriptionsApi.listPlans(token)
      .then(res => {
        if (!alive) return
        const list: PlanOption[] = (res?.plans ?? res?.data ?? []).filter((p: PlanOption) => p.is_active !== false)
        setPlans(list)
        const first = list.find(p => p.key === user.subscription_plan) ?? list[0]
        if (first) { setPlanKey(first.key); setDays(String(first.duration_days)) }
      })
      .catch((err: Error) => toast.error(err.message || 'Could not load plans'))
      .finally(() => { if (alive) setLoadingPlans(false) })
    return () => { alive = false }
  }, [token, user.subscription_plan])

  function pick(p: PlanOption) {
    setPlanKey(p.key)
    setDays(String(p.duration_days))
  }

  const selected = plans.find(p => p.key === planKey)
  const extending = !!selected && onPlan && selected.key === user.subscription_plan

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    const n = Number(days)
    if (!planKey) { toast.error('Pick a plan.'); return }
    if (!Number.isInteger(n) || n < 1 || n > 3650) { toast.error('Days must be a whole number between 1 and 3650.'); return }
    setSaving(true)
    try {
      const res = await usersApi.grantPlan(token, user.id, { plan: planKey, days: n, note: note.trim() || undefined })
      toast.success(res?.message ?? `${selected?.name ?? 'Plan'} granted to ${user.name}. They have been notified.`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not grant the plan.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Take ${user.name} off their plan? They go back to the free plan immediately.`)) return
    setRemoving(true)
    try {
      await usersApi.revokePlan(token, user.id)
      toast.success(`${user.name} is on the free plan now. They have been notified.`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not remove the plan.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Give a plan</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {user.name}
              {onPlan
                ? ` · currently on ${user.subscription_plan} until ${new Date(user.plan_expires_at!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : ' · on the free plan'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <form id="grant-plan-form" onSubmit={submit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Plan</p>
            {loadingPlans ? (
              <div className="h-20 rounded-xl animate-shimmer" />
            ) : plans.length === 0 ? (
              <p className="text-sm text-gray-400">No active plans. Create one under Subscriptions first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {plans.map(p => (
                  <button key={p.key} type="button" onClick={() => pick(p)}
                    className={`text-left rounded-xl border-2 p-3 transition-colors ${
                      planKey === p.key ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
                    }`}>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">₹{Number(p.price).toLocaleString('en-IN')} · {p.duration_days} days</p>
                    {p.tag && <p className="text-[10px] text-pink-600 font-semibold mt-1 uppercase">{p.tag}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Days</label>
              <input type="number" min={1} max={3650} value={days} onChange={e => setDays(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <p className="text-[11px] text-gray-400 mt-1">
                {extending ? 'Added on top of their current expiry.' : 'Starts today, replaces any current plan.'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" maxLength={200} value={note} onChange={e => setNote(e.target.value)} placeholder="Why? e.g. refund made right"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <p className="text-[11px] text-gray-400 mt-1">Saved in the ledger, not shown to the user.</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
            Recorded as a ₹0 admin grant, so it never counts as revenue. The user gets a push and an in-app notice.
          </p>
        </form>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
          {onPlan ? (
            <button type="button" onClick={remove} disabled={removing || saving}
              className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
              {removing ? 'Removing…' : 'Remove current plan'}
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" form="grant-plan-form" disabled={saving || removing || !planKey}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
              {saving ? 'Granting…' : extending ? 'Extend plan' : 'Grant plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
