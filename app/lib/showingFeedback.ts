import type { Question } from '@/app/components/Questionnaire'

export const SHOWING_FEEDBACK_KIND = 'showing_feedback'

export const SHOWING_AGENT_NAME_KEY = 'agent_name'
export const SHOWING_AGENT_EMAIL_KEY = 'agent_email'

export const SHOWING_AGENT_QUESTION: Question = {
  id: 'agent',
  type: 'name_email',
  optional: true,
  text: 'Your name and email',
}

export function isShowingFeedback(kind?: string | null) {
  return kind === SHOWING_FEEDBACK_KIND
}

function isLegacyShowingNameQuestion(question: Question) {
  if (question.type === 'name_email' || question.id === 'agent') return true
  return question.type === 'text' && /your name/i.test(question.text || '')
}

export function withShowingAgentQuestion(questions: Question[] | undefined) {
  const rest = (questions || []).filter(question => !isLegacyShowingNameQuestion(question))
  return [...rest, SHOWING_AGENT_QUESTION]
}

export function showingAgentFromAnswers(answers: Record<string, unknown> | undefined) {
  const name = String(answers?.[SHOWING_AGENT_NAME_KEY] || '').trim()
  const email = String(answers?.[SHOWING_AGENT_EMAIL_KEY] || answers?.email || '').trim()
  return { name, email }
}

export const SHOWING_FEEDBACK_TEMPLATES: { title: string; description: string; questions: Question[] }[] = [
  {
    title: 'Showing Agent Feedback',
    description: 'Thanks for showing this listing. Takes about a minute. Honest notes help the listing agent keep the seller informed. Skip anything you’d rather not answer.',
    questions: [
      { id: 'q1', type: 'rating', maxRating: 5, text: 'Overall, how would you rate this home for the buyers you showed?' },
      { id: 'q2', type: 'choice', text: 'How did the asking price feel?', options: ['Priced too high', 'A little high', 'About right', 'A good value'] },
      { id: 'q3', type: 'choice', text: 'How does this home compare to others you’ve shown lately?', options: ['One of the best I’ve shown', 'About the same as others', 'It doesn’t quite compare'] },
      { id: 'q4', type: 'choice', text: 'Would your buyers consider writing an offer?', options: ['Yes, they could write', 'Maybe, if something changed', 'No, this is not the one'] },
      { id: 'q5', type: 'choice', text: 'How well did the home match the listing photos?', options: ['Better in person', 'About the same', 'Photos were generous'] },
      { id: 'q6', type: 'choice', text: 'Which area felt strongest?', options: ['Kitchen', 'Primary suite', 'Living spaces', 'Outdoor / backyard', 'Location / neighborhood', 'Layout / flow'] },
      { id: 'q7', type: 'choice', text: 'What was the biggest drawback?', options: ['Price', 'Condition / updates needed', 'Layout / flow', 'Size of the rooms', 'Location', 'Something else'] },
      { id: 'q8', type: 'text', text: 'What did your buyers like most?', placeholder: 'e.g. The light, the yard, the kitchen…' },
      { id: 'q9', type: 'text', text: 'What concerns or deal-breakers came up?', placeholder: 'e.g. The primary bath, traffic noise, the price…' },
      { id: 'q10', type: 'text', text: 'What would need to change for them to write an offer?', placeholder: 'e.g. Price, a repair credit, staging…' },
      { id: 'q11', type: 'text', optional: true, text: 'Anything else the listing agent should know?', placeholder: 'Access, neighbors, showing notes…' },
      SHOWING_AGENT_QUESTION,
    ],
  },
  {
    title: 'Quick Showing Recap',
    description: 'Four taps and two notes. Send it right after you leave the driveway.',
    questions: [
      { id: 'q1', type: 'rating', maxRating: 5, text: 'How would you rate this showing overall?' },
      { id: 'q2', type: 'choice', text: 'Would your buyers write an offer?', options: ['Yes', 'Maybe', 'No'] },
      { id: 'q3', type: 'choice', text: 'How did the price feel?', options: ['Too high', 'About right', 'A good value'] },
      { id: 'q4', type: 'text', text: 'What did they like, and what got in the way?', placeholder: 'The two things that stuck with them…' },
      SHOWING_AGENT_QUESTION,
    ],
  },
]

export const SHOWING_QUESTION_BANK: Omit<Question, 'id'>[] = [
  { type: 'rating', maxRating: 5, text: 'Overall, how would you rate this home for the buyers you showed?' },
  { type: 'choice', text: 'How did the asking price feel?', options: ['Priced too high', 'A little high', 'About right', 'A good value'] },
  { type: 'choice', text: 'Would your buyers consider writing an offer?', options: ['Yes, they could write', 'Maybe, if something changed', 'No, this is not the one'] },
  { type: 'choice', text: 'How does this home compare to others you’ve shown lately?', options: ['One of the best I’ve shown', 'About the same as others', 'It doesn’t quite compare'] },
  { type: 'choice', text: 'How well did the home match the listing photos?', options: ['Better in person', 'About the same', 'Photos were generous'] },
  { type: 'choice', text: 'Which area felt strongest?', options: ['Kitchen', 'Primary suite', 'Living spaces', 'Outdoor / backyard', 'Location / neighborhood', 'Layout / flow'] },
  { type: 'choice', text: 'What was the biggest drawback?', options: ['Price', 'Condition / updates needed', 'Layout / flow', 'Size of the rooms', 'Location', 'Something else'] },
  { type: 'rating', maxRating: 5, text: 'How easy was showing access (lockbox, time, notice)?' },
  { type: 'text', text: 'What did your buyers like most?', placeholder: 'e.g. The light, the yard, the kitchen…' },
  { type: 'text', text: 'What concerns or deal-breakers came up?', placeholder: 'e.g. The primary bath, traffic noise…' },
  { type: 'text', text: 'What would need to change for them to write an offer?', placeholder: 'e.g. Price, a repair credit…' },
  { type: 'text', optional: true, text: 'Anything else the listing agent should know?', placeholder: 'Access, neighbors, showing notes…' },
  { type: 'name_email', optional: true, text: 'Your name and email' },
]
