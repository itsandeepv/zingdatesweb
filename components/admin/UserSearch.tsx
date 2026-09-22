'use client'

import { useState, useEffect, useRef } from 'react'
import { usersApi } from '@/lib/api'

type Row = { id: number; name: string | null; email?: string | null; city?: string | null }

/**
 * Pick a user by typing.
 *
 * Searches as you type rather than behind a button — a field that looks like
 * a search box and does nothing until you find the button reads as broken.
 * Debounced so a five-letter name is one request, not five, and
 * sequence-guarded so a slow early response cannot overwrite a newer one.
 */
export default function UserSearch({
  token, placeholder = 'Search by name, email or phone', onPick, disabled,
}: {
  token: string
  placeholder?: string
  onPick: (user: Row) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)

  const seq = useRef(0)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setRows([]); setTouched(false); return }

    const id = ++seq.current
    setBusy(true)
    setTouched(true)

    const t = setTimeout(async () => {
      try {
        const res = await usersApi.list(token, { search: q })
        if (id !== seq.current) return          // a newer keystroke won
        setRows(((res.data ?? res ?? []) as Row[]).slice(0, 8))
      } catch {
        if (id === seq.current) setRows([])
      } finally {
        if (id === seq.current) setBusy(false)
      }
    }, 350)

    return () => clearTimeout(t)
  }, [query, token])

  return (
    <div>
      <div className="relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
        />
        {busy && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-2 border border-gray-100 rounded-lg bg-white overflow-hidden">
          {rows.length > 0 ? (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {rows.map(u => (
                <button
                  key={u.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onPick(u); setQuery(''); setRows([]) }}
                  className="w-full text-left px-3 py-2 hover:bg-pink-50 disabled:opacity-50"
                >
                  <span className="text-sm text-gray-900">{u.name ?? 'Unnamed'}</span>
                  <span className="text-xs text-gray-400 ml-2">#{u.id}</span>
                  {u.city && <span className="text-xs text-gray-400 ml-2">· {u.city}</span>}
                </button>
              ))}
            </div>
          ) : (
            // Never silently empty — "nothing matched" and "still typing"
            // look identical otherwise.
            <p className="px-3 py-2.5 text-sm text-gray-400">
              {busy ? 'Searching…' : touched ? 'No users match that.' : ''}
            </p>
          )}
        </div>
      )}

      {query.trim().length === 1 && (
        <p className="text-xs text-gray-400 mt-1">Keep typing — at least 2 characters.</p>
      )}
    </div>
  )
}
