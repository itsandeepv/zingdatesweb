'use client'

/* ─── Persistent local CMS store (localStorage) ──────────────────
   Used by admin/content until the Laravel backend implements
   /admin/content/blog, /admin/content/pages, /admin/content/media.
   All methods return Promises so they can be swapped for HTTP calls
   later without touching the page components.
─────────────────────────────────────────────────────────────────── */

const K = {
  blog:  'zd-cms-blog',
  pages: 'zd-cms-pages',
  media: 'zd-cms-media',
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}

function write(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota exceeded */ }
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

/* ── Defaults for static pages ─────────────────────────────────── */
const DEFAULT_PAGES: any[] = [
  { id: 1, key: 'about',   title: 'About Us',         slug: 'about',   content: '', status: 'published', updated_at: '' },
  { id: 2, key: 'privacy', title: 'Privacy Policy',   slug: 'privacy', content: '', status: 'published', updated_at: '' },
  { id: 3, key: 'terms',   title: 'Terms of Service', slug: 'terms',   content: '', status: 'published', updated_at: '' },
  { id: 4, key: 'faq',     title: 'FAQ',               slug: 'faq',     content: '', status: 'published', updated_at: '' },
  { id: 5, key: 'contact', title: 'Contact Us',        slug: 'contact', content: '', status: 'published', updated_at: '' },
].map(p => ({ ...p, updated_at: new Date().toISOString() }))

/* ══════════════════════════════════════════════
   Blog
══════════════════════════════════════════════ */
export async function getPosts(): Promise<any[]> {
  return read<any[]>(K.blog, [])
}

export async function createPost(data: any): Promise<any> {
  const posts = read<any[]>(K.blog, [])
  const now = new Date().toISOString()
  const post = {
    ...data,
    id: Date.now(),
    slug: slugify(data.title ?? ''),
    views_count: 0,
    created_at: now,
    updated_at: now,
    published_at: data.status === 'published' ? now : null,
  }
  write(K.blog, [...posts, post])
  return post
}

export async function updatePost(id: number, data: any): Promise<any> {
  const posts = read<any[]>(K.blog, [])
  const now = new Date().toISOString()
  const next = posts.map(p =>
    p.id === id
      ? { ...p, ...data, updated_at: now, published_at: data.status === 'published' && !p.published_at ? now : p.published_at }
      : p
  )
  write(K.blog, next)
  return next.find(p => p.id === id)
}

export async function deletePost(id: number): Promise<void> {
  write(K.blog, read<any[]>(K.blog, []).filter(p => p.id !== id))
}

/* ══════════════════════════════════════════════
   Static Pages
══════════════════════════════════════════════ */
export async function getPages(): Promise<any[]> {
  const saved = read<any[] | null>(K.pages, null)
  if (!saved) { write(K.pages, DEFAULT_PAGES); return DEFAULT_PAGES }
  return saved
}

export async function updatePage(id: number, data: any): Promise<any> {
  const pages = read<any[]>(K.pages, DEFAULT_PAGES)
  const next = pages.map(p =>
    p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
  )
  write(K.pages, next)
  return next.find(p => p.id === id)
}

/* ══════════════════════════════════════════════
   Media Library
══════════════════════════════════════════════ */
export async function getMedia(): Promise<any[]> {
  return read<any[]>(K.media, [])
}

export async function addMedia(file: File, folder?: string): Promise<any> {
  const MAX = 3 * 1024 * 1024  // 3 MB per file to stay within localStorage limits
  if (file.size > MAX) throw new Error(`${file.name} exceeds 3 MB limit`)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const item = {
        id: Date.now(),
        name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        url: reader.result as string,  // base64 data URL — copy and use anywhere
        folder: folder || null,
        created_at: new Date().toISOString(),
      }
      const existing = read<any[]>(K.media, [])
      write(K.media, [...existing, item])
      resolve(item)
    }
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export async function deleteMedia(id: number): Promise<void> {
  write(K.media, read<any[]>(K.media, []).filter(m => m.id !== id))
}
