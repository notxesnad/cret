import type { Question } from '@/app/components/Questionnaire'

export const OPENHOUSE_REGISTRATION_KIND = 'openhouse_registration'

export const REGISTRATION_FIELD_IDS = ['name', 'phone', 'email', 'is_realtor', 'with_realtor'] as const

export const STANDARD_REGISTRATION_QUESTIONS: Question[] = [
  { id: 'name', type: 'text', text: 'Full name', placeholder: 'Your name' },
  { id: 'phone', type: 'text', text: 'Cell phone', placeholder: '(555) 555-5555' },
  { id: 'email', type: 'text', optional: true, text: 'Email', placeholder: 'you@email.com' },
  {
    id: 'is_realtor',
    type: 'choice',
    text: 'Are you a licensed realtor?',
    options: ['Yes, I am a realtor', 'No'],
  },
  {
    id: 'with_realtor',
    type: 'choice',
    text: 'Are you currently working with a realtor?',
    options: ['Yes, I am', "No, I'm looking on my own"],
  },
]

export function extraRegistrationQuestions(questions: Question[] | undefined) {
  const locked = new Set<string>(REGISTRATION_FIELD_IDS)
  return (questions || []).filter((q) => !locked.has(q.id))
}

export function isOpenHouseRegistration(kind?: string | null) {
  return kind === OPENHOUSE_REGISTRATION_KIND
}
