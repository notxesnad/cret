'use client'

import { Questionnaire, type Question } from '@/app/components/Questionnaire'
import { submitOutreachResponse } from '@/app/actions/outreach'
import { SHOWING_LOOP_COPY, showingLoopHref, withShowingAgentQuestion } from '@/app/lib/showingFeedback'
import { type QuizTheme } from '@/app/lib/quizTheme'

export function ShowingFeedbackClient({ profileId, campaignId, campaign }: {
  profileId: string
  campaignId: string
  campaign: {
    title: string
    description?: string
    questions: Question[]
    listingAddress?: string
    theme?: QuizTheme
  }
}) {
  const handleSubmit = async (answers: Record<string, string | number>) => {
    await submitOutreachResponse(profileId, campaignId, answers)
  }

  return (
    <Questionnaire
      title={campaign.title}
      description={campaign.description}
      questions={withShowingAgentQuestion(campaign.questions)}
      onSubmit={handleSubmit}
      accentColor="teal"
      theme="light"
      doneTitle={SHOWING_LOOP_COPY.doneTitle}
      doneBody={SHOWING_LOOP_COPY.doneBody}
      doneHint={SHOWING_LOOP_COPY.hint}
      doneAction={{ label: SHOWING_LOOP_COPY.cta, href: showingLoopHref('quiz') }}
    />
  )
}
