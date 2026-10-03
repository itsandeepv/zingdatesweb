'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { userEventsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/**
 * Asking people to your event.
 *
 * Anyone on the app can be invited, with the people you already talk to
 * listed first — on a real install the unfiltered list is the whole user
 * base, so the ordering and the search box are what make it usable.
 *
 * The limits are the server's: one person is messaged once per event however
 * many times you tap, and one host may send a bounded number of invites a
 * day. The remaining count is shown so it is not discovered by being refused.
 */

type Person = {
  id: number
  name: string
  photo: string | null
  invited: boolean
  is_contact: boolean
}

export default function InvitePage() {
  const token = useAuthStore(s => s.token) ?? ''
  const { id } = useParams<{ id: string }>()

  const [people, setPeople] = useState<Person[]>([])
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [query, setQuery] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [shared, setShared] = useState(false)

  const load = useCallback(async (q = '') => {
    if (!token) return
    try {
      const res = await userEventsApi.invitable(token, id, q)
      setPeople(res.data ?? [])
      setRemaining(res.meta?.remaining_today ?? null)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not load people to invite')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  // Searching hits the server: the list is everyone, so filtering the one
  // page already fetched would only ever search the first fifty.
  useEffect(() => {
    const q = query.trim()
    const t = setTimeout(() => { load(q) }, q ? 350 : 0)
    return () => clearTimeout(t)
  }, [query, load])

  const toggle = (uid: number) => setPicked(prev => {
    const next = new Set(prev)
    next.has(uid) ? next.delete(uid) : next.add(uid)
    return next
  })

  async function send() {
    if (!picked.size || sending) return
    setSending(true)
    try {
      const res = await userEventsApi.invite(token, id, [...picked])
      const n = res?.data?.invited?.length ?? 0
      toast.success(n === 1 ? 'Invite sent' : `${n} invites sent`)
      setPicked(new Set())
      await load(query.trim())
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not send the invites')
    } finally {
      setSending(false)
    }
  }

  /** The share link is the public event page — what a non-user can open. */
  const shareUrl = typeof window === 'undefined'
    ? '' : `${window.location.origin}/events/${id}`

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Come to this', url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      // The user dismissed the share sheet, or the clipboard is blocked.
      // Neither is worth an error toast.
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Invite people</h1>
        <Link href="/my-events" className="text-sm font-semibold text-gray-500 hover:text-gray-700">Done</Link>
      </div>

      {/* Anyone, not just app users — the link opens the public event page. */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="min-w-[12rem] flex-1">
          <p className="text-sm font-semibold text-gray-900">Share the link</p>
          <p className="truncate text-xs text-gray-500">{shareUrl}</p>
        </div>
        <button onClick={share}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
          {shared ? 'Copied!' : 'Share'}
        </button>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name"
        className="mt-5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
      />

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading…</p>
      ) : people.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">Nobody to invite right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {people.map(p => {
            const on = p.invited || picked.has(p.id)
            return (
              <li key={p.id}>
                <button
                  onClick={() => !p.invited && toggle(p.id)}
                  disabled={p.invited}
                  className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-60">
                  {p.photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                    : <div className="h-11 w-11 rounded-full bg-pink-100" />}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-gray-900">{p.name}</span>
                    {p.invited
                      ? <span className="text-xs text-gray-400">Already invited</span>
                      : p.is_contact ? <span className="text-xs font-semibold text-pink-600">You chat with them</span> : null}
                  </span>

                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    on ? 'border-pink-500 bg-pink-500 text-white' : 'border-gray-200'
                  }`}>
                    {on ? '✓' : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {picked.size > 0 && (
        <div className="sticky bottom-4 mt-6">
          {remaining != null && remaining < 20 && (
            <p className="mb-2 text-center text-xs text-gray-500">{remaining} invites left today</p>
          )}
          <button onClick={send} disabled={sending}
            className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-pink-600 disabled:opacity-50">
            {sending ? 'Sending…' : `Invite ${picked.size}`}
          </button>
        </div>
      )}
    </div>
  )
}
