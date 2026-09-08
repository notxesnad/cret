import { billingFromProfile, hasShareAccess } from '@/app/lib/billing'
import { ShareUnavailable } from '@/app/components/ShareUnavailable'
import { ClientDashboardView } from '@/app/components/ClientDashboardView'
import { unpackTourData } from '@/app/lib/tourHomes'
import { trackShareVisit } from '@/app/lib/trackVisit'
import { adminClient, loadPublicProfile, loadPublicWorkspace } from '@/app/lib/workspacePublic'

export const dynamic = 'force-dynamic'

export default async function ClientDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string; clientId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { profileId, clientId } = await params
  const supabaseAdmin = adminClient()
  const { profile } = await loadPublicProfile(supabaseAdmin, profileId)
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Dashboard Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This client link might have been removed or the URL is incorrect.</p>
      </div>
    )
  }

  if (!hasShareAccess(billingFromProfile(profile))) {
    return <ShareUnavailable profile={profile} />
  }

  const workspace = await loadPublicWorkspace(supabaseAdmin, profileId, profile)
  const client = unpackTourData(workspace.clients).people.find((person) => person.id === clientId) || null
  if (!client) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Client Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto">This client might have been removed or the link is incorrect.</p>
      </div>
    )
  }

  await trackShareVisit({
    tool: 'dashboard',
    profileId,
    sourceId: clientId,
    path: `/client/${profileId}/${clientId}`,
    searchParams,
  })

  return (
    <ClientDashboardView
      profile={profile}
      client={client}
      homes={workspace.homes}
      listings={workspace.listings}
      profileId={profileId}
    />
  )
}
