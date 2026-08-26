/**
 * The real ZingDates app screens, shipped in /public/screens.
 *
 * Kept out of components/AppScreens.tsx on purpose: that file is a client
 * module, and every export a server component pulls from a client module comes
 * back as a client reference rather than the value itself.
 *
 * Ordered the way a new member actually meets the app.
 */
export const SCREENS = [
  { key: 'splash',     src: '/screens/splash.jpeg',     label: 'Splash',         caption: 'Real people, real connections' },
  { key: 'getstarted', src: '/screens/getstarted.jpeg', label: 'Get started',    caption: 'The best place to meet your future partner' },
  { key: 'login',      src: '/screens/login.jpeg',      label: 'Login',          caption: 'Sign in with your mobile number' },
  { key: 'otp',        src: '/screens/otp.jpeg',        label: 'OTP',            caption: 'Secure 6-digit verification' },
  { key: 'profile',    src: '/screens/signup.jpeg',     label: 'Create profile', caption: 'Photo, age, gender, location' },
] as const

export type Screen = (typeof SCREENS)[number]
export type ScreenKey = Screen['key']

/** Look a screen up by name so callers never depend on array order. */
export function screen(key: ScreenKey): Screen {
  const found = SCREENS.find(s => s.key === key)
  if (!found) throw new Error(`Unknown app screen: ${key}`)
  return found
}
