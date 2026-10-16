export type Category = 'Explain' | 'Ask and Join' | 'Interview and Intro'
export type Mode = 'voice' | 'text'
export type Goal = 'project' | 'interviews' | 'questions' | 'networking' | 'team' | 'unsure'

export interface Scenario {
  id: string
  title: string
  category: Category
  goals: Goal[]
  situation: string
  audience: string
  prompt: string
  aims: string[]
  tips: string[]
  timeGuide: string
  difficulty: 1 | 2
  focus: 'audience' | 'specifics' | 'structure' | 'plain' | 'question'
}

export const GOALS: { id: Goal; label: string }[] = [
  { id: 'project', label: 'Explaining my project' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'questions', label: 'Asking questions' },
  { id: 'networking', label: 'Networking' },
  { id: 'team', label: 'Team discussions' },
  { id: 'unsure', label: 'Not sure yet' },
]

export const CATEGORIES: Category[] = ['Explain', 'Ask and Join', 'Interview and Intro']

export const SCENARIOS: Scenario[] = [
  {
    id: 'project-60',
    title: 'Explain your project in 60 seconds',
    category: 'Explain',
    goals: ['project', 'networking'],
    situation: "You're at a community meetup. Someone asks what you're building.",
    audience: 'A curious developer you just met',
    prompt: "So, what are you working on at the moment?",
    aims: ['Say what it is in one sentence', 'Name who it helps', 'Share one detail you are proud of'],
    tips: ['Start with the problem, not the tech stack.', 'One concrete example beats three features.'],
    timeGuide: '60–90 seconds, or 100–150 words',
    difficulty: 1,
    focus: 'audience',
  },
  {
    id: 'plain-words',
    title: 'Explain a tech idea to someone non-technical',
    category: 'Explain',
    goals: ['project', 'team'],
    situation: 'Your aunt asks what an API is, because you mentioned it at dinner.',
    audience: 'A smart person with no tech background',
    prompt: "You keep saying 'API'. What does that actually mean?",
    aims: ['Use an everyday comparison', 'Avoid jargon, or explain it', 'Check it connects to her world'],
    tips: ['Try "it\'s like…" once, then stop.', 'Imagine she will repeat it to a friend.'],
    timeGuide: '60 seconds, or about 100 words',
    difficulty: 1,
    focus: 'plain',
  },
  {
    id: 'ask-workshop',
    title: 'Ask a question at a workshop',
    category: 'Ask and Join',
    goals: ['questions'],
    situation: 'The speaker pauses for questions. You are not sure you understood the last part.',
    audience: 'The workshop speaker, with 30 people listening',
    prompt: '"Any questions before we move on?"',
    aims: ['Say briefly what you understood', 'Ask one clear question', 'Keep it short'],
    tips: ['"So if I understood right…" is a great opener.', 'One question, not three.'],
    timeGuide: '20–40 seconds, or 40–80 words',
    difficulty: 1,
    focus: 'question',
  },
  {
    id: 'team-idea',
    title: 'Share an idea in a team discussion',
    category: 'Ask and Join',
    goals: ['team'],
    situation: 'Your project team is stuck on how to onboard new users. You have an idea.',
    audience: 'Four teammates on a video call',
    prompt: '"Does anyone have other ideas?"',
    aims: ['State the idea first', 'Give one reason it could work', 'Invite a response'],
    tips: ['Lead with the idea, then the why.', 'End with a question so others can build on it.'],
    timeGuide: '45–60 seconds, or 80–120 words',
    difficulty: 2,
    focus: 'structure',
  },
  {
    id: 'tell-me',
    title: 'Tell me about yourself',
    category: 'Interview and Intro',
    goals: ['interviews', 'networking'],
    situation: 'First-round internship interview. This is the opening question.',
    audience: 'A friendly engineering manager',
    prompt: '"To start, tell me a little about yourself."',
    aims: ['Where you are now', 'One thing you built or learned', 'Why this role'],
    tips: ['Present → past → future works well.', 'Pick one story, not your whole CV.'],
    timeGuide: '60–90 seconds, or 120–150 words',
    difficulty: 1,
    focus: 'structure',
  },
  {
    id: 'challenge',
    title: 'Describe a challenge you solved',
    category: 'Interview and Intro',
    goals: ['interviews'],
    situation: 'Interview, mid-way. They want to hear how you handle problems.',
    audience: 'Two interviewers taking notes',
    prompt: '"Tell us about a time something went wrong in a project. What did you do?"',
    aims: ['What the situation was', 'What you did, specifically', 'What changed because of it'],
    tips: ['Say "I", not only "we".', 'A number or result makes it real.'],
    timeGuide: '90 seconds, or 150 words',
    difficulty: 2,
    focus: 'specifics',
  },
]

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id)!
