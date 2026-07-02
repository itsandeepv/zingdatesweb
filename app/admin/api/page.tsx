'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { apiKeysApi } from '@/lib/api'

export default function ApiPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', permissions: [] as string[] })

  const PERMISSIONS = ['read:users', 'write:users', 'read:events', 'write:events', 'read:payments', 'read:analytics']

  useEffect(() => {
    async function load() {
      try {
        const res = await apiKeysApi.list(token)
        setKeys(res.data ?? res ?? [])
      } catch (err: any) { toast.error(err.message || 'Failed to load API keys') }
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault()
    try {
      const res = await apiKeysApi.create(token, form)
      const newKey = res.data ?? res
      setKeys(k => [...k, newKey])
      toast.success(`API key created: ${newKey.key ?? '(saved)'}`)
      setShowForm(false)
      setForm({ name: '', permissions: [] })
    } catch (err: any) { toast.error(err.message || 'Failed to create key') }
  }

  async function handleRotate(id: number) {
    if (!confirm('Rotate this API key? The old key will stop working immediately.')) return
    setActionLoading(id)
    try {
      const res = await apiKeysApi.rotate(token, id)
      const updated = res.data ?? res
      setKeys(k => k.map(key => key.id === id ? { ...key, ...updated } : key))
      toast.success('API key rotated successfully')
    } catch (err: any) { toast.error(err.message || 'Failed to rotate key') }
    finally { setActionLoading(null) }
  }

  async function handleRevoke(id: number) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    setActionLoading(id)
    try {
      await apiKeysApi.revoke(token, id)
      setKeys(k => k.filter(key => key.id !== id))
      toast.success('API key revoked')
    } catch (err: any) { toast.error(err.message || 'Failed to revoke key') }
    finally { setActionLoading(null) }
  }

  function togglePermission(perm: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage API access keys and permissions</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand shadow-brand hover:opacity-90">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create API Key
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New API Key</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. Mobile App Integration" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {PERMISSIONS.map(perm => (
                  <button key={perm} type="button" onClick={() => togglePermission(perm)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.permissions.includes(perm) ? 'gradient-brand text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-pink-300'}`}>
                    {perm}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand hover:opacity-90">Create Key</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Active Keys</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No API keys yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {keys.map(key => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{key.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${key.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {key.is_active !== false ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-400 mt-1">{key.key ? key.key.slice(0, 20) + '...' : '••••••••••••••••••••'}</p>
                  {key.permissions && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(Array.isArray(key.permissions) ? key.permissions : [key.permissions]).map((p: string) => (
                        <span key={p} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{p}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Last used: {key.last_used ?? key.lastUsed ?? 'Never'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRotate(key.id)} disabled={actionLoading === key.id}
                    className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                    {actionLoading === key.id ? '...' : 'Rotate'}
                  </button>
                  <button onClick={() => handleRevoke(key.id)} disabled={actionLoading === key.id}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
