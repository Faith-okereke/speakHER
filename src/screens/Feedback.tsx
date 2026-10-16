import { useState } from 'react'
import type { Ctx } from '../App'
import { scenarioById } from '../data'
import type { FeedbackItem } from '../feedback'
import { IArrow, ICheck, IFlag, ISpark } from '../icons'

const REASONS = ['Not accurate', 'Not helpful', 'Not relevant to my goal', 'Other']

function Highlighted({ text, quotes }: { text: string; quotes: string[] }) {
  // Mark quoted spans (underline + colour, not colour alone).
  const ranges = quotes
    .map((q) => q.replace(/…$/, ''))
    .map((q) => { const i = text.indexOf(q); return i >= 0 ? [i, i + q.length] as const : null })
    .filter((r): r is readonly [number, number] => !!r)
    .sort((a, b) => a[0] - b[0])
  const out: React.ReactNode[] = []
  let pos = 0
  ranges.forEach(([a, b], k) => {
    if (a < pos) return
    out.push(text.slice(pos, a))
    out.push(<mark key={k} className="hl">{text.slice(a, b)}</mark>)
    pos = b
  })
  out.push(text.slice(pos))
  return <>{out}</>
}

export function FeedbackScreen({ ctx, sessionId }: { ctx: Ctx; sessionId: string }) {
  const { state, setState, go } = ctx
  const session = state.sessions.find((s) => s.id === sessionId)
  const [flagging, setFlagging] = useState<string | null>(null)
  const [showFull, setShowFull] = useState(false)
  const [thanks, setThanks] = useState('')

  if (!session) {
    return <div className="empty"><h1 tabIndex={-1}>This practice was deleted</h1><button className="btn btn--primary" onClick={() => go({ name: 'library' })}>Pick a scenario</button></div>
  }
  const scenario = scenarioById(session.scenarioId)
  const attempt = session.attempts[session.attempts.length - 1]
  const fb = attempt.feedback
  const n = session.attempts.length

  const update = (patch: Partial<typeof attempt>) =>
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((x) => x.id !== sessionId ? x : { ...x, attempts: x.attempts.map((a) => a.id === attempt.id ? { ...a, ...patch } : a) }),
    }))

  const hide = (id: string, reason: string) => {
    update({ hidden: [...attempt.hidden, id] })
    setFlagging(null)
    setThanks(`Thanks. We've hidden that one ("${reason.toLowerCase()}").`)
  }

  const strengths = fb.strengths.filter((i) => !attempt.hidden.includes(i.id))
  const improvements = fb.improvements.filter((i) => !attempt.hidden.includes(i.id))

  const Item = ({ item, kind }: { item: FeedbackItem; kind: 'good' | 'try' }) => (
    <li className={`fb-item fb-item--${kind}`}>
      <h3>{kind === 'good' ? <ICheck width={18} height={18} /> : <ISpark width={18} height={18} />}{item.title}</h3>
      <p>{item.detail}</p>
      {item.quote && <blockquote><span className="sr">You said: </span>"<u>{item.quote}</u>"</blockquote>}
      {item.example && <p className="example"><span className="muted">For example:</span> {item.example}</p>}
      {flagging === item.id ? (
        <div className="flag" role="group" aria-label="Why doesn't this fit?">
          {REASONS.map((r) => <button key={r} className="chip" onClick={() => hide(item.id, r)}>{r}</button>)}
          <button className="link" onClick={() => setFlagging(null)}>Cancel</button>
        </div>
      ) : (
        <button className="link link--quiet" onClick={() => setFlagging(item.id)}><IFlag width={15} height={15} /> This doesn't fit</button>
      )}
    </li>
  )

  return (
    <div className="feedback">
      <p className="muted small">{scenario.title} · Attempt {n}</p>
      <h1 tabIndex={-1} aria-live="polite">{fb.summary}</h1>

      {thanks && <p className="toast" role="status">{thanks}</p>}

      {fb.changed && (
        <section className="changed" aria-labelledby="ch-h">
          <h2 id="ch-h">What changed</h2>
          <ul>{fb.changed.map((c) => <li key={c}>{c}</li>)}</ul>
          <button className="link" onClick={() => go({ name: 'compare', sessionId })}>Compare attempts side by side <IArrow width={16} height={16} /></button>
        </section>
      )}

      {strengths.length > 0 && (
        <section aria-labelledby="ww-h">
          <h2 id="ww-h">What worked</h2>
          <ul className="fb-list">{strengths.map((i) => <Item key={i.id} item={i} kind="good" />)}</ul>
        </section>
      )}

      {improvements.length > 0 && (
        <section aria-labelledby="tt-h">
          <h2 id="tt-h">{improvements.length === 1 ? 'One thing to try' : 'Things to try'}</h2>
          <ul className="fb-list">{improvements.map((i) => <Item key={i.id} item={i} kind="try" />)}</ul>
        </section>
      )}

      <section className="another">
        <h2>Try another way</h2>
        <p>{fb.tryAnother}</p>
      </section>

      <details className="prev" open={showFull} onToggle={(e) => setShowFull((e.target as HTMLDetailsElement).open)}>
        <summary>Your full answer</summary>
        <p><Highlighted text={attempt.text} quotes={strengths.map((s) => s.quote ?? '')} /></p>
      </details>

      <div className="rate" role="group" aria-label="Was this feedback helpful?">
        <span>Was this feedback helpful?</span>
        <button className="chip" aria-pressed={attempt.rating === 'helpful'} onClick={() => update({ rating: 'helpful' })}>Helpful</button>
        <button className="chip" aria-pressed={attempt.rating === 'not'} onClick={() => update({ rating: 'not' })}>Not helpful</button>
      </div>

      {n >= 5 && <p className="callout">You've done {n} attempts. That's real effort. Maybe take a break, or try a different scenario?</p>}

      <div className="sticky-cta row">
        <button className="btn btn--ghost" onClick={() => go({ name: 'library' })}>New scenario</button>
        <button className="btn btn--primary grow" onClick={() => go({ name: 'practice', scenarioId: scenario.id, sessionId })}>Revise my answer <IArrow /></button>
      </div>
    </div>
  )
}
