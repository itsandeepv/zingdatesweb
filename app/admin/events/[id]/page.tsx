'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { eventsApi, usersApi } from '@/lib/api'
import UserSearch from '@/components/admin/UserSearch'
import EventPhotoPicker from '@/components/admin/EventPhotoPicker'
import EventForm, {
  EMPTY_EVENT, toPayload, toLocalInput, toIso, type EventFormValues,
} from '@/components/admin/EventForm'

type EventStatus = 'published' | 'pending_approval' | 'draft' | 'cancelled' | 'completed'

type Participant = {
  id: number
  name: string | null
  photo: string | null
  is_verified: boolean
  joined_at: string | null
}

type Report = {
  id: number
  reason: string
  details: string | null
  status: string
  reporter: string | null
  created_at: string | null
}

type EventDetail = {
  id: number
  category: string | null
  photos?: { id: number; url: string }[]
  location_visibility?: 'public' | 'participants_only'
  name: string
  status: EventStatus
  category_label: string | null
  description: string
  organizer_name: string | null
  organizer_id: number
  organizer_verified: boolean
  venue_city: string | null
  venue_name: string | null
  cover_url: string | null
  starts_at: string | null
  ends_at: string | null
  price: number
  is_free: boolean
  capacity: number
  attendees: number
  age_min: number | null
  age_max: number | null
  join_mode: string
  gender_preference: string
  reject_reason: string | null
  cancel_reason: string | null
  reports_count: number
  is_admin_created: boolean
  created_at: string | null
  participants: Participant[]
  reports: Report[]
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { label: string; cls: string }> = {
    published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
    pending_approval: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
    completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
  }
  const { label, cls } = map[status] ?? map.draft
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''
  const id = Number(params.id)

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EventFormValues>(EMPTY_EVENT)

  const [postponeOpen, setPostponeOpen] = useState(false)
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [postponeReason, setPostponeReason] = useState('')


  const load = useCallback(async () => {
    setLoading(true)
    try {
      const e = (await eventsApi.get(token, id)).data
      setEvent(e)
      setForm({
        title: e.name ?? '', description: e.description ?? '',
        category: e.category ?? '',
        starts_at: toLocalInput(e.starts_at), ends_at: toLocalInput(e.ends_at),
        city: e.venue_city ?? '', public_location_name: e.venue_name ?? '',
        event_location_id: e.event_location_id != null ? String(e.event_location_id) : '',
        // Seeded from the payload for the same reason as the venue and the
        // visibility: a field the form does not know about is a field every
        // save silently resets.
        food: e.food ?? 'unspecified',
        drinks: e.drinks ?? 'unspecified',
        cost_sharing: e.cost_sharing ?? 'unspecified',
        dress_code: e.dress_code ?? '',
        what_to_bring: e.what_to_bring ?? '',
        amenities: e.amenities ?? [],
        max_participants: e.capacity ?? 20,
        age_min: e.age_min != null ? String(e.age_min) : '',
        age_max: e.age_max != null ? String(e.age_max) : '',
        join_mode: (e.join_mode ?? 'everyone') as EventFormValues['join_mode'],
        gender_preference: (e.gender_preference ?? 'everyone') as EventFormValues['gender_preference'],
        location_visibility: (e.location_visibility ?? 'public') as EventFormValues['location_visibility'],
      })
    } catch (err: any) {
      if (err.status === 404) setNotFound(true)
      else toast.error(err.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => { if (id) load() }, [id, load])

  async function approve() {
    setActing(true)
    try {
      await eventsApi.approve(token, id)
      toast.success('Event approved')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to approve') }
    finally { setActing(false) }
  }

  // One endpoint, two meanings: a rejection before it was ever published, a
  // cancellation (with participants notified) after.
  async function rejectOrCancel() {
    const isPending = event?.status === 'pending_approval' || event?.status === 'draft'
    const reason = prompt(isPending ? 'Reason for rejection:' : 'Why is this being cancelled? Participants will be told.')
    if (!reason) return
    setActing(true)
    try {
      await eventsApi.cancel(token, id, reason)
      toast.success('Event updated')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to update') }
    finally { setActing(false) }
  }

  async function suspendHost() {
    const reason = prompt('Why is this host being suspended? Their upcoming events will be cancelled.')
    if (!reason) return
    setActing(true)
    try {
      const res = await eventsApi.suspendHost(token, id, reason)
      toast.success(res.message ?? 'Host suspended')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to suspend host') }
    finally { setActing(false) }
  }

  async function removeParticipant(userId: number, name: string | null) {
    const reason = prompt(`Remove ${name ?? 'this person'} from the event? They will be told. Reason:`)
    if (reason === null) return
    setActing(true)
    try {
      await eventsApi.removeParticipant(token, id, userId, reason)
      toast.success('Participant removed')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to remove') }
    finally { setActing(false) }
  }

  async function saveEdit() {
    setActing(true)
    try {
      await eventsApi.updateEvent(token, id, toPayload(form))
      toast.success('Event updated')
      setEditing(false)
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to update') }
    finally { setActing(false) }
  }

  async function doPostpone() {
    if (!newStart || !newEnd) return
    if (new Date(newEnd) <= new Date(newStart)) {
      toast.error('The end time must be after the start.')
      return
    }
    setActing(true)
    try {
      await eventsApi.postpone(token, id, {
        starts_at: toIso(newStart), ends_at: toIso(newEnd),
        reason: postponeReason.trim() || undefined,
      })
      toast.success('Event postponed — everyone going has been told')
      setPostponeOpen(false)
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to postpone') }
    finally { setActing(false) }
  }

  async function addPhotos(files: File[]) {
    if (files.length === 0) return
    setActing(true)
    try {
      await eventsApi.uploadPhotos(token, id, files)
      toast.success(files.length === 1 ? 'Picture added' : 'Pictures added')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to upload') }
    finally { setActing(false) }
  }

  async function removePhoto(photoId: number) {
    setActing(true)
    try {
      await eventsApi.deletePhoto(token, id, photoId)
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to remove') }
    finally { setActing(false) }
  }

  async function addParticipant(userId: number, name: string) {
    setActing(true)
    try {
      await eventsApi.addParticipant(token, id, userId)
      toast.success(`${name} added`)
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to add') }
    finally { setActing(false) }
  }

  async function remove() {
    if (!confirm('Delete this event? Participants are notified and this cannot be undone.')) return
    setActing(true)
    try {
      await eventsApi.delete(token, id)
      toast.success('Event deleted')
      router.push('/admin/events')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-500 text-sm">This event no longer exists.</p>
        <Link href="/admin/events" className="inline-block mt-4 text-sm font-semibold text-pink-600 hover:text-pink-700">Back to events</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link href="/admin/events" className="text-xs text-gray-500 hover:text-pink-600">&larr; Events</Link>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <StatusBadge status={event.status} />
            {event.is_admin_created && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">Admin created</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {event.category_label ?? 'Uncategorised'} &middot; created {formatDate(event.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {event.status !== 'cancelled' && event.status !== 'completed' && (
            <>
              <button onClick={() => setEditing(v => !v)} disabled={acting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold disabled:opacity-50">
                {editing ? 'Close editor' : 'Edit'}
              </button>
              <button
                onClick={() => {
                  setNewStart(toLocalInput(event.starts_at))
                  setNewEnd(toLocalInput(event.ends_at))
                  setPostponeOpen(true)
                }}
                disabled={acting}
                className="px-4 py-2 text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold disabled:opacity-50">
                Postpone
              </button>
            </>
          )}

          {event.status === 'pending_approval' && (
            <button onClick={approve} disabled={acting}
              className="px-4 py-2 text-sm rounded-lg bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 font-semibold disabled:opacity-50">
              Approve
            </button>
          )}
          {event.status !== 'cancelled' && event.status !== 'completed' && (
            <button onClick={rejectOrCancel} disabled={acting}
              className="px-4 py-2 text-sm rounded-lg bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 font-semibold disabled:opacity-50">
              {event.status === 'pending_approval' || event.status === 'draft' ? 'Reject' : 'Cancel'}
            </button>
          )}
          <button onClick={remove} disabled={acting}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-pink-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit event</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              A host can only edit a draft. As an admin you can correct a published event — capacity
              cannot go below the {event.attendees} already joined.
            </p>
          </div>

          <EventForm value={form} onChange={setForm} token={token} />

          <div className="flex items-center gap-3 pt-2">
            <button onClick={saveEdit} disabled={acting}
              className="px-5 py-2 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50">
              {acting ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {postponeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900">Postpone event</h2>
            <p className="text-sm text-gray-500 mt-1">
              Everyone going keeps their place and is told the new date. Reminders reset.
            </p>

            <div className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New start</label>
                <input type="datetime-local" value={newStart} onChange={e => setNewStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New end</label>
                <input type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason (optional)</label>
                <input value={postponeReason} onChange={e => setPostponeReason(e.target.value)}
                  maxLength={300} placeholder="Venue clash"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setPostponeOpen(false)}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={doPostpone} disabled={acting || !newStart || !newEnd}
                className="px-5 py-2 text-sm rounded-lg gradient-brand text-white font-semibold shadow-brand disabled:opacity-50">
                {acting ? 'Moving…' : 'Postpone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(event.reject_reason || event.cancel_reason) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
            {event.reject_reason ? 'Rejection reason' : 'Cancellation reason'}
          </p>
          <p className="text-sm text-red-800">{event.reject_reason ?? event.cancel_reason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative group">
              {event.cover_url
                ? <img src={event.cover_url} alt="" className="w-full h-48 object-cover" />
                : <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600" />}

            </div>

            {/* The gallery, with the cover shown above it. Uploads go up as
                soon as they are picked — the event already exists here. */}
            <div className="px-6 pt-5">
              <EventPhotoPicker
                files={[]}
                onFilesChange={addPhotos}
                existing={event.photos ?? []}
                onRemoveExisting={removePhoto}
              />
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">About</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{event.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-2 border-t border-gray-100">
                <Field label="Starts">{formatDate(event.starts_at)}</Field>
                <Field label="Ends">{formatDate(event.ends_at)}</Field>
                <Field label="Venue">
                  {event.venue_name ?? '—'}
                  <div className="text-xs text-gray-400">{event.venue_city ?? ''}</div>
                </Field>
                <Field label="Price">{event.is_free ? 'Free' : `₹${event.price}`}</Field>
                <Field label="Capacity">{event.attendees} / {event.capacity}</Field>
                <Field label="Age range">
                  {event.age_min || event.age_max ? `${event.age_min ?? 18}–${event.age_max ?? 'any'}` : 'Any'}
                </Field>
                <Field label="Who can join">{event.join_mode === 'verified_only' ? 'Verified only' : 'Everyone'}</Field>
                <Field label="Gender">{event.gender_preference === 'everyone' ? 'Everyone' : event.gender_preference}</Field>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Participants</h2>
              <span className="text-xs text-gray-400">{event.participants.length}</span>
            </div>
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/60">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Add someone</label>
              <UserSearch
                token={token}
                disabled={acting}
                onPick={u => addParticipant(u.id, u.name ?? 'That user')}
              />
              <p className="text-xs text-gray-400 mt-1">
                Age, gender and verification rules are skipped — capacity is not.
              </p>
            </div>

            {event.participants.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">Nobody has joined yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {event.participants.map(p => (
                  <div key={p.id} className="px-6 py-3 flex items-center gap-3">
                    {p.photo
                      ? <img src={p.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <div className="w-9 h-9 rounded-full bg-gray-100" />}
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/users/${p.id}`} className="text-sm font-medium text-gray-900 hover:text-pink-600">
                        {p.name ?? 'Unknown'}
                      </Link>
                      {p.is_verified && <span title="Verified" className="text-blue-500 ml-1">✓</span>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(p.joined_at)}</span>
                    <button
                      onClick={() => removeParticipant(p.id, p.name)}
                      disabled={acting}
                      className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Host</h2>
            <Link href={`/admin/users/${event.organizer_id}`} className="text-sm font-medium text-gray-900 hover:text-pink-600">
              {event.organizer_name ?? 'Unknown'}
            </Link>
            {event.organizer_verified
              ? <span className="ml-1 text-blue-500" title="Verified">✓</span>
              : <p className="text-xs text-amber-600 mt-1">Not verified</p>}

            <button
              onClick={suspendHost}
              disabled={acting}
              className="mt-4 w-full px-3 py-2 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold disabled:opacity-50"
            >
              Suspend host &amp; cancel their events
            </button>
          </div>

          <div className={`bg-white rounded-xl border shadow-sm ${event.reports.length > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Reports</h2>
              <span className={`text-xs font-semibold ${event.reports.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{event.reports.length}</span>
            </div>
            {event.reports.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">No reports.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {event.reports.map(r => (
                  <div key={r.id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{r.reason}</span>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                    {r.details && <p className="text-xs text-gray-600 mt-1">{r.details}</p>}
                    <p className="text-xs text-gray-400 mt-1">by {r.reporter ?? 'Unknown'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
