// POST /api/login { pin } -> sets ad_session (lib/session.js).
//
// No database here, so the lockout lives in memory per server instance:
// 5 wrong PINs from one address in 15 minutes locks that address, and 20
// wrong PINs in 24 hours locks the PIN. With a 6-digit PIN that keeps
// guessing impractical even across a handful of instances.

import { SESSION_SECONDS, constantEq, createSession, sessionCookie } from '../../../lib/session'

export const dynamic = 'force-dynamic'

const LIMITS = { ip: { max: 5, windowMs: 15 * 60 * 1000 }, all: { max: 20, windowMs: 24 * 60 * 60 * 1000 } }
const counters = new Map()

function counter(key, windowMs) {
  const now = Date.now()
  let c = counters.get(key)
  if (!c || (now - c.start > windowMs && c.lockedUntil < now)) {
    c = { fails: 0, start: now, lockedUntil: 0 }
    counters.set(key, c)
  }
  return c
}

export async function POST(request) {
  const expected = process.env.DEMO_PIN
  if (!expected || !/^\d{6,12}$/.test(expected)) {
    return Response.json({ error: 'DEMO_PIN is not set on the server.' }, { status: 500 })
  }
  let body = {}
  try { body = await request.json() } catch { /* handled below */ }
  const pin = typeof body.pin === 'string' ? body.pin : ''
  const ip = request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const cs = [counter(`ip:${ip}`, LIMITS.ip.windowMs), counter('all', LIMITS.all.windowMs)]
  const locked = cs.find((c) => c.lockedUntil > now)
  if (locked) return Response.json({ error: 'too many attempts', retry_after_s: Math.ceil((locked.lockedUntil - now) / 1000) }, { status: 429 })

  if (!constantEq(pin, expected)) {
    let lockedNow = false
    ;[[cs[0], LIMITS.ip], [cs[1], LIMITS.all]].forEach(([c, l]) => {
      c.fails += 1
      if (c.fails >= l.max) { c.lockedUntil = now + l.windowMs; lockedNow = true }
    })
    console.warn(`[login] wrong PIN from ${ip}${lockedNow ? ' (locked)' : ''}`)
    return lockedNow
      ? Response.json({ error: 'too many attempts', retry_after_s: LIMITS.ip.windowMs / 1000 }, { status: 429 })
      : Response.json({ error: 'incorrect PIN' }, { status: 401 })
  }

  counters.delete(`ip:${ip}`)
  const session = await createSession()
  if (!session) return Response.json({ error: 'CP_SECRET is not set on the server.' }, { status: 500 })
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(session, SESSION_SECONDS) },
  })
}
