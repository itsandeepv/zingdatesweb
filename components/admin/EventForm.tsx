'use client'

import { useState, useEffect } from 'react'
import { eventsApi } from '@/lib/api'

export type EventFormValues = {
  title: string
  description: string
  category: string
  starts_at: string
  ends_at: string
  city: string
  public_location_name: string
  max_participants: number
  age_min: string
  age_max: string
  join_mode: 'everyone' | 'verified_only'
  gender_preference: 'everyone' | 'male' | 'female'
  location_visibility: 'public' | 'participants_only'
}

/** The platform ceiling. Mirrors Event::MAX_PARTICIPANTS on the API. */
export const MAX_PARTICIPANTS = 50

export const EMPTY_EVENT: EventFormValues = {
  title: '', description: '', category: '',
  starts_at: '', ends_at: '',
  city: '', public_location_name: '',
  max_participants: 20,
  age_min: '', age_max: '',
  join_mode: 'everyone',
  gender_preference: 'everyone',
  location_visibility: 'public',
}

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in LOCAL time; the API sends ISO. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Back to a real instant before sending. The input has no timezone, so it is
 * read as the admin's local time and converted — the same contract the app's
 * create flow uses, which is what keeps 8 PM meaning 8 PM.
 */
export function toIso(local: string): string {
  return local ? new Date(local).toISOString() : ''
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-pink-600"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const input = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200'

export default function EventForm({
  value, onChange, token, disabledFields = [],
}: {
  value: EventFormValues
  onChange: (v: EventFormValues) => void
  token: string
  disabledFields?: (keyof EventFormValues)[]
}) {
  const [cats, setCats] = useState<{ key: string; label: string; is_active: boolean }[]>([])

  useEffect(() => {
    eventsApi.categories(token)
      .then(r => setCats(r.data ?? []))
      .catch(() => setCats([]))
  }, [token])

  const set = (patch: Partial<EventFormValues>) => onChange({ ...value, ...patch })
  const off = (f: keyof EventFormValues) => disabledFields.includes(f)

  return (
    <div className="space-y-5">
      <Field label="Title" required>
        <input className={input} value={value.title} maxLength={150}
          onChange={e => set({ title: e.target.value })} placeholder="Saturday Night Out" />
      </Field>

      <Field label="Description" required>
        <textarea className={`${input} min-h-[110px]`} value={value.description} maxLength={5000}
          onChange={e => set({ description: e.target.value })}
          placeholder="What is it, who is it for, what should people expect?" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category">
          <select className={input} value={value.category} onChange={e => set({ category: e.target.value })}>
            <option value="">No category</option>
            {cats.map(c => (
              <option key={c.key} value={c.key}>{c.label}{c.is_active ? '' : ' (off)'}</option>
            ))}
          </select>
        </Field>

        <Field label="Capacity" required hint={`Maximum ${MAX_PARTICIPANTS} per event.`}>
          <input
            type="number" min={2} max={MAX_PARTICIPANTS}
            className={input}
            value={value.max_participants}
            onChange={e => set({ max_participants: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Starts" required>
          <input type="datetime-local" className={input} value={value.starts_at}
            disabled={off('starts_at')}
            onChange={e => set({ starts_at: e.target.value })} />
        </Field>
        <Field label="Ends" required>
          <input type="datetime-local" className={input} value={value.ends_at}
            disabled={off('ends_at')}
            onChange={e => set({ ends_at: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Meeting point" required>
          <input className={input} value={value.public_location_name} maxLength={200}
            onChange={e => set({ public_location_name: e.target.value })} placeholder="Cyber Hub, Gurugram" />
        </Field>
        <Field label="City">
          <input className={input} value={value.city} maxLength={100}
            onChange={e => set({ city: e.target.value })} placeholder="Gurugram" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Who can join">
          <select className={input} value={value.join_mode}
            onChange={e => set({ join_mode: e.target.value as EventFormValues['join_mode'] })}>
            <option value="everyone">Everyone</option>
            <option value="verified_only">Verified users only</option>
          </select>
        </Field>
        <Field label="Gender">
          <select className={input} value={value.gender_preference}
            onChange={e => set({ gender_preference: e.target.value as EventFormValues['gender_preference'] })}>
            <option value="everyone">Everyone</option>
            <option value="male">Men only</option>
            <option value="female">Women only</option>
          </select>
        </Field>
        <Field label="Meeting point visibility">
          <select className={input} value={value.location_visibility}
            onChange={e => set({ location_visibility: e.target.value as EventFormValues['location_visibility'] })}>
            <option value="public">Public</option>
            <option value="participants_only">Participants only</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Minimum age" hint="Leave blank for 18+">
          <input type="number" min={18} max={99} className={input} value={value.age_min}
            onChange={e => set({ age_min: e.target.value })} />
        </Field>
        <Field label="Maximum age" hint="Leave blank for no upper limit">
          <input type="number" min={18} max={120} className={input} value={value.age_max}
            onChange={e => set({ age_max: e.target.value })} />
        </Field>
      </div>
    </div>
  )
}

/** Form values → the API's payload. Blank optional fields are omitted. */
export function toPayload(v: EventFormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: v.title.trim(),
    description: v.description.trim(),
    starts_at: toIso(v.starts_at),
    ends_at: toIso(v.ends_at),
    public_location_name: v.public_location_name.trim(),
    max_participants: v.max_participants,
    join_mode: v.join_mode,
    gender_preference: v.gender_preference,
    location_visibility: v.location_visibility,
  }
  if (v.category) body.category = v.category
  if (v.city.trim()) body.city = v.city.trim()
  if (v.age_min) body.age_min = Number(v.age_min)
  if (v.age_max) body.age_max = Number(v.age_max)
  return body
}
