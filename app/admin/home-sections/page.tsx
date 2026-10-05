'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { homeSectionsApi, bannersApi, type HomeSection, type AppBanner } from '@/lib/api'

/**
 * The "What are you looking for today?" screen, edited.
 *
 * Everything the app draws on that screen is a row here — the words, the photo
 * behind each card, where it goes, and what it counts. The app knows none of
 * the cards by name, so adding a fourth is a row, not a release.
 */

const fieldClass =
  'mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300'

const LABEL = 'text-xs font-semibold text-gray-500 uppercase tracking-wide'

/** What each counter source means, in the admin's words rather than the column's. */
const COUNTER_HELP: Record<string, string> = {
  none: 'No number on the card',
  online_users: 'Members online right now',
  event_members: 'Members who have saved an event',
  companions: 'Approved companions',
  custom: 'Your own text (below)',
}

const emptyDraft: Partial<HomeSection> = {
  key: '', title: '', subtitle: '', route: 'MainTabs',
  icon: 'heart', gradient_from: '#E9218C', gradient_to: '#8B2FC9', accent_color: '#E9218C',
  counter_source: 'none', counter_label: '', counter_text: '',
  show_avatars: true, sort_order: 0, is_active: true,
}

/** A card as the app will draw it, so the admin is not editing blind. */
function CardPreview({ s, counts }: { s: Partial<HomeSection>; counts: Record<string, number> }) {
  const counter =
    s.counter_source === 'custom' ? (s.counter_text || '')
    : s.counter_source && s.counter_source !== 'none' ? String(counts[s.counter_source] ?? 0)
    : ''

  return (
    <div className="relative h-[108px] rounded-2xl overflow-hidden shadow-sm"
      style={{ background: `linear-gradient(135deg, ${s.gradient_from ?? '#E9218C'}, ${s.gradient_to ?? '#8B2FC9'})` }}>
      {s.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* The same scrim the app draws, so what is previewed is what ships. */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.70), rgba(0,0,0,0.28), rgba(0,0,0,0.05))' }} />
      <div className="relative h-full flex items-center gap-3 px-4">
        <div className="w-10 h-10 rounded-full bg-white shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-white font-extrabold text-lg truncate">{s.title || 'Card title'}</p>
          {s.subtitle && <p className="text-white/90 text-xs truncate">{s.subtitle}</p>}
          {counter && (
            <p className="text-white text-[11px] font-bold mt-1 truncate">
              {counter} {s.counter_label}
            </p>
          )}
        </div>
        <div className="w-8 h-8 rounded-full shrink-0" style={{ background: s.accent_color ?? '#E9218C' }} />
      </div>
    </div>
  )
}

