// Demo sign-in. A correct DEMO_PIN (server-only) at POST /api/login sets
// `ad_session`: httpOnly, SameSite=Strict, 12 hours, signed with a key derived
// from CP_SECRET. middleware.js requires it on every page and API route, so
// /api/ask can no longer be used as an open proxy to the CP backend.
// Web Crypto only, so middleware (edge) and routes share it.

export const SESSION_COOKIE = 'ad_session'
export const SESSION_SECONDS = 12 * 60 * 60

const enc = new TextEncoder()

function b64url(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(data) {
  const secret = process.env.CP_SECRET
  if (!secret) return null
  const key = await crypto.subtle.importKey('raw', enc.encode(`alfred-demo-session:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

export function constantEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

export async function createSession() {
  const body = b64url(enc.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })))
  const sig = await sign(body)
  return sig ? `${body}.${sig}` : null
}

export async function validSession(raw) {
  if (!raw || raw.indexOf('.') < 1) return false
  const [body, sig] = raw.split('.')
  const want = await sign(body)
  if (!want || !constantEq(sig || '', want)) return false
  try {
    const p = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof p.exp === 'number' && p.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function sessionCookie(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}
