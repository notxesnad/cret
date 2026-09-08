'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { type Question } from '@/app/components/Questionnaire'
import { RegistrationForm, type RegistrationValues } from '@/app/components/RegistrationForm'
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
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    const url = window.location.href.split('#')[0]
    void QRCode.toDataURL(url, {
      width: 720,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#312e81', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [])

  const handleSubmit = async (values: RegistrationValues) => {
    setError('')
    setSubmitting(true)
    const answers: Record<string, string> = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      is_realtor: values.isRealtor,
      with_realtor: values.withRealtor,
      ...values.extras,
    }

    const [responseResult, prospectResult] = await Promise.all([
      submitOutreachResponse(profileId, campaignId, answers),
      saveProspect({
        profileId,
        name: values.name,
        phone: values.phone,
        email: values.email,
        sourceTool: 'openhouse_registration',
        sourceId: campaignId,
        listingId: campaign.listingId,
        listingAddress: campaign.listingAddress,
      }),
    ])
    setSubmitting(false)

    if (responseResult?.error && prospectResult?.error) {
      setError('Could not save your sign-in. Please try again.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
        <h2 className="text-3xl font-black text-slate-900">You&apos;re on the list</h2>
        <p className="text-slate-500 mt-3 max-w-sm">Thanks for signing in. Enjoy the open house.</p>
        <button
          type="button"
          onClick={() => {
            setDone(false)
            setFormKey((k) => k + 1)
          }}
          className="mt-8 w-full max-w-sm bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-xl"
        >
          Next guest
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <RegistrationForm
        key={formKey}
        address={campaign.listingAddress}
        title={campaign.title}
        description={campaign.description}
        questions={campaign.questions}
        qrDataUrl={qrDataUrl}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
      {error ? <p className="px-6 pb-8 text-sm font-bold text-rose-500">{error}</p> : null}
    </div>
  )
}
