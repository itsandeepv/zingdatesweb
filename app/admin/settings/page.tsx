'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { settingsApi } from '@/lib/api'

export default function SettingsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    app_name: 'zingDates',
    support_email: '',
    max_photos: '6',
    min_age: '18',
    max_age: '99',
    coin_value: '0.01',
    maintenance_mode: false,
    registration_enabled: true,
    email_verification: true,
    phone_verification: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await settingsApi.get(token)
        const s = res.data ?? res ?? {}
        setForm(f => ({ ...f, ...s }))
      } catch (err: any) {
        toast.error(err.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.update(token, form)
      toast.success('Settings saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure global platform settings and defaults</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
              <input type="text" value={form.app_name} onChange={e => set('app_name', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input type="email" value={form.support_email} onChange={e => set('support_email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coin Value (USD)</label>
              <input type="number" step="0.001" value={form.coin_value} onChange={e => set('coin_value', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">User Limits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Photos per User</label>
              <input type="number" value={form.max_photos} onChange={e => set('max_photos', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Age</label>
              <input type="number" value={form.min_age} onChange={e => set('min_age', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Age</label>
              <input type="number" value={form.max_age} onChange={e => set('max_age', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Platform Toggles</h2>
          <div className="space-y-4">
            {[
              { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Temporarily disable the platform for all users' },
              { key: 'registration_enabled', label: 'New Registrations', desc: 'Allow new users to register on the platform' },
              { key: 'email_verification', label: 'Email Verification', desc: 'Require email verification for new accounts' },
              { key: 'phone_verification', label: 'Phone Verification', desc: 'Require phone verification for new accounts' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <button type="button" onClick={() => set(item.key, !(form as any)[item.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(form as any)[item.key] ? 'bg-pink-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(form as any)[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
