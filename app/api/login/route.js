// POST /api/login { pin } -> sets ad_session (lib/session.js).
//
// No database here, so the lockout lives in memory per server instance.
// Same rules as Compliance Pulse, counted separately for the address and the
// (single) account: 5 wrong PINs in 15 minutes locks for 15 minutes; 10 in 24
// hours locks for 24 hours. A correct PIN clears all counters.

import { SESSION_SECONDS, constantEq, createSession, sessionCookie } from '../../../lib/session'

export const dynamic = 'force-dynamic'

const TIERS = [
  { tag: '15m', max: 5, windowMs: 15 * 60 * 1000 },
  { tag: '24h', max: 10, windowMs: 24 * 60 * 60 * 1000 },
]
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
  if (!expected || !/^\d{4,12}$/.test(expected)) {
    return Response.json({ error: 'DEMO_PIN is not set on the server.' }, { status: 500 })
  }
  let body = {}
  try { body = await request.json() } catch { /* handled below */ }
  const pin = typeof body.pin === 'string' ? body.pin : ''
  const ip = request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const slots = [`ip:${ip}`, 'acct'].flatMap((b) => TIERS.map((t) => ({ key: `${b}:${t.tag}`, t })))
  const cs = slots.map((sl) => counter(sl.key, sl.t.windowMs))
  const locked = cs.find((c) => c.lockedUntil > now)
  if (locked) return Response.json({ error: 'too many attempts', retry_after_s: Math.ceil((locked.lockedUntil - now) / 1000) }, { status: 429 })

  if (!constantEq(pin, expected)) {
    let lockMs = 0
    slots.forEach((sl, i) => {
      cs[i].fails += 1
      if (cs[i].fails >= sl.t.max) { cs[i].lockedUntil = now + sl.t.windowMs; lockMs = Math.max(lockMs, sl.t.windowMs) }
    })
    console.warn(`[login] wrong PIN from ${ip}${lockMs ? ' (locked)' : ''}`)
    return lockMs
      ? Response.json({ error: 'too many attempts', retry_after_s: lockMs / 1000 }, { status: 429 })
      : Response.json({ error: 'incorrect PIN' }, { status: 401 })
  }

  slots.forEach((sl) => counters.delete(sl.key))
  const session = await createSession()
  if (!session) return Response.json({ error: 'CP_SECRET is not set on the server.' }, { status: 500 })
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(session, SESSION_SECONDS) },
  })
}
