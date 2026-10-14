'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Staff roles the API can issue, from StaffController::ROLES. Kept in sync by
 * hand once before: the old copy here read 'finance'/'support'/'marketing'
 * while the API issues 'finance_manager'/'support_agent'/'marketing_manager',
 * so every staff member outside the first three roles logged in successfully
 * and was then bounced straight back out of the admin panel.
 */
const ADMIN_ROLES = [
  'super_admin', 'admin', 'moderator', 'event_manager',
  'support_agent', 'marketing_manager', 'finance_manager',
]

/** Roles that bypass the per-area permission checks. */
const FULL_ACCESS_ROLES = ['super_admin', 'admin']

export interface AuthUser {
  id: number
  name: string
  email: string | null
  phone: string | null
  photo: string | null
  role: string | null
  /** True for every staff account. The API is the authority on this. */
  is_admin?: boolean
  /** Granted areas. null or ['*'] means unrestricted. */
  permissions?: string[] | null
  gender: string | null
  age: number | null
  dob: string | null
  is_premium: boolean
  plan_type: string | null
  plan_expires_at: string | null
  wallet_balance: number
  is_online: boolean
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  _hasHydrated: boolean
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  setHasHydrated: (val: boolean) => void
  isLoggedIn: () => boolean
  isAdmin: () => boolean
  can: (area: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setAuth: (token, user) => {
        if (typeof document !== 'undefined') {
          // Can't be HttpOnly — this store reads it back client-side to send
          // as the Authorization header, and only JS-writable cookies allow
          // that. Secure at least stops it going out over a plain http://
          // request; a real fix means proxying API calls through a Next.js
          // route handler so the token never has to live in readable JS.
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `zd-token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax${secure}`
        }
        set({ token, user })
      },
      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = `zd-token=; path=/; max-age=0`
        }
        set({ token: null, user: null })
      },
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      isLoggedIn: () => !!get().token,
      isAdmin: () => {
        const u = get().user
        if (!u) return false
        // is_admin is what the API itself gates on, so trust it first. The role
        // list below is only a fallback for sessions stored before the field
        // was returned.
        if (typeof u.is_admin === 'boolean') return u.is_admin
        return u.role != null && ADMIN_ROLES.includes(u.role)
      },
      /**
       * May this staff member act on `area` (one of the API's permission keys)?
       *
       * Mirrors User::hasAdminPermission on the server, which is the real gate;
       * this only decides what is worth showing. null permissions and '*' both
       * mean unrestricted, as do the two roles defined that way.
       */
      can: (area: string) => {
        const u = get().user
        if (!u) return false
        if (u.role && FULL_ACCESS_ROLES.includes(u.role)) return true
        if (u.permissions == null) return true
        return u.permissions.includes('*') || u.permissions.includes(area)
      },
    }),
    {
      name: 'zingdates-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
