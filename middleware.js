import { NextResponse } from 'next/server'
import { SESSION_COOKIE, validSession } from './lib/session'

// Every page and API route needs the demo sign-in (lib/session.js), except the
// sign-in page and endpoint themselves.
const PUBLIC = new Set(['/login', '/api/login', '/api/logout'])

export async function middleware(req) {
  const path = req.nextUrl.pathname
  if (PUBLIC.has(path)) return NextResponse.next()
  if (await validSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  if (path.startsWith('/api/')) return NextResponse.json({ error: 'authentication required' }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|api/|.*\\.[a-zA-Z0-9]+$).*)'],
}
