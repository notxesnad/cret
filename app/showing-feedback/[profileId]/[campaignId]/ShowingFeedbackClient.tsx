'use client'

import { Questionnaire, type Question } from '@/app/components/Questionnaire'
import { submitOutreachResponse } from '@/app/actions/outreach'
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
      questions={campaign.questions}
      onSubmit={handleSubmit}
      accentColor="amber"
      theme="light"
      doneTitle="Thanks for the notes."
      doneBody="The listing agent will use this to keep the seller informed. You can close this page."
    />
  )
}
