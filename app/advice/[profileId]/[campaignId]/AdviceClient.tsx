'use client'

import { Questionnaire, type Question } from '@/app/components/Questionnaire'
import { submitOutreachResponse } from '@/app/actions/outreach'
import { saveProspect } from '@/app/actions/prospects'
import { normalizeQuizTheme, type QuizTheme } from '@/app/lib/quizTheme'

export function AdviceClient({ profileId, campaignId, campaign }: {
  profileId: string
  campaignId: string
  campaign: { title: string; description?: string; questions: Question[]; theme?: QuizTheme }
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
      accentColor="sky"
      theme={normalizeQuizTheme(campaign.theme)}
      captureLead={{
        title: 'Want a free monthly market snapshot?',
        body: 'I\'ll send a short recap of local prices, inventory, and what is actually selling. No sales pitch — just useful numbers from someone who lives this market.',
        cta: 'Send me the monthly snapshot',
        onSubmit: async ({ email, phone }) => {
          await saveProspect({
            profileId,
            email,
            phone,
            sourceTool: 'advice',
            sourceId: campaignId,
          })
        }
      }}
    />
  )
}
