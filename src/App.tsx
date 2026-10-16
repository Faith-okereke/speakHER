import { useEffect, useRef, useState } from 'react'
import { demoState, usePersistentState } from './store'
import type { AppState } from './store'
import { IHome, IPractise, IProgress, IUser } from './icons'
import { Landing, Onboarding } from './screens/Onboarding'
import { Home, Library, ScenarioDetail, Progress, Compare, Me } from './screens/Screens'
import { PracticeRoom } from './screens/Practice'
import { FeedbackScreen } from './screens/Feedback'

export type Route =
  | { name: 'landing' }
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'scenario'; id: string }
  | { name: 'practice'; scenarioId: string; sessionId?: string }
  | { name: 'feedback'; sessionId: string }
  | { name: 'progress' }
  | { name: 'compare'; sessionId: string }
  | { name: 'me' }

export interface Ctx {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  go: (r: Route) => void
}

const TABS = [
  { name: 'home', label: 'Home', Icon: IHome },
  { name: 'library', label: 'Practise', Icon: IPractise },
  { name: 'progress', label: 'Progress', Icon: IProgress },
] as const

// ?demo=home|feedback|compare|practice|library|progress|me loads a sample user for presenting.
const DEMO = new URLSearchParams(location.search).get('demo')

export default function App() {
  const [state, setState] = usePersistentState(DEMO !== null ? demoState : undefined)
  const [route, setRoute] = useState<Route>(() => {
    const demo = DEMO
    if (demo !== null) {
      history.replaceState(null, '', location.pathname)
      if (demo === 'feedback' || demo === 'compare') return { name: demo, sessionId: 'demo1' }
      if (demo === 'practice') return { name: 'practice', scenarioId: 'project-60', sessionId: 'demo1' }
      if (['library', 'progress', 'me', 'landing', 'onboarding'].includes(demo)) return { name: demo } as Route
      return { name: 'home' }
    }
    return state.onboarded ? { name: 'home' } : { name: 'landing' }
  })
  const mainRef = useRef<HTMLElement>(null)

  const go = (r: Route) => {
    setRoute(r)
    window.scrollTo({ top: 0 })
  }

  // Move focus to the new screen's heading for keyboard and screen-reader users.
  useEffect(() => {
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [route])

  const ctx: Ctx = { state, setState, go }
  const inFlow = route.name === 'landing' || route.name === 'onboarding'
  const inPractice = route.name === 'practice'

  let screen: React.ReactNode
  switch (route.name) {
    case 'landing': screen = <Landing ctx={ctx} />; break
    case 'onboarding': screen = <Onboarding ctx={ctx} />; break
    case 'home': screen = <Home ctx={ctx} />; break
    case 'library': screen = <Library ctx={ctx} />; break
    case 'scenario': screen = <ScenarioDetail ctx={ctx} id={route.id} />; break
    case 'practice': screen = <PracticeRoom key={route.sessionId ?? route.scenarioId} ctx={ctx} scenarioId={route.scenarioId} sessionId={route.sessionId} />; break
    case 'feedback': screen = <FeedbackScreen key={route.sessionId + state.sessions.find(s => s.id === route.sessionId)?.attempts.length} ctx={ctx} sessionId={route.sessionId} />; break
    case 'progress': screen = <Progress ctx={ctx} />; break
    case 'compare': screen = <Compare ctx={ctx} sessionId={route.sessionId} />; break
    case 'me': screen = <Me ctx={ctx} />; break
  }

  const active = route.name === 'scenario' || route.name === 'feedback' ? 'library' : route.name === 'compare' ? 'progress' : route.name

  if (inFlow) return <main ref={mainRef} className="flow">{screen}</main>

  return (
    <div className={`shell ${inPractice ? 'shell--focus' : ''}`}>
      <a className="skip" href="#main">Skip to content</a>
      {!inPractice && (
        <nav className="rail" aria-label="Main">
          <div className="brand" aria-label="SpeakHER">Speak<span>HER</span></div>
          <ul>
            {TABS.map(({ name, label, Icon }) => (
              <li key={name}>
                <button className="tab" aria-current={active === name ? 'page' : undefined} onClick={() => go({ name })}>
                  <Icon /><span>{label}</span>
                </button>
              </li>
            ))}
            <li className="rail__me">
              <button className="tab" aria-current={active === 'me' ? 'page' : undefined} onClick={() => go({ name: 'me' })}>
                <IUser /><span>Me</span>
              </button>
            </li>
          </ul>
        </nav>
      )}
      {!inPractice && (
        <header className="topbar">
          <div className="brand">Speak<span>HER</span></div>
          <button className="avatar" aria-label="Me: profile and privacy" onClick={() => go({ name: 'me' })}>
            {(state.name || 'M').slice(0, 1).toUpperCase()}
          </button>
        </header>
      )}
      <main id="main" ref={mainRef} className="main">{screen}</main>
    </div>
  )
}
