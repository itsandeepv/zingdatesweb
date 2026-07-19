'use client'
import { create } from 'zustand'
import { notifApi, chatApi, companionApi } from '@/lib/api'
import type { AuthUser } from '@/lib/store/auth'

/**
 * Nav badge counts — shared by the desktop sidebar and the mobile bottom nav.
 * Not persisted: these are live counts, stale values on reload look worse than
 * a brief empty state.
 */
interface BadgeState {
  notifications: number
  chats: number
  companionRequests: number
  refresh: (token: string) => Promise<void>
  clearNotifications: () => void
  reset: () => void
}

export const useBadgeStore = create<BadgeState>()((set) => ({
  notifications: 0,
  chats: 0,
  companionRequests: 0,

  refresh: async (token) => {
    if (!token) return

    // Independent sources — one failing must not blank the others.
    const [notif, chats, stats] = await Promise.allSettled([
      notifApi.unreadCount(token),
      chatApi.list(token),
      companionApi.creatorStats(token),
    ])

    if (notif.status === 'fulfilled') {
      set({ notifications: Number(notif.value) || 0 })
    }

    if (chats.status === 'fulfilled') {
      const total = (chats.value ?? []).reduce(
        (sum: number, c: any) => sum + (Number(c?.unread) || 0), 0
      )
      set({ chats: total })
    }

    // Non-creators get a 404 ("Companion mode not enabled") — expected, no badge.
    set({
      companionRequests: stats.status === 'fulfilled'
        ? Number((stats.value as any)?.stats?.pending_requests) || 0
        : 0,
    })
  },

  clearNotifications: () => set({ notifications: 0 }),
  reset: () => set({ notifications: 0, chats: 0, companionRequests: 0 }),
}))

/** Fields a user must fill before we stop nagging them with the profile dot. */
const REQUIRED_PROFILE_FIELDS: (keyof AuthUser)[] = ['name', 'dob', 'gender']

export function isProfileComplete(user: AuthUser | null): boolean {
  if (!user) return true // not loaded / logged out — don't flash a dot
  if (!user.photo) return false
  return REQUIRED_PROFILE_FIELDS.every((f) => {
    const v = user[f]
    return v !== null && v !== undefined && String(v).trim() !== ''
  })
}
