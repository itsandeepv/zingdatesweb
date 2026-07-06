import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/admin', '/discover', '/matches', '/companion', '/chat', '/call', '/profile', '/notifications', '/plans']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

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
  matcher: ['/admin/:path*', '/discover/:path*', '/matches/:path*', '/companion/:path*', '/chat/:path*', '/call/:path*', '/profile/:path*', '/notifications/:path*', '/plans/:path*'],
}
