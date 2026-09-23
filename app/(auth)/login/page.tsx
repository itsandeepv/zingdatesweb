'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

/* Mobile-number rules per country, national format (no trunk '0'). `lengths`
   is every digit count that country allows; `prefix` is the opening digit(s)
   a mobile line can actually start with. Without these the form happily took
   a 24-digit number and sent it to the OTP endpoint. */
type Country = {
  code: string; flag: string; name: string
  lengths: number[]; prefix?: RegExp; example: string
}

const COUNTRY_CODES: Country[] = [
  { code: '+91', flag: '🇮🇳', name: 'IN', lengths: [10],     prefix: /^[6-9]/, example: '98765 43210' },
  { code: '+1',  flag: '🇺🇸', name: 'US', lengths: [10],     prefix: /^[2-9]/, example: '415 555 0132' },
  { code: '+44', flag: '🇬🇧', name: 'GB', lengths: [10],     prefix: /^7/,     example: '7700 900123' },
  { code: '+971',flag: '🇦🇪', name: 'AE', lengths: [9],      prefix: /^5/,     example: '50 123 4567' },
  { code: '+86', flag: '🇨🇳', name: 'CN', lengths: [11],     prefix: /^1/,     example: '138 0013 8000' },
  { code: '+55', flag: '🇧🇷', name: 'BR', lengths: [10, 11],                   example: '11 91234 5678' },
  { code: '+49', flag: '🇩🇪', name: 'DE', lengths: [10, 11],                   example: '1512 3456789' },
]

const countryFor = (cc: string) => COUNTRY_CODES.find(c => c.code === cc) ?? COUNTRY_CODES[0]

/* The first thing wrong with the number, or null when it is dialable. */
function phoneIssue(digits: string, c: Country): string | null {
  if (!digits) return 'Enter your mobile number'
  const min = Math.min(...c.lengths)
  if (digits.length < min) {
    const need = min - digits.length
    return `${need} more digit${need === 1 ? '' : 's'} to go`
  }
  if (!c.lengths.includes(digits.length))
    return `${c.name} mobile numbers are ${c.lengths.join(' or ')} digits`
  if (c.prefix && !c.prefix.test(digits))
    return `That is not a valid ${c.name} mobile number`
  return null
}

type Step = 'input' | 'otp'

/**
 * Where to land after a successful sign-in.
 *
 * `?next=` lets a page hand the user off here and get them back — e.g. the
 * public companion cards, which need an account before a booking can start.
 * Only same-site absolute paths are honoured: anything else (a full URL, a
 * protocol-relative "//evil.com") is an open-redirect vector and is ignored.
 */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

