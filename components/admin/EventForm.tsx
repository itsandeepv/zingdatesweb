'use client'

import { useState, useEffect } from 'react'
import { eventsApi, locationsApi } from '@/lib/api'

export type EventFormValues = {
  title: string
  description: string
  category: string
  starts_at: string
  ends_at: string
  city: string
  /** A venue from the master, or '' for a one-off meeting point. */
  event_location_id: string
  public_location_name: string
  max_participants: number
  age_min: string
  age_max: string
  join_mode: 'everyone' | 'verified_only'
  gender_preference: 'everyone' | 'male' | 'female'
  location_visibility: 'public' | 'participants_only'
  food: string
  drinks: string
  cost_sharing: string
  dress_code: string
  what_to_bring: string
  amenities: string[]
}

/** Mirrors App\Support\EventAmenities on the API. */
export const FOOD_OPTIONS = [
  { key: 'unspecified', label: 'Not mentioned' },
  { key: 'none',        label: 'No food' },
  { key: 'snacks',      label: 'Snacks' },
  { key: 'meal',        label: 'Full meal' },
]
export const DRINK_OPTIONS = [
  { key: 'unspecified', label: 'Not mentioned' },
  { key: 'none',        label: 'No drinks' },
  { key: 'soft',        label: 'Soft drinks' },
  { key: 'alcohol',     label: 'Alcohol served' },
]
export const COST_OPTIONS = [
  { key: 'unspecified', label: 'Not mentioned' },
  { key: 'host_pays',   label: 'Host covers it' },
  { key: 'split',       label: 'Split the bill' },
  { key: 'own',         label: 'Everyone pays their own' },
]
export const AMENITY_OPTIONS = [
  { key: 'parking',      label: 'Parking' },
  { key: 'washroom',     label: 'Washroom' },
  { key: 'wifi',         label: 'Wi-Fi' },
  { key: 'music',        label: 'Music / DJ' },
  { key: 'outdoor',      label: 'Outdoor seating' },
  { key: 'ac',           label: 'Air conditioned' },
  { key: 'wheelchair',   label: 'Wheelchair access' },
  { key: 'pet_friendly', label: 'Pet friendly' },
  { key: 'smoking_area', label: 'Smoking area' },
  { key: 'no_smoking',   label: 'No smoking' },
  { key: 'id_required',  label: 'ID check at entry' },
]

/** Mirrors EventAmenities::ALCOHOL_MIN_AGE. */
export const ALCOHOL_MIN_AGE = 21

/** The platform ceiling. Mirrors Event::MAX_PARTICIPANTS on the API. */
export const MAX_PARTICIPANTS = 50

export const EMPTY_EVENT: EventFormValues = {
  title: '', description: '', category: '',
  starts_at: '', ends_at: '',
  city: '', event_location_id: '', public_location_name: '',
  max_participants: 20,
  age_min: '', age_max: '',
  join_mode: 'everyone',
  gender_preference: 'everyone',
  location_visibility: 'public',
  food: 'unspecified',
  drinks: 'unspecified',
  cost_sharing: 'unspecified',
  dress_code: '',
  what_to_bring: '',
  amenities: [],
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
  const [venues, setVenues] = useState<{ id: number; name: string; city: string | null }[]>([])

  useEffect(() => {
    eventsApi.categories(token)
      .then(r => setCats(r.data ?? []))
      .catch(() => setCats([]))
  }, [token])

  // Only approved venues are offered. The server refuses anything else, so an
  // unapproved one in this list would only produce a confusing error later.
  useEffect(() => {
    locationsApi.list(token, { status: 'approved', per_page: '100' })
      .then(r => setVenues(r.data ?? []))
      .catch(() => setVenues([]))
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
        <Field label="Venue" hint="Approved venues only. Choose “Custom” for a one-off spot.">
          <select className={input} value={value.event_location_id}
            onChange={e => {
              const id = e.target.value
              const venue = venues.find(v => String(v.id) === id)
              // The server fills the name from the database either way; this
              // just keeps the form honest about what was chosen.
              set(venue
                ? { event_location_id: id, public_location_name: venue.name, city: venue.city ?? value.city }
                : { event_location_id: '' })
            }}>
            <option value="">Custom meeting point</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}{v.city ? ` — ${v.city}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Meeting point" required={!value.event_location_id}>
          <input className={input} value={value.public_location_name} maxLength={200}
            disabled={!!value.event_location_id}
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

      {/* ── What's included ─────────────────────────────────────
          The questions people ask before deciding to come. All
          optional: "not mentioned" is a different answer from "no". */}
      <div className="pt-5 border-t border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">What's included</h3>
        <p className="text-xs text-gray-500 mt-0.5">All optional.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Food">
          <select className={input} value={value.food} onChange={e => set({ food: e.target.value })}>
            {FOOD_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Drinks">
          <select className={input} value={value.drinks} onChange={e => set({ drinks: e.target.value })}>
            {DRINK_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Who pays">
          <select className={input} value={value.cost_sharing} onChange={e => set({ cost_sharing: e.target.value })}>
            {COST_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      {value.drinks === 'alcohol' && Number(value.age_min || 0) < ALCOHOL_MIN_AGE && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-800">
            An event serving alcohol must set a minimum age of {ALCOHOL_MIN_AGE} or above. The API refuses it otherwise.
          </p>
        </div>
      )}

      <Field label="Facilities">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(a => {
            const on = value.amenities.includes(a.key)
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => set({
                  amenities: on
                    ? value.amenities.filter(k => k !== a.key)
                    : [...value.amenities, a.key],
                })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  on ? 'bg-pink-50 border-pink-300 text-pink-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {a.label}
              </button>
            )
          })}
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Dress code">
          <input className={input} value={value.dress_code} maxLength={120}
            onChange={e => set({ dress_code: e.target.value })} placeholder="Smart casual" />
        </Field>
        <Field label="What to bring">
          <input className={input} value={value.what_to_bring} maxLength={300}
            onChange={e => set({ what_to_bring: e.target.value })} placeholder="Just yourself" />
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
    // With a venue, the id is authoritative and the server reads the name
    // from the database; the typed name only matters without one.
    ...(v.event_location_id
      ? { event_location_id: Number(v.event_location_id) }
      : { event_location_id: null, public_location_name: v.public_location_name.trim() }),
    max_participants: v.max_participants,
    join_mode: v.join_mode,
    gender_preference: v.gender_preference,
    location_visibility: v.location_visibility,
  }
  if (v.category) body.category = v.category
  if (v.city.trim()) body.city = v.city.trim()
  if (v.age_min) body.age_min = Number(v.age_min)
  if (v.age_max) body.age_max = Number(v.age_max)

  // 'unspecified' is a real stored answer, so it is sent rather than skipped.
  body.food = v.food
  body.drinks = v.drinks
  body.cost_sharing = v.cost_sharing
  body.dress_code = v.dress_code.trim() || null
  body.what_to_bring = v.what_to_bring.trim() || null
  body.amenities = v.amenities

  return body
}
