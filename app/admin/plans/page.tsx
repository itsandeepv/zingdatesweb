'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { subscriptionsApi, freeTierApi } from '@/lib/api'

type Plan = {
  id: number
  key: string
  name: string
  // Used wherever every plan has to fit on one line (the app's upgrade card).
  // Null falls back to `name`.
  short_label: string | null
  price: number | string
  duration_days: number
  features: string[]
  tag: string | null
  icon: string
  gradient_from: string
  gradient_to: string
  accent_color: string
  is_one_time: boolean
  sort_order: number
  is_active: boolean
}

const emptyDraft = {
  key: '', name: '', short_label: '', price: '', duration_days: '30', features: [] as string[],
  tag: '', icon: 'star', gradient_from: '#667eea', gradient_to: '#764ba2',
  accent_color: '#667eea', is_one_time: false, sort_order: '0', is_active: true,
}

function FeatureGrid({ featureLabels, selected, onToggle }: {
  featureLabels: Record<string, string>; selected: string[]; onToggle: (k: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(featureLabels).map(([key, label]) => {
        const on = selected.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              on ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-pink-300'
            }`}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function FreeTierSettingsCard({ token }: { token: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ welcome_coins: 0, message_cost: 0, profile_view_daily_limit: 0 })

  useEffect(() => {
    freeTierApi.get(token)
      .then(res => setForm(res.data ?? form))
      .catch(e => toast.error(e.message || 'Could not load free-tier settings'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function save() {
    setSaving(true)
    try {
      const res = await freeTierApi.update(token, form)
      setForm(res.data ?? form)
      toast.success(res.message ?? 'Saved')
    } catch (e: any) {
      toast.error(e.message || 'Could not save')
    } finally { setSaving(false) }
  }

  const freeMessages = form.message_cost > 0 ? Math.floor(form.welcome_coins / form.message_cost) : 0

  if (loading) {
    return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 flex justify-center">
      <div className="w-6 h-6 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Free Tier</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          What a signed-up user gets before buying any plan. Changes apply immediately — no deploy needed.
        </p>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Welcome Coins</span>
          <input
            type="number" min={0} value={form.welcome_coins}
            onChange={e => setForm(f => ({ ...f, welcome_coins: Number(e.target.value) }))}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <span className="text-xs text-gray-400">Given once, on signup</span>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coins per Message</span>
          <input
            type="number" min={1} value={form.message_cost}
            onChange={e => setForm(f => ({ ...f, message_cost: Number(e.target.value) }))}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <span className="text-xs text-gray-400">= <strong className="text-gray-600">{freeMessages}</strong> free message{freeMessages === 1 ? '' : 's'} before the paywall</span>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Free Profile Views / Day</span>
          <input
            type="number" min={0} value={form.profile_view_daily_limit}
            onChange={e => setForm(f => ({ ...f, profile_view_daily_limit: Number(e.target.value) }))}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <span className="text-xs text-gray-400">0 = unlimited. Any plan removes this cap entirely.</span>
        </label>
      </div>
      <div className="px-6 pb-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [featureLabels, setFeatureLabels] = useState<Record<string, string>>({})
  const [newPlan, setNewPlan] = useState(emptyDraft)
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res: any = await subscriptionsApi.listPlans(token)
        setPlans(res.plans ?? [])
        setFeatureLabels(res.feature_labels ?? {})
      } catch (err: any) {
        toast.error(err.message || 'Failed to load plans')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function patchRow(id: number, patch: Partial<Plan>) {
    setPlans(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function toggleFeature(row: Plan, key: string) {
    const has = row.features.includes(key)
    patchRow(row.id, { features: has ? row.features.filter(f => f !== key) : [...row.features, key] })
  }

  function toggleNewFeature(key: string) {
    setNewPlan(d => ({
      ...d,
      features: d.features.includes(key) ? d.features.filter(f => f !== key) : [...d.features, key],
    }))
  }

  async function savePlan(row: Plan) {
    setSavingId(row.id)
    try {
      await subscriptionsApi.updatePlan(token, row.id, {
        key: row.key, name: row.name, short_label: row.short_label || null,
        price: Number(row.price), duration_days: Number(row.duration_days),
        features: row.features, tag: row.tag, icon: row.icon,
        gradient_from: row.gradient_from, gradient_to: row.gradient_to, accent_color: row.accent_color,
        is_one_time: row.is_one_time, sort_order: Number(row.sort_order), is_active: row.is_active,
      })
      toast.success('Saved — every user on this plan sees the change immediately')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSavingId(null)
    }
  }

  async function deletePlan(id: number) {
    if (!window.confirm('Delete this plan? Users currently on it must be moved off first — deletion is refused otherwise.')) return
    setDeletingId(id)
    try {
      await subscriptionsApi.deletePlan(token, id)
      setPlans(rows => rows.filter(r => r.id !== id))
      toast.success('Plan deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete — someone may still be on this plan')
    } finally {
      setDeletingId(null)
    }
  }

  async function createPlan() {
    if (!newPlan.key.trim() || !newPlan.name.trim() || !newPlan.price) {
      toast.error('Key, name and price are required')
      return
    }
    setCreating(true)
    try {
      const res: any = await subscriptionsApi.createPlan(token, {
        ...newPlan,
        // Blank means "no short name" — the app falls back to the full one.
        short_label: newPlan.short_label.trim() || null,
        price: Number(newPlan.price),
        duration_days: Number(newPlan.duration_days),
        sort_order: Number(newPlan.sort_order),
      })
      setPlans(rows => [...rows, res.plan].sort((a, b) => a.sort_order - b.sort_order))
      setNewPlan(emptyDraft)
      toast.success('Plan created')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create plan')
    } finally {
      setCreating(false)
    }
  }

  const fieldClass = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Price, duration, and which features each plan grants for free. A user with no plan that includes a
          feature spends free coins instead, or sees a popup naming which plan unlocks it — changes here take
          effect immediately, for every current subscriber and every future signup.
        </p>
      </div>

      <FreeTierSettingsCard token={token} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Plan Catalog</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ordered by sort order (lower = cheaper tier, used for upgrade/downgrade rules).</p>
        </div>

        <div className="divide-y divide-gray-50">
          {plans.map(row => (
            <div key={row.id} className={`px-6 py-5 space-y-3 ${!row.is_active ? 'bg-gray-50/60' : ''}`}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key</span>
                  <input value={row.key} onChange={e => patchRow(row.id, { key: e.target.value })} className={fieldClass + ' font-mono'} />
                </label>
                <label className="block sm:col-span-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</span>
                  <input value={row.name} onChange={e => patchRow(row.id, { name: e.target.value })} className={fieldClass} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Short name</span>
                  <input value={row.short_label ?? ''} maxLength={20}
                    onChange={e => patchRow(row.id, { short_label: e.target.value })}
                    placeholder={row.name} className={fieldClass} />
                  <span className="text-[11px] text-gray-400">Shown where all plans share one line. Blank = full name.</span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price (₹)</span>
                  <input type="number" value={row.price} onChange={e => patchRow(row.id, { price: e.target.value as any })} className={fieldClass} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration (days)</span>
                  <input type="number" value={row.duration_days} onChange={e => patchRow(row.id, { duration_days: Number(e.target.value) })} className={fieldClass} />
                </label>
                <label className="block sm:col-span-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag (badge text)</span>
                  <input value={row.tag ?? ''} onChange={e => patchRow(row.id, { tag: e.target.value })} placeholder="Most Popular" className={fieldClass} />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Icon</span>
                  <input value={row.icon} onChange={e => patchRow(row.id, { icon: e.target.value })} placeholder="Ionicons name" className={fieldClass + ' font-mono'} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gradient from</span>
                  <input type="color" value={row.gradient_from} onChange={e => patchRow(row.id, { gradient_from: e.target.value })} className={fieldClass + ' h-9 p-1'} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gradient to</span>
                  <input type="color" value={row.gradient_to} onChange={e => patchRow(row.id, { gradient_to: e.target.value })} className={fieldClass + ' h-9 p-1'} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accent</span>
                  <input type="color" value={row.accent_color} onChange={e => patchRow(row.id, { accent_color: e.target.value })} className={fieldClass + ' h-9 p-1'} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sort order</span>
                  <input type="number" value={row.sort_order} onChange={e => patchRow(row.id, { sort_order: Number(e.target.value) })} className={fieldClass} />
                </label>
                <div className="sm:col-span-2 flex flex-col gap-2 sm:pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input type="checkbox" checked={row.is_one_time} onChange={e => patchRow(row.id, { is_one_time: e.target.checked })} />
                    One-time only
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input type="checkbox" checked={row.is_active} onChange={e => patchRow(row.id, { is_active: e.target.checked })} />
                    Active (shown to users)
                  </label>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Features this plan grants for free</span>
                <div className="mt-1.5"><FeatureGrid featureLabels={featureLabels} selected={row.features} onToggle={(k) => toggleFeature(row, k)} /></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => deletePlan(row.id)}
                  disabled={deletingId === row.id}
                  className="rounded-lg border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-semibold px-4 py-2 transition-colors">
                  {deletingId === row.id ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => savePlan(row)}
                  disabled={savingId === row.id}
                  className="rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors">
                  {savingId === row.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new plan */}
        <div className="px-6 py-5 bg-gray-50/60 rounded-b-2xl space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Add a new plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key</span>
              <input value={newPlan.key} onChange={e => setNewPlan(d => ({ ...d, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} placeholder="weekly" className={fieldClass + ' font-mono'} />
            </label>
            <label className="block sm:col-span-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</span>
              <input value={newPlan.name} onChange={e => setNewPlan(d => ({ ...d, name: e.target.value }))} placeholder="Weekly Pass" className={fieldClass} />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Short name</span>
              <input value={newPlan.short_label} maxLength={20}
                onChange={e => setNewPlan(d => ({ ...d, short_label: e.target.value }))}
                placeholder="Weekly" className={fieldClass} />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price (₹)</span>
              <input type="number" value={newPlan.price} onChange={e => setNewPlan(d => ({ ...d, price: e.target.value }))} className={fieldClass} />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration (days)</span>
              <input type="number" value={newPlan.duration_days} onChange={e => setNewPlan(d => ({ ...d, duration_days: e.target.value }))} className={fieldClass} />
            </label>
            <label className="block sm:col-span-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag</span>
              <input value={newPlan.tag} onChange={e => setNewPlan(d => ({ ...d, tag: e.target.value }))} placeholder="New" className={fieldClass} />
            </label>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Features this plan grants for free</span>
            <div className="mt-1.5"><FeatureGrid featureLabels={featureLabels} selected={newPlan.features} onToggle={toggleNewFeature} /></div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={createPlan}
              disabled={creating}
              className="rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              {creating ? 'Creating…' : '+ Add plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
