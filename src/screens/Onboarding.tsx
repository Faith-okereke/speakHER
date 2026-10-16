import { useState } from 'react'
import type { Ctx } from '../App'
import { GOALS, SCENARIOS } from '../data'
import type { Goal } from '../data'
import { IArrow, IBack, ICheck, ILock, IMic, IType, Scribble } from '../icons'

export function Landing({ ctx }: { ctx: Ctx }) {
  return (
    <div className="landing">
      <header className="landing__bar">
        <div className="brand">Speak<span>HER</span></div>
        <button className="btn btn--ghost" onClick={() => ctx.go({ name: 'onboarding' })}>Sign in</button>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <h1 tabIndex={-1}>
            Find the words to <span className="mark">express<Scribble className="mark__line" /></span> your thoughts.
          </h1>
          <p className="lede">
            A private practice space for explaining your projects, asking questions and answering interview prompts.
            Answer by voice or text, get specific feedback, and try again.
          </p>
          <button className="btn btn--primary btn--lg" onClick={() => ctx.go({ name: 'onboarding' })}>
            Start practising <IArrow />
          </button>
          <p className="fine"><ILock width={16} height={16} /> Private by default. Your audio is never stored.</p>
        </div>

        <figure className="demo" aria-label="Example: a practice answer gets a highlighted suggestion">
          <div className="bubble bubble--them">So, what are you working on at the moment?</div>
          <div className="bubble bubble--me">
            I'm building a study-planner app <mark className="hl">for first-year students who juggle part-time jobs</mark>. It already has 12 testers.
          </div>
          <div className="note">
            <ICheck width={18} height={18} />
            <div><strong>You named who it helps.</strong> That makes people care.</div>
          </div>
        </figure>
      </section>

      <section className="how" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <ol className="steps">
          <li><strong>Pick a real situation.</strong> Explaining a project, asking at a workshop, a first interview.</li>
          <li><strong>Say it or type it.</strong> Take your time. Nobody is listening.</li>
          <li><strong>Get feedback, then try again.</strong> Two things that worked, one thing to change, in your own words.</li>
        </ol>
      </section>

      <section className="scen-preview" aria-labelledby="sp-h">
        <h2 id="sp-h">Six situations to start with</h2>
        <ul>
          {SCENARIOS.map((s) => <li key={s.id}><span className="chip chip--static">{s.category}</span>{s.title}</li>)}
        </ul>
      </section>

      <section className="privacy-sum" aria-labelledby="pv-h">
        <h2 id="pv-h">Privacy, in plain words</h2>
        <p>No public profile, no audience, no leaderboard. Voice is turned into text and the recording is thrown away. You can delete any practice, or your whole account, at any time.</p>
        <p className="fine">SpeakHER gives practice and feedback. It does not replace a mentor or guarantee outcomes.</p>
      </section>

      <div className="sticky-cta">
        <button className="btn btn--primary btn--block" onClick={() => ctx.go({ name: 'onboarding' })}>Start practising</button>
      </div>
    </div>
  )
}

const TOTAL = 5

