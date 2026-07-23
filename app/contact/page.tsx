'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { contactApi, ApiError } from '@/lib/api'

const COMPANY_LEGAL_NAME  = 'S&S Tech'
const REGISTERED_ADDRESS  = 'Unit No. 7, 3rd Floor, JMD Regent Arcade Mall, A Block, DLF Phase 1, Gurugram, Haryana – 122 002, India'
const SUPPORT_EMAIL       = 'support@zingdates.com'
const SUPPORT_PHONE       = '+91 94664 40136'
const GRIEVANCE_OFFICER   = 'Sachin Rao'
const GRIEVANCE_EMAIL     = 'support@zingdates.com'
const GRIEVANCE_PHONE     = '+91 94664 40136'
const BUSINESS_HOURS      = 'Monday – Saturday, 10:00 AM – 7:00 PM IST'

const EMPTY = { name: '', email: '', subject: '', message: '' }

function ContactForm() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // Clear the field-level error as the user edits it.
    setErrors(prev => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.name.trim())    next.name = 'Please enter your name'
    if (!form.email.trim())   next.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address'
    if (!form.subject.trim()) next.subject = 'Please choose a subject'
    if (form.message.trim().length < 10) next.message = 'Message must be at least 10 characters'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate()
    if (Object.keys(found).length) { setErrors(found); return }

    setSubmitting(true)
    setErrors({})
    try {
      await contactApi.submit(form)
      setSent(true)
      toast.success('Message sent — thank you!')
    } catch (err) {
      if (err instanceof ApiError) {
        // Surface Laravel field validation errors (422) inline.
        const fieldErrors = err.body?.errors as Record<string, string[]> | undefined
        if (fieldErrors) {
          setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])))
        }
        toast.error(err.message || 'Could not send your message')
      } else {
        toast.error('Network error — please try again')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-brand flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
        <p className="text-gray-500 mb-6">Thanks for reaching out — our team typically responds within 1–2 business days. You can also email us anytime at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 font-medium">{SUPPORT_EMAIL}</a></p>
        <button onClick={() => { setForm(EMPTY); setSent(false) }} className="text-sm text-gray-500 underline">Send another message</button>
      </div>
    )
  }

  const fieldClass = (name: string) =>
    `w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-sm text-gray-800 ${
      errors[name]
        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
        : 'border-gray-200 focus:ring-pink-300 focus:border-pink-400'
    }`

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name <span className="text-pink-500">*</span></label>
          <input
            name="name" value={form.name} onChange={handleChange}
            placeholder="Rahul Sharma" className={fieldClass('name')}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-pink-500">*</span></label>
          <input
            name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="you@example.com" className={fieldClass('email')}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-pink-500">*</span></label>
        <select
          name="subject" value={form.subject} onChange={handleChange}
          className={`${fieldClass('subject')} bg-white`}
        >
          <option value="">Select a topic…</option>
          <option value="Account Issue">Account Issue</option>
          <option value="Payment / Refund">Payment / Refund</option>
          <option value="Report a User">Report a User</option>
          <option value="Companion Booking">Companion Booking</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Privacy Request">Privacy / Data Request</option>
          <option value="Partnership / Business">Partnership / Business</option>
          <option value="Other">Other</option>
        </select>
        {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-pink-500">*</span></label>
        <textarea
          name="message" rows={5} value={form.message} onChange={handleChange}
          placeholder="Describe your issue or question in detail…"
          className={`${fieldClass('message')} resize-none`}
        />
        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
      </div>
      <button type="submit" disabled={submitting}
        className="w-full gradient-brand text-white font-semibold py-3 rounded-xl shadow-brand hover:opacity-90 transition-opacity text-sm disabled:opacity-60 flex items-center justify-center gap-2">
        {submitting && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
      <p className="text-xs text-gray-400 text-center">We typically respond within 1–2 business days.</p>
    </form>
  )
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-11 h-11 gradient-brand rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <div className="pt-28 pb-12" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fdf4ff 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-pink-100 text-pink-600 text-sm font-medium mb-5 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              We're here to help
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Contact <span className="gradient-brand-text">Us</span></h1>
            <p className="text-lg text-gray-500">
              Have a question, issue, or just want to say hello? Reach out — our support team typically responds within <strong>1–2 business days</strong>.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Left: Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Get in touch</h2>

              <InfoCard title="Email Support" icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              }>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 font-medium hover:underline">{SUPPORT_EMAIL}</a>
                <p className="text-gray-400 text-xs mt-0.5">For all general inquiries, account issues, and feedback</p>
              </InfoCard>

              <InfoCard title="Phone / WhatsApp" icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              }>
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="text-pink-600 font-medium hover:underline">{SUPPORT_PHONE}</a>
                <p className="text-gray-400 text-xs mt-0.5">{BUSINESS_HOURS}</p>
              </InfoCard>

              <InfoCard title="Registered Office" icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              }>
                <p className="font-semibold text-gray-900">{COMPANY_LEGAL_NAME}</p>
                <p className="text-gray-500 mt-0.5">{REGISTERED_ADDRESS}</p>
              </InfoCard>

              {/* Grievance Officer — required under India IT Act 2000 Rules */}
              <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100">
                <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-2">Grievance Officer</p>
                <p className="text-sm text-gray-700 mb-1">
                  In accordance with the Information Technology Act, 2000 and Rules made thereunder,
                  the name and contact details of the Grievance Officer are provided below:
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-600">{GRIEVANCE_OFFICER}</span></p>
                  <p><span className="font-medium text-gray-700">Designation:</span> <span className="text-gray-600">Grievance Officer</span></p>
                  <p><span className="font-medium text-gray-700">Email:</span> <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-pink-600 hover:underline">{GRIEVANCE_EMAIL}</a></p>
                  <p><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-600">{GRIEVANCE_PHONE}</span></p>
                  <p className="text-xs text-gray-400 mt-2">Grievances are acknowledged within 24 hours and resolved within 30 days as required by law.</p>
                </div>
              </div>

              {/* Quick links */}
              <div className="p-5 bg-gray-50 rounded-2xl">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Privacy Policy', href: '/privacy' },
                    { label: 'Terms of Service', href: '/terms' },
                    { label: 'Refund Policy', href: '/refund' },
                  ].map(l => (
                    <Link key={l.label} href={l.href}
                      className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-pink-600 hover:border-pink-200 transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h2>
              <p className="text-sm text-gray-400 mb-6">Fill the form below and we'll get back to you shortly.</p>
              <ContactForm />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="rounded-3xl gradient-brand p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Need urgent help?</h3>
            <p className="opacity-90 mb-6">For payment issues, account recovery, or safety concerns, email us directly with your transaction ID for fastest response.</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Urgent Support Request`}
              className="inline-block bg-white text-pink-600 font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-shadow text-sm"
            >
              Email Support Now →
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
