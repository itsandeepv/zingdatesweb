'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { eventsApi } from '@/lib/api'
import UserSearch from '@/components/admin/UserSearch'
import EventPhotoPicker from '@/components/admin/EventPhotoPicker'
import EventForm, { EMPTY_EVENT, toPayload, type EventFormValues } from '@/components/admin/EventForm'

export default function NewEventPage() {
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''

  const [values, setValues] = useState<EventFormValues>(EMPTY_EVENT)
  const [photos, setPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  // Host — an admin creating an event on someone else's behalf.
  const [host, setHost] = useState<{ id: number; name: string | null } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    if (!values.title.trim() || !values.description.trim()
        || !values.starts_at || !values.ends_at || !values.public_location_name.trim()) {
      toast.error('Fill in the required fields first.')
      return
    }
    if (new Date(values.ends_at) <= new Date(values.starts_at)) {
      toast.error('The end time must be after the start.')
      return
    }

    setSaving(true)
    try {
      const body = toPayload(values)
      if (host) body.host_user_id = host.id

      const res = await eventsApi.createEvent(token, body)
      const id = res.data?.id

      // Pictures go up after the event exists, so a failed upload leaves a
      // picture-less event rather than losing everything that was typed.
      if (photos.length > 0 && id) {
        try { await eventsApi.uploadPhotos(token, id, photos) }
        catch { toast.error('Event created, but the pictures failed to upload.') }
      }

      toast.success('Event created and published')
      router.push(id ? `/admin/events/${id}` : '/admin/events')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/events" className="text-xs text-gray-500 hover:text-pink-600">&larr; Events</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Create Event</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Published straight away — an admin creating an event is the approval.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <EventForm value={values} onChange={setValues} token={token} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <EventPhotoPicker files={photos} onFilesChange={setPhotos} required />

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Host</label>
          {host ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-900">{host.name} <span className="text-gray-400">#{host.id}</span></span>
              <button type="button" onClick={() => setHost(null)}
                className="text-xs text-pink-600 font-semibold">Change</button>
            </div>
          ) : (
            <>
              <UserSearch token={token} onPick={u => setHost(u)} />
              <p className="text-xs text-gray-400 mt-1">Leave blank to host it yourself.</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50">
          {saving ? 'Creating…' : 'Create & publish'}
        </button>
        <Link href="/admin/events" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
      </div>
    </form>
  )
}
