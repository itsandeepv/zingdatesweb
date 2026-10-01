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
    ...(await pageMetadata('terms', {
      title: 'Terms of Service',
      description:
        'The terms governing your use of zingDates — accounts, coins, subscriptions, calls, companion bookings, and community conduct.',
      path: '/terms',
    })),
    robots: { index: true, follow: true },
  }
}

export default async function TermsPage() {
  const cms = await getCmsPage('terms')
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="Please read these terms carefully before using zingDates."
      updated={fmtUpdated(cms?.updatedAt, "July 5, 2026")}
      htmlContent={cms?.content ?? undefined}
    >
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the zingDates
        website, mobile applications, and related services (together, the &ldquo;Service&rdquo;),
        operated by zingDates (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By creating an account or using the
        Service, you agree to be bound by these Terms. If you do not agree, please do not use zingDates.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least <strong>18 years old</strong> to create an account and use zingDates. By using the
        Service, you represent that you are 18 or older, that you can form a binding contract, and that you
        are not barred from using the Service under the laws of your country. Accounts found to belong to
        minors will be removed.
      </p>

      <h2>2. Your Account</h2>
      <ul>
        <li>You register using your <strong>phone number (via OTP)</strong> or a supported social login (Google or Facebook).</li>
        <li>You agree to provide accurate profile information — including name, date of birth, gender, photos, and location — and to keep it up to date.</li>
        <li>You are responsible for all activity on your account and for keeping your login and device secure.</li>
        <li>You may not create more than one account, impersonate others, or transfer your account to another person.</li>
        <li>Some features may require identity or profile <strong>verification (KYC)</strong>. We may limit features until verification is complete.</li>
      </ul>

      <h2>3. Community Guidelines &amp; Acceptable Use</h2>
      <p>zingDates is a community built on respect and authenticity. You agree not to:</p>
      <ul>
        <li>Post false, misleading, offensive, hateful, sexually explicit, or unlawful content;</li>
        <li>Harass, threaten, stalk, or abuse other members;</li>
        <li>Solicit money, run scams, spam, advertise, or promote commercial services without permission;</li>
        <li>Share another person&rsquo;s private information without consent;</li>
        <li>Use bots, scrapers, or attempt to access the Service by unauthorized means;</li>
        <li>Engage in prostitution, human trafficking, or any illegal activity through the Service;</li>
        <li>Create, upload, share, solicit, or distribute any content that sexualizes, exploits, or endangers a minor, including Child Sexual Abuse Material (CSAM) &mdash; ZingDates has <strong>zero tolerance for Child Sexual Abuse and Exploitation (CSAE)</strong>.</li>
      </ul>
      <p>
        Every photo and video you share is automatically screened before it is visible to anyone else.
        Content containing nudity, sexual acts, or other explicit material is automatically detected and
        blocked &mdash; it is never shown to other members.
      </p>
      <p>
        Violations involving CSAE result in immediate, permanent account termination and, where legally
        required, a report to the National Center for Missing &amp; Exploited Children (NCMEC) and/or other law
        enforcement authorities. Other violations may result in content removal, feature restrictions,
        suspension, or permanent termination.
      </p>

      <h2>4. Coins, Wallet &amp; Virtual Items</h2>
      <ul>
        <li>New accounts receive a one-time <strong>welcome bonus of free Coins</strong> so you can try messaging before choosing a plan.</li>
        <li>Coins are spent only on messaging &mdash; a flat Coin cost per message &mdash; and only for accounts without an active plan that covers chat. Accounts with such a plan are never charged Coins to message.</li>
        <li>Coins cannot be purchased separately, have no monetary value, and are <strong>non-transferable</strong> and non-refundable.</li>
        <li>Audio calls, video calls, and other premium features are unlocked through a paid <strong>Plan</strong> (see Section 5), not through Coins.</li>
      </ul>

      <h2>5. Premium Subscriptions</h2>
      <ul>
        <li>zingDates offers optional paid plans (such as Trial, Monthly, and VIP) that unlock additional features.</li>
        <li>Subscriptions may renew automatically at the end of each billing cycle unless cancelled beforehand.</li>
        <li>You can manage or cancel auto-renewal from your account or the store through which you subscribed.</li>
        <li>Fees, features, and billing cycles are shown at the point of purchase and are subject to the <a href="/refund">Refund &amp; Cancellation Policy</a>.</li>
      </ul>

      <h2>6. Calls, Chat &amp; Gifts</h2>
      <p>
        The Service lets you chat and place audio and video calls with other members. You are solely
        responsible for your interactions. Do not share sensitive personal or financial information with
        other users. We do not guarantee the identity, conduct, or intentions of any member and are not
        responsible for offline interactions.
      </p>
      <p>
        Your phone number, email address, and exact location are never shown to other members. Chat
        conversations are protected against screenshots on Android devices, and against screen recording on
        iOS and Android. See our <a href="/privacy">Privacy Policy</a> for details on how we protect your
        information.
      </p>

      <h2>7. Companion Bookings</h2>
      <ul>
        <li>Where available, members may offer or book companion sessions (audio/video companionship) at rates set within the app.</li>
        <li>Companions are independent users, not employees of zingDates. Bookings, availability, quotes, and ratings are handled through the Service.</li>
        <li>Companion earnings and withdrawals are subject to applicable fees, verification, and payout schedules. Cancellations follow the <a href="/refund">Refund &amp; Cancellation Policy</a>.</li>
        <li>Any illegal, sexual, or exploitative arrangement is strictly prohibited and will result in a permanent ban and possible reporting to authorities.</li>
      </ul>

      <h2>8. Events &amp; Meetups</h2>
      <p>
        ZingDates lets members create and join local events, trips, and meetups (&ldquo;Events&rdquo;). Events are
        created by other members acting as hosts, not by ZingDates, and ZingDates does not run background
        checks on hosts or attendees beyond the verification shown on their profile.
      </p>
      <p>
        Depending on the event, joining may be free, paid online through the app, or paid in cash directly to
        the host at the venue. ZingDates does not collect, hold, or reconcile cash payments made directly to a
        host &mdash; any dispute over a cash payment is between you and the host. If an event is cancelled,
        refunds for payments made online follow our <a href="/refund">Refund &amp; Cancellation Policy</a>;
        cash already paid to a host is refundable only as agreed between you and that host.
      </p>
      <p>
        Joining an event gives you access to a group chat shared with the host and every other attendee of
        that event &mdash; it is not a private conversation. The exact venue address may only become visible
        once you join. You are solely responsible for your own safety and conduct when attending an Event or
        meeting other attendees, online or in person, and agree to follow any safety guidance shown in the app
        before joining.
      </p>

      <h2>9. Your Content</h2>
      <p>
        You retain ownership of the photos, text, and other content you post. By posting, you grant zingDates
        a non-exclusive, worldwide, royalty-free licence to host, display, and distribute that content solely
        to operate and promote the Service. You are responsible for ensuring you have the rights to any
        content you upload.
      </p>

      <h2>10. Suspension &amp; Termination</h2>
      <p>
        We may suspend or terminate your account at any time if you violate these Terms, create risk or legal
        exposure, or engage in fraudulent or abusive behaviour. You may stop using the Service and delete
        your account at any time. Unused Coins may be forfeited on termination for cause, subject to the
        Refund Policy and applicable law.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind.
        zingDates is a platform for meeting people; we do not conduct criminal background checks and do not
        guarantee compatibility, safety, or the accuracy of any member&rsquo;s profile.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, zingDates and its team will not be liable for any indirect,
        incidental, or consequential damages, or for any conduct or content of any user or third party,
        arising from your use of the Service.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes will be subject to the exclusive
        jurisdiction of the competent courts at our registered place of business, without regard to
        conflict-of-law principles.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated through the app or
        by other reasonable means. Continued use of the Service after changes take effect constitutes
        acceptance of the revised Terms.
      </p>

      <h2>15. Contact Us</h2>
      <p>
        Questions about these Terms? Contact us at{' '}
        <a href="mailto:zingdates2026@gmail.com">zingdates2026@gmail.com</a>.
      </p>
    </LegalPage>
  )
}
