import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/admin', '/discover', '/matches', '/companion', '/chat', '/call', '/profile', '/notifications', '/plans']

// One canonical host. www.zingdates.com was answering 200 with a canonical
// tag pointing at the apex, which Search Console reports as "Alternate page
// with proper canonical tag" for every page — a duplicate, not a redirect.
// A 301 here settles it for crawlers and for anyone typing www.
const CANONICAL_HOST = 'zingdates.com'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const host = request.headers.get('host')?.toLowerCase() ?? ''
  if (host === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone()
    url.host = CANONICAL_HOST
    url.protocol = 'https'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }

  // Whole path segments only: '/admin' must not catch '/admin-login'.
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isProtected) {
    const token = request.cookies.get('zd-token')?.value
    if (!token) {
      const loginPath = pathname.startsWith('/admin') ? '/admin-login' : '/login'
      return NextResponse.redirect(new URL(`${loginPath}?redirect=${pathname}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Every page (for the host redirect) except Next internals and static files.
  // The auth gate above still only bites on the PROTECTED prefixes.
  matcher: ['/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)'],
}
