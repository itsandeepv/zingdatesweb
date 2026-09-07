/**
 * The real ZingDates app screens, shipped in /public/screens.
 *
 * Kept out of components/AppScreens.tsx on purpose: that file is a client
 * module, and every export a server component pulls from a client module comes
 * back as a client reference rather than the value itself.
 *
 * Ordered the way a member actually uses the app: browse, get liked, chat,
 * and get help when something goes wrong.
 */
export const SCREENS = [
  { key: 'companions', src: '/screens/companions.png', label: 'Companions', caption: 'Book a verified companion near you' },
  { key: 'likes',      src: '/screens/likes.png',      label: 'Likes',      caption: 'See everyone who liked your profile' },
  { key: 'chats',      src: '/screens/chats.png',      label: 'Chats',      caption: 'Private chats with your matches' },
  { key: 'support',    src: '/screens/support.png',    label: 'Support',    caption: 'Help & support, answered in 24 hours' },
] as const

export type Screen = (typeof SCREENS)[number]
export type ScreenKey = Screen['key']

/** Look a screen up by name so callers never depend on array order. */
export function screen(key: ScreenKey): Screen {
  const found = SCREENS.find(s => s.key === key)
  if (!found) throw new Error(`Unknown app screen: ${key}`)
  return found
}

/**
 * Full-bleed store-listing artwork (phone mockup + copy baked into the image).
 * These already carry their own background, so they are shown on their own —
 * never inside a PhoneFrame.
 */
export const POSTERS = [
  { key: 'match',       src: '/screens/poster-match.png',       alt: 'ZingDates — find your perfect match' },
  { key: 'companion',   src: '/screens/poster-companion.png',   alt: 'ZingDates — find your perfect companion' },
  { key: 'login',       src: '/screens/poster-login.png',       alt: 'ZingDates — quick, secure and hassle-free login' },
  { key: 'connections', src: '/screens/poster-connections.png', alt: 'ZingDates — real people, real connections' },
] as const

export type Poster = (typeof POSTERS)[number]
