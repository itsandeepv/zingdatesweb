'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { mailApi } from '@/lib/api'

type MailType = {
  key: string
  enabled: boolean
  subject: string | null
  body: string | null
  customized: boolean
}

/**
 * Human copy + the {{token}} list for each type — the API only knows keys
 * and booleans, this is what turns them into something an admin can read.
 */
const META: Record<string, { label: string; desc: string; tokens: string[] }> = {
  welcome: {
    label: 'Welcome email',
    desc: 'Sent once, the first time an account has an email address.',
    tokens: ['name', 'app'],
  },
  plan_purchased: {
    label: 'Plan purchase receipt',
    desc: 'Sent right after a plan purchase or renewal is activated.',
    tokens: ['name', 'plan_label', 'amount', 'payment_id', 'valid_till', 'upgraded_from'],
  },
  plan_expiring_soon: {
    label: 'Plan expiring soon',
    desc: 'The daily reminder sent a few days before a paid plan expires.',
    tokens: ['name', 'plan_label', 'days_left', 'expires_on'],
  },
  booking_cancelled: {
    label: 'Companion booking cancelled',
    desc: 'Sent to the client when a paid companion booking is cancelled, with the refund figures.',
    tokens: ['name', 'companion_name', 'booking_id', 'paid', 'refundable', 'withheld', 'reason'],
  },
  suspended: {
    label: 'Account suspended',
    desc: 'Sent the moment an account is suspended — by any of the admin suspend actions.',
    tokens: ['name', 'reason', 'app'],
  },
  refund_processed: {
    label: 'Refund processed',
    desc: 'Sent once a refund is actually settled — a plan/order refund (back to the original payment method) or a companion booking refund (credited to the wallet).',
    tokens: ['name', 'amount', 'for_what', 'destination'],
  },
  event_joined: {
    label: 'Event joined',
    desc: 'Sent the moment a user joins an event for the first time.',
    tokens: ['name', 'title', 'when', 'location'],
  },
  companion_session_reminder: {
    label: 'Companion session reminder',
    desc: 'Sent to both sides a few minutes before a booked companion session starts.',
    tokens: ['name', 'with_name', 'minutes_left'],
  },
}

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

function TemplateEditor({ token, type, onSaved }: { token: string; type: MailType; onSaved: (t: MailType) => void }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(type.subject ?? '')
  const [body, setBody] = useState(type.body ?? '')
  const [saving, setSaving] = useState(false)
  const meta = META[type.key]

  async function save() {
    setSaving(true)
    try {
      const res = await mailApi.update(token, type.key, { subject, body })
      onSaved({ ...type, subject: subject || null, body: body || null, customized: !!subject || !!body })
      toast.success(res.message ?? 'Saved')
    } catch (e: any) {
      toast.error(e.message || 'Could not save')
    } finally { setSaving(false) }
  }

  async function resetToDefault() {
    setSaving(true)
    try {
      await mailApi.update(token, type.key, { subject: '', body: '' })
      setSubject(''); setBody('')
      onSaved({ ...type, subject: null, body: null, customized: false })
      toast.success('Reverted to the default template')
    } catch (e: any) {
      toast.error(e.message || 'Could not reset')
    } finally { setSaving(false) }
  }

  return (
    <div className="border-t border-gray-50 px-5 py-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs font-medium text-pink-600 hover:text-pink-700"
      >
        {open ? 'Hide template' : type.customized ? 'Edit custom template' : 'Customize template'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Leave blank to use the default subject"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              placeholder="Leave blank to use the default body"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-400">
              Available tokens: {meta.tokens.map(t => (
                <code key={t} className="bg-gray-100 text-gray-600 rounded px-1 py-0.5 mr-1">{`{{${t}}}`}</code>
              ))}
            </p>
            <div className="flex items-center gap-2">
              {type.customized && (
                <button
                  type="button"
                  onClick={resetToDefault}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Reset to default
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg gradient-brand text-white text-xs font-semibold shadow-brand disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MailSettingsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [types, setTypes] = useState<MailType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mailApi.types(token)
      .then(r => setTypes(r.data ?? []))
      .catch(e => toast.error(e.message || 'Could not load mail types'))
      .finally(() => setLoading(false))
  }, [token])

  async function toggle(type: MailType) {
    const next = !type.enabled
    setTypes(ts => ts.map(t => t.key === type.key ? { ...t, enabled: next } : t))
    try {
      await mailApi.update(token, type.key, { enabled: next })
      toast.success(next ? `${META[type.key]?.label ?? type.key} turned on` : `${META[type.key]?.label ?? type.key} turned off`)
    } catch (e: any) {
      // Roll back on failure — the switch must reflect what the server has.
      setTypes(ts => ts.map(t => t.key === type.key ? { ...t, enabled: !next } : t))
      toast.error(e.message || 'Could not save')
    }
  }

  function updateType(updated: MailType) {
    setTypes(ts => ts.map(t => t.key === updated.key ? updated : t))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mail Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Every transactional email the app sends. Turn a type off to stop sending it, or customize its subject and
          body — leave either blank to keep the built-in default.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {types.map(type => {
          const meta = META[type.key]

          return (
            <div key={type.key}>
              <div className="flex items-start justify-between gap-6 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{meta?.label ?? type.key}</p>
                    {type.customized && (
                      <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">Customized</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta?.desc}</p>
                </div>

                <Toggle on={type.enabled} onClick={() => toggle(type)} />
              </div>

              <TemplateEditor token={token} type={type} onSaved={updateType} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
