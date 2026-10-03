'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { promosApi, type PromoCard } from '@/lib/api'

/**
 * Admin > Promo cards.
 *
 * An offer, an ad or an announcement, with a picture, pointed at one surface
 * of the app and switched on between two dates. Nothing here is shown until
 * it is both active and inside its schedule, so a card can be written and
 * dated well before anyone sees it.
 */

type Draft = {
  placement: string
  title: string
  body: string
  cta_label: string
  cta_type: string
  cta_value: string
  audience: string
  starts_at: string
  ends_at: string
  is_active: boolean
  sort_order: string
}

const emptyDraft: Draft = {
  placement: 'plan_popup',
  title: '',
  body: '',
  cta_label: '',
  cta_type: 'none',
  cta_value: '',
  audience: 'all',
  starts_at: '',
  ends_at: '',
  is_active: false,
  sort_order: '0',
}

const STATUS_STYLE: Record<PromoCard['status'], string> = {
  live: 'bg-green-100 text-green-700',
  scheduled: 'bg-amber-100 text-amber-700',
  expired: 'bg-gray-100 text-gray-500',
  off: 'bg-gray-100 text-gray-500',
}

/** <input type="datetime-local"> wants `YYYY-MM-DDTHH:mm`, the API sends ISO. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PromosPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<PromoCard[]>([])
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [actions, setActions] = useState<Record<string, string>>({})
  const [audiences, setAudiences] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await promosApi.list(token)
      setRows(res.promos ?? [])
      // The dropdowns come from the server so they cannot drift from what it
      // actually accepts.
      setPlacements(res.placements ?? {})
      setActions(res.actions ?? {})
      setAudiences(res.audiences ?? {})
    } catch {
      toast.error('Could not load promo cards')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { if (token) load() }, [token, load])

  const payload = (d: Draft) => ({
    ...d,
    sort_order: Number(d.sort_order) || 0,
    // Empty means "no bound", not "the epoch".
    starts_at: d.starts_at || null,
    ends_at: d.ends_at || null,
    body: d.body || null,
    cta_label: d.cta_label || null,
    cta_value: d.cta_value || null,
  })

  async function create(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!draft.title.trim()) return

    setCreating(true)
    try {
      await promosApi.create(token, payload(draft))
      setDraft(emptyDraft)
      await load()
      toast.success('Card created — add a picture, then switch it on')
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create the card')
    } finally {
      setCreating(false)
    }
  }

  async function patch(row: PromoCard, changes: Record<string, unknown>) {
    try {
      await promosApi.update(token, row.id, changes)
      await load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save')
    }
  }

  async function remove(row: PromoCard) {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return
    try {
      await promosApi.remove(token, row.id)
      await load()
      toast.success('Deleted')
    } catch {
      toast.error('Could not delete')
    }
  }

  async function upload(row: PromoCard, file?: File | null) {
    if (!file) return
    try {
      await promosApi.uploadImage(token, row.id, file)
      await load()
      toast.success('Picture updated')
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not upload the picture')
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading…</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Promo Cards</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Offers, ads and announcements shown inside the app. A card appears only while it is
          switched on <em>and</em> inside its dates — so you can write next week&apos;s offer today.
        </p>
      </div>

      {/* ── New card ─────────────────────────────────────── */}
      <form onSubmit={create} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-900">New card</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Where it shows">
            <Select value={draft.placement} onChange={v => setDraft({ ...draft, placement: v })} options={placements} />
          </Field>
          <Field label="Who sees it">
            <Select value={draft.audience} onChange={v => setDraft({ ...draft, audience: v })} options={audiences} />
          </Field>
          <Field label="Starts (optional)">
            <Input type="datetime-local" value={draft.starts_at} onChange={v => setDraft({ ...draft, starts_at: v })} />
          </Field>
          <Field label="Ends (optional)">
            <Input type="datetime-local" value={draft.ends_at} onChange={v => setDraft({ ...draft, ends_at: v })} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Headline">
            <Input value={draft.title} onChange={v => setDraft({ ...draft, title: v })} placeholder="Festive offer — 50% off" />
          </Field>
          <Field label="One line below it">
            <Input value={draft.body} onChange={v => setDraft({ ...draft, body: v })} placeholder="Ends Sunday midnight." />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Button does">
            <Select value={draft.cta_type} onChange={v => setDraft({ ...draft, cta_type: v })} options={actions} />
          </Field>
          <Field label="Button text">
            <Input value={draft.cta_label} onChange={v => setDraft({ ...draft, cta_label: v })} placeholder="Grab it" />
          </Field>
          <Field label={draft.cta_type === 'url' ? 'Link' : draft.cta_type === 'event' ? 'Event id' : 'Not needed'}>
            <Input
              value={draft.cta_value}
              onChange={v => setDraft({ ...draft, cta_value: v })}
              disabled={draft.cta_type !== 'url' && draft.cta_type !== 'event'}
              placeholder={draft.cta_type === 'url' ? 'https://…' : ''}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-500">
            The picture is added after the card exists — create it first, then upload below.
          </p>
          <button
            type="submit"
            disabled={creating || !draft.title.trim()}
            className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create card'}
          </button>
        </div>
      </form>

      {/* ── Existing cards ───────────────────────────────── */}
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No cards yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start gap-4">
                <label className="shrink-0 cursor-pointer">
                  {row.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.image_url} alt="" className="h-20 w-32 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-20 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
                      Add picture
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => upload(row, e.target.files?.[0])}
                  />
                </label>

                <div className="min-w-[14rem] flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLE[row.status]}`}>
                      {row.status}
                    </span>
                    <span className="text-xs text-gray-500">{placements[row.placement] ?? row.placement}</span>
                    <span className="text-xs text-gray-400">· {audiences[row.audience] ?? row.audience}</span>
                  </div>

                  <p className="mt-1 font-semibold text-gray-900">{row.title}</p>
                  {row.body && <p className="text-sm text-gray-500">{row.body}</p>}

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Field label="Starts">
                      <Input
                        type="datetime-local"
                        value={toLocalInput(row.starts_at)}
                        onChange={v => patch(row, { starts_at: v || null })}
                      />
                    </Field>
                    <Field label="Ends">
                      <Input
                        type="datetime-local"
                        value={toLocalInput(row.ends_at)}
                        onChange={v => patch(row, { ends_at: v || null })}
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={e => patch(row, { is_active: e.target.checked })}
                      className="h-4 w-4 accent-pink-500"
                    />
                    <span className="font-semibold text-gray-700">Active</span>
                  </label>

                  {row.image_url && (
                    <button
                      onClick={() => promosApi.removeImage(token, row.id).then(load)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Remove picture
                    </button>
                  )}

                  <button onClick={() => remove(row)} className="text-xs font-semibold text-red-500 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Small shared bits ───────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Input({
  value, onChange, type = 'text', placeholder, disabled,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}

function Select({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: Record<string, string>
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
    >
      {Object.entries(options).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  )
}
