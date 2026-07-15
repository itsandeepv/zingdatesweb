import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'

/**
 * Shared shell for legal / policy pages. Pass semantic children
 * (<h2>, <p>, <ul>) — the wrapper applies consistent prose styling.
 */
export default function LegalPage({
  title,
  subtitle,
  updated,
  htmlContent,
  children,
}: {
  title: string
  subtitle?: string
  updated: string
  htmlContent?: string
  children?: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <header className="pt-28 pb-10" style={{ background: 'linear-gradient(160deg,#fff5f8 0%,#fdf4ff 60%,#fff 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-3 text-gray-500">{subtitle}</p>}
          <p className="mt-4 text-xs text-gray-400">Last updated: {updated}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div
          className="text-gray-700 leading-relaxed text-[15px]
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
            [&_li]:leading-relaxed
            [&_a]:text-pink-600 [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:text-gray-900 [&_strong]:font-semibold
            [&_table]:w-full [&_table]:my-4 [&_table]:text-sm
            [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:border-b [&_th]:border-gray-200 [&_th]:py-2 [&_th]:pr-4
            [&_td]:border-b [&_td]:border-gray-100 [&_td]:py-2 [&_td]:pr-4"
        >
          {htmlContent
            ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            : children}
        </div>

        <div className="mt-12 rounded-2xl gradient-brand-soft p-5 text-sm text-gray-600">
          Questions about this policy? Email us at{' '}
          <a href="mailto:support@zingdates.com" className="text-pink-600 font-semibold">support@zingdates.com</a>.
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
