'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { contentApi } from '@/lib/api'

/* ── helpers ─────────────────────────────────── */
function slugify(str: string) {
  return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}
function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── status badge ─────────────────────────────── */
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

/* ══════════════════════════════════════════════
   TAB 1 — Blog Posts
══════════════════════════════════════════════ */
const EMPTY_POST = {
  title: '', excerpt: '', body: '', category: '', tags: '',
  cover_image: '', status: 'draft' as string,
  meta_title: '', meta_description: '',
}

function BlogTab({ token }: { token: string }) {
  const [posts, setPosts]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm]           = useState({ ...EMPTY_POST })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await contentApi.blog(token)
      const list = res?.data ?? res ?? []
      setPosts(Array.isArray(list) ? list : [])
    } catch (e: any) { toast.error(e.message || 'Failed to load posts') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_POST })
    setShowForm(true)
  }

  function openEdit(post: any) {
    setEditing(post)
    setForm({
      title:            post.title ?? '',
      excerpt:          post.excerpt ?? '',
      body:             post.body ?? post.content ?? '',
      category:         post.category ?? '',
      tags:             Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags ?? ''),
      cover_image:      post.cover_image ?? '',
      status:           post.status ?? 'draft',
      meta_title:       post.meta_title ?? '',
      meta_description: post.meta_description ?? '',
    })
    setShowForm(true)
  }

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    try {
      if (editing) {
        const res = await contentApi.updatePost(token, editing.id, payload)
        setPosts(p => p.map(x => x.id === editing.id ? { ...x, ...(res?.data ?? res) } : x))
        toast.success('Post updated')
      } else {
        const res = await contentApi.createPost(token, payload)
        setPosts(p => [...p, res?.data ?? res])
        toast.success('Post created')
      }
      setShowForm(false)
    } catch (e: any) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this post permanently?')) return
    setDeleting(id)
    try {
      await contentApi.deletePost(token, id)
      setPosts(p => p.filter(x => x.id !== id))
      toast.success('Post deleted')
    } catch (e: any) { toast.error(e.message || 'Failed to delete') }
    finally { setDeleting(null) }
  }

  const filtered = posts.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const slugPreview = slugify(form.title)

  return (
    <div className="space-y-5">
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
          <input
            type="text" placeholder="Search posts..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editing ? 'Edit Post' : 'New Blog Post'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left — main content */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
                  <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200}
                    placeholder="Enter post title..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  {form.title && (
                    <p className="text-xs text-gray-400 mt-1">Slug: <span className="font-mono text-pink-600">{slugPreview}</span></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Excerpt</label>
                  <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} maxLength={500}
                    placeholder="Short summary (max 500 chars)..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
                  <p className="text-xs text-gray-400 text-right mt-0.5">{form.excerpt.length}/500</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Body *</label>
                  <textarea value={form.body} onChange={e => set('body', e.target.value)} required rows={10}
                    placeholder="Write your blog post content here..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-y font-mono" />
                </div>
              </div>

              {/* Right — meta */}
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
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <input type="text" value={form.category} onChange={e => set('category', e.target.value)}
                    placeholder="e.g. Tips, News, Events"
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
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
                {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                {editing ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Blog Posts <span className="text-gray-400 text-sm font-normal">({filtered.length})</span></h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm font-medium">No posts found</p>
            <p className="text-xs mt-1">Create your first blog post to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-3">
                        {post.cover_image && (
                          <img src={post.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{post.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{post.slug ?? slugify(post.title)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={post.status} /></td>
                    <td className="px-4 py-4">
                      {post.category
                        ? <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-600 font-medium">{post.category}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-4 text-gray-600">{post.views_count ?? 0}</td>
                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{fmtDate(post.published_at ?? post.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(post)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                          className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors disabled:opacity-40">
                          {deleting === post.id ? '...' : 'Delete'}
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

/* ══════════════════════════════════════════════
   TAB 2 — Static Pages
══════════════════════════════════════════════ */
function PagesTab({ token }: { token: string }) {
  const [pages, setPages]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState({ content: '', status: 'published' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await contentApi.pages(token)
      const list = res?.data ?? res ?? []
      setPages(Array.isArray(list) ? list : [])
    } catch (e: any) { toast.error(e.message || 'Failed to load pages') }
    finally { setLoading(false) }
  }

  function openEdit(page: any) {
    setEditing(page)
    setForm({ content: page.content ?? '', status: page.status ?? 'published' })
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    try {
      const res = await contentApi.updatePage(token, editing.id, form)
      setPages(p => p.map(x => x.id === editing.id ? { ...x, ...(res?.data ?? res) } : x))
      toast.success(`"${editing.title}" updated`)
      setEditing(null)
    } catch (e: any) { toast.error(e.message || 'Failed to update page') }
    finally { setSaving(false) }
  }

  const PAGE_ICONS: Record<string, string> = {
    about: '👋', privacy: '🔒', terms: '📄', faq: '❓', contact: '✉️', home: '🏠',
  }

  return (
    <div className="space-y-5">
      {/* Edit panel */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Editing: {editing.title}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">/{editing.slug}</p>
            </div>
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Page Content</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={18} required
                placeholder="Page content (HTML or Markdown supported)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-200 resize-y" />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
                {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                Save Page
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pages list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Static Pages</h2>
          <p className="text-xs text-gray-400 mt-0.5">Edit content for your platform's public pages</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No pages found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pages.map(page => {
              const icon = PAGE_ICONS[page.key?.toLowerCase()] ?? '📝'
              return (
                <div key={page.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl gradient-brand-soft flex items-center justify-center text-xl flex-shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{page.title}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">/{page.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={page.status ?? 'published'} />
                    <p className="text-xs text-gray-400">{fmtDate(page.updated_at)}</p>
                    <button onClick={() => openEdit(page)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 3 — Media Library
══════════════════════════════════════════════ */
function MediaTab({ token }: { token: string }) {
  const [media, setMedia]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [folder, setFolder]     = useState('')
  const fileRef                 = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await contentApi.media(token)
      const list = res?.data ?? res ?? []
      setMedia(Array.isArray(list) ? list : [])
    } catch (e: any) { toast.error(e.message || 'Failed to load media') }
    finally { setLoading(false) }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    let uploaded = 0
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      if (folder) fd.append('folder', folder)
      try {
        const res = await contentApi.uploadMedia(token, fd)
        setMedia(m => [...m, res?.data ?? res])
        uploaded++
      } catch (e: any) { toast.error(`Failed to upload ${file.name}: ${e.message}`) }
    }
    if (uploaded > 0) toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this file permanently?')) return
    setDeleting(id)
    try {
      await contentApi.deleteMedia(token, id)
      setMedia(m => m.filter(x => x.id !== id))
      if (selected?.id === id) setSelected(null)
      toast.success('File deleted')
    } catch (e: any) { toast.error(e.message || 'Failed to delete') }
    finally { setDeleting(null) }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => toast.success('URL copied!'))
  }

  const isImage = (mime: string) => mime?.startsWith('image/')
  const folders = Array.from(new Set(media.map(m => m.folder).filter(Boolean))) as string[]

  return (
    <div className="space-y-5">
      {/* Upload bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Folder (optional)</label>
            <input type="text" value={folder} onChange={e => setFolder(e.target.value)}
              placeholder="e.g. blog, avatars, events"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
          </div>
          <div>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload}
              accept="image/*,video/*,application/pdf,.doc,.docx" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
              {uploading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Uploading...</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Upload Files</>
              }
            </button>
          </div>
          <button onClick={load} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            Refresh
          </button>
        </div>
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400 self-center">Folders:</span>
            {folders.map(f => (
              <span key={f} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{f}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-5">
        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm font-medium">No media uploaded yet</p>
              <p className="text-xs mt-1">Click "Upload Files" to add images, videos, and documents</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {media.map(file => (
                <div key={file.id} onClick={() => setSelected(file)}
                  className={`relative group bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${selected?.id === file.id ? 'border-pink-400 shadow-brand' : 'border-gray-100 hover:border-pink-200'}`}>
                  {isImage(file.mime_type) ? (
                    <img src={file.url} alt={file.name} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square flex flex-col items-center justify-center bg-gray-50 p-3">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-xs text-gray-400 mt-2 text-center break-all leading-tight">{file.name}</span>
                    </div>
                  )}
                  {/* hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 self-start sticky top-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">File Details</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {isImage(selected.mime_type) && (
              <img src={selected.url} alt={selected.name} className="w-full rounded-lg object-cover max-h-40" />
            )}
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="text-gray-700 font-medium break-all">{selected.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Type</p>
                <p className="text-gray-700">{selected.mime_type}</p>
              </div>
              <div>
                <p className="text-gray-400">Size</p>
                <p className="text-gray-700">{fmtBytes(selected.size_bytes ?? 0)}</p>
              </div>
              {selected.folder && (
                <div>
                  <p className="text-gray-400">Folder</p>
                  <p className="text-gray-700">{selected.folder}</p>
                </div>
              )}
              {(selected.width && selected.height) && (
                <div>
                  <p className="text-gray-400">Dimensions</p>
                  <p className="text-gray-700">{selected.width} × {selected.height}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400">Uploaded</p>
                <p className="text-gray-700">{fmtDate(selected.created_at)}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <button onClick={() => copyUrl(selected.url)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Copy URL
              </button>
              <a href={selected.url} target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Open in New Tab
              </a>
              <button onClick={() => handleDelete(selected.id)} disabled={deleting === selected.id}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                {deleting === selected.id
                  ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                }
                Delete File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════ */
const TABS = [
  { id: 'blog',  label: 'Blog Posts',    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { id: 'pages', label: 'Static Pages',  icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z' },
  { id: 'media', label: 'Media Library', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
]

export default function ContentPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [tab, setTab] = useState<'blog' | 'pages' | 'media'>('blog')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage blog posts, static pages, and media assets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'blog'  && <BlogTab  token={token} />}
      {tab === 'pages' && <PagesTab token={token} />}
      {tab === 'media' && <MediaTab token={token} />}
    </div>
  )
}
