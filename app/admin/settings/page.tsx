'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { settingsApi } from '@/lib/api'

export default function SettingsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Only settings the API actually enforces. Phone OTP is always required
  // and there is no email verification step, so neither is a switch here.
  const [form, setForm] = useState({
    app_name: 'ZingDates',
    support_email: '',
    max_photos: '6',
    min_age: '18',
    max_age: '99',
    maintenance_mode: false,
    registration_enabled: true,
    // Test numbers: sign in with a fixed code and no SMS (App Store / Play
    // reviewers, QA phones). Only numbers on the list are affected.
    test_otp_enabled: false,
    test_otp_code: '123456',
    test_phone_numbers: [] as string[],
  })
  const [newNumber, setNewNumber] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await settingsApi.get(token)
        const s = res.data ?? res ?? {}
        // Numbers come back as numbers; the inputs hold strings.
        setForm(f => ({ ...f, ...s, max_photos: String(s.max_photos ?? f.max_photos), min_age: String(s.min_age ?? f.min_age), max_age: String(s.max_age ?? f.max_age),
          test_otp_code: String(s.test_otp_code ?? f.test_otp_code), test_phone_numbers: Array.isArray(s.test_phone_numbers) ? s.test_phone_numbers : [] }))
      } catch (err: any) {
        toast.error(err.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function set(key: string, value: string | boolean | string[]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function addNumber() {
    const digits = newNumber.replace(/\D/g, '')
    if (digits.length < 10) { toast.error('Enter a 10-digit mobile number.'); return }
    const normalised = '+91' + digits.slice(-10)
    if (form.test_phone_numbers.includes(normalised)) { toast.error('That number is already on the list.'); return }
    set('test_phone_numbers', [...form.test_phone_numbers, normalised])
    setNewNumber('')
  }

  function removeNumber(n: string) {
    set('test_phone_numbers', form.test_phone_numbers.filter(x => x !== n))
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    const minAge = Number(form.min_age), maxAge = Number(form.max_age), maxPhotos = Number(form.max_photos)
    if (minAge < 18) { toast.error('Minimum age cannot go below 18.'); return }
    if (maxAge < minAge) { toast.error('Maximum age must be at least the minimum age.'); return }
    if (maxPhotos < 1 || maxPhotos > 20) { toast.error('Max photos must be between 1 and 20.'); return }
    if (!/^[0-9]{4,8}$/.test(form.test_otp_code)) { toast.error('Test OTP must be 4 to 8 digits.'); return }
    if (form.test_otp_enabled && form.test_phone_numbers.length === 0) { toast.error('Add at least one test number, or turn test OTP off.'); return }
    setSaving(true)
    try {
      await settingsApi.update(token, { ...form, max_photos: maxPhotos, min_age: minAge, max_age: maxAge })
      toast.success(form.maintenance_mode ? 'Settings saved — maintenance mode is ON, users cannot use the app' : 'Settings saved')
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
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">User Limits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Photos per User</label>
              <input type="number" min={1} max={20} value={form.max_photos} onChange={e => set('max_photos', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <p className="text-[11px] text-gray-400 mt-1">Enforced when a user adds a gallery photo.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Age</label>
              <input type="number" min={18} max={99} value={form.min_age} onChange={e => set('min_age', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <p className="text-[11px] text-gray-400 mt-1">Never below 18. Checked when a profile saves its date of birth.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Age</label>
              <input type="number" min={18} max={120} value={form.max_age} onChange={e => set('max_age', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Platform Toggles</h2>
          <div className="space-y-4">
            {[
              { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Every user-facing API call answers 503 until turned off. The admin panel keeps working.' },
              { key: 'registration_enabled', label: 'New Registrations', desc: 'Off: new phone numbers and new Google/Facebook accounts are turned away. Existing users still sign in.' },
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Test Numbers</h2>
          <p className="text-xs text-gray-500 mb-4">
            For App Store / Play reviewers and QA phones. A number on this list signs in with the fixed test OTP below and no SMS is sent.
            Every other number still gets a real OTP.
          </p>

          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">Test OTP Enabled</p>
              <p className="text-xs text-gray-500 mt-0.5">Off: the list is kept but every number gets a real OTP.</p>
            </div>
            <button type="button" onClick={() => set('test_otp_enabled', !form.test_otp_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.test_otp_enabled ? 'bg-pink-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.test_otp_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test OTP</label>
              <input type="text" inputMode="numeric" value={form.test_otp_code} onChange={e => set('test_otp_code', e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <p className="text-[11px] text-gray-400 mt-1">Use 6 digits — the app&apos;s OTP screen has six boxes.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Test Number</label>
              <div className="flex gap-2">
                <input type="tel" value={newNumber} onChange={e => setNewNumber(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNumber() } }}
                  placeholder="10-digit mobile number"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                <button type="button" onClick={addNumber}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100">
                  Add
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Saved as +91 followed by the last 10 digits.</p>
            </div>
          </div>

          <div className="mt-4">
            {form.test_phone_numbers.length === 0 ? (
              <p className="text-xs text-gray-400">No test numbers yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50 border border-gray-100 rounded-xl">
                {form.test_phone_numbers.map(n => (
                  <li key={n} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-mono text-gray-800">{n}</span>
                    <button type="button" onClick={() => removeNumber(n)} className="text-xs font-medium text-red-500 hover:text-red-600">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
