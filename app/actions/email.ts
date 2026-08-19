'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPdfEmail(userEmail: string, listingAddress: string, reportUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    return { error: 'RESEND_API_KEY is not configured in .env.local' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Cool Real Estate Tools <hello@coolrealestatetools.com>',
      to: [userEmail],
      subject: `Property Report: ${listingAddress}`,
      html: `
        <h2>Here is your property report for ${listingAddress}</h2>
        <p>You can view and save the PDF report by clicking the link below:</p>
        <p><a href="${reportUrl}">${reportUrl}</a></p>
        <br/>
        <p>Best,<br/>Cool Real Estate Tools</p>
      `
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
