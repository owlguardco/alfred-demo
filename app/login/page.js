'use client'

import { useState } from 'react'

// Demo sign-in (lib/session.js). Dark palette from app/page.js.
const C = { bg: '#0f0f0f', surface: '#1a1a18', border: '#2e2e2a', text: '#e8e6e0', muted: '#9a9890', accentBg: '#2a4a2a', accentBorder: '#3a6a3a', accentText: '#a8d4a8', error: '#e07a6a' }

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (pin.length < 4 || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { window.location.replace('/'); return }
      setPin('')
      if (res.status === 429) setError(`Too many attempts. Try again in ${Math.max(1, Math.ceil((d.retry_after_s || 900) / 60))} minutes.`)
      else if (res.status === 401) setError('Wrong PIN.')
      else setError(d.error || 'Sign-in is unavailable right now.')
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 300 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: C.muted, marginBottom: 16, textTransform: 'uppercase' }}>Alfred</div>
        <label htmlFor="pin" style={{ display: 'block', fontSize: 14, color: C.muted, marginBottom: 6 }}>PIN</label>
        <input
          id="pin" type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="current-password" autoFocus
          maxLength={12} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 18, letterSpacing: 6, textAlign: 'center', outline: 'none' }}
        />
        <p role="alert" style={{ minHeight: 20, margin: '8px 0', fontSize: 13, color: C.error }}>{error}</p>
        <button
          type="submit" disabled={pin.length < 4 || busy}
          style={{ width: '100%', padding: '12px', borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accentText, fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: pin.length < 4 || busy ? 0.4 : 1 }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
