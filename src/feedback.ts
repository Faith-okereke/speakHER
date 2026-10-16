import type { Scenario } from './data'

// Scripted, rule-based stand-in for the AI feedback service (PRD §7: prototype tier).
// Every quote is taken verbatim from the user's own response (FR-6.2).

export interface FeedbackItem {
  id: string
  title: string
  detail: string
  quote?: string
  example?: string
}

export interface Feedback {
  summary: string
  strengths: FeedbackItem[]
  improvements: FeedbackItem[]
  tryAnother: string
  changed?: string[]
  tooShort?: boolean
}

const JARGON = ['api', 'backend', 'frontend', 'endpoint', 'database', 'framework', 'deploy', 'stack', 'repo', 'server', 'json', 'algorithm', 'react', 'typescript', 'sdk', 'ui', 'ux']
const AUDIENCE = ['help', 'helps', 'for people', 'for students', 'for women', 'users', 'so that', 'who ', 'people who', 'anyone']
const COMPARE = ['like a', "it's like", 'imagine', 'think of', 'similar to', 'kind of like']
const STRUCTURE = ['first', 'then', 'because', 'so ', 'finally', 'next', 'right now', 'currently', 'before that', 'that\'s why']
const OWN = [' i built', ' i made', ' i learned', ' i decided', ' i wrote', ' i fixed', ' i led', ' i created', ' i designed', ' i noticed', ' i asked']
const QUESTION_OPENERS = ['if i understood', 'so if', 'could you', 'can you', 'would you', 'how does', 'why does', 'what happens']

export const words = (t: string) => t.trim().split(/\s+/).filter(Boolean)
const sentences = (t: string) =>
  (t.match(/[^.!?\n]+[.!?]?/g) ?? []).map((s) => s.trim()).filter((s) => words(s).length >= 3)

function findSentence(text: string, terms: string[]) {
  const ss = sentences(text)
  return ss.find((s) => terms.some((k) => (' ' + s.toLowerCase()).includes(k)))
}

const clip = (s: string) => {
  const w = words(s)
  return w.length > 22 ? w.slice(0, 22).join(' ') + '…' : s
}