export function Onboarding({ ctx }: { ctx: Ctx }) {
  const { state, setState, go } = ctx
  const [step, setStep] = useState(1)
  const [name, setName] = useState(state.name)
  const [year, setYear] = useState('')
  const [ageError, setAgeError] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [ack, setAck] = useState(false)
  const [ackError, setAckError] = useState(false)
  const [research, setResearch] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [comfort, setComfort] = useState(state.comfort)

  const age = new Date().getFullYear() - Number(year)
  const band = age >= 18 ? '18+' : '16-17'

  const submitAge = () => {
    if (!/^\d{4}$/.test(year)) return setAgeError('Enter the year you were born, like 2005.')
    if (age < 16) return setBlocked(true)
    if (age > 100) return setAgeError('That year looks off. Check it and try again.')
    setAgeError('')
    setStep(2)
  }

  const finish = () => {
    setState((s) => ({ ...s, onboarded: true, name: name.trim() || 'friend', ageBand: band, research, goals, comfort }))
  }

  const suggested = SCENARIOS.find((s) => goals.some((g) => s.goals.includes(g))) ?? SCENARIOS[0]

  if (blocked) {
    return (
      <div className="ob">
        <div className="ob__card">
          <h1 tabIndex={-1}>SpeakHER is for ages 16 and up</h1>
          <p>Thanks for your interest. We haven't stored anything you entered. A coding club or school tech programme near you is a great place to practise explaining ideas in the meantime.</p>
          <button className="btn btn--ghost" onClick={() => go({ name: 'landing' })}>Back to start</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ob">
      <div className="ob__top">
        <button className="btn btn--icon" aria-label="Back" onClick={() => (step === 1 ? go({ name: 'landing' }) : setStep(step - 1))}><IBack /></button>
        <div className="ob__progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} aria-label={`Step ${step} of ${TOTAL}`}>
          {Array.from({ length: TOTAL }, (_, i) => <span key={i} className={i < step ? 'on' : ''} />)}
        </div>
        <span className="ob__count" aria-live="polite">Step {step} of {TOTAL}</span>
      </div>

      <div className="ob__card" key={step}>
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); submitAge() }}>
            <h1 tabIndex={-1}>Hi! Let's set up your space.</h1>
            <label className="field">
              <span>What should we call you?</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name or nickname" autoComplete="given-name" />
            </label>
            <label className="field">
              <span>What year were you born?</span>
              <input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="e.g. 2004" aria-invalid={!!ageError} aria-describedby="age-help" maxLength={4} />
              <small id="age-help" className={ageError ? 'err' : ''}>{ageError || 'We only keep your age band (16–17 or 18+), not the year.'}</small>
            </label>
            <button className="btn btn--primary btn--block" type="submit">Continue <IArrow /></button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); if (!ack) { setAckError(true); return } setStep(3) }}>
            <h1 tabIndex={-1}>What happens to your practice</h1>
            {band === '16-17' && <p className="callout">Because you're under 18, it's a good idea to show this page to a parent, guardian or your club leader.</p>}
            <ul className="facts">
              <li><strong>What we process:</strong> what you type, and your voice turned into text.</li>
              <li><strong>Who processes it:</strong> an AI feedback service and a speech-to-text service.</li>
              <li><strong>What we keep:</strong> text transcripts only. Recordings are deleted right after transcription.</li>
              <li><strong>How to delete:</strong> Me → Privacy and data, any time.</li>
            </ul>
            <fieldset className="checks">
              <legend className="sr">Consent</legend>
              <label className={`check ${ackError && !ack ? 'check--err' : ''}`}>
                <input type="checkbox" checked={ack} onChange={(e) => { setAck(e.target.checked); setAckError(false) }} aria-describedby={ackError ? 'ack-err' : undefined} />
                <span>I understand how my practice is processed. <em>(required)</em></span>
              </label>
              {ackError && !ack && <small id="ack-err" className="err">Tick this box to continue.</small>}
              <label className="check">
                <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
                <span>Use my anonymised feedback ratings to improve SpeakHER. <em>(optional)</em></span>
              </label>
            </fieldset>
            <button className="btn btn--primary btn--block" type="submit">Continue <IArrow /></button>
          </form>
        )}

        {step === 3 && (
          <div>
            <h1 tabIndex={-1}>What are you preparing for?</h1>
            <p className="muted">Pick any. This helps us suggest scenarios.</p>
            <fieldset className="chips">
              <legend className="sr">Goals</legend>
              {GOALS.map((g) => {
                const on = goals.includes(g.id)
                return (
                  <button key={g.id} type="button" className="chip" aria-pressed={on}
                    onClick={() => setGoals(on ? goals.filter((x) => x !== g.id) : [...goals, g.id])}>
                    {on && <ICheck width={16} height={16} />}{g.label}
                  </button>
                )
              })}
            </fieldset>
            <div className="row">
              <button className="btn btn--ghost" onClick={() => { setGoals([]); setStep(4) }}>Skip</button>
              <button className="btn btn--primary grow" onClick={() => setStep(4)}>Continue <IArrow /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 tabIndex={-1}>How would you like to practise?</h1>
            <p className="muted">You can change this any time, even mid-practice.</p>
            <div className="choices" role="radiogroup" aria-label="Practice mode">
              {([['voice', 'Out loud', 'Speak, then check the transcript', IMic], ['text', 'Typing', 'Write it out first, no mic needed', IType], ['either', 'Either', 'Decide each time', null]] as const).map(([v, t, d, Icon]) => (
                <button key={v} role="radio" aria-checked={comfort === v} className="choice" onClick={() => setComfort(v)}>
                  {Icon ? <Icon /> : <span className="choice__both"><IMic width={16} height={16} /><IType width={16} height={16} /></span>}
                  <span><strong>{t}</strong><small>{d}</small></span>
                </button>
              ))}
            </div>
            <button className="btn btn--primary btn--block" onClick={() => setStep(5)}>Continue <IArrow /></button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 tabIndex={-1}>Your first one, {name.trim() || 'friend'}</h1>
            <div className="suggest">
              <span className="chip chip--static">{suggested.category}</span>
              <h2>{suggested.title}</h2>
              <p className="bubble bubble--them">{suggested.situation}</p>
              <p className="muted">{suggested.timeGuide}</p>
            </div>
            <div className="row">
              <button className="btn btn--ghost" onClick={() => { finish(); go({ name: 'home' }) }}>Go to home</button>
              <button className="btn btn--primary grow" onClick={() => { finish(); go({ name: 'scenario', id: suggested.id }) }}>Let's go <IArrow /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
