'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { locationsApi } from '@/lib/api'

type Mode = 'google' | 'manual'

type Suggestion = {
  place_id: string
  text?: string | null
  main?: string | null
  secondary?: string | null
}

type PlaceDetails = {
  place_id: string
  name?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  website?: string | null
  rating?: number | null
  review_count?: number | null
  primary_type?: string | null
  price_level?: number | null
  photos?: { name?: string | null; attribution?: string | null }[]
  opening_hours?: string[] | null
  google_maps_uri?: string | null
  reviews?: { author: string; rating: number | null; text: string; relative_time: string | null }[]
}

/** One token covers the whole type-then-pick sequence; Google bills it once. */
function newSessionToken() {
  return (globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

const EMPTY_MANUAL = {
  name: '', category_id: '', description: '', address: '', city: '',
  state: '', country: 'India', postal_code: '', latitude: '', longitude: '',
  phone: '', website: '', is_featured: false,
}

export default function NewLocationPage() {
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''

  const [mode, setMode] = useState<Mode>('google')
  const [cats, setCats] = useState<any[]>([])
  const [googleReady, setGoogleReady] = useState<boolean | null>(null)

  // Google side
  const session = useRef(newSessionToken())
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [existing, setExisting] = useState<any>(null)
  const seq = useRef(0)

  // Shared ZingDates fields for the import
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [featured, setFeatured] = useState(false)

  const [manual, setManual] = useState({ ...EMPTY_MANUAL })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    locationsApi.categories(token).then(r => setCats(r.data ?? [])).catch(() => {})
    locationsApi.stats(token)
      .then(r => setGoogleReady(r.data?.google_configured !== false))
      .catch(() => setGoogleReady(null))
  }, [token])

  /* ─── Autocomplete: debounced, and stale replies are dropped ─── */
  useEffect(() => {
    const text = q.trim()
    if (text.length < 2) { setSuggestions([]); setWarning(null); return }

    const mine = ++seq.current
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await locationsApi.googleSearch(token, text, session.current)
        if (mine !== seq.current) return           // a newer keystroke won
        setSuggestions(res.data ?? [])
        // Empty because Google refused us, not because nothing matched.
        setWarning(res.warning ?? null)
      } catch (err: any) {
        if (mine === seq.current) {
          setSuggestions([])
          setWarning(err.message || 'Google search failed')
        }
      } finally {
        if (mine === seq.current) setSearching(false)
      }
    }, 350)

    return () => clearTimeout(t)
  }, [q, token])

  const pick = useCallback(async (s: Suggestion) => {
    setSuggestions([])
    setQ(s.main || s.text || '')
    setDetails(null); setExisting(null)
    try {
      const res = await locationsApi.googleDetails(token, s.place_id, session.current)
      setDetails(res.data)
      setExisting(res.existing ?? null)
    } catch (err: any) {
      toast.error(err.message || 'Could not load that place')
    }
  }, [token])

  async function doImport() {
    if (!details) return
    setSaving(true)
    try {
      const res = await locationsApi.import(token, {
        place_id: details.place_id,
        session: session.current,
        category_id: categoryId ? Number(categoryId) : null,
        description: description || null,
        is_featured: featured,
      })
      toast.success(res.message ?? 'Imported')
      session.current = newSessionToken()   // that billing session is spent
      router.push(`/admin/locations/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Import failed')
    } finally { setSaving(false) }
  }

  async function doCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        ...manual,
        category_id: manual.category_id ? Number(manual.category_id) : null,
        latitude: manual.latitude ? Number(manual.latitude) : null,
        longitude: manual.longitude ? Number(manual.longitude) : null,
      }
      for (const k of ['description', 'address', 'state', 'country', 'postal_code', 'phone', 'website']) {
        if (!body[k]) body[k] = null
      }
      const res = await locationsApi.create(token, body)
      toast.success(res.message ?? 'Location added')
      router.push(`/admin/locations/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Could not save')
    } finally { setSaving(false) }
  }

  const field = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200'
  const label = 'block text-xs font-semibold text-gray-600 mb-1.5'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/locations" className="text-sm text-gray-500 hover:text-gray-700">← Locations</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add a Venue</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Anything added here starts as <strong>pending</strong>. It only becomes selectable after you approve and verify it.
        </p>
      </div>

      <div className="flex gap-2">
        {(['google', 'manual'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              mode === m ? 'bg-pink-50 border-pink-300 text-pink-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {m === 'google' ? 'Search on Google' : 'Add Manually'}
          </button>
        ))}
      </div>

      {mode === 'google' ? (
        <div className="space-y-4">
          {googleReady === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-amber-800">Google Places is not configured</p>
              <p className="text-sm text-amber-700 mt-1">
                Ask the developer to set the Places API key and enable Places API (New). Until then, use “Add Manually”.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className={label}>Venue name or address</label>
            <div className="relative">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="e.g. Cyber Hub, Gurgaon"
                className={field}
                autoComplete="off"
              />
              {searching && (
                <div className="absolute right-3 top-2.5 w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              )}

              {suggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.place_id} onClick={() => pick(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-pink-50 border-b border-gray-50 last:border-0">
                      <p className="text-sm font-medium text-gray-900">{s.main || s.text}</p>
                      {s.secondary && <p className="text-xs text-gray-500 mt-0.5">{s.secondary}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {warning && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-red-800">Google returned nothing</p>
                <p className="text-xs text-red-700 mt-0.5 break-words">{warning}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Cafés, restaurants, bars and banquet halls all come from Google Places. The key stays on the server — this panel never calls Google directly.
            </p>
          </div>

          {details && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{details.name}</h2>
                  <p className="text-sm text-gray-600 mt-0.5">{details.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {details.primary_type && <span className="capitalize">{details.primary_type.replace(/_/g, ' ')}</span>}
                    {details.rating ? ` · ⭐ ${details.rating} (${(details.review_count ?? 0).toLocaleString()} reviews)` : ''}
                    {details.phone ? ` · ${details.phone}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {details.website && (
                      <a href={details.website} target="_blank" rel="noreferrer"
                        className="text-xs text-pink-600 hover:underline">{details.website}</a>
                    )}
                    {details.google_maps_uri && (
                      <a href={details.google_maps_uri} target="_blank" rel="noreferrer"
                        className="text-xs text-gray-500 hover:underline">View on Google Maps</a>
                    )}
                    {!!details.photos?.length && (
                      <span className="text-xs text-gray-500">{details.photos.length} photo(s) will be imported</span>
                    )}
                  </div>
                </div>

                {!!details.opening_hours?.length && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">Opening hours</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {details.opening_hours.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {!!details.reviews?.length && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Recent Google reviews</p>
                    {details.reviews.slice(0, 3).map((r, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg px-4 py-2.5">
                        <p className="text-xs font-medium text-gray-800">
                          {r.author}{r.rating ? ` · ⭐ ${r.rating}` : ''}
                          {r.relative_time ? ` · ${r.relative_time}` : ''}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-3">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {existing ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-blue-800">
                      Already in the venue master as <strong>{existing.status}</strong>.
                    </p>
                    <Link href={`/admin/locations/${existing.id}`}
                      className="text-sm font-semibold text-blue-700 hover:underline">Open it →</Link>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className={label}>ZingDates category</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={field}>
                          <option value="">Uncategorised</option>
                          {cats.map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                          <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
                            className="w-4 h-4 accent-pink-500" />
                          Feature this venue
                        </label>
                      </div>
                      <div className="md:col-span-2">
                        <label className={label}>Description (shown in the app)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                          placeholder="Why is this a good spot for an event?" className={field} />
                      </div>
                    </div>

                    <button onClick={doImport} disabled={saving}
                      className="px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50">
                      {saving ? 'Importing…' : 'Import as Pending'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={doCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={label}>Venue name *</label>
              <input required value={manual.name} onChange={e => setManual({ ...manual, name: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>Category</label>
              <select value={manual.category_id} onChange={e => setManual({ ...manual, category_id: e.target.value })} className={field}>
                <option value="">Uncategorised</option>
                {cats.map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>City *</label>
              <input required value={manual.city} onChange={e => setManual({ ...manual, city: e.target.value })} className={field} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Address</label>
              <input value={manual.address} onChange={e => setManual({ ...manual, address: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>State</label>
              <input value={manual.state} onChange={e => setManual({ ...manual, state: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>Country</label>
              <input value={manual.country} onChange={e => setManual({ ...manual, country: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>Postal code</label>
              <input value={manual.postal_code} onChange={e => setManual({ ...manual, postal_code: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input value={manual.phone} onChange={e => setManual({ ...manual, phone: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label}>Latitude</label>
              <input value={manual.latitude} onChange={e => setManual({ ...manual, latitude: e.target.value })}
                placeholder="28.4949" className={field} />
            </div>
            <div>
              <label className={label}>Longitude</label>
              <input value={manual.longitude} onChange={e => setManual({ ...manual, longitude: e.target.value })}
                placeholder="77.0886" className={field} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Website</label>
              <input type="url" value={manual.website} onChange={e => setManual({ ...manual, website: e.target.value })}
                placeholder="https://…" className={field} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Description</label>
              <textarea rows={3} value={manual.description}
                onChange={e => setManual({ ...manual, description: e.target.value })} className={field} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={manual.is_featured}
                onChange={e => setManual({ ...manual, is_featured: e.target.checked })} className="w-4 h-4 accent-pink-500" />
              Feature this venue
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50">
              {saving ? 'Saving…' : 'Save as Pending'}
            </button>
            <Link href="/admin/locations"
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
