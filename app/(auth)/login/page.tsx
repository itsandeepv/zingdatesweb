'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'IN' },
  { code: '+1',  flag: '🇺🇸', name: 'US' },
  { code: '+44', flag: '🇬🇧', name: 'GB' },
  { code: '+971',flag: '🇦🇪', name: 'AE' },
  { code: '+86', flag: '🇨🇳', name: 'CN' },
  { code: '+55', flag: '🇧🇷', name: 'BR' },
  { code: '+49', flag: '🇩🇪', name: 'DE' },
]

type Step = 'input' | 'otp'

export default function LoginPage() {
  const router  = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)

  const [step, setStep]       = useState<Step>('input')
  const [phone, setPhone]     = useState('')
  const [cc, setCC]           = useState('+91')
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp]   = useState<string | null>(null)

  function handleOtpChange(val: string, idx: number) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus()
  }

  function handleOtpKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus()
  }

  async function handleSendOtp(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.sendOtp(phone, cc.replace('+', ''))
      if (res.dev_mode && res.otp) {
        const verifyRes = await authApi.verifyOtp(phone, cc.replace('+', ''), res.otp)
        setAuth(verifyRes.token, verifyRes.user)
        toast.success(verifyRes.is_new_user ? 'Welcome to zingDates!' : 'Welcome back!')
        if (verifyRes.is_new_user) {
          router.push('/register')
        } else if (verifyRes.user?.role && ['admin', 'super_admin', 'moderator'].includes(verifyRes.user.role)) {
          router.push('/admin')
        } else {
          router.push('/discover')
        }
        return
      }
      toast.success('OTP sent to your mobile number')
      setStep('otp')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.verifyOtp(phone, cc.replace('+', ''), otp.join(''))
      setAuth(res.token, res.user)
      toast.success(res.is_new_user ? 'Welcome to zingDates!' : 'Welcome back!')
      if (res.is_new_user) {
        router.push('/register')
      } else if (res.user?.role && ['admin', 'super_admin', 'moderator'].includes(res.user.role)) {
        router.push('/admin')
      } else {
        router.push('/discover')
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const inputReady = phone.length >= 7
  const otpReady   = otp.join('').length === 6

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {step === 'input' ? 'Sign in' : 'Verify your number'}
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">
          {step === 'input'
            ? 'Enter your mobile number to continue'
            : `We sent a 6-digit code to ${cc} ${phone}`}
        </p>
      </div>

      {/* ── Dev OTP banner ── */}
      {devOtp && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <span className="text-amber-500 text-base">🔧</span>
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Dev mode</span> — OTP:{' '}
            <span className="font-mono font-bold tracking-widest">{devOtp}</span>
          </p>
        </div>
      )}

      {/* ── Step: Phone input ── */}
      {step === 'input' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <select
                value={cc}
                onChange={e => setCC(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all cursor-pointer text-gray-700">
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                required
                autoFocus
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-300" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !inputReady}
            className="w-full gradient-brand text-white font-bold py-4 rounded-2xl shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[15px] tracking-wide">
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending code...
                </span>
              : 'Continue →'}
          </button>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="underline underline-offset-2 hover:text-gray-600 transition-colors">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline underline-offset-2 hover:text-gray-600 transition-colors">Privacy Policy</a>
          </p>
        </form>

      ) : (

        /* ── Step: OTP input ── */
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
              6-Digit Code
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((v, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={v}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleOtpKeyDown(e, i)}
                  className="w-11 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all bg-gray-50 focus:bg-white text-gray-900"
                  style={{ height: 52 }} />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !otpReady}
            className="w-full gradient-brand text-white font-bold py-4 rounded-2xl shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 text-[15px] tracking-wide">
            {loading ? 'Verifying...' : 'Confirm Code'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep('input'); setOtp(['','','','','','']); setDevOtp(null) }}
              className="text-gray-400 hover:text-gray-600 transition-colors font-medium">
              ← Change number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="font-semibold hover:opacity-75 transition-opacity"
              style={{ color: '#E91E8C' }}>
              Resend code
            </button>
          </div>
        </form>
      )}

      {/* ── Divider ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            New to zingDates?
          </span>
        </div>
      </div>

      {/* ── Sign up link ── */}
      <Link
        href="/register"
        className="block w-full text-center py-3.5 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-500 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-all">
        Create an account
      </Link>
    </div>
  )
}
