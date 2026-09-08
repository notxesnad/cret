export const TOOL_LABELS: Record<string, string> = {
  site: 'Site',
  app: 'App visit',
  register: 'OH registration',
  feedback: 'OH feedback',
  feedback_report: 'Feedback report',
  advice: 'Re-engage quiz',
  tour: 'Driving tour',
  netsheet: 'Net sheet',
  report: 'Seller report',
}

export type AdminAgentRow = {
  id: string
  email: string
  name: string
  createdAt: string | null
  billing: string
  header: boolean
  listings: number
  netSheets: number
  tours: number
  clients: number
  registration: number
  feedback: number
  quizzes: number
  responses: number
  prospects: number
  clientClicks: number
  clicksByTool: Record<string, number>
  appVisits: number
  appVisitsThisWeek: number
  lastVisit: string | null
}

export type AdminRecentVisit = {
  createdAt: string
  tool: string
  path: string
  agent: string
  utmSource: string | null
  utmCampaign: string | null
}

export type AdminDashboard = {
  you: string
  tableReady: boolean
  totals: {
    agents: number
    agentsThisWeek: number
    trialing: number
    paid: number
    siteClicks: number
    siteClicksThisWeek: number
    siteClicksWithUtm: number
    clientClicks: number
    clientClicksThisWeek: number
    appVisits: number
    appVisitsThisWeek: number
    agentsActiveThisWeek: number
    responses: number
  }
  siteByCampaign: { campaign: string; source: string; clicks: number }[]
  clientByTool: { tool: string; label: string; clicks: number }[]
  recent: AdminRecentVisit[]
  agents: AdminAgentRow[]
}
