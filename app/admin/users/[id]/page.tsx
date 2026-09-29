'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import UserDetail from '@/components/admin/users/UserDetail'
import type { ApiUser } from '@/components/admin/users/shared'

/** /admin/users/[id] — one user in full, with every admin action. */
export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const token = useAuthStore(s => s.token) ?? ''
  const [user, setUser] = useState<ApiUser | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await usersApi.get(token, Number(id))
      setUser(res?.user ?? res?.data ?? null)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not load this user.')
    }
  }, [token, id])

  useEffect(() => { if (token) load() }, [token, load])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/users" className="text-sm font-medium text-gray-500 hover:text-pink-600">&larr; All users</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{user?.name || 'User'}</h1>
        </div>
        {user && (
          <Link href={`/admin/users/${user.id}/edit`}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:opacity-90">
            Edit user
          </Link>
        )}
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
        <UserDetail
          user={user} token={token}
          onChanged={load}
          onDeleted={() => { toast.success('User deleted.'); router.push('/admin/users') }}
        />
      )}
    </div>
  )
}
