'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const QUICK_PROMPTS = [
  { label: 'ROI objection', icon: '💰', prompt: 'Prospect says the ROI on compliance tools is hard to quantify. How do I respond?' },
  { label: 'Budget pushback', icon: '🚫', prompt: 'Prospect says they don\'t have budget right now. Best response?' },
  { label: 'We have a competitor', icon: '⚔️', prompt: 'Prospect says they already use a competitor. How do I handle this?' },
  { label: 'Need team alignment', icon: '👥', prompt: 'Prospect says they need internal alignment first. What do I say?' },
  { label: 'Stats for CFO', icon: '📊', prompt: 'I need to make the financial case to a CFO in 2-3 sentences. What do I say?' },
  { label: 'VitalLaw cross-sell', icon: '⚡', prompt: 'Prospect mentioned their outside counsel. How do I introduce VitalLaw?' },
  { label: 'Discovery openers', icon: '🔍', prompt: 'Best discovery questions to open with for a compliance director?' },
  { label: '418 CPT changes', icon: '📅', prompt: 'How do I use the 418 CPT code changes as an urgency hook?' },
  { label: 'Send me something', icon: '📧', prompt: 'Prospect says just send me something. How do I keep the conversation alive?' },
  { label: 'Suite breakdown', icon: '📦', prompt: 'Prospect asks what\'s in the Master Suite vs Compliance Suite vs Coding Center?' },
  { label: 'CROI model', icon: '🧮', prompt: 'Walk me through the CROI model numbers for a 250-bed community hospital.' },
  { label: 'vs manual process', icon: '🔄', prompt: 'Prospect says their team looks things up manually. How do I make the case for MediRegs?' },
]

const DARK = {
  page: '#0f0f0f',
  surface: '#141414',
  surfaceAlt: '#161616',
  border: '#1e1e1e',
  borderStrong: '#2a2a22',
  text: '#e8e6e0',
  textMuted: '#9a9890',
  textDim: '#5a5a52',
  textFaint: '#3a3a32',
  userBubbleBg: '#1a1f1a',
  userBubbleBorder: '#253025',
  accent: '#4a7c4a',
  accentBorder: '#3a6a3a',
  accentText: '#a8d4a8',
  accentBg: '#2a4a2a',
  strongText: '#e8e6e0',
  micActive: '#c0392b',
  micActiveBorder: '#a93226',
  micActiveText: '#ffffff',
  logoFill: '#e8e6e0',
  logoBg: '#1a2a1a',
}

const LIGHT = {
  page: '#f5f5f2',
  surface: '#ffffff',
  surfaceAlt: '#f0f0ec',
  border: '#e0e0d8',
  borderStrong: '#c8c8c0',
  text: '#1a1a18',
  textMuted: '#5a5a52',
  textDim: '#888880',
  textFaint: '#aaaaaa',
  userBubbleBg: '#e8f0e8',
  userBubbleBorder: '#b8d4b8',
  accent: '#2a6a2a',
  accentBorder: '#2a5a2a',
  accentText: '#ffffff',
  accentBg: '#2a6a2a',
  strongText: '#1a1a18',
  micActive: '#c0392b',
  micActiveBorder: '#a93226',
  micActiveText: '#ffffff',
  logoFill: '#1a1a18',
  logoBg: '#e8e8e4',
}

function ButlerLogo({ size = 34, bg }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.55,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      🤵
    </div>
  )
}

