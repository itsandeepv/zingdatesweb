'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { seoApi } from '@/lib/api'
import { SITE_URL } from '@/lib/site'

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
        data.forEach((p: any) => {
          init[p.id] = {
            title: p.title ?? '', description: p.description ?? '', keywords: p.keywords ?? '',
            og_title: p.og_title ?? '', og_description: p.og_description ?? '', og_image: p.og_image ?? '',
            geo_region: p.geo_region ?? '', geo_placename: p.geo_placename ?? '', geo_position: p.geo_position ?? '',
          }
        })
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

  // The live sitemap is built by the website on every request (app/sitemap.ts)
  // from the blog, podcast and event APIs — there is nothing to "generate".
  // This checks it is reachable and well-formed and says how many URLs it lists.
  const [sitemapInfo, setSitemapInfo] = useState<{ urls: number; checkedAt: string } | null>(null)
  async function handleCheckSitemap() {
    setGenerating(true)
    try {
      const res = await fetch(`${SITE_URL}/sitemap.xml`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Sitemap answered ${res.status}`)
      const xml = await res.text()
      const urls = (xml.match(/<loc>/g) ?? []).length
      if (!xml.includes('<urlset') || urls === 0) throw new Error('Sitemap is empty or not valid XML')
      setSitemapInfo({ urls, checkedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) })
      toast.success(`Sitemap is live with ${urls} URLs`)
    } catch (err: any) { toast.error(err.message || 'Could not read the sitemap') }
    finally { setGenerating(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage meta titles, descriptions, and keywords for each page</p>
        </div>
        <div className="flex items-center gap-2">
          {sitemapInfo && (
            <span className="text-xs text-gray-500">{sitemapInfo.urls} URLs · checked {sitemapInfo.checkedAt}</span>
          )}
          <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener"
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
            Open sitemap
          </a>
          <button onClick={handleCheckSitemap} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-brand shadow-brand hover:opacity-90 disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {generating ? 'Checking...' : 'Check sitemap'}
          </button>
        </div>
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

                {/* Social card + geo tags. Blank falls back to the meta title/description above. */}
                <details className="group rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 select-none">
                    Social sharing &amp; geo tags <span className="font-normal text-gray-400">(optional)</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">OG Title</label>
                        <input type="text" value={edits[p.id]?.og_title ?? ''} onChange={e => setField(p.id, 'og_title', e.target.value)}
                          placeholder="Defaults to the meta title"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200" />
                        <p className="text-xs text-gray-400 mt-0.5">{(edits[p.id]?.og_title ?? '').length}/60 characters</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">OG Image URL</label>
                        <input type="text" value={edits[p.id]?.og_image ?? ''} onChange={e => setField(p.id, 'og_image', e.target.value)}
                          placeholder="/og-image.jpg or https://…  (1200×630)"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">OG Description</label>
                      <textarea value={edits[p.id]?.og_description ?? ''} onChange={e => setField(p.id, 'og_description', e.target.value)}
                        rows={2} placeholder="Defaults to the meta description"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
                      <p className="text-xs text-gray-400 mt-0.5">{(edits[p.id]?.og_description ?? '').length}/160 characters</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Geo region</label>
                        <input type="text" value={edits[p.id]?.geo_region ?? ''} onChange={e => setField(p.id, 'geo_region', e.target.value.toUpperCase())}
                          placeholder="IN or IN-HR"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-pink-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Geo place name</label>
                        <input type="text" value={edits[p.id]?.geo_placename ?? ''} onChange={e => setField(p.id, 'geo_placename', e.target.value)}
                          placeholder="Gurugram"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Geo position</label>
                        <input type="text" value={edits[p.id]?.geo_position ?? ''} onChange={e => setField(p.id, 'geo_position', e.target.value)}
                          placeholder="28.4595;77.0266"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-pink-200" />
                      </div>
                    </div>
                  </div>
                </details>
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
