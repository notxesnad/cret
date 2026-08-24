export type QuizTheme = 'light' | 'dark'

export function normalizeQuizTheme(theme?: string | null): QuizTheme {
  return theme === 'light' ? 'light' : 'dark'
}