function LoginForm() {
  const setAuth = useAuthStore(s => s.setAuth)
  const next = safeNext(useSearchParams().get('next'))

  const [step, setStep]       = useState<Step>('input')
  const [phone, setPhone]     = useState('')
  const [cc, setCC]           = useState('+91')
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp]   = useState<string | null>(null)
  const [agreed, setAgreed]   = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const country    = countryFor(cc)
  const phoneError = phoneIssue(phone, country)
  const maxDigits  = Math.max(...country.lengths)

  // Resend throttle — without it the button can be hammered, and every press
  // costs a real SMS.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Switching country changes what counts as valid, so anything now too long
  // is trimmed rather than left sitting there silently wrong.
  function changeCountry(code: string) {
    setCC(code)
    setPhone(p => p.slice(0, Math.max(...countryFor(code).lengths)))
  }

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

  function handleOtpPaste(e: React.ClipboardEvent, idx: number) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = [...otp]
    for (let j = 0; j < pasted.length && idx + j < 6; j++) next[idx + j] = pasted[j]
    setOtp(next)
    const focusIdx = Math.min(idx + pasted.length, 5)
    document.getElementById(`otp-${focusIdx}`)?.focus()
  }

  async function handleSendOtp(e: { preventDefault(): void }) {
    e.preventDefault()
    if (loading || cooldown > 0) return
    const issue = phoneIssue(phone, countryFor(cc))
    if (issue) { toast.error(issue); return }
    if (!agreed) { toast.error('Please accept the Terms and Privacy Policy'); return }
    setLoading(true)
    try {
      const res = await authApi.sendOtp(phone, cc.replace('+', ''))
      if (res.dev_mode && res.otp) {
        const verifyRes = await authApi.verifyOtp(phone, cc.replace('+', ''), res.otp)
        setAuth(verifyRes.token, verifyRes.user)
        toast.success(verifyRes.is_new_user ? 'Welcome to zingDates!' : 'Welcome back!')
        const dest = verifyRes.is_new_user ? '/register'
          : (verifyRes.user?.role && ['admin', 'super_admin', 'moderator'].includes(verifyRes.user.role)) ? '/admin'
          : (next ?? '/discover')
        setTimeout(() => { window.location.href = dest }, 100)
        return
      }
      toast.success('OTP sent to your mobile number')
      setCooldown(30)
      setStep('otp')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: { preventDefault(): void }) {
    e.preventDefault()
    if (loading) return
    if (otp.join('').length !== 6) { toast.error('Enter all 6 digits of the code'); return }
    setLoading(true)
    try {
      const res = await authApi.verifyOtp(phone, cc.replace('+', ''), otp.join(''))
      setAuth(res.token, res.user)
      toast.success(res.is_new_user ? 'Welcome to zingDates!' : 'Welcome back!')
      const dest = res.is_new_user ? '/register'
        : (res.user?.role && ['admin', 'super_admin', 'moderator'].includes(res.user.role)) ? '/admin'
        : (next ?? '/discover')
      setTimeout(() => { window.location.href = dest }, 100)
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // Consent is its own step, not something buried in fine print under the
  // button. The Continue button stays disabled until it is ticked.
  const inputIssue = phoneError ?? (agreed ? null : 'Accept the Terms and Privacy Policy to continue')
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
            <div className="flex gap-2 w-full">
              <select
                value={cc}
                onChange={e => changeCountry(e.target.value)}
                className="flex-shrink-0 w-[108px] border border-gray-200 rounded-xl px-2 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all cursor-pointer text-gray-700">
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, maxDigits))}
                maxLength={maxDigits}
                placeholder={country.example}
                required
                autoFocus
                aria-invalid={!!phone && !!phoneError}
                className={`flex-1 min-w-0 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-300 ${
                  phone && phoneError
                    ? 'border-red-300 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-pink-400'
                }`} />
            </div>
            {/* Say what is wrong while they type, instead of only greying the
                button out and leaving them to guess. */}
            {phone && phoneError && (
              <p className="text-[11px] text-red-500 mt-1.5">{phoneError}</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              required
              className="mt-0.5 w-4 h-4 accent-pink-500 cursor-pointer shrink-0"
            />
            <span className="text-[12px] text-gray-500 leading-relaxed">
              I agree to the{' '}
              {/* target=_blank so reading them does not lose the number
                  already typed in. */}
              <a href="/terms" target="_blank" rel="noreferrer"
                 className="text-pink-600 font-semibold underline underline-offset-2">Terms &amp; Conditions</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noreferrer"
                 className="text-pink-600 font-semibold underline underline-offset-2">Privacy Policy</a>
            </span>
          </label>

          {inputIssue && phone && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              {inputIssue}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !!inputIssue}
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
                  pattern="[0-9]*"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  autoFocus={i === 0}
                  maxLength={1}
                  value={v}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleOtpKeyDown(e, i)}
                  onPaste={e => handleOtpPaste(e, i)}
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
              onClick={() => { setStep('input'); setOtp(['','','','','','']); setDevOtp(null); setCooldown(0) }}
              className="text-gray-400 hover:text-gray-600 transition-colors font-medium">
              ← Change number
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || cooldown > 0}
              className="font-semibold hover:opacity-75 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
              style={{ color: cooldown > 0 ? '#9ca3af' : '#E91E8C' }}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
