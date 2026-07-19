/**
 * Gender-based default avatars, shown when a user hasn't uploaded a photo.
 * Files live in `public/avatars/` and are served as plain static paths (the app
 * uses <img>, not next/image, since `images.unoptimized` is on).
 */

export const MALE_AVATAR = '/avatars/BOY.jpeg'
export const FEMALE_AVATAR = '/avatars/GIRL.jpeg'
// No dedicated neutral illustration yet — drop one in public/avatars/ and
// repoint this if unknown-gender users should look different.
export const NEUTRAL_AVATAR = MALE_AVATAR

type AvatarUser = { photo?: string | null; gender?: string | null } | null | undefined

const normaliseGender = (g?: string | null) => String(g ?? '').trim().toLowerCase()

/**
 * Returns the avatar URL for a user:
 * 1. Their uploaded photo, if they have one
 * 2. A gender-matched illustrated avatar
 * 3. A neutral avatar, if gender is unknown
 */
export function getAvatarUri(user: AvatarUser): string {
  if (user?.photo) return user.photo

  const g = normaliseGender(user?.gender)
  if (g === 'female' || g === 'f' || g === 'woman') return FEMALE_AVATAR
  if (g === 'male' || g === 'm' || g === 'man') return MALE_AVATAR
  return NEUTRAL_AVATAR
}
