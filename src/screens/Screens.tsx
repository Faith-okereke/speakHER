import { useState } from 'react'
import type { Ctx } from '../App'
import { CATEGORIES, GOALS, SCENARIOS, scenarioById } from '../data'
import type { Category, Scenario } from '../data'
import { addedWords } from '../feedback'
import type { Session } from '../store'
import { clearAll, initialState } from '../store'
import { IArrow, IMic, IPin, ITrash, IType, Scribble } from '../icons'

const when = (t: number) => {
  const d = Math.floor((Date.now() - t) / 86400000)
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Notebook({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="notebook">
      <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden>
        <rect x="14" y="8" width="92" height="74" rx="8" fill="var(--paper)" stroke="var(--plum)" strokeWidth="2.5" />
        {[26, 38, 50, 62].map((y) => <path key={y} d={`M28 ${y}h62`} stroke="var(--lilac)" strokeWidth="2.5" strokeLinecap="round" />)}
        {[18, 34, 50, 66].map((y) => <circle key={y} cx="14" cy={y + 4} r="3.5" fill="var(--coral)" />)}
        <path d="M78 54c8-6 18-4 22 4" stroke="var(--coral)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <p>{title}</p>
      <button className="btn btn--primary" onClick={onAction}>{action} <IArrow /></button>
    </div>
  )
}

function ScenarioCard({ s, onOpen, count }: { s: Scenario; onOpen: () => void; count?: number }) {
  return (
    <button className="scard" onClick={onOpen}>
      <span className={`chip chip--static chip--${CATEGORIES.indexOf(s.category)}`}>{s.category}</span>
      <strong className="scard__title">{s.title}</strong>
      <span className="scard__meta">{s.audience}</span>
      <span className="scard__foot">
        <span>{s.timeGuide.split(',')[0]}</span>
        <span aria-label={`Difficulty ${s.difficulty} of 2`}>{s.difficulty === 1 ? 'Gentle' : 'Stretch'}</span>
        {count ? <span>{count} {count === 1 ? 'try' : 'tries'}</span> : null}
      </span>
    </button>
  )
}

const attemptsFor = (sessions: Session[], id: string) => sessions.filter((s) => s.scenarioId === id).reduce((n, s) => n + s.attempts.length, 0)

export function Home({ ctx }: { ctx: Ctx }) {
  const { state, go } = ctx
  const last = state.sessions[0]
  const suggested = SCENARIOS.find((s) => s.goals.some((g) => state.goals.includes(g)) && !state.sessions.some((x) => x.scenarioId === s.id))
    ?? SCENARIOS.find((s) => !state.sessions.some((x) => x.scenarioId === s.id)) ?? SCENARIOS[0]
  const recent = state.sessions.flatMap((s) => s.attempts.map((a) => ({ s, a }))).sort((x, y) => y.a.at - x.a.at).slice(0, 3)
  const [now] = useState(() => Date.now())
  const weekCount = state.sessions.flatMap((s) => s.attempts).filter((a) => now - a.at < 7 * 86400000).length

  return (
    <div className="home">
      <h1 tabIndex={-1}>Hi {state.name || 'there'}<span className="wave-hand" aria-hidden>.</span> <span className="h-sub">What do you want to put into words today?</span></h1>

      {last && (
        <section aria-labelledby="cont-h">
          <h2 id="cont-h">Pick up where you left off</h2>
          <button className="continue" onClick={() => go({ name: 'feedback', sessionId: last.id })}>
            <span>
              <strong>{scenarioById(last.scenarioId).title}</strong>
              <span className="muted">Attempt {last.attempts.length} · {when(last.attempts[last.attempts.length - 1].at)}</span>
            </span>
            <IArrow />
          </button>
        </section>
      )}

      <section aria-labelledby="sug-h">
        <h2 id="sug-h">Suggested for you</h2>
        <button className="feature" onClick={() => go({ name: 'scenario', id: suggested.id })}>
          <span className="feature__bubble">{suggested.prompt}</span>
          <strong>{suggested.title}</strong>
          <span className="muted">{suggested.situation}</span>
          <span className="feature__go">Start <IArrow width={18} height={18} /></span>
        </button>
      </section>

      <section aria-labelledby="rec-h">
        <h2 id="rec-h">Recent attempts</h2>
        {recent.length === 0 ? (
          <Notebook title="Nothing here yet. Try your first scenario." action="Browse scenarios" onAction={() => go({ name: 'library' })} />
        ) : (
          <ul className="list">
            {recent.map(({ s, a }) => (
              <li key={a.id}>
                <button className="list__row" onClick={() => go({ name: 'feedback', sessionId: s.id })}>
                  {a.mode === 'voice' ? <IMic width={18} height={18} /> : <IType width={18} height={18} />}
                  <span className="grow"><strong>{scenarioById(s.scenarioId).title}</strong><span className="muted">{a.text.slice(0, 70)}…</span></span>
                  <span className="muted small">{when(a.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {weekCount > 0 && <p className="muted small">You practised {weekCount} {weekCount === 1 ? 'time' : 'times'} this week.</p>}
      </section>
    </div>
  )
}

export function Library({ ctx }: { ctx: Ctx }) {
  const { state, go } = ctx
  const [cat, setCat] = useState<Category | 'All'>('All')
  const [mine, setMine] = useState(false)
  const list = SCENARIOS.filter((s) => (cat === 'All' || s.category === cat) && (!mine || s.goals.some((g) => state.goals.includes(g))))

  return (
    <div className="library">
      <h1 tabIndex={-1}>Practise</h1>
      <div className="tabs" role="tablist" aria-label="Category">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className="chip" onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {state.goals.length > 0 && (
        <label className="check check--inline">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          <span>Only my goals</span>
        </label>
      )}
      <p className="sr" aria-live="polite">{list.length} scenarios shown</p>
      {list.length === 0 ? (
        <div className="empty"><p>No scenarios match.</p><button className="btn btn--ghost" onClick={() => { setCat('All'); setMine(false) }}>Clear filters</button></div>
      ) : (
        <div className="grid">
          {list.map((s) => <ScenarioCard key={s.id} s={s} count={attemptsFor(state.sessions, s.id)} onOpen={() => go({ name: 'scenario', id: s.id })} />)}
        </div>
      )}
    </div>
  )
}

export function ScenarioDetail({ ctx, id }: { ctx: Ctx; id: string }) {
  const { state, go } = ctx
  const s = scenarioById(id)
  const earlier = state.sessions.filter((x) => x.scenarioId === id)
  const lastAttempt = earlier[0]?.attempts[earlier[0].attempts.length - 1]
  const lastFocus = lastAttempt?.feedback.improvements.find((i) => !lastAttempt.hidden.includes(i.id))

  return (
    <div className="detail">
      <button className="link link--back" onClick={() => go({ name: 'library' })}>← All scenarios</button>
      <span className={`chip chip--static chip--${CATEGORIES.indexOf(s.category)}`}>{s.category}</span>
      <h1 tabIndex={-1}>{s.title}</h1>
      <p className="bubble bubble--them bubble--lg">{s.situation}</p>

      <dl className="facts-grid">
        <div><dt>Who you're talking to</dt><dd>{s.audience}</dd></div>
        <div><dt>Suggested length</dt><dd>{s.timeGuide}. No timer pressure.</dd></div>
      </dl>

      <h2>What to aim for</h2>
      <ul className="aims">{s.aims.map((a) => <li key={a}>{a}</li>)}</ul>

      <details className="tips">
        <summary>Tips</summary>
        <ul>{s.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </details>

      {earlier.length > 0 && (
        <section className="earlier">
          <h2>Your earlier attempts</h2>
          {lastFocus && <p className="focus-pin"><IPin width={18} height={18} /><span><strong>Last time's focus:</strong> {lastFocus.title.toLowerCase()}</span></p>}
          <ul className="list">
            {earlier.map((x) => (
              <li key={x.id}><button className="list__row" onClick={() => go({ name: 'feedback', sessionId: x.id })}>
                <span className="grow"><strong>{x.attempts.length} {x.attempts.length === 1 ? 'attempt' : 'attempts'}</strong><span className="muted">{when(x.startedAt)}</span></span><IArrow width={18} height={18} />
              </button></li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky-cta">
        <button className="btn btn--primary btn--block" onClick={() => go({ name: 'practice', scenarioId: id })}>Start <IArrow /></button>
      </div>
    </div>
  )
}

export function Progress({ ctx }: { ctx: Ctx }) {
  const { state, go } = ctx
  const focusAreas = Array.from(new Set(state.sessions.flatMap((s) => s.attempts.flatMap((a) => a.feedback.improvements.map((i) => i.title)))))

  return (
    <div className="progress">
      <h1 tabIndex={-1}>Progress</h1>
      {state.sessions.length === 0 ? (
        <Notebook title="Your practice will show up here." action="Pick a scenario" onAction={() => go({ name: 'library' })} />
      ) : (
        <>
          {focusAreas.length > 0 && (
            <section>
              <h2>Focus areas you've worked on</h2>
              <ul className="tags">{focusAreas.slice(0, 6).map((f) => <li key={f} className="chip chip--static">{f}</li>)}</ul>
            </section>
          )}
          <section>
            <h2>History</h2>
            <ol className="timeline">
              {state.sessions.map((x) => (
                <li key={x.id}>
                  <div className="timeline__head">
                    <strong>{scenarioById(x.scenarioId).title}</strong>
                    <span className="muted small">{when(x.startedAt)} · {x.attempts.length} {x.attempts.length === 1 ? 'attempt' : 'attempts'}</span>
                  </div>
                  <div className="row row--wrap">
                    <button className="btn btn--ghost btn--sm" onClick={() => go({ name: 'feedback', sessionId: x.id })}>Feedback</button>
                    {x.attempts.length > 1 && <button className="btn btn--ghost btn--sm" onClick={() => go({ name: 'compare', sessionId: x.id })}>Compare</button>}
                    <button className="btn btn--ghost btn--sm" onClick={() => go({ name: 'practice', scenarioId: x.scenarioId })}>Practise again</button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}

export function Compare({ ctx, sessionId }: { ctx: Ctx; sessionId: string }) {
  const { state, setState, go } = ctx
  const session = state.sessions.find((s) => s.id === sessionId)
  const [tab, setTab] = useState<'a' | 'b'>('b')
  if (!session || session.attempts.length < 2) {
    return <div className="empty"><h1 tabIndex={-1}>Nothing to compare yet</h1><button className="btn btn--primary" onClick={() => go({ name: 'progress' })}>Back to progress</button></div>
  }
  const a = session.attempts[session.attempts.length - 2]
  const b = session.attempts[session.attempts.length - 1]
  const diff = addedWords(a.text, b.text)
  const removeAttempt = (id: string) => {
    if (!confirm('Delete this attempt? This cannot be undone.')) return
    setState((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === sessionId ? { ...x, attempts: x.attempts.filter((t) => t.id !== id) } : x) }))
  }

  return (
    <div className="compare">
      <button className="link link--back" onClick={() => go({ name: 'progress' })}>← Progress</button>
      <h1 tabIndex={-1}>{scenarioById(session.scenarioId).title}</h1>
      <p className="muted"><mark className="hl hl--add">Highlighted</mark> words are new in your latest attempt.</p>
      <div className="tabs compare__tabs" role="tablist">
        <button role="tab" className="chip" aria-selected={tab === 'a'} onClick={() => setTab('a')}>Attempt {session.attempts.length - 1}</button>
        <button role="tab" className="chip" aria-selected={tab === 'b'} onClick={() => setTab('b')}>Attempt {session.attempts.length}</button>
      </div>
      <div className="cols">
        <article className={`col ${tab === 'a' ? 'col--on' : ''}`}>
          <h2>Attempt {session.attempts.length - 1}</h2>
          <p>{a.text}</p>
          <button className="link link--quiet" onClick={() => removeAttempt(a.id)}><ITrash width={15} height={15} /> Delete</button>
        </article>
        <article className={`col col--new ${tab === 'b' ? 'col--on' : ''}`}>
          <h2>Attempt {session.attempts.length} <Scribble className="col__mark" /></h2>
          <p>{diff.reduce<{ added: boolean; text: string }[]>((runs, d) => {
            const last = runs[runs.length - 1]
            if (last && last.added === d.added) last.text += ' ' + d.w
            else runs.push({ added: d.added, text: d.w })
            return runs
          }, []).map((r, i) => <span key={i}>{i > 0 && ' '}{r.added ? <mark className="hl hl--add">{r.text}</mark> : r.text}</span>)}</p>
          <button className="link link--quiet" onClick={() => removeAttempt(b.id)}><ITrash width={15} height={15} /> Delete</button>
        </article>
      </div>
      {b.feedback.changed && (
        <section className="changed">
          <h2>What changed</h2>
          <ul>{b.feedback.changed.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      )}
    </div>
  )
}

export function Me({ ctx }: { ctx: Ctx }) {
  const { state, setState, go } = ctx
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [done, setDone] = useState('')

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'speakher-my-data.json'; a.click()
  }

  return (
    <div className="me">
      <h1 tabIndex={-1}>Me</h1>
      {done && <p className="toast" role="status">{done}</p>}

      <section className="panel">
        <h2>Profile</h2>
        <label className="field"><span>Name</span><input value={state.name} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} /></label>
        <p className="muted small">Age band: {state.ageBand ?? 'not set'}</p>
      </section>

      <section className="panel">
        <h2>Preferences</h2>
        <fieldset className="chips"><legend>Default practice mode</legend>
          {(['voice', 'text', 'either'] as const).map((m) => (
            <button key={m} className="chip" aria-pressed={state.comfort === m} onClick={() => setState((s) => ({ ...s, comfort: m }))}>{m[0].toUpperCase() + m.slice(1)}</button>
          ))}
        </fieldset>
        <fieldset className="chips"><legend>Goals</legend>
          {GOALS.map((g) => {
            const on = state.goals.includes(g.id)
            return <button key={g.id} className="chip" aria-pressed={on} onClick={() => setState((s) => ({ ...s, goals: on ? s.goals.filter((x) => x !== g.id) : [...s.goals, g.id] }))}>{g.label}</button>
          })}
        </fieldset>
      </section>

      <section className="panel">
        <h2>Privacy and data</h2>
        <ul className="facts">
          <li><strong>Stored:</strong> your text answers, transcripts and feedback. On this prototype, only in this browser.</li>
          <li><strong>Never stored:</strong> voice recordings. They're discarded after transcription.</li>
          <li><strong>Processed by:</strong> an AI feedback provider and a speech-to-text provider.</li>
        </ul>
        <fieldset className="chips"><legend>Keep my practice for</legend>
          {([['30d', '30 days'], ['1y', '1 year'], ['forever', 'Until I delete']] as const).map(([v, l]) => (
            <button key={v} className="chip" aria-pressed={state.retention === v} onClick={() => setState((s) => ({ ...s, retention: v }))}>{l}</button>
          ))}
        </fieldset>
        <label className="check"><input type="checkbox" checked={state.research} onChange={(e) => setState((s) => ({ ...s, research: e.target.checked }))} /><span>Use my anonymised feedback ratings to improve SpeakHER</span></label>
        <div className="row row--wrap">
          <button className="btn btn--ghost btn--sm" onClick={download}>Download my data</button>
          <button className="btn btn--ghost btn--sm" disabled={!state.sessions.length} onClick={() => {
            if (confirm('Delete all practice history? This cannot be undone.')) { setState((s) => ({ ...s, sessions: [] })); setDone('All practice history deleted.') }
          }}><ITrash width={16} height={16} /> Delete all history</button>
        </div>
      </section>

      <section className="panel panel--danger">
        <h2>Account</h2>
        {!deleting ? (
          <div className="row row--wrap">
            <button className="btn btn--ghost btn--sm" onClick={() => go({ name: 'landing' })}>Sign out</button>
            <button className="btn btn--danger btn--sm" onClick={() => setDeleting(true)}>Delete account</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (confirmText.trim().toLowerCase() !== 'delete') return; clearAll(); setState(initialState); go({ name: 'landing' }) }}>
            <p>This erases your profile, goals, {state.sessions.length} practice {state.sessions.length === 1 ? 'session' : 'sessions'} and all feedback. You'll get an email confirming it.</p>
            <label className="field"><span>Type <strong>delete</strong> to confirm</span><input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" /></label>
            <div className="row">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDeleting(false)}>Cancel</button>
              <button className="btn btn--danger btn--sm" disabled={confirmText.trim().toLowerCase() !== 'delete'}>Delete everything</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
