'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { adminAdsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/* ─── Types ─────────────────────────────────────────── */
interface AdSettings {
  ads_enabled: boolean
  ads_web_enabled: boolean
  ads_app_enabled: boolean
  ads_hide_for_premium: boolean
  adsense_client: string
  adsense_slot: string
  admob_banner_android: string
  admob_banner_ios: string
  admob_publisher_id: string
  adsense_account: string
}

interface Credentials {
  google_client_id: boolean
  google_client_secret: boolean
  admob_refresh_token: boolean
  adsense_refresh_token: boolean
  admob_ready: boolean
  adsense_ready: boolean
}

interface NetworkReport {
  status: 'ok' | 'not_configured' | 'auth_failed' | 'failed'
  rows: { date: string; earnings: number; impressions: number; clicks: number }[]
  total: number
  currency: string | null
}

const money = (n: number, c?: string | null) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: c || 'USD', maximumFractionDigits: 2 }).format(n || 0)

/** Why a network is not reporting, in words an admin can act on. */
const STATUS_NOTE: Record<NetworkReport['status'], string | null> = {
  ok: null,
  not_configured: 'Not connected yet — add the publisher id and a refresh token below.',
  auth_failed: 'Google rejected the refresh token. It may have been revoked; reconnect to get a new one.',
  failed: 'Google returned an error. Check the server log for the response.',
}