function makeStyles(t) {
  return {
    wrapper: {
      minHeight: '100vh',
      width: '100%',
      background: t.page,
      transition: 'background 0.2s',
    },
    page: {
      maxWidth: '780px',
      margin: '0 auto',
      padding: '0 0 40px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      color: t.text,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 24px 16px',
      borderBottom: `1px solid ${t.border}`,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    title: {
      fontSize: '15px',
      fontWeight: 600,
      color: t.text,
      margin: 0,
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: '12px',
      color: t.textDim,
      margin: 0,
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    statusDot: (active) => ({
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: active ? t.accent : '#7c7c4a',
      display: 'inline-block',
      marginRight: '4px',
    }),
    statusText: {
      fontSize: '12px',
      color: t.textDim,
    },
    iconBtn: {
      fontSize: '14px',
      background: 'none',
      border: `1px solid ${t.border}`,
      borderRadius: '5px',
      padding: '3px 8px',
      cursor: 'pointer',
      color: t.textDim,
      lineHeight: 1,
    },
    clearBtn: {
      fontSize: '12px',
      color: t.textDim,
      background: 'none',
      border: `1px solid ${t.border}`,
      borderRadius: '5px',
      padding: '3px 10px',
      cursor: 'pointer',
    },
    quickGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
      gap: '6px',
      padding: '20px 24px 0',
    },
    quickBtn: {
      background: t.surfaceAlt,
      border: `1px solid ${t.border}`,
      borderRadius: '8px',
      padding: '9px 11px',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '13px',
      color: t.textMuted,
      lineHeight: 1.35,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '7px',
      transition: 'border-color 0.12s, color 0.12s',
    },
    quickLabel: {
      fontSize: '11px',
      color: t.textFaint,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '20px 24px 10px',
      margin: 0,
    },
    messages: {
      flex: 1,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    },
    userBubble: {
      alignSelf: 'flex-end',
      background: t.userBubbleBg,
      border: `1px solid ${t.userBubbleBorder}`,
      borderRadius: '10px 10px 2px 10px',
      padding: '9px 13px',
      maxWidth: '72%',
      fontSize: '14px',
      lineHeight: 1.5,
      color: t.text,
    },
    assistantBubble: (error) => ({
      background: t.surface,
      border: `1px solid ${error ? '#c0392b44' : t.border}`,
      borderRadius: '2px 10px 10px 10px',
      padding: '14px 16px',
    }),
    assistantHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      marginBottom: '10px',
    },
    assistantName: {
      fontSize: '12px',
      color: t.textDim,
      fontWeight: 500,
    },
    answerText: {
      fontSize: '15px',
      lineHeight: 1.65,
      color: t.text,
      margin: '0 0 4px',
    },
    bulletRow: {
      display: 'flex',
      gap: '8px',
      margin: '2px 0',
      fontSize: '15px',
      lineHeight: 1.6,
      color: t.text,
    },
    bulletAccent: {
      color: t.accent,
      flexShrink: 0,
      marginTop: '2px',
    },
    followBtns: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      marginTop: '12px',
    },
    followBtn: {
      fontSize: '12px',
      color: t.textDim,
      background: 'none',
      border: `1px solid ${t.border}`,
      borderRadius: '5px',
      padding: '3px 9px',
      cursor: 'pointer',
    },
    typingBubble: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: '2px 10px 10px 10px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    quickStrip: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      padding: '0 24px 12px',
    },
    quickPill: {
      background: t.surfaceAlt,
      border: `1px solid ${t.border}`,
      borderRadius: '20px',
      padding: '4px 11px',
      cursor: 'pointer',
      fontSize: '12px',
      color: t.textDim,
      whiteSpace: 'nowrap',
    },
    inputArea: {
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    inputRow: {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-end',
    },
    textarea: {
      flex: 1,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: '8px',
      padding: '10px 13px',
      fontSize: '14px',
      lineHeight: 1.5,
      color: t.text,
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
    },
    sendBtn: (active) => ({
      padding: '10px 18px',
      borderRadius: '8px',
      background: active ? t.accentBg : t.surfaceAlt,
      border: `1px solid ${active ? t.accentBorder : t.border}`,
      color: active ? t.accentText : t.textFaint,
      fontSize: '14px',
      fontWeight: 500,
      cursor: active ? 'pointer' : 'default',
      height: '60px',
      flexShrink: 0,
      transition: 'all 0.12s',
    }),
    voiceBar: (listening) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: listening ? '#c0392b18' : t.surfaceAlt,
      border: `1px solid ${listening ? '#c0392b44' : t.border}`,
      transition: 'all 0.2s',
    }),
    voiceBtn: (listening) => ({
      padding: '7px 16px',
      borderRadius: '6px',
      background: listening ? t.micActive : t.surfaceAlt,
      border: `1px solid ${listening ? t.micActiveBorder : t.border}`,
      color: listening ? t.micActiveText : t.textMuted,
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }),
    voiceTranscript: {
      fontSize: '13px',
      color: t.textMuted,
      fontStyle: 'italic',
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    hint: {
      fontSize: '11px',
      color: t.textFaint,
      textAlign: 'right',
      padding: '4px 0 0',
    },
    strongText: {
      color: t.strongText,
      fontWeight: 600,
    },
  }
}

function renderAnswer(text, S) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: '6px' }} />
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={S.strongText}>{part.slice(2, -2)}</strong>
      }
      return part
    })
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <div key={i} style={S.bulletRow}>
          <span style={S.bulletAccent}>›</span>
          <span>{rendered.map((p) => typeof p === 'string' ? p.replace(/^[-*]\s+/, '') : p)}</span>
        </div>
      )
    }
    return <p key={i} style={S.answerText}>{rendered}</p>
  })
}

