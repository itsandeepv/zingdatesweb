'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { eventsApi, usersApi } from '@/lib/api'
import EventForm, { EMPTY_EVENT, toPayload, type EventFormValues } from '@/components/admin/EventForm'

export default function NewEventPage() {
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''

  const [values, setValues] = useState<EventFormValues>(EMPTY_EVENT)
  const [cover, setCover] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Host search — an admin creating an event on someone else's behalf.
  const [hostQuery, setHostQuery] = useState('')
  const [hostResults, setHostResults] = useState<any[]>([])
  const [host, setHost] = useState<any | null>(null)
  const [searching, setSearching] = useState(false)

  async function searchHosts() {
    if (!hostQuery.trim()) return
    setSearching(true)
    try {
      const res = await usersApi.list(token, { search: hostQuery.trim() })
      setHostResults((res.data ?? res ?? []).slice(0, 6))
    } catch (err: any) { toast.error(err.message || 'Search failed') }
    finally { setSearching(false) }
  }

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

      // The cover goes up after the event exists, so a failed upload leaves a
      // coverless event rather than losing everything that was typed.
      if (cover && id) {
        try { await eventsApi.uploadCover(token, id, cover) }
        catch { toast.error('Event created, but the cover failed to upload.') }
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
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cover photo</label>
          <input
            type="file" accept="image/*"
            onChange={e => setCover(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600"
          />
          {cover && <p className="text-xs text-gray-400 mt-1">{cover.name}</p>}
        </div>

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
              <div className="flex gap-2">
                <input
                  value={hostQuery}
                  onChange={e => setHostQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchHosts() } }}
                  placeholder="Search a user by name or phone"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <button type="button" onClick={searchHosts} disabled={searching}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  {searching ? '…' : 'Search'}
                </button>
              </div>
              {hostResults.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {hostResults.map((u: any) => (
                    <button
                      key={u.id} type="button"
                      onClick={() => { setHost(u); setHostResults([]); setHostQuery('') }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50"
                    >
                      {u.name} <span className="text-gray-400">#{u.id}</span>
                    </button>
                  ))}
                </div>
              )}
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
