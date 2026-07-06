'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.adminLogin(email, password)
      setAuth(res.token, res.user)
      toast.success('Welcome, admin')
      router.replace('/admin')
    } catch (err: any) {
      toast.error(err?.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin sign in</h1>
        <p className="text-gray-400 text-sm mt-1.5">Restricted area — staff accounts only</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
            placeholder="admin@zingdates.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-900 placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-gray-900 placeholder:text-gray-300" />
        </div>
        <button type="submit" disabled={loading || !email || !password}
          className="w-full gradient-brand text-white font-bold py-4 rounded-2xl shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 text-[15px] tracking-wide">
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      <Link href="/login" className="block text-center text-sm text-gray-400 hover:text-gray-600">← Back to user sign in</Link>
    </div>
  )
}
