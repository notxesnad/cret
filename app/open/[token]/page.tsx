import { redirect } from 'next/navigation'
import { adminClient } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function publicOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://coolrealestatetools.com').replace(/\/$/, '')
}

export default async function OpenEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { token } = await params
  const query = await searchParams
  const db = adminClient()
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, email, editor_token')
    .eq('editor_token', token)
    .maybeSingle()

  if (error || !profile?.email) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-black mb-2">That link isn’t working</h1>
          <p className="text-slate-400">Ask Parker to send it again. It only works from the email we sent you.</p>
        </div>
      </div>
    )
  }

  const next = first(query.next) === 'profile' ? 'profile' : 'sellertracker'
  const listing = first(query.listing) || ''
  const via = first(query.via) === 'html' ? 'html' : 'plain'
  const dest = new URL(publicOrigin())
  dest.searchParams.set('view', next)
  if (next === 'sellertracker' && listing) dest.searchParams.set('listing', listing)
  dest.searchParams.set('utm_source', 'email')
  dest.searchParams.set('utm_medium', via)
  dest.searchParams.set('utm_campaign', 'realtors-st-made')
  dest.searchParams.set('utm_content', next === 'profile' ? 'header' : 'editor')

  await db.from('profiles').update({ imported: false, updated_at: new Date().toISOString() }).eq('id', profile.id)

  const { data, error: linkError } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email,
    options: { redirectTo: dest.toString() },
  })
  const actionLink = data?.properties?.action_link
  if (linkError || !actionLink) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-black mb-2">Couldn’t open the editor</h1>
          <p className="text-slate-400">Try the link once more. If it still fails, reply to Parker.</p>
        </div>
      </div>
    )
  }

  redirect(actionLink)
}
