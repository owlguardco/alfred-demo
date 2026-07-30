'use client'

/** Certification Mode — a timed teleprompter for the WK product certs.
 *
 *  Browser port of the alfred-electron Certification tab. Same scripts, same
 *  timing behaviour; the only difference is where the data comes from (fetch
 *  against /api/certification/* instead of Electron IPC).
 *
 *  Each step pairs the line to say out loud with where to be in the product
 *  while saying it, and a duration. The timer auto-advances so a run lands on
 *  the estimated length without watching a clock — but auto-advance is a
 *  default, not a rail: Play/Pause/Prev/Next/Restart mean a prospect question
 *  mid-step never derails the walkthrough.
 *
 *  This file sits in app/certification/ but is NOT a route — only page.js and
 *  route.js create routes, so it is plain colocation. app/page.js renders it
 *  inline on a view switch.
 */

import { useCallback, useEffect, useState } from 'react'

const DARK = {
  page: '#0f0f0f', surface: '#141414', surfaceAlt: '#161616',
  border: '#1e1e1e', text: '#e8e6e0', textMuted: '#9a9890',
  textDim: '#5a5a52', accent: '#4a7c4a', accentBg: '#2a4a2a',
  accentBorder: '#3a6a3a', cueBg: '#1a2a3a', cueBorder: '#2a4a6a',
  cueText: '#8ab4d8',
}

const LIGHT = {
  page: '#f5f5f2', surface: '#ffffff', surfaceAlt: '#f0f0ec',
  border: '#e0e0d8', text: '#1a1a18', textMuted: '#5a5a52',
  textDim: '#888880', accent: '#2a6a2a', accentBg: '#e2efe2',
  accentBorder: '#a8c8a8', cueBg: '#eaf2fa', cueBorder: '#c3d9ee',
  cueText: '#1d4e79',
}

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function ctrlBtnStyle(t, disabled = false) {
  return {
    background: t.surfaceAlt,
    border: `1px solid ${t.border}`,
    color: disabled ? t.textDim : t.text,
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '14px',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  }
}

/** Longer lines get smaller type so a whole step stays on one screen — a
 *  teleprompter you have to scroll mid-sentence is useless. */
function sayFontSize(len) {
  if (len > 380) return 20
  if (len > 250) return 23
  return 26
}

function fmtClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CertificationView({ onExit, dark }) {
  const [scripts, setScripts] = useState([])
  const [error, setError] = useState(null)
  const [activeScript, setActiveScript] = useState(null)
  // Step index and seconds-remaining live in ONE state object so the ticking
  // interval can advance the step and reset the countdown in a single pure
  // update. Split across two states, the reset races the advance.
  const [pos, setPos] = useState({ step: 0, left: 0 })
  const [playing, setPlaying] = useState(false)

  const t = dark ? DARK : LIGHT

  useEffect(() => {
    let cancelled = false
    fetch('/api/certification/list')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) { setError(data.error); return }
        setScripts(data.scripts || [])
        if (!data.scripts?.length) setError('No certification scripts found.')
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [])

  const openScript = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/certification/${id}`)
      const data = await res.json()
      if (!data.script) {
        setError(data.error || 'Script could not be loaded.')
        return
      }
      setActiveScript(data.script)
      setPos({ step: 0, left: data.script.steps[0].duration_seconds })
      setPlaying(false)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const steps = activeScript?.steps
  const currentStep = steps?.[pos.step]
  const nextStep = steps?.[pos.step + 1]
  const isLastStep = steps ? pos.step === steps.length - 1 : false
  const isComplete = isLastStep && pos.left === 0

  const goToStep = useCallback((idx) => {
    if (!steps) return
    const clamped = Math.max(0, Math.min(idx, steps.length - 1))
    setPos({ step: clamped, left: steps[clamped].duration_seconds })
  }, [steps])

  // Tick once a second while playing. On reaching zero, roll straight into the
  // next step's duration; on the final step clamp at zero and let the effect
  // below stop playback.
  useEffect(() => {
    if (!playing || !steps) return
    const id = setInterval(() => {
      setPos((p) => {
        if (p.left > 1) return { step: p.step, left: p.left - 1 }
        const next = p.step + 1
        if (next >= steps.length) return { step: p.step, left: 0 }
        return { step: next, left: steps[next].duration_seconds }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [playing, steps])

  // End of script: stop rather than loop.
  useEffect(() => {
    if (playing && isComplete) setPlaying(false)
  }, [playing, isComplete])

  // Script picker.
  if (!activeScript) {
    return (
      <div style={{ minHeight: '100vh', background: t.page, color: t.text, padding: '24px', fontFamily: FONT }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Certification Mode</h2>
            <button onClick={onExit}
              style={{ background: 'none', border: `1px solid ${t.border}`, color: t.textDim, borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
              ← Back to Alfred
            </button>
          </div>
          <p style={{ color: t.textMuted, fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
            Pick a script to run through. It auto-advances on a timer matched to each step — pause or skip anytime.
          </p>
          {error && (
            <div style={{ fontSize: '13px', color: '#c0392b', padding: '9px 12px', background: '#c0392b12', border: '1px solid #c0392b44', borderRadius: '6px', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scripts.map((s) => (
              <button key={s.id} onClick={() => openScript(s.id)}
                style={{ textAlign: 'left', background: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '16px 18px', cursor: 'pointer', color: t.text, fontFamily: 'inherit' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '13px', color: t.textMuted }}>
                  ~{s.estimated_minutes} min · {s.step_count} steps
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Walkthrough.
  const progressPct = ((pos.step + 1) / activeScript.steps.length) * 100
  const stepDuration = currentStep?.duration_seconds ?? 0
  const stepPct = stepDuration > 0 ? ((stepDuration - pos.left) / stepDuration) * 100 : 100
  const secondsRemaining = pos.left + activeScript.steps
    .slice(pos.step + 1)
    .reduce((sum, s) => sum + s.duration_seconds, 0)

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: t.page, color: t.text, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeScript.title}
          </div>
          <div style={{ fontSize: '11px', color: t.textDim }}>
            Step {pos.step + 1} of {activeScript.steps.length} · {fmtClock(secondsRemaining)} left
          </div>
        </div>
        <button onClick={() => { setPlaying(false); setActiveScript(null) }}
          style={{ background: 'none', border: `1px solid ${t.border}`, color: t.textDim, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', flexShrink: 0, fontFamily: 'inherit' }}>
          Exit Script
        </button>
      </div>

      {/* Overall progress */}
      <div style={{ height: '3px', background: t.surfaceAlt, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: t.accent, transition: 'width 0.3s' }} />
      </div>

      {/* Teleprompter */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* App cue */}
          <div style={{ background: t.cueBg, border: `1px solid ${t.cueBorder}`, borderRadius: '10px', padding: '14px 18px', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: t.cueText, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', opacity: 0.85 }}>
              📍 Where to be in the app
            </div>
            <div style={{ fontSize: '15px', color: t.cueText, lineHeight: 1.5 }}>{currentStep?.app_cue}</div>
          </div>

          {/* Say this */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <p style={{ fontSize: `${sayFontSize(currentStep?.say.length ?? 0)}px`, lineHeight: 1.5, color: t.text, margin: 0 }}>
              {currentStep?.say}
            </p>
          </div>

          {/* Next-step preview */}
          {nextStep && (
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '16px', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Coming up
              </div>
              <div style={{ fontSize: '13px', color: t.textMuted }}>{nextStep.app_cue}</div>
            </div>
          )}
        </div>
      </div>

      {/* Step timer */}
      <div style={{ height: '4px', background: t.surfaceAlt, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${stepPct}%`, background: t.accentBorder, transition: 'width 1s linear' }} />
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderTop: `1px solid ${t.border}`, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={() => goToStep(0)} style={ctrlBtnStyle(t)}>⏮ Restart</button>
        <button onClick={() => goToStep(pos.step - 1)} disabled={pos.step === 0} style={ctrlBtnStyle(t, pos.step === 0)}>◀ Prev</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={isComplete}
          style={{ ...ctrlBtnStyle(t, isComplete), background: isComplete ? t.surfaceAlt : t.accentBg, borderColor: isComplete ? t.border : t.accentBorder, minWidth: '96px', fontWeight: 600 }}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => goToStep(pos.step + 1)} disabled={isLastStep} style={ctrlBtnStyle(t, isLastStep)}>Next ▶</button>
        <span style={{ fontSize: '13px', color: t.textDim, marginLeft: '12px', whiteSpace: 'nowrap' }}>
          {isComplete ? '✓ Script complete' : `${pos.left}s left on this step`}
        </span>
      </div>
    </div>
  )
}
