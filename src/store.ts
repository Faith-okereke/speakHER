import { useEffect, useState } from 'react'
import type { Goal, Mode } from './data'
import type { Feedback } from './feedback'
import { generateFeedback } from './feedback'
import { scenarioById } from './data'

export interface Attempt {
  id: string
  text: string
  mode: Mode
  at: number
  feedback: Feedback
  hidden: string[]
  rating?: 'helpful' | 'not'
}

export interface Session {
  id: string
  scenarioId: string
  startedAt: number
  attempts: Attempt[]
}

export interface AppState {
  onboarded: boolean
  name: string
  ageBand?: '16-17' | '18+'
  research: boolean
  goals: Goal[]
  comfort: Mode | 'either'
  retention: '30d' | '1y' | 'forever'
  sessions: Session[]
}

const KEY = 'speakher.v1'

export const initialState: AppState = {
  onboarded: false,
  name: '',
  research: false,
  goals: [],
  comfort: 'either',
  retention: '1y',
  sessions: [],
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

export function usePersistentState(seed?: () => AppState) {
  const [state, setState] = useState<AppState>(seed ?? load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
  }, [state])
  return [state, setState] as const
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function clearAll() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('speakher')).forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

// Sample user for demos (?demo in the URL).
export function demoState(): AppState {
  const day = 86400000
  const now = Date.now()
  const a1 = "I'm building a study planner app. It uses React and a small database to sort your deadlines by week. Right now I'm testing it with friends from my coding club."
  const a2 = "I'm building a study planner for first-year students who juggle part-time jobs and classes. It sorts your deadlines by week, so you can see what's coming before it's urgent. Right now 12 people from my coding club are testing it."
  return {
    ...initialState,
    onboarded: true,
    name: 'Tolu',
    ageBand: '18+',
    goals: ['project', 'interviews'],
    comfort: 'either',
    sessions: [
      {
        id: 'demo1', scenarioId: 'project-60', startedAt: now - day,
        attempts: [
          { id: 'd1a', text: a1, mode: 'text', at: now - day, feedback: generateFeedback(a1, scenarioById('project-60')), hidden: [] },
          { id: 'd1b', text: a2, mode: 'voice', at: now - day + 600000, feedback: generateFeedback(a2, scenarioById('project-60'), a1), hidden: [] },
        ],
      },
    ],
  }
}
