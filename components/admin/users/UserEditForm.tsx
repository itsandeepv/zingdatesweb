'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import { type ApiUser, type EditUserForm, type PhotoMode, ROLES, GENDERS, PhotoPicker, inputCls } from './shared'

/**
 * The edit form for one user, as a page section rather than a popup.
 * `onSaved` fires after the profile (and, if changed, the photo) is stored.
 */
export default function UserEditForm({ user, token, onSaved, onCancel }: {
  user: ApiUser; token: string; onSaved: () => void; onCancel: () => void
}) {
  const [form, setForm]     = useState<EditUserForm>({
    name:   user.name   || '',
    email:  user.email  || '',
    phone:  user.phone  || '',
    role:   user.role   || 'user',
    gender: user.gender || '',
    city:   user.city   || '',
    status: user.status || 'active',
    photoUrl: user.profile_photo || '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  // Same two sources as Add: a pasted URL or an uploaded file. The photo call is
  // separate from the profile update, and only fires when something changed.
  const [photoMode, setPhotoMode] = useState<PhotoMode>('url')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  function pickFile(f: File | null) {
    setPhotoFile(f)
    setPhotoPreview(p => { if (p) URL.revokeObjectURL(p); return f ? URL.createObjectURL(f) : null })
    setErrors(e => ({ ...e, photo: '' }))
  }

  function set(field: keyof EditUserForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    const newUrl = form.photoUrl.trim()
    const urlChanged = photoMode === 'url' && newUrl !== '' && newUrl !== (user.profile_photo || '')
    if (urlChanged && !/^https?:\/\/\S+$/i.test(newUrl)) {
      errs.photo = 'Enter a full image URL starting with http:// or https://'
    }
    if (photoMode === 'upload' && photoFile && photoFile.size > 5 * 1024 * 1024) {
      errs.photo = 'Image must be 5 MB or smaller.'
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload: Record<string, any> = {
        name:   form.name.trim(),
        role:   form.role,
        status: form.status,
      }
      if (form.email.trim())  payload.email  = form.email.trim()
      if (form.phone.trim())  payload.phone  = form.phone.trim()
      if (form.gender)        payload.gender = form.gender
      if (form.city.trim())   payload.city   = form.city.trim()
      await usersApi.update(token, user.id, payload)

      const photoSource = photoMode === 'upload' && photoFile ? { file: photoFile } : urlChanged ? { url: newUrl } : null
      if (photoSource) {
        try {
          await usersApi.setPhoto(token, user.id, photoSource)
        } catch (err) {
          // The profile fields are already saved — say exactly what failed.
          const why = err instanceof Error && err.message ? `: ${err.message}` : '.'
          toast.error(`Profile saved, but the photo update failed${why}`)
          onSaved()
          return
        }
      }

      toast.success(`User "${form.name}" updated successfully.`)
      onSaved()
    } catch (err: any) {
      toast.error(err?.status === 422 ? 'Validation failed. Check the form fields.' : (err?.message ?? 'Failed to update user.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">Changes save to the account straight away.</p>
      </div>
      <form id="edit-user-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" className={inputCls(errors.name)} autoFocus />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls()}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" className={inputCls(errors.email)} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <PhotoPicker mode={photoMode} onMode={m => { setPhotoMode(m); setErrors(e => ({ ...e, photo: '' })) }}
          url={form.photoUrl} onUrl={v => set('photoUrl', v)}
          preview={photoPreview} onFile={pickFile} current={user.profile_photo} error={errors.photo} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" className={inputCls()} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls()}>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls()}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </form>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" form="edit-user-form" disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-white rounded-xl gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

