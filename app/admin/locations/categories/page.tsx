'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth'
import { locationsApi } from '@/lib/api'

type Category = {
  id: number
  key: string
  label: string
  icon: string | null
  sort_order: number
  is_active: boolean
  locations: number
}

/**
 * The icons here are Ionicons names, because that is what the mobile app
 * renders them with. Offering a short list beats a free-text field that
 * silently renders nothing when someone guesses a name wrong.
 */
const ICON_CHOICES = [
  'cafe', 'restaurant', 'wine', 'bed', 'business', 'home', 'leaf', 'sunny',
  'film', 'basketball', 'trail-sign', 'bonfire', 'people', 'camera',
  'musical-notes', 'boat', 'storefront', 'library', 'ellipsis-horizontal',
]

export default function VenueCategoriesPage() {
  const token = useAuthStore(s => s.token) ?? ''
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | 'new' | null>(null)

  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState(ICON_CHOICES[0])

  const [editing, setEditing] = useState<Category | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editIcon, setEditIcon] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCats((await locationsApi.categories(token)).data ?? [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setBusy('new')
    try {
      await locationsApi.createCategory(token, { label: label.trim(), icon })
      toast.success('Venue category added')
      setLabel('')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to add') }
    finally { setBusy(null) }
  }

  async function toggle(c: Category) {
    setBusy(c.id)
    try {
      await locationsApi.updateCategory(token, c.id, { is_active: !c.is_active })
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to update') }
    finally { setBusy(null) }
  }

  async function saveEdit() {
    if (!editing) return
    setBusy(editing.id)
    try {
      await locationsApi.updateCategory(token, editing.id, { label: editLabel.trim(), icon: editIcon })
      toast.success('Venue category updated')
      setEditing(null)
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to update') }
    finally { setBusy(null) }
  }

  async function move(c: Category, direction: -1 | 1) {
    const ordered = [...cats].sort((a, b) => a.sort_order - b.sort_order)
    const i = ordered.findIndex(x => x.id === c.id)
    const swap = ordered[i + direction]
    if (!swap) return

    setBusy(c.id)
    try {
      // Swap the two sort values — the list is small and this keeps the
      // numbers stable rather than renumbering everything on every nudge.
      await locationsApi.updateCategory(token, c.id, { sort_order: swap.sort_order })
      await locationsApi.updateCategory(token, swap.id, { sort_order: c.sort_order })
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to reorder') }
    finally { setBusy(null) }
  }

  async function remove(c: Category) {
    if (c.locations > 0) {
      toast.error(`${c.locations} venue(s) use this. Turn it off instead.`)
      return
    }
    if (!confirm(`Delete "${c.label}"?`)) return
    setBusy(c.id)
    try {
      await locationsApi.deleteCategory(token, c.id)
      toast.success('Venue category deleted')
      await load()
    } catch (err: any) { toast.error(err.message || 'Failed to delete') }
    finally { setBusy(null) }
  }

  const ordered = [...cats].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/locations" className="text-xs text-gray-500 hover:text-pink-600">&larr; Locations</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Venue Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          What kind of PLACE a venue is — Cafe, Banquet Hall, Park. Separate from
          event categories, which say what you are going to DO there.
        </p>
      </div>


      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5">
        <p className="text-sm text-blue-800">
          These say what kind of <strong>place</strong> a venue is — Cafe, Banquet Hall, Park.
          They are a separate list from{' '}
          <Link href="/admin/events/categories" className="font-semibold underline">event categories</Link>
          {' '}(what people will do) and from{' '}
          <Link href="/admin/companions?tab=categories" className="font-semibold underline">companion categories</Link>.
          The same word can appear in more than one — editing here changes nothing in the others.
        </p>
      </div>
      <form onSubmit={add} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Add a category</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Live Music"
              maxLength={60}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none text-gray-700"
            >
              {ICON_CHOICES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={!label.trim() || busy === 'new'}
            className="px-5 py-2 rounded-lg gradient-brand text-white text-sm font-semibold shadow-brand disabled:opacity-50"
          >
            {busy === 'new' ? 'Adding…' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          The internal key is generated from the name and cannot be changed afterwards — the app filters on it.
        </p>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">All categories</h2>
          <span className="text-xs text-gray-400">{cats.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : ordered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No categories yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {ordered.map((c, i) => (
              <div key={c.id} className="px-6 py-3 flex items-center gap-4 flex-wrap">
                <div className="flex flex-col">
                  <button onClick={() => move(c, -1)} disabled={i === 0 || busy === c.id}
                    className="text-gray-300 hover:text-pink-600 disabled:opacity-30 leading-none" aria-label="Move up">▲</button>
                  <button onClick={() => move(c, 1)} disabled={i === ordered.length - 1 || busy === c.id}
                    className="text-gray-300 hover:text-pink-600 disabled:opacity-30 leading-none" aria-label="Move down">▼</button>
                </div>

                <div className="min-w-0 flex-1">
                  {editing?.id === c.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        maxLength={60}
                        className="px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                      <select
                        value={editIcon}
                        onChange={e => setEditIcon(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700"
                      >
                        {ICON_CHOICES.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <button onClick={saveEdit} disabled={busy === c.id}
                        className="px-3 py-1 text-xs rounded bg-green-50 border border-green-300 text-green-700 font-semibold disabled:opacity-50">Save</button>
                      <button onClick={() => setEditing(null)}
                        className="px-3 py-1 text-xs rounded border border-gray-200 text-gray-500">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-900 text-sm">{c.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <code>{c.key}</code>{c.icon ? ` · ${c.icon}` : ''} · {c.locations} venue{c.locations === 1 ? '' : 's'}
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => toggle(c)}
                  disabled={busy === c.id}
                  aria-pressed={c.is_active}
                  aria-label={`${c.label} visible in the app`}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${c.is_active ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${c.is_active ? 'translate-x-5' : ''}`} />
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditing(c); setEditLabel(c.label); setEditIcon(c.icon ?? ICON_CHOICES[0]) }}
                    className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(c)}
                    disabled={busy === c.id}
                    title={c.locations > 0 ? 'In use — turn it off instead' : 'Delete'}
                    className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
