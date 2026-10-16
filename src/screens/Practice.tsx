import { useEffect, useRef, useState } from 'react'
import type { Ctx } from '../App'
import { scenarioById } from '../data'
import type { Mode } from '../data'
import { generateFeedback, words } from '../feedback'
import { uid } from '../store'
import { IClose, IMic, IPause, IPin, IPlay, IRedo, IStop, IType } from '../icons'

const SAMPLES: Record<string, string> = {
  'project-60': "I'm building a study planner app. It uses React and a small database to sort your deadlines by week. Right now I'm testing it with friends from my coding club.",
  'plain-words': 'An API is basically an endpoint on a server that returns JSON when the frontend sends a request to the backend.',
  'ask-workshop': 'Sorry, I just wanted to ask about the caching part, I got a bit lost with how the data gets updated and stuff.',
  'team-idea': 'Maybe we could do a short welcome video for new users. I saw another app do that and it seemed nice and people liked it.',
  'tell-me': "Hi, I'm in my final year studying computer science. I like building things and I've done a few projects. I'm really interested in this internship.",
  'challenge': 'In our group project the app kept crashing before the demo. We worked on it together and eventually we fixed it and the demo went okay.',
}

type VoiceState = 'idle' | 'requesting' | 'recording' | 'paused' | 'review' | 'denied' | 'nomic'

// Minimal typing for the Web Speech API (not in TS DOM lib).
interface SR { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => void) | null; onend: (() => void) | null }
const SRCtor: (new () => SR) | undefined = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
  ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const MAX_SECONDS = 180

