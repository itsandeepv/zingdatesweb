import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { blogApi } from '@/lib/api'
import { fmtDate, readingTime, slugify, toList } from '@/lib/site'
import { pageMetadata } from '@/lib/seo-meta'

// Rendered per-request so newly published posts appear without a rebuild.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('blog', {
    title: 'Blog — Dating Tips, Stories & Guides',
    description:
      'Read the zingDates blog for dating advice, real connection stories, event guides, and tips to help you meet your future partner.',
    path: '/blog',
  })
}

async function getData(category?: string) {
  try {
    const params: Record<string, string> = { status: 'published' }
    if (category) params.category = category
    const [postsRes, catsRes] = await Promise.all([
      blogApi.list(params),
      blogApi.categories().catch(() => []),
    ])
    return {
      posts: toList(postsRes),
      categories: toList(catsRes).map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.category)).filter(Boolean),
    }
  } catch {
    return { posts: [] as any[], categories: [] as string[] }
  }
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const { posts, categories } = await getData(category)
  const [featured, ...rest] = posts

  return (
    <div className="min-h-screen bg-white">
      <Navbar overlay />

      {/* Header */}
      <header className="relative overflow-hidden min-h-[60svh] flex items-center bg-[#160a2a]">
        {/* Photo background with a dark wash so the copy reads over any part of the image. */}
        <div className="absolute inset-0">
          <Image src="/all-blogs.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,7,32,0.78) 0%, rgba(12,7,32,0.5) 40%, rgba(12,7,32,0.6) 75%, rgba(12,7,32,0.92) 100%)' }} />
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(60% 50% at 50% 55%, rgba(233,30,140,0.35), transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14 text-center">
          <span className="inline-block text-sm font-medium px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white/90">
            The zingDates Blog
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
            Stories, tips &amp; <span className="gradient-brand-text-anim">real connections</span>
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Advice, guides, and inspiration to help you meet your future partner.
          </p>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <FilterChip href="/blog" active={!category}>All</FilterChip>
              {categories.map((c: string) => (
                <FilterChip key={c} href={`/blog?category=${encodeURIComponent(c)}`} active={category === c}>
                  {c}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {posts.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-semibold text-gray-500">No posts yet</p>
            <p className="text-sm mt-1">Check back soon — great content is on the way.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && !category && (
              <Link
                href={`/blog/${featured.slug ?? slugify(featured.title)}`}
                className="group grid md:grid-cols-2 gap-8 items-center mb-16 rounded-3xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all overflow-hidden bg-white"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  {featured.cover_image
                    ? <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full gradient-brand-soft" />}
                </div>
                <div className="p-6 md:pr-10">
                  <Meta post={featured} />
                  <h2 className="mt-3 text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && <p className="mt-3 text-gray-500 leading-relaxed line-clamp-3">{featured.excerpt}</p>}
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-pink-600">
                    Read article
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
                  </span>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(category ? posts : rest).map((post: any) => (
                <PostCard key={post.id ?? post.slug} post={post} />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active ? 'gradient-brand text-white shadow-brand' : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-200 hover:text-pink-600'
      }`}
    >
      {children}
    </Link>
  )
}

function Meta({ post }: { post: any }) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      {post.category && (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600">{post.category}</span>
      )}
      {fmtDate(post.published_at ?? post.created_at) && <span>{fmtDate(post.published_at ?? post.created_at)}</span>}
      <span>·</span>
      <span>{readingTime(post.body ?? post.content ?? post.excerpt)} min read</span>
    </div>
  )
}

function PostCard({ post }: { post: any }) {
  return (
    <Link
      href={`/blog/${post.slug ?? slugify(post.title)}`}
      className="group flex flex-col rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all overflow-hidden bg-white"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        {post.cover_image
          ? <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full gradient-brand-soft" />}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <Meta post={post} />
        <h3 className="mt-2.5 text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>}
      </div>
    </Link>
  )
}
