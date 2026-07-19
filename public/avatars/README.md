# Default avatars

Served by `lib/avatars.ts` when a user has no uploaded photo. Same two images as
the mobile app (`DatingApp/src/images/avatars/`) — keep them in sync.

| File | Used for |
|---|---|
| `BOY.jpeg` | `gender === 'male'`, and unknown/unset gender |
| `GIRL.jpeg` | `gender === 'female'` |

Square images (512×512 works well). They render from 32 px in the nav up to
full-card size on the discover grid, so don't go below ~400 px.
