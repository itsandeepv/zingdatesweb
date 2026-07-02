'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { seoApi } from '@/lib/api'

export default function SeoPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [edits, setEdits] = useState<Record<number, any>>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await seoApi.pages(token)
        const data = res.data ?? res ?? []
        setPages(data)
        const init: Record<number, any> = {}
        data.forEach((p: any) => { init[p.id] = { title: p.title ?? '', description: p.description ?? '', keywords: p.keywords ?? '' } })
        setEdits(init)
      } catch (err: any) { toast.error(err.message || 'Failed to load SEO pages') }
      finally { setLoading(false) }
    }
    if (token) load()
    else setLoading(false)
  }, [token])

  function setField(id: number, field: string, value: string) {
    setEdits(e => ({ ...e, [id]: { ...e[id], [field]: value } }))
  }

  async function handleSave(id: number) {
    setSaving(id)
    try {
      await seoApi.updatePage(token, id, edits[id])
      toast.success('SEO page updated')
    } catch (err: any) { toast.error(err.message || 'Failed to save') }
    finally { setSaving(null) }
  }

  async function handleGenerateSitemap() {
    setGenerating(true)
    try {
      await seoApi.generateSitemap(token)
      toast.success('Sitemap generated successfully')
    } catch (err: any) { toast.error(err.message || 'Failed to generate sitemap') }
    finally { setGenerating(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage meta titles, descriptions, and keywords for each page</p>
        </div>
        <button onClick={handleGenerateSitemap} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {generating ? 'Generating...' : 'Generate Sitemap'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" /></div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No SEO pages configured yet.</div>
      ) : (
        <div className="space-y-4">
          {pages.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{p.page_name ?? p.pageName ?? p.slug}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{p.url ?? p.slug}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                  <input type="text" value={edits[p.id]?.title ?? ''} onChange={e => setField(p.id, 'title', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  <p className="text-xs text-gray-400 mt-0.5">{(edits[p.id]?.title ?? '').length}/60 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                  <textarea value={edits[p.id]?.description ?? ''} onChange={e => setField(p.id, 'description', e.target.value)}
                    rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
                  <p className="text-xs text-gray-400 mt-0.5">{(edits[p.id]?.description ?? '').length}/160 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Keywords (comma separated)</label>
                  <input type="text" value={edits[p.id]?.keywords ?? ''} onChange={e => setField(p.id, 'keywords', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => handleSave(p.id)} disabled={saving === p.id}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
                  {saving === p.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
