'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { eventsApi } from '@/lib/api'

type Flags = Record<string, boolean>

/**
 * The switches, in the order they should be turned on.
 *
 * Every one ships off. `events_enabled` is the master: while it is off the
 * whole module answers 404, so the code can be live before the feature is.
 */
const SWITCHES: {
  key: string
  label: string
  desc: string
  danger?: boolean
  needsMaster?: boolean
}[] = [
  {
    key: 'events_enabled',
    label: 'Events module',
    desc: 'The master switch. Off: the Events tab is not offered and every events endpoint answers 404, as though the module were not deployed. Turn this on only once an app build with Events is live in the stores.',
  },
  {
    key: 'event_creation_enabled',
    label: 'Users can create events',
    desc: 'Off: only admins can add events. This is the safe rollout order — seed a few good events yourself, then open it up.',
    needsMaster: true,
  },
  {
    key: 'event_host_requires_kyc',
    label: 'Hosts must be verified',
    desc: 'On: only KYC-verified users can submit an event. Leave this on unless you have a reason not to.',
    needsMaster: true,
  },
  {
    key: 'event_auto_approval',
    label: 'Skip the moderation queue',
    desc: 'On: user-created events publish immediately with no review. Off is the launch setting.',
    danger: true,
    needsMaster: true,
  },
  {
    key: 'event_broadcasts_enabled',
    label: 'Broadcast notifications',
    desc: '“New Event Added”, “Popular Event” and “Special Event for You” go to people in the city who never asked for them — capped at 200 per event. A broadcast to a whole city is the fastest way to get notifications turned off for good.',
    danger: true,
    needsMaster: true,
  },
  {
    key: 'event_join_reminders_enabled',
    label: 'Nudge people who saved an event',
    desc: 'Someone who saved an event but never joined gets reminded every 4 hours — at most 3 times, never between 10pm and 8am, and it stops the moment they join, unsave it, or the event starts or fills. Only people who saved it; nobody else is messaged.',
    danger: true,
    needsMaster: true,
  },
  {
    key: 'paid_events_enabled',
    label: 'Paid tickets',
    desc: 'Not finished. Leave off until payments and refunds have been tested end to end.',
    danger: true,
    needsMaster: true,
  },
]

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
        on ? 'bg-pink-500' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function EventSettingsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [flags, setFlags] = useState<Flags>({})
  const [saved, setSaved] = useState<Flags>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    eventsApi.settings(token)
      .then(r => { setFlags(r.data ?? {}); setSaved(r.data ?? {}) })
      .catch(e => toast.error(e.message || 'Could not load the switches'))
      .finally(() => setLoading(false))
  }, [token])

  const master = !!flags.events_enabled
  const dirty = JSON.stringify(flags) !== JSON.stringify(saved)

  async function save() {
    setSaving(true)
    try {
      const res = await eventsApi.updateSettings(token, flags)
      setFlags(res.data ?? flags)
      setSaved(res.data ?? flags)
      toast.success(res.message ?? 'Saved')
    } catch (e: any) {
      toast.error(e.message || 'Could not save')
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/events" className="text-sm text-gray-500 hover:text-gray-700">← Events</Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Which parts of the Events module are live. Everything ships off.
        </p>
      </div>

      <div className={`rounded-xl px-5 py-3.5 border ${master
        ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className={`text-sm font-semibold ${master ? 'text-green-800' : 'text-gray-700'}`}>
          {master ? 'Events are live for users.' : 'Events are off. Users see nothing.'}
        </p>
        <p className={`text-sm mt-0.5 ${master ? 'text-green-700' : 'text-gray-500'}`}>
          {master
            ? 'The Events tab is offered and the endpoints answer normally.'
            : 'Every events endpoint answers 404 and no reminders or notifications are sent. You can still add events and venues here — they simply stay invisible until you switch this on.'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {SWITCHES.map(sw => {
          // A sub-switch does nothing while the master is off, and a toggle
          // that silently does nothing is worse than one you cannot press.
          const locked = !!sw.needsMaster && !master
          const on = !!flags[sw.key]

          return (
            <div key={sw.key} className="flex items-start justify-between gap-6 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{sw.label}</p>
                  {sw.danger && on && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Be careful</span>
                  )}
                  {locked && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Needs the module on
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{sw.desc}</p>
              </div>

              <Toggle
                on={on}
                disabled={locked}
                onClick={() => setFlags(f => ({ ...f, [sw.key]: !f[sw.key] }))}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="px-6 py-2.5 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {dirty && <span className="text-xs text-gray-500">Unsaved changes</span>}
      </div>
    </div>
  )
}
