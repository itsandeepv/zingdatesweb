'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { mobileApi } from '@/lib/api'

export default function MobilePage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [versions, setVersions] = useState<any[]>([])
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingFlag, setTogglingFlag] = useState<number | null>(null)

  // The update gate the mobile app checks on launch.
  const [gate, setGate] = useState<any>({ latest_version: '', min_required_version: '', update_message: '', play_store_url: '' })
  const [savingGate, setSavingGate] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [v, f, g] = await Promise.all([mobileApi.versions(token), mobileApi.flags(token), mobileApi.updateGate(token)])
        setVersions(v.data ?? v ?? [])
        setFlags(f.data ?? f ?? [])
        if (g) setGate({
          latest_version: g.latest_version ?? '',
          min_required_version: g.min_required_version ?? '',
          update_message: g.update_message ?? '',
          play_store_url: g.play_store_url ?? '',
        })
      } catch (err: any) { toast.error(err.message || 'Failed to load mobile data') }
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  async function handleToggleFlag(id: number, currentEnabled: boolean) {
    setTogglingFlag(id)
    try {
      await mobileApi.updateFlag(token, id, !currentEnabled)
      setFlags(f => f.map(flag => flag.id === id ? { ...flag, is_enabled: !currentEnabled, enabled: !currentEnabled } : flag))
      toast.success('Feature flag updated')
    } catch (err: any) { toast.error(err.message || 'Failed to update flag') }
    finally { setTogglingFlag(null) }
  }

  async function saveGate() {
    setSavingGate(true)
    try {
      await mobileApi.saveUpdateGate(token, gate)
      toast.success('Update gate saved — users on older versions will be prompted')
    } catch (err: any) { toast.error(err.message || 'Failed to save update gate') }
    finally { setSavingGate(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mobile App</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage app versions and feature flags</p>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">App Versions</h2>
        </div>
        {versions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No version data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Platform','Version','Build','Status','Released','Force Update'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {versions.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{v.platform}</td>
                    <td className="px-4 py-3 font-mono text-gray-800">{v.version}</td>
                    <td className="px-4 py-3 text-gray-500">{v.build_number ?? v.buildNumber ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'active' ? 'bg-green-100 text-green-700' : v.status === 'deprecated' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{v.released_at ?? v.releasedAt ?? '-'}</td>
                    <td className="px-4 py-3">
                      {(v.force_update ?? v.forceUpdate) ? (
                        <span className="text-xs font-medium text-red-600">Required</span>
                      ) : (
                        <span className="text-xs text-gray-400">Optional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Feature Flags</h2>
          <p className="text-xs text-gray-500 mt-0.5">Toggle features on/off without deploying new code</p>
        </div>
        {flags.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No feature flags configured.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {flags.map(flag => {
              const enabled = flag.is_enabled ?? flag.enabled ?? false
              return (
                <div key={flag.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{flag.name ?? flag.key}</p>
                    {flag.description && <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{flag.key}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFlag(flag.id, enabled)}
                    disabled={togglingFlag === flag.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? 'bg-pink-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
