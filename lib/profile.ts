/* What a member must have on file before the rest of the app means anything.
   The register flow collects exactly these, and the app layout turns anyone
   still missing one back to /register — without that guard, typing /discover
   straight into the address bar walks past setup entirely. */
export const REQUIRED_PROFILE_FIELDS = [
  { key: 'photo',  label: 'Profile photo' },
  { key: 'name',   label: 'Full name'     },
  { key: 'gender', label: 'Gender'        },
  { key: 'dob',    label: 'Date of birth' },
  { key: 'bio',    label: 'Bio'           },
  { key: 'city',   label: 'City'          },
] as const

type Profile = Record<string, unknown> | null | undefined

export function missingProfileFields(p: Profile): string[] {
  return REQUIRED_PROFILE_FIELDS
    .filter(f => !String(p?.[f.key] ?? '').trim())
    .map(f => f.label)
}

export function isProfileComplete(p: Profile): boolean {
  return !!p && missingProfileFields(p).length === 0
}

/* `/profile` answers with either the row itself or { user: row }. */
export function unwrapProfile(res: unknown): Record<string, unknown> | null {
  const r = res as Record<string, unknown> | null
  return (r?.user as Record<string, unknown>) ?? r ?? null
}