function SectionEditor({
  row, routes, counterSources, counts, token, onChanged,
}: {
  row: HomeSection
  routes: string[]
  counterSources: string[]
  counts: Record<string, number>
  token: string
  onChanged: () => void
}) {
  const [draft, setDraft] = useState<HomeSection>(row)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof HomeSection>(k: K, v: HomeSection[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  async function save() {
    setBusy(true)
    try {
      const { section } = await homeSectionsApi.update(token, row.id, draft)
      setDraft(section)
      toast.success('Saved — the app shows this on its next open')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally { setBusy(false) }
  }

  async function upload(file: File) {
    setBusy(true)
    try {
      // The saved row comes back from the call, so the preview updates from
      // the server's answer rather than from an effect watching props.
      const { section } = await homeSectionsApi.setImage(token, row.id, { file })
      setDraft(section)
      toast.success('Background updated')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally { setBusy(false) }
  }

  async function clearImage() {
    setBusy(true)
    try {
      const { section } = await homeSectionsApi.clearImage(token, row.id)
      setDraft(section)
      toast.success('Background removed — the card falls back to its gradient')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove')
    } finally { setBusy(false) }
  }

  async function remove() {
    if (!confirm(`Delete the "${row.title}" card? Its background image goes too.`)) return
    setBusy(true)
    try {
      await homeSectionsApi.remove(token, row.id)
      toast.success('Card removed')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete')
    } finally { setBusy(false) }
  }

  return (
    <div className="px-6 py-5 border-b border-gray-100 last:border-b-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview + background */}
        <div>
          <CardPreview s={draft} counts={counts} />

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
            <button onClick={() => fileRef.current?.click()} disabled={busy}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50">
              {draft.image ? 'Replace background' : 'Upload background'}
            </button>
            {draft.image && (
              <button onClick={clearImage} disabled={busy}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Remove
              </button>
            )}
            <label className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
              <input type="checkbox" checked={draft.is_active}
                onChange={e => set('is_active', e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-pink-400" />
              Show in the app
            </label>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Wide photo, around 1200×800. Text sits on the left, so keep faces to the right.
          </p>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2">
            <span className={LABEL}>Title</span>
            <input value={draft.title} onChange={e => set('title', e.target.value)} className={fieldClass} />
          </label>
          <label className="block col-span-2">
            <span className={LABEL}>Subtitle</span>
            <input value={draft.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)}
              placeholder="Chat • Connect • Make Friends" className={fieldClass} />
          </label>

          <label className="block">
            <span className={LABEL}>Opens</span>
            <select value={draft.route} onChange={e => set('route', e.target.value)} className={fieldClass}>
              {routes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Order</span>
            <input type="number" value={draft.sort_order}
              onChange={e => set('sort_order', Number(e.target.value))} className={fieldClass} />
          </label>

          <label className="block">
            <span className={LABEL}>Number shows</span>
            <select value={draft.counter_source} onChange={e => set('counter_source', e.target.value)} className={fieldClass}>
              {counterSources.map(c => <option key={c} value={c}>{COUNTER_HELP[c] ?? c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>{draft.counter_source === 'custom' ? 'Your text' : 'Number label'}</span>
            {draft.counter_source === 'custom' ? (
              <input value={draft.counter_text ?? ''} onChange={e => set('counter_text', e.target.value)}
                placeholder="₹50 per friend" className={fieldClass} />
            ) : (
              <input value={draft.counter_label ?? ''} onChange={e => set('counter_label', e.target.value)}
                placeholder="Online Now" className={fieldClass} />
            )}
          </label>

          <label className="block">
            <span className={LABEL}>Icon</span>
            <input value={draft.icon} onChange={e => set('icon', e.target.value)}
              placeholder="heart" className={fieldClass + ' font-mono'} />
          </label>
          <label className="block">
            <span className={LABEL}>Key</span>
            <input value={draft.key} onChange={e => set('key', e.target.value)}
              className={fieldClass + ' font-mono'} />
          </label>

          <label className="block">
            <span className={LABEL}>Gradient from</span>
            <input type="color" value={draft.gradient_from}
              onChange={e => set('gradient_from', e.target.value)} className={fieldClass + ' h-10 p-1'} />
          </label>
          <label className="block">
            <span className={LABEL}>Gradient to</span>
            <input type="color" value={draft.gradient_to}
              onChange={e => set('gradient_to', e.target.value)} className={fieldClass + ' h-10 p-1'} />
          </label>
          <label className="block">
            <span className={LABEL}>Arrow colour</span>
            <input type="color" value={draft.accent_color}
              onChange={e => set('accent_color', e.target.value)} className={fieldClass + ' h-10 p-1'} />
          </label>
          <label className="flex items-end gap-2 text-sm text-gray-600 pb-2">
            <input type="checkbox" checked={draft.show_avatars}
              onChange={e => set('show_avatars', e.target.checked)}
              className="rounded border-gray-300 text-brand focus:ring-pink-400" />
            Show member faces
          </label>

          <div className="col-span-2 flex items-center gap-3 pt-1">
            <button onClick={save} disabled={busy}
              className="rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={remove} disabled={busy}
              className="ml-auto text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
              Delete card
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The artwork behind a screen's header.
 *
 * Image only — the slug names a fixed place in the app, so there is nothing to
 * add or remove, just a picture to set, swap or clear. Cleared means the app
 * falls back to the picture it ships with, which is why "Remove" is safe.
 */
function BannerRow({ banner, token, onChanged }: {
  banner: AppBanner; token: string; onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setBusy(true)
    try {
      await bannersApi.setImage(token, banner.slug, { file })
      toast.success('Header image updated')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally { setBusy(false) }
  }

  async function clear() {
    setBusy(true)
    try {
      await bannersApi.clearImage(token, banner.slug)
      toast.success("Removed — the app uses its own picture again")
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove')
    } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 border-b border-gray-100 last:border-b-0">
      <div className="relative w-full sm:w-64 h-28 rounded-xl overflow-hidden shrink-0"
        style={{ background: 'linear-gradient(135deg,#E9218C,#7B3FD4)' }}>
        {banner.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* The same scrim the app lays over it, so the preview is honest about
            how light an image will actually look under the headings. */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg,rgba(233,33,140,0.92),rgba(168,47,196,0.78),rgba(123,63,212,0.72))' }} />
        <div className="relative p-3">
          <p className="text-white font-extrabold text-lg">Events</p>
          <p className="text-white/90 text-[11px]">Meet people. Join plans. Make memories.</p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{banner.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {banner.image ? 'Using your image.' : "No image set — the app is using the picture it ships with."}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50">
            {busy ? 'Working…' : banner.image ? 'Replace image' : 'Upload image'}
          </button>
          {banner.image && (
            <button onClick={clear} disabled={busy}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Wide photo, around 1200×600. The headings sit on the left, so keep the busy part to the right.
        </p>
      </div>
    </div>
  )
}

export default function HomeSectionsPage() {
  const token = useAuthStore(s => s.token) ?? ''

  const [sections, setSections] = useState<HomeSection[]>([])
  const [routes, setRoutes] = useState<string[]>([])
  const [counterSources, setCounterSources] = useState<string[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [heading, setHeading] = useState('')
  const [subheading, setSubheading] = useState('')
  const [banners, setBanners] = useState<AppBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPage, setSavingPage] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Partial<HomeSection>>(emptyDraft)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await homeSectionsApi.list(token)
      setSections(res.sections ?? [])
      setRoutes(res.routes ?? [])
      setCounterSources(res.counter_sources ?? [])
      setCounts(res.counts ?? {})
      setHeading(res.heading ?? '')
      setSubheading(res.subheading ?? '')

      // Separate call, separate failure: a banner that will not load must not
      // take the cards down with it.
      try {
        const b = await bannersApi.list(token)
        setBanners(b.banners ?? [])
      } catch { /* the section below just stays empty */ }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load')
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  async function savePage() {
    setSavingPage(true)
    try {
      await homeSectionsApi.savePage(token, { heading, subheading })
      toast.success('Saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally { setSavingPage(false) }
  }

  async function createSection() {
    if (!draft.key?.trim() || !draft.title?.trim()) {
      toast.error('A key and a title are required')
      return
    }
    setCreating(true)
    try {
      await homeSectionsApi.create(token, { ...draft, sort_order: sections.length + 1 })
      toast.success('Card added')
      setDraft(emptyDraft)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create')
    } finally { setCreating(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App screens</h1>
        <p className="text-sm text-gray-500 mt-1">
          The welcome screen someone sees after signing up, and the artwork behind other screens&apos; headers.
          Changes reach the app the next time a screen opens — no update needed.
        </p>
      </div>

      {/* The words above the cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className={LABEL}>Heading</span>
            <input value={heading} onChange={e => setHeading(e.target.value)}
              placeholder="What are you looking for today?" className={fieldClass} />
          </label>
          <label className="block">
            <span className={LABEL}>Subheading</span>
            <input value={subheading} onChange={e => setSubheading(e.target.value)}
              placeholder="Optional" className={fieldClass} />
          </label>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Leave the heading blank to use the default, &ldquo;What are you looking for today?&rdquo;
        </p>
        <button onClick={savePage} disabled={savingPage}
          className="mt-3 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2">
          {savingPage ? 'Saving…' : 'Save heading'}
        </button>
      </div>

      {/* Screen header artwork */}
      {banners.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Screen headers</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The picture behind a screen&apos;s title. Remove it and the app goes back to its own.
            </p>
          </div>
          {banners.map(b => (
            <BannerRow key={b.slug} banner={b} token={token} onChanged={load} />
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Cards</h2>
          <p className="text-xs text-gray-500 mt-0.5">Shown in the order below. Turn one off to hide it without deleting it.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : sections.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No cards yet — add one below.</p>
        ) : (
          sections.map(s => (
            <SectionEditor key={s.id} row={s} routes={routes} counterSources={counterSources}
              counts={counts} token={token} onChanged={load} />
          ))
        )}

        {/* Add */}
        <div className="px-6 py-5 bg-gray-50/60 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Add a card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <label className="block sm:col-span-3">
              <span className={LABEL}>Key</span>
              <input value={draft.key ?? ''}
                onChange={e => setDraft(d => ({ ...d, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                placeholder="refer" className={fieldClass + ' font-mono'} />
            </label>
            <label className="block sm:col-span-4">
              <span className={LABEL}>Title</span>
              <input value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Invite Friends" className={fieldClass} />
            </label>
            <label className="block sm:col-span-3">
              <span className={LABEL}>Opens</span>
              <select value={draft.route ?? 'MainTabs'} onChange={e => setDraft(d => ({ ...d, route: e.target.value }))}
                className={fieldClass}>
                {routes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2 flex items-end">
              <button onClick={createSection} disabled={creating}
                className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2">
                {creating ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            The background photo and colours are set on the card once it exists.
          </p>
        </div>
      </div>
    </div>
  )
}
