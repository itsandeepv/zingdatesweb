'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Search box for the events list.
 *
 * The query lives in the URL rather than in local state, so a search is
 * shareable, survives the back button, and composes with the category chips
 * instead of fighting them. Typing is debounced — the list is server-rendered,
 * so a request per keystroke would be a request per keystroke.
 */
export default function EventSearch({ placeholder = 'Search events, trips, parties…' }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const urlQuery = params.get('search') ?? ''
  const [q, setQ] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  const typed = useRef(false)

  // Follow the URL when it changes from somewhere else — a category chip, the
  // back button. Adjusted during render rather than in an effect, which is the
  // React-recommended shape for "reset state when an input changes" and avoids
  // the extra pass an effect would cost. Our own pushes land here too, but by
  // then the value already matches, so nothing is overwritten mid-typing.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    setQ(urlQuery)
  }

  useEffect(() => {
    if (!typed.current) return          // don't rewrite the URL on first paint
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      const v = q.trim()
      if (v) next.set('search', v)
      else next.delete('search')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 350)
    return () => clearTimeout(t)
    // `params` is read inside the timeout only to preserve the other filters;
    // re-running on every param change would re-fire the search needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pathname, router])

  return (
    <div className="relative">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={e => { typed.current = true; setQ(e.target.value) }}
        placeholder={placeholder}
        aria-label="Search events"
        className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white transition-all"
      />
      {q && (
        <button
          type="button"
          onClick={() => { typed.current = true; setQ('') }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