function Toggle({ on, onChange, label, hint }: {
  on: boolean; onChange: (v: boolean) => void; label: string; hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? 'gradient-brand' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, hint, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-200"
      />
      {hint && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

function RevenueCard({ title, report }: { title: string; report: NetworkReport | null }) {
  const note = report ? STATUS_NOTE[report.status] : null
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</p>
      {report?.status === 'ok' ? (
        <>
          <p className="text-2xl font-extrabold text-gray-900 mt-1.5">
            {money(report.total, report.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {report.rows.reduce((a, r) => a + r.impressions, 0).toLocaleString('en-IN')} impressions ·{' '}
            {report.rows.reduce((a, r) => a + r.clicks, 0).toLocaleString('en-IN')} clicks
          </p>
        </>
      ) : (
        <>
          {/* No number at all rather than a zero: "earned nothing" and "could
              not ask" are different answers. */}
          <p className="text-lg font-bold text-gray-300 mt-1.5">—</p>
          <p className="text-xs text-amber-600 mt-1 leading-relaxed">{note}</p>
        </>
      )}
    </div>
  )
}

export default function AdsAdminPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [creds, setCreds] = useState<Credentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Secrets are write-only: blank means "leave what is stored alone".
  const [secrets, setSecrets] = useState({
    google_ads_client_id: '', google_ads_client_secret: '',
    admob_refresh_token: '', adsense_refresh_token: '',
  })

  const [revenue, setRevenue] = useState<{ admob: NetworkReport; adsense: NetworkReport; combined: { total: number; currency: string | null; mixed_currencies: boolean } } | null>(null)
  const [revLoading, setRevLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminAdsApi.settings(token) as { data?: AdSettings; credentials?: Credentials }
      setSettings(res?.data ?? null)
      setCreds(res?.credentials ?? null)
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Could not load ad settings.')
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadRevenue = useCallback(async () => {
    setRevLoading(true)
    try {
      setRevenue(await adminAdsApi.revenue(token) as typeof revenue)
    } catch {
      setRevenue(null)
    } finally {
      setRevLoading(false)
    }
  }, [token])

  useEffect(() => { void (async () => { await load(); await loadRevenue() })() }, [load, loadRevenue])

  const set = <K extends keyof AdSettings>(k: K, v: AdSettings[K]) =>
    setSettings(s => (s ? { ...s, [k]: v } : s))

  async function save() {
    if (!settings || saving) return
    setSaving(true)
    try {
      // Only send secrets that were actually typed, so saving the placement
      // form never wipes a credential the form did not display.
      const payload: Record<string, unknown> = { ...settings }
      for (const [k, v] of Object.entries(secrets)) if (v.trim()) payload[k] = v.trim()

      await adminAdsApi.update(token, payload)
      setSecrets({ google_ads_client_id: '', google_ads_client_secret: '', admob_refresh_token: '', adsense_refresh_token: '' })
      toast.success('Ad settings saved.')
      await load()
      await loadRevenue()
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-9 h-9 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
          <p className="text-sm text-gray-500 mt-0.5">Where ads appear, and what they earn.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="gradient-brand text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* ── Earnings ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Earnings · last 30 days</h2>
          <button onClick={loadRevenue} disabled={revLoading}
            className="text-xs font-semibold text-pink-600 hover:text-pink-800 disabled:opacity-50">
            {revLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <RevenueCard title="AdMob (app)" report={revenue?.admob ?? null} />
          <RevenueCard title="AdSense (web)" report={revenue?.adsense ?? null} />
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Combined</p>
            {revenue?.combined.mixed_currencies ? (
              // Two networks paying in different currencies cannot be summed
              // into one honest figure.
              <>
                <p className="text-lg font-bold text-gray-300 mt-1.5">—</p>
                <p className="text-xs text-amber-600 mt-1">The two networks pay in different currencies, so they are not added up.</p>
              </>
            ) : (
              <p className="text-2xl font-extrabold text-gray-900 mt-1.5">
                {money(revenue?.combined.total ?? 0, revenue?.combined.currency)}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">Figures come from Google and settle over a day or two.</p>
          </div>
        </div>
      </div>

      {/* ── Switches ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <h2 className="text-base font-bold text-gray-900 mb-1">Where ads appear</h2>
        <p className="text-xs text-gray-500 mb-2">Takes effect immediately — no deploy, no app release.</p>
        <div className="divide-y divide-gray-50">
          <Toggle
            label="Show ads"
            hint="Master switch. Off means no ads anywhere, whatever the switches below say."
            on={settings.ads_enabled} onChange={v => set('ads_enabled', v)} />
          <Toggle
            label="Website"
            hint="AdSense slots on zingdates.com."
            on={settings.ads_web_enabled} onChange={v => set('ads_web_enabled', v)} />
          <Toggle
            label="Mobile app"
            hint="AdMob banner in the Android and iOS apps."
            on={settings.ads_app_enabled} onChange={v => set('ads_app_enabled', v)} />
          <Toggle
            label="Hide ads from paying members"
            hint="Every plan is sold on being the version without ads. Turning this off shows ads to subscribers too."
            on={settings.ads_hide_for_premium} onChange={v => set('ads_hide_for_premium', v)} />
        </div>
      </div>

      {/* ── Units ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <div>
          <h2 className="text-base font-bold text-gray-900">Ad units</h2>
          <p className="text-xs text-gray-500 mt-0.5">A surface with no unit id shows nothing, even with its switch on.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="AdSense client" value={settings.adsense_client} onChange={v => set('adsense_client', v)}
            placeholder="ca-pub-0000000000000000" hint="From AdSense → Account → Settings." />
          <Field label="AdSense slot" value={settings.adsense_slot} onChange={v => set('adsense_slot', v)}
            placeholder="1234567890" hint="The ad unit's numeric slot id." />
          <Field label="AdMob banner — Android" value={settings.admob_banner_android} onChange={v => set('admob_banner_android', v)}
            placeholder="ca-app-pub-0000000000000000/0000000000" />
          <Field label="AdMob banner — iOS" value={settings.admob_banner_ios} onChange={v => set('admob_banner_ios', v)}
            placeholder="ca-app-pub-0000000000000000/0000000000" />
        </div>
      </div>

      {/* ── Google connection ────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <div>
          <h2 className="text-base font-bold text-gray-900">Reading earnings from Google</h2>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Neither API accepts a service account — both need a one-time sign-in that produces a refresh token.
            Paste it once here and the server reads reports on its own from then on.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['AdMob', creds?.admob_ready],
            ['AdSense', creds?.adsense_ready],
          ].map(([name, ready]) => (
            <span key={String(name)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {String(name)}: {ready ? 'connected' : 'not connected'}
            </span>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="AdMob publisher id" value={settings.admob_publisher_id} onChange={v => set('admob_publisher_id', v)}
            placeholder="pub-0000000000000000" hint="With the pub- prefix." />
          <Field label="AdSense account" value={settings.adsense_account} onChange={v => set('adsense_account', v)}
            placeholder="accounts/pub-0000000000000000" hint="Full resource name, including accounts/." />

          <Field label="OAuth client id" type="password" value={secrets.google_ads_client_id}
            onChange={v => setSecrets(s => ({ ...s, google_ads_client_id: v }))}
            placeholder={creds?.google_client_id ? '•••••• saved — type to replace' : 'From Google Cloud Console'} />
          <Field label="OAuth client secret" type="password" value={secrets.google_ads_client_secret}
            onChange={v => setSecrets(s => ({ ...s, google_ads_client_secret: v }))}
            placeholder={creds?.google_client_secret ? '•••••• saved — type to replace' : 'From Google Cloud Console'} />

          <Field label="AdMob refresh token" type="password" value={secrets.admob_refresh_token}
            onChange={v => setSecrets(s => ({ ...s, admob_refresh_token: v }))}
            placeholder={creds?.admob_refresh_token ? '•••••• saved — type to replace' : 'Scope: admob.report'} />
          <Field label="AdSense refresh token" type="password" value={secrets.adsense_refresh_token}
            onChange={v => setSecrets(s => ({ ...s, adsense_refresh_token: v }))}
            placeholder={creds?.adsense_refresh_token ? '•••••• saved — type to replace' : 'Scope: adsense.readonly'} />
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Secrets are encrypted before they are stored and are never sent back to this page — a saved value
          shows as dots. Leaving a box empty keeps whatever is already stored.
        </p>
      </div>
    </div>
  )
}
