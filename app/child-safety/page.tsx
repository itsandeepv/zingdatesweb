import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { pagesApi } from '@/lib/api'
import { pageMetadata } from '@/lib/seo-meta'

export const dynamic = 'force-dynamic'

// The admin-edited copy (Content CMS → Static Pages) and when it was last
// saved, so the "Updated" line on the page is true rather than a fixed date.
async function getCmsPage(key: string): Promise<{ content: string; updatedAt: string | null } | null> {
  try {
    const res = await pagesApi.get(key)
    const page = res?.data ?? res
    if (!page?.content) return null
    return { content: page.content, updatedAt: page.updated_at ?? null }
  } catch {
    return null
  }
}

function fmtUpdated(iso: string | null | undefined, fallback: string): string {
  if (!iso) return fallback
  const d = new Date(iso)
  return isNaN(d.getTime()) ? fallback : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await pageMetadata('child-safety', {
      title: 'Child Safety Standards',
      description:
        'ZingDates’ published Child Safety Standards: our zero-tolerance policy on Child Sexual Abuse and Exploitation (CSAE), age requirements, content moderation, and how to report a concern.',
      path: '/child-safety',
    })),
    robots: { index: true, follow: true },
  }
}

export default async function ChildSafetyPage() {
  const cms = await getCmsPage('child-safety')
  return (
    <LegalPage
      title="Child Safety Standards"
      subtitle="Our zero-tolerance policy on Child Sexual Abuse and Exploitation (CSAE)."
      updated={fmtUpdated(cms?.updatedAt, 'October 1, 2026')}
      htmlContent={cms?.content ?? undefined}
    >
      <p>
        ZingDates (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is an 18+ social and dating platform. These are our
        published Child Safety Standards, in line with Google Play&rsquo;s Child Safety Standards policy, and they apply to our
        website, mobile applications, and related services (the &ldquo;Service&rdquo;).
      </p>

      <h2>1. Age Requirement</h2>
      <p>
        ZingDates is intended only for users aged <strong>18 and over</strong>. We do not knowingly allow anyone under 18 to
        create an account or use the Service, and we do not knowingly collect personal data from a minor. If we learn that an
        account belongs to someone under 18, we remove it and the data associated with it.
      </p>

      <h2>2. Zero Tolerance for Child Sexual Abuse and Exploitation (CSAE)</h2>
      <p>
        ZingDates has <strong>zero tolerance for Child Sexual Abuse and Exploitation (CSAE)</strong>. The following are strictly
        prohibited on ZingDates, without exception:
      </p>
      <ul>
        <li>Creating, uploading, sharing, soliciting, or distributing Child Sexual Abuse Material (CSAM) in any form;</li>
        <li>Sexualizing, sexually objectifying, or sexually exploiting a minor in images, video, text, or any other content;</li>
        <li>Grooming &mdash; building a relationship with a minor with the intent of sexual abuse, exploitation, or trafficking;</li>
        <li>Soliciting sexual content, meetings, or contact involving a minor;</li>
        <li>Facilitating, advertising, or arranging child trafficking or the sale/exploitation of a minor in any way;</li>
        <li>Misrepresenting a minor&rsquo;s age in order to access or remain on the Service.</li>
      </ul>
      <p>
        Any of the above results in <strong>immediate, permanent removal</strong> of the account and all associated content.
        Where legally required, we report such activity to the <strong>National Center for Missing &amp; Exploited Children
        (NCMEC)</strong> and/or other relevant law enforcement authorities, and we cooperate fully with their investigations.
        We comply with all applicable child safety laws and regulations in the jurisdictions where we operate.
      </p>

      <h2>3. How We Screen Content</h2>
      <p>
        Every photo and video shared on ZingDates is automatically screened before it is visible to anyone else. Content
        containing nudity, sexual acts, child sexual abuse material, or other material that sexualizes a minor is automatically
        detected and blocked &mdash; it is never shown to other members. This screening runs on every image and video upload,
        with no exceptions and no opt-out.
      </p>

      <h2>4. In-App Reporting</h2>
      <p>
        Every profile, message, and photo on ZingDates can be reported directly from within the app, including a dedicated
        &ldquo;Appears to be under 18&rdquo; reason. A report goes straight to our moderation team, who can suspend or
        permanently remove an account. Reports are private &mdash; the person you report is never told who reported them.
      </p>

      <h2>5. Reporting a Concern Directly</h2>
      <p>
        If you encounter content or behavior on ZingDates &mdash; on the app, the website, or anywhere else &mdash; that you
        believe involves CSAE, report it immediately to our designated Child Safety contact:
      </p>
      <p>
        📧 <a href="mailto:support@zingdates.com">support@zingdates.com</a>
        <br />
        📧 <a href="mailto:zingdates2026@gmail.com">zingdates2026@gmail.com</a>
      </p>
      <p>
        Please include as much detail as possible (usernames, screenshots, timestamps). We review every report as a priority
        and act on it immediately, including reporting to NCMEC and law enforcement where required.
      </p>

      <h2>6. Other Safety Measures</h2>
      <ul>
        <li>Phone number, email address, and exact location are never shown to other members;</li>
        <li>Identity/profile verification (KYC) is available and can be required for certain features;</li>
        <li>Accounts can be blocked and reported at any time, by anyone, from within the app;</li>
        <li>Chat conversations are protected against screenshots on Android and against screen recording on iOS and Android.</li>
      </ul>

      <h2>7. Changes to These Standards</h2>
      <p>
        We may update these Child Safety Standards from time to time to reflect changes in the law, our Service, or best
        practice. The &ldquo;Last updated&rdquo; date at the top of this page always reflects the current version.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        For any question about these standards, email{' '}
        <a href="mailto:zingdates2026@gmail.com">zingdates2026@gmail.com</a>. See also our{' '}
        <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.
      </p>
    </LegalPage>
  )
}
