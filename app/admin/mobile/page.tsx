'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { mobileApi } from '@/lib/api'

type ScheduledPush = {
  id: number
  title: string
  body: string
  send_time: string
  enabled: boolean
  last_sent_date: string | null
  last_manual_sent_at: string | null
}

const emptyDraft = { title: '', body: '', send_time: '20:30' }

export default function MobilePage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)

  // The update gate the mobile app checks on launch.
  const [gate, setGate] = useState<any>({ latest_version: '', min_required_version: '', update_message: '', play_store_url: '' })
  const [savingGate, setSavingGate] = useState(false)

  // Scheduled re-engagement pushes — any number, each with its own time/copy.
  const [pushes, setPushes] = useState<ScheduledPush[]>([])
  const [previewCount, setPreviewCount] = useState(0)
  const [newPush, setNewPush] = useState(emptyDraft)
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    // Each card loads on its own: one failing must not blank the other.
    async function load() {
      const [g, sp] = await Promise.allSettled([mobileApi.updateGate(token), mobileApi.scheduledPushes(token)])
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
      if (sp.status === 'fulfilled' && sp.value) {
        setPushes(sp.value.pushes ?? [])
        setPreviewCount(sp.value.preview_count ?? 0)
      } else if (sp.status === 'rejected') {
        toast.error(sp.reason?.message || 'Failed to load scheduled pushes')
      }
      setLoading(false)
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function patchRow(id: number, patch: Partial<ScheduledPush>) {
    setPushes(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  async function saveGate() {
    setSavingGate(true)
    try {
      await mobileApi.saveUpdateGate(token, gate)
      toast.success('Update gate saved — users on older versions will be prompted')
    } catch (err: any) { toast.error(err.message || 'Failed to save update gate') }
    finally { setSavingGate(false) }
  }

  async function createPush() {
    if (!newPush.title.trim() || !newPush.body.trim()) { toast.error('Title and body are required'); return }
    setCreating(true)
    try {
      const res = await mobileApi.createScheduledPush(token, newPush)
      setPushes(rows => [...rows, res.push].sort((a, b) => a.send_time.localeCompare(b.send_time)))
      setNewPush(emptyDraft)
      toast.success('Schedule added')
    } catch (err: any) { toast.error(err.message || 'Failed to add schedule') }
    finally { setCreating(false) }
  }

  async function savePush(row: ScheduledPush) {
    setSavingId(row.id)
    try {
      await mobileApi.updateScheduledPush(token, row.id, {
        title: row.title, body: row.body, send_time: row.send_time, enabled: row.enabled,
      })
      toast.success('Saved')
    } catch (err: any) { toast.error(err.message || 'Failed to save') }
    finally { setSavingId(null) }
  }

  async function deletePush(id: number) {
    if (!window.confirm('Delete this schedule? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await mobileApi.deleteScheduledPush(token, id)
      setPushes(rows => rows.filter(r => r.id !== id))
      toast.success('Deleted')
    } catch (err: any) { toast.error(err.message || 'Failed to delete') }
    finally { setDeletingId(null) }
  }

  // Reaches every user with the app installed, so it saves first (what you
  // see is what goes out) and asks before sending.
  async function sendNow(row: ScheduledPush) {
    if (!window.confirm(`Send this push to every user right now?\n\n${row.title}\n${row.body}`)) return
    setSendingId(row.id)
    try {
      await mobileApi.updateScheduledPush(token, row.id, {
        title: row.title, body: row.body, send_time: row.send_time, enabled: row.enabled,
      })
      const res = await mobileApi.sendScheduledPushNow(token, row.id)
      toast.success(`Push sent to ${res.sent.toLocaleString()} users`)
      const fresh = await mobileApi.scheduledPushes(token)
      setPushes(fresh.pushes ?? [])
    } catch (err: any) { toast.error(err.message || 'Failed to send the push') }
    finally { setSendingId(null) }
  }

  const fieldClass = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mobile App</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update prompt and scheduled re-engagement pushes</p>
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
              className={fieldClass + ' font-mono'}
            />
            <span className="text-[11px] text-gray-400">Prompts an optional update on older builds.</span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Minimum required version</span>
            <input
              value={gate.min_required_version}
              onChange={e => setGate((g: any) => ({ ...g, min_required_version: e.target.value }))}
              placeholder="e.g. 1.0.0"
              className={fieldClass + ' font-mono'}
            />
            <span className="text-[11px] text-gray-400">Below this, the update is forced (can&apos;t be dismissed).</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update message</span>
            <input
              value={gate.update_message}
              onChange={e => setGate((g: any) => ({ ...g, update_message: e.target.value }))}
              placeholder="A new version is available with exciting features!"
              className={fieldClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Play Store URL</span>
            <input
              value={gate.play_store_url}
              onChange={e => setGate((g: any) => ({ ...g, play_store_url: e.target.value }))}
              placeholder="https://play.google.com/store/apps/details?id=com.zingdates.app"
              className={fieldClass}
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

      {/* Scheduled re-engagement pushes — any number, each with its own time/copy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Scheduled Pushes 🔔</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Each schedule fires every day at its own time (IST), to every user with notifications on. Add as many as
            you like. Use <code className="font-mono bg-gray-100 px-1 rounded">{'{count}'}</code> anywhere in a title
            or body to insert today&rsquo;s new-signup count (currently <strong>{previewCount}</strong>).
          </p>
        </div>

        {pushes.length === 0 && (
          <div className="mx-6 mt-5 rounded-lg bg-pink-50/60 border border-pink-100 px-3 py-2">
            <p className="text-sm text-gray-700">
              No schedules yet — a built-in rotating message goes out automatically at <strong>8:30 PM IST</strong> so
              the feature isn&rsquo;t silent. Add a schedule below and it takes over.
            </p>
          </div>
        )}

        {/* Existing schedules */}
        <div className="divide-y divide-gray-50">
          {pushes.map(row => (
            <div key={row.id} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <label className="block sm:col-span-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</span>
                <input
                  value={row.title}
                  onChange={e => patchRow(row.id, { title: e.target.value })}
                  maxLength={80}
                  className={fieldClass}
                />
              </label>
              <label className="block sm:col-span-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Body</span>
                <input
                  value={row.body}
                  onChange={e => patchRow(row.id, { body: e.target.value })}
                  maxLength={180}
                  className={fieldClass}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time (IST)</span>
                <input
                  type="time"
                  value={row.send_time}
                  onChange={e => patchRow(row.id, { send_time: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <div className="sm:col-span-2 flex flex-col items-start sm:items-end gap-2 sm:pt-5">
                <button
                  onClick={() => patchRow(row.id, { enabled: !row.enabled })}
                  title={row.enabled ? 'Enabled — click to pause' : 'Paused — click to enable'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${row.enabled ? 'bg-pink-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${row.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="sm:col-span-12 flex items-center justify-between gap-3 flex-wrap -mt-1">
                <p className="text-[11px] text-gray-400">
                  {row.last_sent_date ? `Last auto-sent ${row.last_sent_date}` : 'Not sent automatically yet'}
                  {row.last_manual_sent_at && ` · Last manual send ${new Date(row.last_manual_sent_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deletePush(row.id)}
                    disabled={deletingId === row.id}
                    className="rounded-lg border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-semibold px-4 py-2 transition-colors">
                    {deletingId === row.id ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    onClick={() => sendNow(row)}
                    disabled={sendingId === row.id || savingId === row.id}
                    className="rounded-lg border border-pink-200 bg-white hover:bg-pink-50 disabled:opacity-50 text-pink-600 text-sm font-semibold px-4 py-2 transition-colors">
                    {sendingId === row.id ? 'Sending…' : 'Send now'}
                  </button>
                  <button
                    onClick={() => savePush(row)}
                    disabled={savingId === row.id || sendingId === row.id}
                    className="rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors">
                    {savingId === row.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add new schedule */}
        <div className="px-6 py-5 bg-gray-50/60 rounded-b-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <label className="block sm:col-span-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New title</span>
            <input
              value={newPush.title}
              onChange={e => setNewPush(d => ({ ...d, title: e.target.value }))}
              placeholder="💕 Feeling bored?"
              maxLength={80}
              className={fieldClass}
            />
          </label>
          <label className="block sm:col-span-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New body</span>
            <input
              value={newPush.body}
              onChange={e => setNewPush(d => ({ ...d, body: e.target.value }))}
              placeholder="Your perfect match might be one swipe away..."
              maxLength={180}
              className={fieldClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time (IST)</span>
            <input
              type="time"
              value={newPush.send_time}
              onChange={e => setNewPush(d => ({ ...d, send_time: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <div className="sm:col-span-2 flex sm:justify-end sm:pt-5">
            <button
              onClick={createPush}
              disabled={creating}
              className="w-full sm:w-auto rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              {creating ? 'Adding…' : '+ Add schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
