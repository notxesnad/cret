'use client'

import { Questionnaire } from '@/app/components/Questionnaire'
import { submitOutreachResponse } from '@/app/actions/outreach'

export function AdviceClient({ profileId, campaignId, campaign }: any) {
  
  const handleSubmit = async (answers: Record<string, any>) => {
    await submitOutreachResponse(profileId, campaignId, answers)
  }

  return (
    <Questionnaire 
      title={campaign.title}
      description={campaign.description}
      questions={campaign.questions}
      onSubmit={handleSubmit}
      accentColor="sky"
    />
  )
}
