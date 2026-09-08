'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { type Question } from '@/app/components/Questionnaire'
import { RegistrationExperience } from '@/app/components/RegistrationForm'
import { submitOutreachResponse } from '@/app/actions/outreach'
import { saveProspect } from '@/app/actions/prospects'

export function RegistrationClient({
  profileId,
  campaignId,
  campaign,
}: {
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
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const url = window.location.href.split('#')[0]
    void QRCode.toDataURL(url, {
      width: 720,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#312e81', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [])

  const handleSubmit = async (answers: Record<string, string | number>) => {
    const name = String(answers.name || '').trim()
    const phone = String(answers.phone || '').trim()
    const email = String(answers.email || '').trim()

    await Promise.all([
      submitOutreachResponse(profileId, campaignId, answers),
      saveProspect({
        profileId,
        name,
        phone,
        email,
        sourceTool: 'openhouse_registration',
        sourceId: campaignId,
        listingId: campaign.listingId,
        listingAddress: campaign.listingAddress,
      }),
    ])
  }

  return (
    <RegistrationExperience
      address={campaign.listingAddress}
      title={campaign.title}
      description={campaign.description}
      questions={campaign.questions}
      qrDataUrl={qrDataUrl}
      onSubmit={handleSubmit}
    />
  )
}
