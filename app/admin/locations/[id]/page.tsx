'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { locationsApi } from '@/lib/api'

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-600',
}

const PRICE = ['Free', '₹', '₹₹', '₹₹₹', '₹₹₹₹']

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-40 shrink-0 text-xs font-semibold text-gray-500 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-words min-w-0">{children}</span>
    </div>
  )
}

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const locationId = Number(id)
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''

  const [loc, setLoc] = useState<any>(null)
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // The four fields ZingDates owns. Everything else is Google's and read-only
  // for a google-sourced venue, so the two never fight over the same row.
  const [form, setForm] = useState({ category_id: '', description: '', is_featured: false, is_verified: false })

  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await locationsApi.get(token, locationId)
      setLoc(res.data)
      setForm({
        category_id: res.data.category_id ? String(res.data.category_id) : '',
        description: res.data.description ?? '',
        is_featured: !!res.data.is_featured,
        is_verified: !!res.data.is_verified,
      })
    } catch (err: any) {
      toast.error(err.message || 'Could not load this location')
    } finally { setLoading(false) }
  }, [token, locationId])

  useEffect(() => { load() }, [load])
  useEffect(() => { locationsApi.categories(token).then(r => setCats(r.data ?? [])).catch(() => {}) }, [token])

  async function run(fn: () => Promise<any>) {
    setBusy(true)
    try {
      const res = await fn()
      toast.success(res.message ?? 'Done')
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally { setBusy(false) }
  }

  const save = () => run(() => locationsApi.update(token, locationId, {
    category_id: form.category_id ? Number(form.category_id) : null,
    description: form.description || null,
    is_featured: form.is_featured,
    is_verified: form.is_verified,
  }))

  const doReject = () => {
    if (!reason.trim()) { toast.error('A reason is required'); return }
    setRejectOpen(false)
    run(() => locationsApi.reject(token, locationId, reason.trim())).then(() => setReason(''))
  }

  async function remove() {
    if (!confirm(`Delete "${loc.name}" permanently? Deactivating is usually what you want.`)) return
    setBusy(true)
    try {
      const res = await locationsApi.remove(token, locationId)
      toast.success(res.message ?? 'Deleted')
      router.push('/admin/locations')
    } catch (err: any) {
      toast.error(err.message || 'Could not delete')
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
    </div>
  }

  if (!loc) {
    return <div className="text-center py-16">
      <p className="text-gray-900 font-semibold">Location not found</p>
      <Link href="/admin/locations" className="text-sm text-pink-600 hover:underline">← Back to Locations</Link>
    </div>
  }

  const selectable = loc.status === 'approved' && loc.is_verified
  const mapsUrl = loc.latitude && loc.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`
    : null

  const field = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200'

  return (
    <div className="space-y-6">
      <Link href="/admin/locations" className="text-sm text-gray-500 hover:text-gray-700">← Locations</Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{loc.name}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[loc.status]}`}>{loc.status}</span>
            {loc.is_verified && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Verified</span>}
            {loc.is_featured && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Featured</span>}
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{loc.source_type}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{loc.address}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {loc.status !== 'approved' && (
            <button onClick={() => run(() => loc.status === 'inactive'
              ? locationsApi.reactivate(token, locationId)
              : locationsApi.approve(token, locationId))}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loc.status === 'inactive' ? 'Reactivate' : 'Approve'}
            </button>
          )}
          {loc.status === 'approved' && (
            <button onClick={() => run(() => locationsApi.deactivate(token, locationId))} disabled={busy}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Deactivate
            </button>
          )}
          {loc.status !== 'rejected' && (
            <button onClick={() => setRejectOpen(true)} disabled={busy}
              className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
              Reject
            </button>
          )}
          <button onClick={remove} disabled={busy}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>

      <div className={`rounded-xl px-5 py-3.5 border ${selectable
        ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <p className={`text-sm font-semibold ${selectable ? 'text-green-800' : 'text-amber-800'}`}>
          {selectable
            ? 'Selectable — users can pick this venue when creating an event.'
            : 'Not selectable — users cannot pick this venue yet.'}
        </p>
        {!selectable && (
          <p className="text-sm text-amber-700 mt-0.5">
            A venue must be both <strong>approved</strong> and <strong>verified</strong> before it appears in the app.
            {loc.status === 'approved' && !loc.is_verified && ' Tick “Verified” below and save.'}
          </p>
        )}
      </div>

      {loc.status === 'rejected' && loc.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
          <p className="text-sm font-semibold text-red-800">Rejected</p>
          <p className="text-sm text-red-700 mt-0.5">{loc.rejection_reason}</p>
        </div>
      )}

      {!!loc.photos?.length && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {loc.photos.map((p: any) => p.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt="" title={p.attribution ?? ''}
              className="w-48 h-36 rounded-xl object-cover shrink-0 border border-gray-100" />
          ) : null)}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              Venue details {loc.source_type === 'google' && <span className="font-normal text-gray-400">· from Google, read-only</span>}
            </h2>
            <Row label="Full address">{loc.address}</Row>
            <Row label="City / State">{[loc.city, loc.state, loc.country, loc.postal_code].filter(Boolean).join(', ')}</Row>
            <Row label="Google type">{loc.primary_google_type?.replace(/_/g, ' ')}</Row>
            <Row label="Rating">{loc.rating ? `⭐ ${loc.rating} (${(loc.review_count ?? 0).toLocaleString()} reviews)` : null}</Row>
            <Row label="Price level">{loc.price_level !== null && loc.price_level !== undefined ? PRICE[loc.price_level] : null}</Row>
            <Row label="Phone">{loc.phone ?? loc.international_phone}</Row>
            <Row label="Website">
              {loc.website ? <a href={loc.website} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">{loc.website}</a> : null}
            </Row>
            <Row label="Coordinates">
              {loc.latitude && loc.longitude ? (
                <>
                  {loc.latitude}, {loc.longitude}
                  {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="ml-2 text-pink-600 hover:underline">Open in Maps</a>}
                </>
              ) : null}
            </Row>
            <Row label="Google Place ID">
              {loc.google_place_id
                ? <code className="text-xs bg-gray-50 px-1.5 py-0.5 rounded">{loc.google_place_id}</code>
                : null}
            </Row>
            <Row label="Google synced">{loc.google_synced_at ? new Date(loc.google_synced_at).toLocaleString() : null}</Row>
            <Row label="Added by">{loc.created_by}</Row>
            <Row label="Approved by">
              {loc.approved_by ? `${loc.approved_by}${loc.approved_at ? ` · ${new Date(loc.approved_at).toLocaleString()}` : ''}` : null}
            </Row>
          </div>

          {!!loc.opening_hours?.length && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Opening hours</h2>
              <ul className="text-sm text-gray-600 space-y-1">
                {loc.opening_hours.map((h: string, i: number) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              Events at this venue {loc.events_count > 0 && <span className="font-normal text-gray-400">· {loc.events_count}</span>}
            </h2>
            {loc.events?.length ? (
              <div className="divide-y divide-gray-50">
                {loc.events.map((e: any) => (
                  <Link key={e.id} href={`/admin/events/${e.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded">
                    <span className="text-sm text-gray-800">{e.title}</span>
                    <span className="text-xs text-gray-500">
                      {e.starts_at ? new Date(e.starts_at).toLocaleDateString() : ''} · {e.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No events use this venue yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Audit trail</h2>
            {loc.audits?.length ? (
              <ol className="space-y-3">
                {loc.audits.map((a: any, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 capitalize">{a.action.replace(/_/g, ' ')}</p>
                      {a.note && <p className="text-xs text-gray-600 mt-0.5">{a.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.admin ?? 'System'} · {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">Nothing recorded yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">ZingDates settings</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={field}>
                <option value="">Uncategorised</option>
                {cats.map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <textarea rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Shown to users in the app" className={field} />
            </div>

            <label className="flex items-start gap-2.5 text-sm text-gray-700">
              <input type="checkbox" checked={form.is_verified}
                onChange={e => setForm({ ...form, is_verified: e.target.checked })}
                className="w-4 h-4 accent-pink-500 mt-0.5" />
              <span>
                <strong>Verified</strong>
                <span className="block text-xs text-gray-500">Required, along with Approved, before users can select it.</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-sm text-gray-700">
              <input type="checkbox" checked={form.is_featured}
                onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                className="w-4 h-4 accent-pink-500 mt-0.5" />
              <span>
                <strong>Featured</strong>
                <span className="block text-xs text-gray-500">Pushed to the top of venue search in the app.</span>
              </span>
            </label>

            <button onClick={save} disabled={busy}
              className="w-full px-4 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50">
              {busy ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

          {mapsUrl && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Map</h2>
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 h-32 flex items-center justify-center text-white text-sm font-semibold">
                Open in Google Maps
              </a>
              <p className="text-xs text-gray-500 mt-2">{loc.latitude}, {loc.longitude}</p>
            </div>
          )}
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setRejectOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Reject this venue</h3>
            <p className="text-sm text-gray-500 mt-1">The reason is stored in the audit trail.</p>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} autoFocus
              placeholder="e.g. Permanently closed" className={`${field} mt-4`} />
            <div className="flex gap-3 mt-4">
              <button onClick={doReject}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                Reject
              </button>
              <button onClick={() => setRejectOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
