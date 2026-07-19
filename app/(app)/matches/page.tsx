'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { matchApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { triggerPlanModal } from '@/components/NoPlanModal'
import type { AppUser } from '@/lib/types'
import UserAvatar from '@/components/UserAvatar'

export default function MatchesPage() {
  const { token, user } = useAuthStore()
  const isPremium = !!user?.is_premium
  const [matches, setMatches] = useState<AppUser[]>([])
  const [likedMe, setLikedMe] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    load()
  }, [token])

  async function load() {
    setLoading(true)
    try {
      const t = token!
      const [m, l] = await Promise.allSettled([
        matchApi.list(t),
        matchApi.likedMe(t),
      ])
      if (m.status === 'fulfilled') {
        setMatches(m.value ?? [])
      } else {
        const err = m.reason as any
        if (err?.status === 402 || err?.needPlan) triggerPlanModal('like')
        else toast.error('Failed to load matches')
      }
      if (l.status === 'fulfilled') {
        setLikedMe(l.value ?? [])
      }
      // likedMe 402 is expected for free users — data is blurred server-side, no toast
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Matches</h1>

      {/* Liked you */}
      {likedMe.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-gray-800">Liked You</span>
            <span className="gradient-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">{likedMe.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {likedMe.map(u => {
              const blurred = !isPremium || (u as any).blurred
              return (
                <button
                  key={u.id}
                  onClick={() => { if (blurred) triggerPlanModal('like') }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                >
                  <div className="relative">
                    {/* Avatar with blur for free users */}
                    <div className={blurred ? 'blur-sm pointer-events-none select-none' : ''}>
                      <UserAvatar src={u.photo} name={u.name} gender={(u as any).gender} size={68} online={u.is_online} />
                    </div>
                    {/* Heart badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gradient-brand flex items-center justify-center border-2 border-white z-10">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    {/* Lock overlay for blurred */}
                    {blurred && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity="0.9">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center max-w-[64px] truncate ${blurred ? 'blur-sm text-gray-400 select-none' : 'text-gray-700'}`}>
                    {blurred ? '••••' : u.name.split(' ')[0]}
                  </span>
                  {blurred && (
                    <span className="text-[10px] text-pink-500 font-semibold -mt-1">Upgrade</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Mutual matches */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-bold text-gray-800">Your Matches</span>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{matches.length}</span>
        </div>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="text-5xl">💫</div>
            <p className="font-bold text-gray-800">No matches yet</p>
            <p className="text-sm text-gray-500">Start liking profiles to get matches</p>
            <Link href="/discover" className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl text-sm mt-1">
              Discover People
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(u => (
              <Link
                key={u.id}
                href="/chat"
                onClick={e => { if (!isPremium) { e.preventDefault(); triggerPlanModal('chat') } }}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 hover:shadow-md transition-shadow"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
              >
                <UserAvatar src={u.photo} name={u.name} gender={(u as any).gender} size={52} online={u.is_online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                    {u.is_premium && (
                      <span className="gradient-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {u.plan_type === 'vip' ? 'VIP' : 'PRO'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{u.about ?? u.bio ?? 'No bio yet'}</p>
                  {u.age && <p className="text-xs text-gray-400 mt-0.5">{u.age} years • {u.gender}</p>}
                </div>
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
