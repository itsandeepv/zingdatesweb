import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import { podcastApi } from '@/lib/api'
import { SITE_URL, fmtDate, fmtDuration, slugify, toList } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Podcasts — Conversations on Dating & Connection',
  description:
    'Listen to the zingDates podcast: honest conversations about dating, relationships, and building real connections. New episodes every week.',
  alternates: { canonical: `${SITE_URL}/podcasts` },
  openGraph: {
    title: 'zingDates Podcasts',
    description: 'Conversations on dating, relationships, and real connection.',
    url: `${SITE_URL}/podcasts`,
    type: 'website',
  },
}

async function getData(category?: string) {
  try {
    const params: Record<string, string> = { status: 'published' }
    if (category) params.category = category
    const [res, catsRes] = await Promise.all([
      podcastApi.list(params),
      podcastApi.categories().catch(() => []),
    ])
    return {
      episodes: toList(res),
      categories: toList(catsRes).map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.category)).filter(Boolean),
    }
  } catch {
    return { episodes: [] as any[], categories: [] as string[] }
  }
}

export default async function PodcastsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const { episodes, categories } = await getData(category)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <header className="pt-28 pb-12" style={{ background: 'linear-gradient(160deg,#fdf2ff 0%,#fff5f8 60%,#fff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full gradient-brand-soft" style={{ color: '#9C27B0' }}>
            🎙️ The zingDates Podcast
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-gray-900">
            Conversations on <span className="gradient-brand-text">dating &amp; connection</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Honest talks with real people. Tune in for stories, advice, and everything about finding your person.
          </p>

          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <FilterChip href="/podcasts" active={!category}>All</FilterChip>
              {categories.map((c: string) => (
                <FilterChip key={c} href={`/podcasts?category=${encodeURIComponent(c)}`} active={category === c}>{c}</FilterChip>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {episodes.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-semibold text-gray-500">No episodes yet</p>
            <p className="text-sm mt-1">Our first episode is coming soon — stay tuned.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {episodes.map((ep: any) => (
              <EpisodeRow key={ep.id ?? ep.slug} ep={ep} />
            ))}
          </div>
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
        active ? 'gradient-brand text-white shadow-brand' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-200 hover:text-purple-600'
      }`}
    >
      {children}
    </Link>
  )
}

function EpisodeRow({ ep }: { ep: any }) {
  const href = `/podcasts/${ep.slug ?? slugify(ep.title)}`
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 p-4 sm:p-5 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all bg-white"
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {ep.cover_image
          ? <img src={ep.cover_image} alt={ep.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full gradient-brand flex items-center justify-center text-3xl">🎙️</div>}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <svg className="w-4 h-4 text-pink-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {ep.episode_number != null && <span className="font-semibold text-purple-600">EP {ep.episode_number}</span>}
          {ep.category && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">{ep.category}</span>}
          {fmtDate(ep.published_at ?? ep.created_at) && <span>{fmtDate(ep.published_at ?? ep.created_at)}</span>}
          {fmtDuration(ep.duration) && <span>· {fmtDuration(ep.duration)}</span>}
        </div>
        <h3 className="mt-1 text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">{ep.title}</h3>
        {ep.excerpt && <p className="mt-1 text-sm text-gray-500 leading-relaxed line-clamp-2">{ep.excerpt}</p>}
      </div>
    </Link>
  )
}
