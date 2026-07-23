import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'https://api.zingdates.com/api'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = `${BACKEND}/${path.join('/')}${req.nextUrl.search}`

  // Forward all headers except host (would confuse the backend)
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => {
    if (k !== 'host') headers[k] = v
  })

  // Read body as text so streaming / duplex issues don't arise
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const body = hasBody ? await req.text() : undefined

  let res: Response
  try {
    res = await fetch(url, { method: req.method, headers, body })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Backend unreachable' },
      { status: 502 },
    )
  }

  const contentType = res.headers.get('content-type') ?? 'application/json'
  const responseBody = await res.text()

  return new NextResponse(responseBody, {
    status: res.status,
    headers: { 'content-type': contentType },
  })
}

export const GET    = handler
export const POST   = handler
export const PUT    = handler
export const PATCH  = handler
export const DELETE = handler
