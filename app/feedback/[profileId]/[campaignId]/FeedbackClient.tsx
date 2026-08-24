'use client'

import { Questionnaire, type Question } from '@/app/components/Questionnaire'
import { submitOutreachResponse } from '@/app/actions/outreach'
import { saveProspect } from '@/app/actions/prospects'

export function FeedbackClient({ profileId, campaignId, campaign }: {
  profileId: string
  campaignId: string
  campaign: {
    title: string
    description?: string
    questions: Question[]
    listingId?: string
    listingAddress?: string
  }
}) {
  const handleSubmit = async (answers: Record<string, string | number>) => {
    await submitOutreachResponse(profileId, campaignId, answers)
  }

  const area = campaign.listingAddress ? `the ${campaign.listingAddress} area` : 'this neighborhood'

  return (
    <Questionnaire
      title={campaign.title}
      description={campaign.description}
      questions={campaign.questions}
      onSubmit={handleSubmit}
      accentColor="indigo"
      theme="dark"
      captureLead={{
        title: 'Want a free monthly neighborhood snapshot?',
        body: `I'll send a short recap of prices, inventory, and what actually sold in ${area}. No listing pitches — just useful local numbers.`,
        cta: 'Send me the monthly snapshot',
        onSubmit: async ({ email, phone }) => {
          await saveProspect({
            profileId,
            email,
            phone,
            sourceTool: 'openhouse_feedback',
            sourceId: campaignId,
            listingId: campaign.listingId,
            listingAddress: campaign.listingAddress,
          })
        }
      }}
    />
  )
}