export function generateFeedback(text: string, scenario: Scenario, previous?: string): Feedback {
  const wc = words(text).length
  const lower = ' ' + text.toLowerCase()
  const ss = sentences(text)

  if (wc < 15) {
    return {
      summary: "There isn't quite enough here for useful feedback yet.",
      strengths: [],
      improvements: [{ id: 'more', title: 'Add a little more detail', detail: 'Try two or three sentences: what it is, who it is for, and one specific detail.' }],
      tryAnother: 'Pretend the listener just said "Oh, tell me more!"',
      tooShort: true,
    }
  }

  const strengths: FeedbackItem[] = []
  const improvements: FeedbackItem[] = []

  const audienceS = findSentence(text, AUDIENCE)
  const numberS = ss.find((s) => /\d/.test(s))
  const compareS = findSentence(text, COMPARE)
  const structureS = findSentence(text, STRUCTURE)
  const ownS = findSentence(text, OWN)
  const qS = ss.find((s) => s.includes('?'))
  const openerS = findSentence(text, QUESTION_OPENERS)
  const jargonHits = JARGON.filter((j) => new RegExp(`\\b${j}\\b`, 'i').test(text))

  if (ss[0] && ss[0] !== audienceS && ss[0] !== numberS) strengths.push({ id: 'open', title: 'You got to the point quickly', detail: 'Your opening tells the listener what this is about, so they know what to listen for.', quote: clip(ss[0]) })
  if (audienceS) strengths.push({ id: 'aud', title: 'You named who it is for', detail: 'Saying who benefits makes it easier for people to care.', quote: clip(audienceS) })
  if (numberS) strengths.push({ id: 'num', title: 'You used a concrete detail', detail: 'Numbers and specifics make your answer believable and memorable.', quote: clip(numberS) })
  if (compareS) strengths.push({ id: 'cmp', title: 'Your comparison makes it click', detail: 'An everyday comparison lets a non-technical listener picture it.', quote: clip(compareS) })
  if (ownS) strengths.push({ id: 'own', title: 'You owned your part', detail: 'Using "I" shows what you personally did.', quote: clip(ownS) })
  if (structureS && strengths.length < 3) strengths.push({ id: 'str', title: 'Your answer has a clear flow', detail: 'Linking words help the listener follow your thinking.', quote: clip(structureS) })

  // Improvements tuned to the scenario's focus first
  if (scenario.focus === 'plain' && jargonHits.length)
    improvements.push({ id: 'jar', title: `Explain or swap "${jargonHits[0]}"`, detail: 'This word may lose a non-technical listener. Either drop it or add a short "which means…".', example: `"…a ${jargonHits[0]}, which basically means…"` })
  if (scenario.focus === 'plain' && !compareS)
    improvements.push({ id: 'cmp-i', title: 'Try one everyday comparison', detail: 'A single "it\'s like…" can do more than a definition.', example: '"It\'s like a waiter: you ask for something, it goes to the kitchen and brings it back."' })
  if ((scenario.focus === 'audience' || scenario.focus === 'structure') && !audienceS)
    improvements.push({ id: 'aud-i', title: 'Say who it helps', detail: 'The listener does not yet know who this is for or why it matters to them.', example: '"It\'s for first-year students who…"' })
  if (scenario.focus === 'specifics' && !numberS)
    improvements.push({ id: 'num-i', title: 'Add one result or number', detail: 'What changed because of what you did? Even a small, real number helps.', example: '"…and after that, the page loaded in 2 seconds instead of 8."' })
  if (scenario.focus === 'specifics' && !ownS)
    improvements.push({ id: 'own-i', title: 'Say what you did with "I"', detail: 'Interviewers want to know your part, not only the team\'s.', example: '"I noticed the bug came from… so I…"' })
  if (scenario.focus === 'question' && !qS)
    improvements.push({ id: 'q-i', title: 'End with one clear question', detail: 'Your listener might not know what you are asking yet.', example: '"…so how does that work when there are two users?"' })
  if (scenario.focus === 'question' && !openerS)
    improvements.push({ id: 'open-i', title: 'Show what you understood first', detail: 'A short recap helps the speaker answer exactly what you need.', example: '"So if I understood right, the cache resets every hour…"' })
  if (scenario.focus === 'structure' && !structureS)
    improvements.push({ id: 'str-i', title: 'Give it a simple shape', detail: 'Try now → before → next, or idea → reason → question.', example: '"Right now I\'m… Before that I… Next I want to…"' })
  if (wc > 170)
    improvements.push({ id: 'long', title: 'Trim to your strongest point', detail: `At ${wc} words this is past the time guide. Which sentence could go?` })
  if (improvements.length === 0 && !numberS)
    improvements.push({ id: 'num-g', title: 'Add one specific detail', detail: 'A name, number or small example would make this stick.', example: '"…it already has 12 people from my coding club using it."' })
  if (improvements.length === 0)
    improvements.push({ id: 'end', title: 'Land the ending', detail: 'Finish with one line the listener can respond to.', example: '"…would you want to try it?"' })

  let changed: string[] | undefined
  if (previous) {
    changed = []
    const pl = ' ' + previous.toLowerCase()
    const had = (terms: string[]) => terms.some((k) => pl.includes(k))
    const has = (terms: string[]) => terms.some((k) => lower.includes(k))
    if (!had(AUDIENCE) && has(AUDIENCE)) changed.push('Your answer now names who it helps.')
    if (!/\d/.test(previous) && /\d/.test(text)) changed.push('You added a concrete number or detail.')
    if (!had(COMPARE) && has(COMPARE)) changed.push('You added an everyday comparison.')
    if (!had(OWN) && has(OWN)) changed.push('You now say what you did yourself.')
    if (!previous.includes('?') && text.includes('?')) changed.push('You now end with a clear question.')
    const pw = words(previous).length
    if (pw > 170 && wc < pw) changed.push(`It's tighter: ${pw} → ${wc} words.`)
    if (changed.length === 0) changed.push('The wording changed, but the main structure is similar. Try focusing on the pinned point.')
  }

  return {
    summary: strengths.length >= 2 ? 'A solid start with real substance. One small change will make it land.' : 'You have the core idea. Let\'s make it easier to follow.',
    strengths: strengths.slice(0, 2),
    improvements: improvements.slice(0, 2),
    tryAnother: scenario.focus === 'question' ? 'Try asking it in under 25 words.' : 'Try opening with the problem instead of the solution.',
    changed,
  }
}

// Word-level diff for attempt comparison: marks words in `b` that were not in `a`.
export function addedWords(a: string, b: string) {
  const bag = new Map<string, number>()
  words(a).forEach((w) => { const k = w.toLowerCase().replace(/[^\w']/g, ''); bag.set(k, (bag.get(k) ?? 0) + 1) })
  return words(b).map((w) => {
    const k = w.toLowerCase().replace(/[^\w']/g, '')
    const n = bag.get(k) ?? 0
    if (n > 0) { bag.set(k, n - 1); return { w, added: false } }
    return { w, added: true }
  })
}
