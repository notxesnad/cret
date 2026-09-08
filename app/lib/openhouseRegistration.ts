import type { Question } from '@/app/components/Questionnaire'

export const OPENHOUSE_REGISTRATION_KIND = 'openhouse_registration'

export const REGISTRATION_FIELD_IDS = ['name', 'contact', 'phone', 'email', 'is_realtor', 'with_realtor'] as const

export const STANDARD_REGISTRATION_QUESTIONS: Question[] = [
  { id: 'name', type: 'text', text: "What's your name?", placeholder: 'Your full name', singleLine: true },
  {
    id: 'contact',
    type: 'contact',
    text: 'How can we reach you?',
  },
  {
    id: 'with_realtor',
    type: 'choice',
    text: 'Are you working with a realtor?',
    options: ['Yes, I am', "No, I'm looking on my own", 'I am a realtor'],
  },
]

export function extraRegistrationQuestions(questions: Question[] | undefined) {
  const locked = new Set<string>(REGISTRATION_FIELD_IDS)
  return (questions || []).filter((q) => !locked.has(q.id))
}

export function registrationQuestionsForForm(questions: Question[] | undefined) {
  return [...STANDARD_REGISTRATION_QUESTIONS, ...extraRegistrationQuestions(questions)]
}

export function isOpenHouseRegistration(kind?: string | null) {
  return kind === OPENHOUSE_REGISTRATION_KIND
}
