'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import UserEditForm from '@/components/admin/users/UserEditForm'
import type { ApiUser } from '@/components/admin/users/shared'

/** /admin/users/[id]/edit — the edit form on its own page. */
export default function UserEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''
  const [user, setUser] = useState<ApiUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let alive = true
    usersApi.get(token, Number(id))
      .then(res => { if (alive) setUser(res?.user ?? res?.data ?? null) })
      .catch(err => { if (alive) setError(err instanceof Error && err.message ? err.message : 'Could not load this user.') })
    return () => { alive = false }
  }, [token, id])

  const back = `/admin/users/${id}`

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Link href={back} className="text-sm font-medium text-gray-500 hover:text-pink-600">&larr; Back to {user?.name || 'user'}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit user</h1>
        <p className="text-sm text-gray-500 mt-0.5">Profile details, role, status and photo.</p>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <Link href="/admin/users" className="inline-block mt-4 text-sm text-pink-600 hover:underline">Back to users</Link>
        </div>
      ) : !user ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <UserEditForm
          user={user} token={token}
          onSaved={() => router.push(back)}
          onCancel={() => router.push(back)}
        />
      )}
    </div>
  )
}
