'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { podcastAdminApi } from '@/lib/api'
import { slugify } from '@/lib/site'

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft:     'bg-gray-100 text-gray-600',
    archived:  'bg-red-100 text-red-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

const EMPTY = {
  title: '', excerpt: '', show_notes: '', category: '', tags: '',
  audio_url: '', cover_image: '', duration: '', episode_number: '',
  status: 'draft' as string, meta_title: '', meta_description: '',
}

export default function AdminPodcastsPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [items, setItems]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState({ ...EMPTY })

  async function load() {
    setLoading(true)
    try {
      const res = await podcastAdminApi.list(token)
      const list = res?.data?.data ?? res?.data ?? res ?? []
      setItems(Array.isArray(list) ? list : [])
    } catch (e: any) { toast.error(e.message || 'Failed to load episodes') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) load(); else setLoading(false) }, [token])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY })
    setShowForm(true)
  }

  function openEdit(ep: any) {
    setEditing(ep)
    setForm({
      title:            ep.title ?? '',
      excerpt:          ep.excerpt ?? '',
      show_notes:       ep.show_notes ?? ep.description ?? ep.body ?? '',
      category:         ep.category ?? '',
      tags:             Array.isArray(ep.tags) ? ep.tags.join(', ') : (ep.tags ?? ''),
      audio_url:        ep.audio_url ?? '',
      cover_image:      ep.cover_image ?? '',
      duration:         ep.duration != null ? String(ep.duration) : '',
      episode_number:   ep.episode_number != null ? String(ep.episode_number) : '',
      status:           ep.status ?? 'draft',
      meta_title:       ep.meta_title ?? '',
      meta_description: ep.meta_description ?? '',
    })
    setShowForm(true)
  }

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, any> = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      episode_number: form.episode_number ? Number(form.episode_number) : null,
    }
    try {
      if (editing) {
        const res = await podcastAdminApi.update(token, editing.id, payload)
        setItems(p => p.map(x => x.id === editing.id ? { ...x, ...(res?.data ?? res) } : x))
        toast.success('Episode updated')
      } else {
        const res = await podcastAdminApi.create(token, payload)
        setItems(p => [...(res?.data ?? res ? [res?.data ?? res] : []), ...p])
        toast.success('Episode created')
      }
      setShowForm(false)
    } catch (e: any) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this episode permanently?')) return
    setDeleting(id)
    try {
      await podcastAdminApi.delete(token, id)
      setItems(p => p.filter(x => x.id !== id))
      toast.success('Episode deleted')
    } catch (e: any) { toast.error(e.message || 'Failed to delete') }
    finally { setDeleting(null) }
  }

  const filtered = items.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const slugPreview = slugify(form.title)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Podcasts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Publish and manage podcast episodes shown on your public site</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {['all', 'published', 'draft', 'archived'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 font-medium capitalize transition-colors ${filter === s ? 'gradient-brand text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-48">
          <input type="text" placeholder="Search episodes..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Episode
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editing ? 'Edit Episode' : 'New Episode'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
                  <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200}
                    placeholder="Episode title..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  {form.title && <p className="text-xs text-gray-400 mt-1">Slug: <span className="font-mono text-pink-600">{slugPreview}</span></p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Audio URL *</label>
                  <input type="url" value={form.audio_url} onChange={e => set('audio_url', e.target.value)} required
                    placeholder="https://.../episode.mp3"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  {form.audio_url && <audio controls preload="none" src={form.audio_url} className="mt-2 w-full" />}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Excerpt</label>
                  <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} maxLength={500}
                    placeholder="Short summary (max 500 chars)..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
                  <p className="text-xs text-gray-400 text-right mt-0.5">{form.excerpt.length}/500</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Show Notes</label>
                  <textarea value={form.show_notes} onChange={e => set('show_notes', e.target.value)} rows={8}
                    placeholder="Episode show notes, links, timestamps (HTML supported)..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-y font-mono" />
                </div>
              </div>

              {/* Right */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Episode #</label>
                    <input type="number" value={form.episode_number} onChange={e => set('episode_number', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration</label>
                    <input type="text" value={form.duration} onChange={e => set('duration', e.target.value)}
                      placeholder="e.g. 32:15"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <input type="text" value={form.category} onChange={e => set('category', e.target.value)}
                    placeholder="e.g. Interviews, Advice"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tags</label>
                  <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cover Image URL</label>
                  <input type="url" value={form.cover_image} onChange={e => set('cover_image', e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  {form.cover_image && (
                    <img src={form.cover_image} alt="preview" className="mt-2 w-full h-24 object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">SEO</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Meta Title <span className="text-gray-400">({form.meta_title.length}/60)</span></label>
                      <input type="text" value={form.meta_title} onChange={e => set('meta_title', e.target.value)} maxLength={60}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-200" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Meta Description <span className="text-gray-400">({form.meta_description.length}/160)</span></label>
                      <textarea value={form.meta_description} onChange={e => set('meta_description', e.target.value)} rows={2} maxLength={160}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
                {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                {editing ? 'Update Episode' : 'Publish Episode'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Episodes <span className="text-gray-400 text-sm font-normal">({filtered.length})</span></h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3 opacity-40">🎙️</div>
            <p className="text-sm font-medium">No episodes found</p>
            <p className="text-xs mt-1">Publish your first podcast episode to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Episode</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(ep => (
                  <tr key={ep.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-3">
                        {ep.cover_image
                          ? <img src={ep.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          : <div className="w-10 h-10 rounded-lg gradient-brand-soft flex items-center justify-center flex-shrink-0">🎙️</div>}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {ep.episode_number != null && <span className="text-purple-600 mr-1">EP{ep.episode_number}</span>}
                            {ep.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{ep.slug ?? slugify(ep.title)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={ep.status} /></td>
                    <td className="px-4 py-4">
                      {ep.category
                        ? <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-600 font-medium">{ep.category}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{fmtDate(ep.published_at ?? ep.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(ep)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors">Edit</button>
                        <button onClick={() => handleDelete(ep.id)} disabled={deleting === ep.id}
                          className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors disabled:opacity-40">
                          {deleting === ep.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
