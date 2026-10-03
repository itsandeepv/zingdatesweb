'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { userEventsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/**
 * Events, for someone who is signed in.
 *
 * Lives at /my-events rather than /events because the public events pages
 * already own that path — they are what a share link opens and what search
 * engines index. This one acts AS the user: it knows what they have joined,
 * what they are hosting, and can take a seat without leaving the page.
 *
 * Browse and Mine are tabs rather than pages, because "am I going to this?"
 * is the same question on both.
 */

type EventRow = {
  id: number
  title: string
  description: string | null
  cover_url: string | null
  city: string | null
  location_name: string | null
  starts_at: string | null
  price: number
  is_free: boolean
  participants_count: number
  max_participants: number
  is_joined: boolean
  is_full: boolean
  is_host: boolean
  join_locked?: boolean
  status: string
}

const BROWSE_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'trending', label: 'Trending' },
  { key: 'weekend',  label: 'This weekend' },
  { key: 'live',     label: 'Live now' },
]

function when(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

export default function EventsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [mode, setMode] = useState<'browse' | 'mine'>('browse')
  const [tab, setTab] = useState('upcoming')
  const [rows, setRows] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [canHost, setCanHost] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = mode === 'mine'
        ? await userEventsApi.mine(token)
        : await userEventsApi.list(token, { tab })
      setRows(res.data ?? [])
    } catch {
      toast.error('Could not load events')
    } finally {
      setLoading(false)
    }
  }, [token, mode, tab])

  useEffect(() => { load() }, [load])

  // Asked once, so the Create button is not offered to someone the server
  // will refuse — the same check the app makes before opening the form.
  useEffect(() => {
    if (!token) return
    userEventsApi.canHost(token).then(() => setCanHost(true)).catch(() => setCanHost(false))
  }, [token])

  async function join(row: EventRow) {
    setBusyId(row.id)
    try {
      await userEventsApi.join(token, row.id)
      toast.success("You're going!")
      await load()
    } catch (e: any) {
      // A 402 means their plan does not cover joining; the message already
      // says which plan would, so it is shown as-is.
      toast.error(e?.message ?? 'Could not join this event')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>

        {canHost && (
          <Link href="/my-events/create"
            className="rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600">
            Create event
          </Link>
        )}
      </div>

      {/* Browse / mine */}
      <div className="mt-5 inline-flex rounded-xl bg-gray-100 p-1">
        {(['browse', 'mine'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}>
            {m === 'browse' ? 'Browse' : 'My events'}
          </button>
        ))}
      </div>

      {mode === 'browse' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {BROWSE_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-sm text-gray-500">
          {mode === 'mine' ? "You haven't joined or created anything yet." : 'Nothing on just now.'}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(row => (
            <div key={row.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <Link href={`/events/${row.id}`}>
                {row.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.cover_url} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-gradient-to-br from-pink-100 to-purple-100" />
                )}
              </Link>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/events/${row.id}`} className="font-bold text-gray-900 hover:text-pink-600">
                    {row.title}
                  </Link>
                  {row.is_host && (
                    <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                      Hosting
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-gray-500">{when(row.starts_at)}</p>
                <p className="text-xs text-gray-500">{row.location_name || row.city}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    {row.is_free ? 'Free' : `₹${row.price}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {row.participants_count}/{row.max_participants} going
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  {row.is_host ? (
                    <>
                      <Link href={`/my-events/${row.id}/edit`}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700 hover:border-pink-300">
                        Edit
                      </Link>
                      <Link href={`/my-events/${row.id}/invite`}
                        className="flex-1 rounded-lg bg-pink-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-pink-600">
                        Invite
                      </Link>
                    </>
                  ) : row.is_joined ? (
                    <span className="flex-1 rounded-lg bg-green-50 px-3 py-2 text-center text-xs font-semibold text-green-700">
                      You&apos;re going
                    </span>
                  ) : (
                    <button
                      onClick={() => join(row)}
                      disabled={busyId === row.id || row.is_full}
                      className="flex-1 rounded-lg bg-pink-500 px-3 py-2 text-xs font-semibold text-white hover:bg-pink-600 disabled:opacity-50">
                      {row.is_full ? 'Full' : busyId === row.id ? 'Joining…' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
