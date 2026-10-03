'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { userEventsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/**
 * Hosting an event, from the website.
 *
 * One form rather than the app's four-step wizard: a browser has the room,
 * and steps exist on a phone because a phone does not.
 *
 * The two-call shape is the server's, not a choice made here — create() makes
 * a draft, photos attach to a thing that already has an id, and submit() is
 * what puts it in front of people. A picture is required before submitting,
 * so all three happen in one go below.
 */

type Category = { key: string; label: string }

const emptyForm = {
  title: '',
  description: '',
  category: '',
  starts_at: '',
  ends_at: '',
  public_location_name: '',
  city: '',
  max_participants: '20',
  payment_mode: 'free',
  price: '',
  dress_code: '',
  what_to_bring: '',
}

export default function CreateEventPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const router = useRouter()

  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!token) return

    userEventsApi.categories(token)
      .then(res => setCategories(res.data ?? []))
      .catch(() => {})

    // Asked before the form is filled in rather than after: being told you
    // cannot host once you have typed everything is the worst moment for it.
    userEventsApi.canHost(token).catch((e: any) => {
      setBlocked(e?.message ?? 'You cannot host events right now.')
    })
  }, [token])

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (saving) return

    if (!form.title.trim())  { toast.error('Give your event a name.'); return }
    if (!form.category)      { toast.error('Pick a category.'); return }
    if (!form.starts_at || !form.ends_at) { toast.error('Add a start and end time.'); return }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      toast.error('It has to end after it starts.'); return
    }
    // The server refuses to publish an event with no picture, so it is caught
    // here instead of after everything else has already been created.
    if (photos.length === 0) { toast.error('Add at least one photo.'); return }

    setSaving(true)
    try {
      const created = await userEventsApi.create(token, {
        ...form,
        max_participants: Number(form.max_participants) || 20,
        price: form.payment_mode === 'free' ? 0 : Number(form.price) || 0,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      })

      const id = created?.data?.id
      if (!id) throw new Error('The event was not created.')

      await userEventsApi.uploadPhotos(token, id, photos)
      const sent = await userEventsApi.submit(token, id)

      toast.success(
        sent?.data?.status === 'published' ? 'Your event is live!' : 'Event submitted for review.',
      )
      // Straight to inviting — the moment right after creating is the only
      // one where asking people is the obvious next thing.
      router.push(`/my-events/${id}/invite`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create the event.')
    } finally {
      setSaving(false)
    }
  }

  if (blocked) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-gray-900">Create event</h1>
        <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          {blocked}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Create event</h1>
      <p className="mt-1 text-sm text-gray-500">
        Once it is live the date, place, price and seats are fixed &mdash; they are what people
        agree to when they join. Everything else you can edit later.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Event name">
          <Input value={form.title} onChange={v => set('title', v)} placeholder="Saturday Night Out" />
        </Field>

        <Field label="About it">
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder="What happens, who it is for…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            <option value="">Choose one…</option>
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <Input type="datetime-local" value={form.starts_at} onChange={v => set('starts_at', v)} />
          </Field>
          <Field label="Ends">
            <Input type="datetime-local" value={form.ends_at} onChange={v => set('ends_at', v)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue">
            <Input value={form.public_location_name} onChange={v => set('public_location_name', v)}
              placeholder="The Palms, Gurugram" />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={v => set('city', v)} placeholder="Gurugram" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Seats">
            <Input type="number" value={form.max_participants} onChange={v => set('max_participants', v)} />
          </Field>
          <Field label="Entry">
            <select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
              <option value="free">Free</option>
              <option value="cash">Paid &mdash; cash at the venue</option>
            </select>
          </Field>
          <Field label="Price (₹)">
            <Input type="number" value={form.price} onChange={v => set('price', v)}
              disabled={form.payment_mode === 'free'} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dress code">
            <Input value={form.dress_code} onChange={v => set('dress_code', v)} placeholder="Smart casual" />
          </Field>
          <Field label="What to bring">
            <Input value={form.what_to_bring} onChange={v => set('what_to_bring', v)} placeholder="Just yourself" />
          </Field>
        </div>

        <Field label="Photos">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))}
            className="w-full text-sm"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Up to 5. An event with no picture is the one nobody taps, so at least one is required.
          </p>
        </Field>

        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50">
          {saving ? 'Creating…' : 'Create event'}
        </button>
      </form>
    </div>
  )
}

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
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}