export default function Alfred() {
  const [dark, setDark] = useState(true)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const accumulatedRef = useRef('')
  const silenceTimerRef = useRef(null)

  const t = dark ? DARK : LIGHT
  const S = makeStyles(t)

  useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  useEffect(() => {
    document.body.className = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setListening(false)
  }, [])

  const fireQuery = useCallback((text) => {
    const q = text.trim()
    if (!q) return
    setLiveTranscript('')
    accumulatedRef.current = ''
    setQuery('')
    askWithText(q)
  }, [])

  const startListening = useCallback(() => {
    if (!voiceSupported || loading) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    accumulatedRef.current = ''
    setLiveTranscript('')

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      let interim = ''
      let newFinals = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinals += result[0].transcript + ' '
        } else {
          interim = result[0].transcript
        }
      }

      if (newFinals) {
        accumulatedRef.current += newFinals
      }

      const display = (accumulatedRef.current + interim).trim()
      setLiveTranscript(display)

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (accumulatedRef.current.trim()) {
        silenceTimerRef.current = setTimeout(() => {
          const toFire = accumulatedRef.current.trim()
          stopListening()
          if (toFire) fireQuery(toFire)
        }, 2200)
      }
    }

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.error('Speech recognition error:', e.error)
      }
    }

    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.start() } catch {}
      } else {
        setListening(false)
        setLiveTranscript('')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [voiceSupported, loading, stopListening, fireQuery])

  function toggleVoice() {
    if (listening) {
      const toFire = accumulatedRef.current.trim()
      stopListening()
      if (toFire) fireQuery(toFire)
    } else {
      startListening()
    }
  }

  async function askWithText(text) {
    const q = text.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: 'user', content: q }])
    const nextHistory = [...history, { role: 'user', content: q }]
    setHistory(nextHistory)
    setQuery('')
    setLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory }),
      })
      const data = await res.json()
      const text2 = data.text || data.error || 'No response.'
      setMessages(prev => [...prev, { role: 'assistant', content: text2, error: !!data.error }])
      setHistory(prev => [...prev, { role: 'assistant', content: text2 }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.', error: true }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  async function ask(questionText) {
    const q = (questionText || query).trim()
    if (!q || loading) return
    await askWithText(q)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  function clearSession() {
    stopListening()
    setMessages([])
    setHistory([])
    setQuery('')
    setLiveTranscript('')
    accumulatedRef.current = ''
  }

  const hasMessages = messages.length > 0

  return (
    <div style={S.wrapper}>
      <div style={S.page}>

        <div style={S.header}>
          <div style={S.headerLeft}>
            <ButlerLogo bg={t.logoBg} />
            <div>
              <p style={S.title}>Alfred</p>
              <p style={S.subtitle}>MediRegs · VitalLaw · demo co-pilot</p>
            </div>
          </div>
          <div style={S.headerRight}>
            <span style={S.statusDot(!loading)} />
            <span style={S.statusText}>{loading ? 'Thinking...' : listening ? 'Listening...' : 'Ready'}</span>
            <button style={S.iconBtn} onClick={() => setDark(d => !d)} title="Toggle theme">
              {dark ? '☀️' : '🌙'}
            </button>
            {hasMessages && (
              <button style={S.clearBtn} onClick={clearSession}>Clear</button>
            )}
          </div>
        </div>

        {!hasMessages && (
          <>
            <p style={S.quickLabel}>Quick launch</p>
            <div style={S.quickGrid}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.label}
                  style={S.quickBtn}
                  onClick={() => ask(p.prompt)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderStrong; e.currentTarget.style.color = t.text }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {hasMessages && (
          <div style={S.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                {msg.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={S.userBubble}>{msg.content}</div>
                  </div>
                ) : (
                  <div style={S.assistantBubble(msg.error)}>
                    <div style={S.assistantHeader}>
                      <ButlerLogo size={22} bg={t.logoBg} />
                      <span style={S.assistantName}>Alfred</span>
                    </div>
                    <div>{renderAnswer(msg.content, S)}</div>
                    {!msg.error && (
                      <div style={S.followBtns}>
                        {[
                          { label: 'Go deeper', prompt: 'Tell me more about that' },
                          { label: 'Shorter', prompt: 'Give me a one-sentence version I can say right now' },
                          { label: 'Next question →', prompt: 'What should I ask them next?' },
                        ].map(btn => (
                          <button
                            key={btn.label}
                            style={S.followBtn}
                            onClick={() => ask(btn.prompt)}
                            onMouseEnter={e => e.currentTarget.style.color = t.textMuted}
                            onMouseLeave={e => e.currentTarget.style.color = t.textDim}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={S.typingBubble}>
                <ButlerLogo size={22} bg={t.logoBg} />
                <span style={{ color: t.textFaint, fontSize: '20px', letterSpacing: '3px' }}>...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {hasMessages && (
          <div style={S.quickStrip}>
            {QUICK_PROMPTS.slice(0, 6).map(p => (
              <button
                key={p.label}
                style={S.quickPill}
                onClick={() => ask(p.prompt)}
                onMouseEnter={e => e.currentTarget.style.color = t.textMuted}
                onMouseLeave={e => e.currentTarget.style.color = t.textDim}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        )}

        <div style={S.inputArea}>
          {voiceSupported && (
            <div style={S.voiceBar(listening)}>
              <button style={S.voiceBtn(listening)} onClick={toggleVoice}>
                <span>{listening ? '⏹' : '🎙'}</span>
                <span>{listening ? 'Stop' : 'Start listening'}</span>
              </button>
              <span style={S.voiceTranscript}>
                {listening
                  ? liveTranscript || 'Listening — speak the objection or question...'
                  : 'Press to start voice — fires automatically after you finish speaking'}
              </span>
            </div>
          )}

          <div style={S.inputRow}>
            <textarea
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Or type the objection or question they just asked..."
              rows={2}
              style={S.textarea}
            />
            <button
              style={S.sendBtn(!!query.trim() && !loading)}
              onClick={() => ask()}
              disabled={!query.trim() || loading}
            >
              Ask
            </button>
          </div>
          <p style={S.hint}>Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </div>
  )
}

