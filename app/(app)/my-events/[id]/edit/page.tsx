'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { userEventsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/**
 * Fixing an event you are hosting.
 *
 * Only the wording. Once an event is published the server locks its terms —
 * when, where, what it costs, how many seats, who it is open to — because
 * those are what people agreed to when they joined. They are shown here,
 * greyed, with the reason: a host who cannot find the date field assumes the
 * page is broken rather than that the rule is deliberate.
 */

const FIELDS = [
  { key: 'title',         label: 'Event name',    rows: 1 },
  { key: 'description',   label: 'About it',      rows: 4 },
  { key: 'dress_code',    label: 'Dress code',    rows: 1 },
  { key: 'what_to_bring', label: 'What to bring', rows: 2 },
] as const

export default function EditEventPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [event, setEvent] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await userEventsApi.get(token, id)
      const e = res.data
      setEvent(e)
      setForm({
        title: e?.title ?? '',
        description: e?.description ?? '',
        dress_code: e?.dress_code ?? '',
        what_to_bring: e?.what_to_bring ?? '',
      })
    } catch {
      toast.error('Could not load this event')
      router.push('/my-events')
    } finally {
      setLoading(false)
    }
  }, [token, id, router])

  useEffect(() => { load() }, [load])

  async function save(e: { preventDefault(): void }) {
    e.preventDefault()
    if (saving) return
    if (!form.title?.trim()) { toast.error('Give the event a name.'); return }

    // Only what changed. Posting the whole form would send locked fields back
    // unchanged, which the server reads as an attempt to change them.
    const changed: Record<string, string> = {}
    for (const { key } of FIELDS) {
      const now = (form[key] ?? '').trim()
      if (now !== ((event?.[key] ?? '') || '')) changed[key] = now
    }

    if (!Object.keys(changed).length) { router.push('/my-events'); return }

    setSaving(true)
    try {
      await userEventsApi.update(token, id, changed)
      toast.success('Event updated')
      router.push('/my-events')
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="max-w-2xl mx-auto px-4 py-10 text-sm text-gray-500">Loading…</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit event</h1>

      <form onSubmit={save} className="mt-6 space-y-5">
        {FIELDS.map(({ key, label, rows }) => (
          <label key={key} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
            {rows > 1 ? (
              <textarea
                rows={rows}
                value={form[key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            ) : (
              <input
                value={form[key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            )}
          </label>
        ))}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Fixed now that it is live</p>
          <p className="mt-2 text-sm text-amber-900">
            {event?.starts_at ? new Date(event.starts_at).toLocaleString() : '—'}
            {' · '}{event?.location_name || event?.city}
            {' · '}{event?.is_free ? 'Free' : `₹${event?.price}`}
            {' · '}{event?.max_participants} seats
          </p>
          <p className="mt-2 text-xs text-amber-700">
            These are what people agreed to when they joined. To move the date use Postpone,
            and to call it off use Cancel &mdash; both tell everyone who is coming.
          </p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
