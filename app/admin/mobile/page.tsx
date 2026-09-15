'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { mobileApi } from '@/lib/api'

export default function MobilePage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)

  // The update gate the mobile app checks on launch.
  const [gate, setGate] = useState<any>({ latest_version: '', min_required_version: '', update_message: '', play_store_url: '' })
  const [savingGate, setSavingGate] = useState(false)

  // Daily "come back" push sent to every user around 8-9 PM IST. Blank
  // title/body falls back to a rotating default (defaultPreview shows today's).
  const [dailyPush, setDailyPush] = useState<any>({ title: '', body: '', enabled: true })
  const [defaultPreview, setDefaultPreview] = useState<any>({ title: '', body: '' })
  const [lastManualSend, setLastManualSend] = useState<string | null>(null)
  const [savingDailyPush, setSavingDailyPush] = useState(false)
  const [sendingNow, setSendingNow] = useState(false)

  useEffect(() => {
    // Each card loads on its own: one failing must not blank the other.
    async function load() {
      const [g, dp] = await Promise.allSettled([mobileApi.updateGate(token), mobileApi.dailyPush(token)])
      if (g.status === 'fulfilled' && g.value) {
        setGate({
          latest_version: g.value.latest_version ?? '',
          min_required_version: g.value.min_required_version ?? '',
          update_message: g.value.update_message ?? '',
          play_store_url: g.value.play_store_url ?? '',
        })
      } else if (g.status === 'rejected') {
        toast.error(g.reason?.message || 'Failed to load the update prompt settings')
      }
      if (dp.status === 'fulfilled' && dp.value) {
        applyDailyPush(dp.value)
      } else if (dp.status === 'rejected') {
        toast.error(dp.reason?.message || 'Failed to load the daily push settings')
      }
      setLoading(false)
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function applyDailyPush(dp: any) {
    setDailyPush({ title: dp.title ?? '', body: dp.body ?? '', enabled: dp.enabled ?? true })
    setDefaultPreview(dp.default_preview ?? { title: '', body: '' })
    setLastManualSend(dp.last_manual_send_at ?? null)
  }

  async function saveGate() {
    setSavingGate(true)
    try {
      await mobileApi.saveUpdateGate(token, gate)
      toast.success('Update gate saved — users on older versions will be prompted')
    } catch (err: any) { toast.error(err.message || 'Failed to save update gate') }
    finally { setSavingGate(false) }
  }

  async function saveDailyPush() {
    setSavingDailyPush(true)
    try {
      await mobileApi.saveDailyPush(token, dailyPush)
      // Refresh the preview in case blanking the fields just handed control
      // back to the default rotation.
      const fresh = await mobileApi.dailyPush(token)
      if (fresh) applyDailyPush(fresh)
      toast.success('Daily push saved')
    } catch (err: any) { toast.error(err.message || 'Failed to save daily push') }
    finally { setSavingDailyPush(false) }
  }

  // Manual send: this reaches every user with the app installed, so it saves
  // the fields first (what you see is what goes out) and asks before sending.
  async function sendNow() {
    const title = dailyPush.title.trim() || defaultPreview.title
    const body  = dailyPush.body.trim()  || defaultPreview.body
    if (!window.confirm(`Send this push to every user right now?\n\n${title}\n${body}`)) return
    setSendingNow(true)
    try {
      await mobileApi.saveDailyPush(token, dailyPush)
      const res = await mobileApi.sendDailyPushNow(token)
      toast.success(`Push sent to ${res.sent.toLocaleString()} users`)
      const fresh = await mobileApi.dailyPush(token)
      if (fresh) applyDailyPush(fresh)
    } catch (err: any) { toast.error(err.message || 'Failed to send the push') }
    finally { setSendingNow(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mobile App</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update prompt and the daily re-engagement push</p>
      </div>

      {/* Update gate — what the mobile app checks on launch to prompt an update */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">App Update Prompt</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Set the latest published version. Anyone on an older build gets an update popup when they open the app —
            optional above the minimum, forced below it. No app deploy needed.
          </p>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Latest version</span>
            <input
              value={gate.latest_version}
              onChange={e => setGate((g: any) => ({ ...g, latest_version: e.target.value }))}
              placeholder="e.g. 1.0.5"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            />
            <span className="text-[11px] text-gray-400">Prompts an optional update on older builds.</span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Minimum required version</span>
            <input
              value={gate.min_required_version}
              onChange={e => setGate((g: any) => ({ ...g, min_required_version: e.target.value }))}
              placeholder="e.g. 1.0.0"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            />
            <span className="text-[11px] text-gray-400">Below this, the update is forced (can't be dismissed).</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update message</span>
            <input
              value={gate.update_message}
              onChange={e => setGate((g: any) => ({ ...g, update_message: e.target.value }))}
              placeholder="A new version is available with exciting features!"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Play Store URL</span>
            <input
              value={gate.play_store_url}
              onChange={e => setGate((g: any) => ({ ...g, play_store_url: e.target.value }))}
              placeholder="https://play.google.com/store/apps/details?id=com.zingdates.app"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={saveGate}
              disabled={savingGate}
              className="rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              {savingGate ? 'Saving…' : 'Save update prompt'}
            </button>
          </div>
        </div>
      </div>

      {/* Daily re-engagement push — sent to every user around 8-9 PM IST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Daily &ldquo;Come Back&rdquo; Push 🔔</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Sent to every user with notifications on, once a day around 8-9 PM IST. Leave title/body blank to use a
              rotating default line instead. Use <code className="font-mono bg-gray-100 px-1 rounded">{'{count}'}</code> anywhere to insert today&rsquo;s new-signup count.
            </p>
          </div>
          <button
            onClick={() => setDailyPush((d: any) => ({ ...d, enabled: !d.enabled }))}
            title={dailyPush.enabled ? 'Enabled — click to pause' : 'Paused — click to enable'}
            className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dailyPush.enabled ? 'bg-pink-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dailyPush.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</span>
            <input
              value={dailyPush.title}
              onChange={e => setDailyPush((d: any) => ({ ...d, title: e.target.value }))}
              placeholder={defaultPreview.title || '💕 Feeling bored?'}
              maxLength={80}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Body</span>
            <input
              value={dailyPush.body}
              onChange={e => setDailyPush((d: any) => ({ ...d, body: e.target.value }))}
              placeholder={defaultPreview.body || 'Your perfect match might be one swipe away...'}
              maxLength={180}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
            />
          </label>
          {(defaultPreview.title || defaultPreview.body) && (
            <div className="sm:col-span-2 rounded-lg bg-pink-50/60 border border-pink-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-pink-600 uppercase tracking-wide">Tonight&rsquo;s default (used when the fields above are blank)</p>
              <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">{defaultPreview.title}</span> — {defaultPreview.body}</p>
            </div>
          )}
          <div className="sm:col-span-2 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-gray-400">
              {lastManualSend
                ? `Last sent manually ${new Date(lastManualSend).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'Never sent manually'}
              {' · '}Send now goes to everyone immediately, even while paused.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={sendNow}
                disabled={sendingNow || savingDailyPush}
                className="rounded-lg border border-pink-200 bg-white hover:bg-pink-50 disabled:opacity-50 text-pink-600 text-sm font-semibold px-5 py-2.5 transition-colors">
                {sendingNow ? 'Sending…' : 'Send now'}
              </button>
              <button
                onClick={saveDailyPush}
                disabled={savingDailyPush || sendingNow}
                className="rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
                {savingDailyPush ? 'Saving…' : 'Save daily push'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
