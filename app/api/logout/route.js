// POST /api/logout: clears the demo sign-in cookie.

import { sessionCookie } from '../../../lib/session'

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie('', 0) },
  })
}
