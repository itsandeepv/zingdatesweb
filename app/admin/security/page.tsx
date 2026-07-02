'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { settingsApi } from '@/lib/api'

export default function SecurityPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    two_factor_required: false,
    login_attempts_limit: '5',
    lockout_duration: '30',
    session_timeout: '60',
    password_min_length: '8',
    require_special_chars: true,
    ip_whitelist_enabled: false,
    suspicious_activity_alerts: true,
    audit_log_retention_days: '90',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await settingsApi.get(token)
        const s = res.data ?? res ?? {}
        if (s.security) setSettings(prev => ({ ...prev, ...s.security }))
        else setSettings(prev => ({ ...prev, ...s }))
      } catch (err: any) { toast.error(err.message || 'Failed to load security settings') }
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function set(key: string, value: string | boolean) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function handleToggle(key: string, value: boolean) {
    set(key, value)
    try {
      await settingsApi.updateSecurity(token, { [key]: value })
      toast.success('Security setting updated')
    } catch (err: any) {
      set(key, !value)
      toast.error(err.message || 'Failed to update setting')
    }
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.updateSecurity(token, settings)
      toast.success('Security settings saved')
    } catch (err: any) { toast.error(err.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure authentication, access control, and security policies</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Authentication</h2>
          <div className="space-y-4">
            {[
              { key: 'two_factor_required', label: 'Require 2FA for Admin', desc: 'All admin accounts must enable two-factor authentication' },
              { key: 'require_special_chars', label: 'Require Special Characters', desc: 'Passwords must contain at least one special character' },
              { key: 'suspicious_activity_alerts', label: 'Suspicious Activity Alerts', desc: 'Send email alerts when suspicious login activity is detected' },
              { key: 'ip_whitelist_enabled', label: 'IP Whitelist', desc: 'Restrict admin access to whitelisted IP addresses only' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <button type="button" onClick={() => handleToggle(item.key, !(settings as any)[item.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(settings as any)[item.key] ? 'bg-pink-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(settings as any)[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Login Policy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'login_attempts_limit', label: 'Max Login Attempts', type: 'number' },
              { key: 'lockout_duration', label: 'Lockout Duration (minutes)', type: 'number' },
              { key: 'session_timeout', label: 'Session Timeout (minutes)', type: 'number' },
              { key: 'password_min_length', label: 'Minimum Password Length', type: 'number' },
              { key: 'audit_log_retention_days', label: 'Audit Log Retention (days)', type: 'number' },
            ].map(item => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                <input type={item.type} value={(settings as any)[item.key]} onChange={e => set(item.key, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Security Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