export function PracticeRoom({ ctx, scenarioId, sessionId }: { ctx: Ctx; scenarioId: string; sessionId?: string }) {
  const { state, setState, go } = ctx
  const scenario = scenarioById(scenarioId)
  const session = sessionId ? state.sessions.find((s) => s.id === sessionId) : undefined
  const prev = session?.attempts[session.attempts.length - 1]
  const focus = prev?.feedback.improvements.find((i) => !prev.hidden.includes(i.id))
  const draftKey = `speakher.draft.${scenarioId}`

  const startMode: Mode = prev?.mode ?? (state.comfort === 'voice' ? 'voice' : 'text')
  const [mode, setMode] = useState<Mode>(startMode)
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(draftKey) ?? (prev?.mode === 'text' ? prev.text : '') } catch { return prev?.text ?? '' }
  })
  const [nudge, setNudge] = useState<'' | 'short' | 'long'>('')
  const [generating, setGenerating] = useState(0)
  const [prevOpen, setPrevOpen] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)

  // Voice
  const [vs, setVs] = useState<VoiceState>('idle')
  const [secs, setSecs] = useState(0)
  const [transcript, setTranscript] = useState(prev?.mode === 'voice' ? prev.text : '')
  const [interim, setInterim] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [limitHit, setLimitHit] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const srRef = useRef<SR | null>(null)
  const chunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const [levels, setLevels] = useState<number[]>(Array(28).fill(0.1))
  const analyser = useRef<AnalyserNode | null>(null)

  // Autosave text draft (FR-4.1)
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(draftKey, text) } catch { /* ignore */ } }, 600)
    return () => clearTimeout(t)
  }, [text, draftKey])

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Recording timer + waveform
  useEffect(() => {
    if (vs !== 'recording') return
    const t = setInterval(() => setSecs((s) => {
      if (s + 1 >= MAX_SECONDS) { setLimitHit(true); stopRec() }
      return s + 1
    }), 1000)
    let raf = 0
    const buf = new Uint8Array(64)
    const tick = () => {
      if (analyser.current) {
        analyser.current.getByteFrequencyData(buf)
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length / 255
        setLevels((l) => [...l.slice(1), Math.max(0.08, Math.min(1, avg * 2.6))])
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { clearInterval(t); cancelAnimationFrame(raf) }
  }, [vs])

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()) }, [])

  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia) { setVs('nomic'); return }
    setVs('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ac = new AudioContext()
      const an = ac.createAnalyser(); an.fftSize = 128
      ac.createMediaStreamSource(stream).connect(an)
      analyser.current = an
      const rec = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = (e) => chunks.current.push(e.data)
      rec.onstop = () => {
        setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: rec.mimeType })))
        stream.getTracks().forEach((t) => t.stop())
      }
      rec.start()
      recRef.current = rec
      if (SRCtor) {
        const sr = new SRCtor()
        sr.continuous = true; sr.interimResults = true; sr.lang = 'en-GB'
        let finalText = ''
        sr.onresult = (e) => {
          let inter = ''
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i]
            if (r.isFinal) finalText += r[0].transcript.trim() + '. '
            else inter += r[0].transcript
          }
          setTranscript(finalText.trim())
          setInterim(inter)
        }
        sr.start(); srRef.current = sr
      }
      setSecs(0); setLimitHit(false); setTranscript(''); setVs('recording')
    } catch (err) {
      const name = (err as DOMException).name
      setVs(name === 'NotFoundError' ? 'nomic' : 'denied')
    }
  }

  function pauseRec() {
    if (vs === 'recording') { recRef.current?.pause(); srRef.current?.stop(); setVs('paused') }
    else if (vs === 'paused') { recRef.current?.resume(); try { srRef.current?.start() } catch { /* already running */ } setVs('recording') }
  }

  function stopRec() {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    srRef.current?.stop()
    setInterim('')
    setVs('review')
  }

  function rerecord() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(''); setTranscript(''); setSecs(0); setVs('idle')
  }

  const response = mode === 'text' ? text : transcript
  const wc = words(response).length

  function submit(force = false) {
    if (!online) return
    if (!force && wc < 15) return setNudge('short')
    if (wc > 400) return setNudge('long')
    setNudge('')
    setGenerating(1)
    setTimeout(() => setGenerating(2), 900)
    setTimeout(() => setGenerating(3), 1800)
    setTimeout(() => {
      const fb = generateFeedback(response, scenario, prev?.text)
      const attempt = { id: uid(), text: response.trim(), mode, at: Date.now(), feedback: fb, hidden: [] }
      const sid = session?.id ?? uid()
      setState((s) => {
        const exists = s.sessions.find((x) => x.id === sid)
        const sessions = exists
          ? s.sessions.map((x) => (x.id === sid ? { ...x, attempts: [...x.attempts, attempt] } : x))
          : [{ id: sid, scenarioId, startedAt: Date.now(), attempts: [attempt] }, ...s.sessions]
        return { ...s, sessions }
      })
      try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
      if (audioUrl) URL.revokeObjectURL(audioUrl) // audio discarded after use
      go({ name: 'feedback', sessionId: sid })
    }, 2700)
  }

  function leave() {
    const dirty = response.trim().length > 0 || vs === 'recording'
    if (dirty && !confirm('Leave practice? Your typed draft stays on this device. Any recording is discarded.')) return
    streamRef.current?.getTracks().forEach((t) => t.stop())
    go(session ? { name: 'feedback', sessionId: session.id } : { name: 'scenario', id: scenarioId })
  }

  const voiceStatus =
    vs === 'recording' ? `Recording, ${fmt(secs)}` : vs === 'paused' ? `Paused at ${fmt(secs)}` :
    vs === 'requesting' ? 'Waiting for microphone permission…' : vs === 'review' ? 'Recorded. Check your transcript.' : 'Ready when you are'

  if (generating) {
    return (
      <div className="practice">
        <div className="generating" role="status" aria-live="polite">
          <div className="dots" aria-hidden><span /><span /><span /></div>
          <p>{['', 'Reading your answer…', 'Looking for what worked…', 'Choosing one thing to try…'][generating]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="practice">
      <div className="practice__bar">
        <button className="btn btn--ghost btn--sm" onClick={leave}><IClose width={18} height={18} /> Leave practice</button>
        <span className="muted small">{session ? `Attempt ${session.attempts.length + 1}` : 'First attempt'}</span>
      </div>

      {!online && <div className="banner" role="status">You're offline. Your draft is saved on this device; you can submit once you're back online.</div>}

      <section className="prompt-card" aria-label="Prompt">
        <p className="prompt-card__ctx">{scenario.situation}</p>
        <p className="bubble bubble--them bubble--lg">{scenario.prompt}</p>
        <p className="muted small">{scenario.audience} · {scenario.timeGuide}</p>
      </section>

      {focus && (
        <div className="focus-pin"><IPin width={18} height={18} /><span><strong>Focus:</strong> {focus.title.toLowerCase()}</span></div>
      )}

      {prev && (
        <details className="prev" open={prevOpen} onToggle={(e) => setPrevOpen((e.target as HTMLDetailsElement).open)}>
          <summary>Your previous answer</summary>
          <p>{prev.text}</p>
        </details>
      )}

      <div className="mode" role="tablist" aria-label="Answer mode">
        <button role="tab" aria-selected={mode === 'voice'} onClick={() => setMode('voice')}><IMic width={18} height={18} /> Voice</button>
        <button role="tab" aria-selected={mode === 'text'} onClick={() => { if (vs === 'recording') stopRec(); setMode('text') }}><IType width={18} height={18} /> Text</button>
      </div>

      {mode === 'text' ? (
        <div className="composer">
          <label htmlFor="answer" className="sr">Your answer</label>
          <textarea id="answer" value={text} onChange={(e) => { setText(e.target.value); setNudge('') }} rows={8}
            placeholder="Type your answer the way you'd say it. You can take your time." />
          <div className="composer__meta">
            <span className={wc > 150 ? 'warn' : ''}>{wc} words <span className="muted">· aim for 100–150</span></span>
            {!text && <button className="link" onClick={() => setText(SAMPLES[scenarioId])}>Try with an example answer</button>}
          </div>
        </div>
      ) : (
        <div className="voice">
          {(vs === 'denied' || vs === 'nomic') ? (
            <div className="calm" role="status">
              <p><strong>{vs === 'denied' ? 'No problem.' : "We couldn't find a microphone."}</strong> You can type your answer instead.
                {vs === 'denied' && ' If you want to use voice later, allow the microphone in your browser\'s site settings (the lock icon next to the address).'}</p>
              <button className="btn btn--primary" onClick={() => { setMode('text'); setState((s) => ({ ...s, comfort: 'text' })) }}><IType /> Type instead</button>
            </div>
          ) : vs === 'review' ? (
            <div className="review">
              {audioUrl && <audio controls src={audioUrl} aria-label="Play back your recording" />}
              {limitHit && <p className="callout">We stopped at 3 minutes, the maximum. Your recording is kept for review.</p>}
              <label htmlFor="tx" className="label">Your transcript <span className="muted">· fix anything we misheard</span></label>
              <textarea id="tx" rows={7} value={transcript} onChange={(e) => { setTranscript(e.target.value); setNudge('') }}
                placeholder={SRCtor ? "We couldn't hear anything. Re-record, or type what you said." : "Live transcription isn't available in this browser. Type what you said here."} />
              <p className="fine">Feedback reads this transcript, not your voice. Your audio is not saved after this step.</p>
              <div className="row">
                <button className="btn btn--ghost" onClick={rerecord}><IRedo width={18} height={18} /> Re-record</button>
              </div>
            </div>
          ) : (
            <div className="recorder">
              <div className={`wave ${vs === 'recording' ? 'wave--live' : ''}`} aria-hidden>
                {levels.map((l, i) => <span key={i} style={{ transform: `scaleY(${vs === 'recording' ? l : 0.1})` }} />)}
              </div>
              {(vs === 'recording' || vs === 'paused') && (transcript || interim) && (
                <p className="live-tx" aria-hidden>{transcript} <span className="muted">{interim}</span></p>
              )}
              <p className="voice__status" role="status" aria-live="polite">{voiceStatus}</p>
              <div className="rec-controls">
                {vs === 'idle' || vs === 'requesting' ? (
                  <button className="rec" onClick={startRec} disabled={vs === 'requesting'} aria-label="Start recording"><IMic width={30} height={30} /></button>
                ) : (
                  <>
                    <button className="btn btn--icon btn--round" onClick={pauseRec} aria-label={vs === 'paused' ? 'Resume recording' : 'Pause recording'}>
                      {vs === 'paused' ? <IPlay /> : <IPause />}
                    </button>
                    <button className="rec rec--on" onClick={stopRec} aria-label="Stop recording"><IStop width={28} height={28} /></button>
                    <span className="rec-time">{fmt(secs)}</span>
                  </>
                )}
              </div>
              {vs === 'idle' && <p className="fine center">Your browser will ask to use the microphone. We only listen while this button is on.</p>}
            </div>
          )}
        </div>
      )}

      {nudge === 'short' && (
        <div className="callout" role="alert">
          A bit more detail will make the feedback more useful. Try adding who it's for, or one example.
          <button className="link" onClick={() => submit(true)}>Submit anyway</button>
        </div>
      )}
      {nudge === 'long' && <div className="callout" role="alert">That's over 400 words. Try trimming it to your strongest points so the feedback can focus.</div>}

      <p className="muted small center">You can take your time.</p>

      <div className="sticky-cta">
        <button className="btn btn--primary btn--block" disabled={!response.trim() || !online || vs === 'recording' || vs === 'paused'} onClick={() => submit()}>
          Get feedback
        </button>
      </div>
    </div>
  )
}
