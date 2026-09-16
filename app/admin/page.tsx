'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteAdminUser, importSellerReportsFromCsv, loadAdminDashboard } from '@/app/actions/admin'
import { ConfirmDeleteDialog } from '@/app/components/ConfirmDeleteDialog'
import { IMPORT_TEMPLATE_CSV } from '@/app/lib/adminCsv'
import { TOOL_LABELS, type AdminAgentRow, type AdminDashboard, type AdminImportResultRow } from '@/app/lib/adminTypes'
import { supabase } from '@/utils/supabase'

function when(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  )
}

export default function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'signed-out' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AdminAgentRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importFileName, setImportFileName] = useState('')
  const [importSummary, setImportSummary] = useState<{ created: number; added: number; exists: number; failed: number } | null>(null)
  const [importRows, setImportRows] = useState<AdminImportResultRow[]>([])
  const [copied, setCopied] = useState('')

  const refresh = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setStatus('loading')
      setMessage('')
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setStatus('signed-out')
      return
    }
    const result = await loadAdminDashboard({ accessToken: token })
    if ('error' in result) {
      setMessage(result.error)
      setStatus(result.error === 'Sign in first.' ? 'signed-out' : 'error')
      return
    }
    setData(result.data)
    setStatus('ready')
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const confirmDelete = async () => {
    if (!pendingDelete || deletingId) return
    setDeleteError('')
    setDeletingId(pendingDelete.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setDeleteError('Sign in first.')
        return
      }
      const result = await deleteAdminUser({ accessToken: token, profileId: pendingDelete.id })
      if ('error' in result) {
        setDeleteError(result.error)
        return
      }
      setPendingDelete(null)
      await refresh({ quiet: true })
    } finally {
      setDeletingId(null)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([IMPORT_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'seller-report-import.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('')
    }
  }

  const runImport = async (file: File | undefined) => {
    if (!file || importing) return
    setImportError('')
    setImportSummary(null)
    setImportRows([])
    setImportFileName(file.name)
    setImporting(true)
    try {
      const csvText = await file.text()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setImportError('Sign in first.')
        return
      }
      const result = await importSellerReportsFromCsv({ accessToken: token, csvText })
      if ('error' in result) {
        setImportError(result.error)
        return
      }
      setImportSummary({
        created: result.created,
        added: result.added,
        exists: result.exists,
        failed: result.failed,
      })
      setImportRows(result.rows)
      await refresh({ quiet: true })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import that file.')
    } finally {
      setImporting(false)
    }
  }

  const reportLinks = importRows.map((row) => row.reportUrl).filter(Boolean) as string[]

  const agents = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLowerCase()
    if (!needle) return data.agents
    return data.agents.filter((agent) =>
      `${agent.name} ${agent.email}`.toLowerCase().includes(needle)
    )
  }, [data, query])

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-['Inter',sans-serif] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <a href="/" className="text-xs font-bold tracking-widest text-slate-400 uppercase hover:text-slate-300">
              Cool<span className="text-emerald-400">RealEstate</span>Tools.com
            </a>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Usage</h1>
            <p className="text-sm text-slate-400">Clicks to the site, what agents built, and client link opens.</p>
            {data?.you ? <p className="text-xs text-slate-600 mt-1">{data.you}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700"
          >
            Refresh
          </button>
        </header>

        {status === 'loading' && <p className="text-slate-400">Loading…</p>}

        {status === 'signed-out' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 max-w-lg">
            <p className="text-slate-200 font-bold mb-2">Sign in first</p>
            <p className="text-sm text-slate-400 mb-4">
              Open the home page, sign in with your account, then come back here.
            </p>
            <a href="/?view=signin" className="inline-block text-xs font-bold bg-emerald-500 text-slate-950 px-4 py-2 rounded-full">
              Sign in
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-rose-900/60 bg-rose-950/40 p-6 max-w-lg">
            <p className="font-bold text-rose-100">{message || 'Could not load this page.'}</p>
          </div>
        )}

        {status === 'ready' && data && (
          <div className="space-y-8">
            {!data.tableReady && (
              <div className="rounded-2xl border border-amber-800/70 bg-amber-950/40 p-4 text-sm text-amber-100">
                Click tracking is not live yet. Run <code className="font-mono">supabase/analytics.sql</code> in the Supabase SQL editor.
              </div>
            )}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Make reports</h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    Upload a CSV. Each row gets an account, their header, and a listing with Pre-Listing Inspection, Listed In the MLS, and Syndicated to Zillow. No welcome email is sent.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700"
                >
                  Download template
                </button>
              </div>
              <label className="inline-flex items-center gap-3 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-full cursor-pointer">
                {importing ? 'Importing…' : 'Upload CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={importing}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void runImport(file)
                  }}
                />
              </label>
              {importFileName ? <p className="text-xs text-slate-500 mt-2">{importFileName}</p> : null}
              {importError ? <p className="text-sm text-rose-300 mt-3">{importError}</p> : null}
              {importSummary ? (
                <p className="text-sm text-slate-300 mt-3">
                  {importSummary.created} new accounts · {importSummary.added} listings added to existing accounts · {importSummary.exists} already had that listing · {importSummary.failed} failed
                </p>
              ) : null}
              {reportLinks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void copyText('all', reportLinks.join('\n'))}
                  className="mt-3 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700"
                >
                  {copied === 'all' ? 'Copied' : 'Copy report links'}
                </button>
              ) : null}
              {importRows.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 mt-4">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950">
                      <tr>
                        <th className="px-3 py-2 font-bold">Agent</th>
                        <th className="px-3 py-2 font-bold">Listing</th>
                        <th className="px-3 py-2 font-bold">Status</th>
                        <th className="px-3 py-2 font-bold">Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row, index) => (
                        <tr key={`${row.line}-${row.email}-${index}`} className="border-t border-slate-800 align-top">
                          <td className="px-3 py-2">
                            <div className="font-bold">{row.name || '—'}</div>
                            <div className="text-xs text-slate-500">{row.email || `Line ${row.line}`}</div>
                          </td>
                          <td className="px-3 py-2">{row.address || '—'}</td>
                          <td className="px-3 py-2">
                            {row.status === 'error' ? (
                              <span className="text-rose-300">{row.message || 'Failed'}</span>
                            ) : row.status === 'exists' ? (
                              <span className="text-amber-300">Already there</span>
                            ) : row.status === 'created' ? (
                              <span className="text-emerald-400 font-bold">New account</span>
                            ) : (
                              <span className="text-emerald-300">Listing added</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {row.reportUrl ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <a href={row.reportUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline break-all">
                                  Open
                                </a>
                                <button
                                  type="button"
                                  onClick={() => void copyText(row.reportUrl || '', row.reportUrl || '')}
                                  className="text-xs font-bold text-slate-400 hover:text-slate-200"
                                >
                                  {copied === row.reportUrl ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Agents" value={data.totals.agents} hint={`${data.totals.agentsThisWeek} this week · ${data.totals.verified} verified email`} />
              <Stat label="Trial / paid" value={`${data.totals.trialing} / ${data.totals.paid}`} />
              <Stat
                label="Site clicks"
                value={data.totals.siteClicks}
                hint={`${data.totals.siteClicksThisWeek} this week · ${data.totals.siteClicksWithUtm} with UTM`}
              />
              <Stat
                label="Agent visits"
                value={data.totals.appVisitsThisWeek}
                hint={`${data.totals.agentsActiveThisWeek} agents this week · ${data.totals.appVisits} all time`}
              />
              <Stat
                label="Client link clicks"
                value={data.totals.clientClicks}
                hint={`${data.totals.clientClicksThisWeek} this week · ${data.totals.responses} form replies`}
              />
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Site clicks by campaign</h2>
                {data.siteByCampaign.length === 0 ? (
                  <p className="text-sm text-slate-500">No homepage clicks yet. Put <code className="font-mono text-slate-400">?utm_source=email&utm_campaign=realtors-50</code> on the link you send.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900">
                        <tr>
                          <th className="px-3 py-2 font-bold">Campaign</th>
                          <th className="px-3 py-2 font-bold">Source</th>
                          <th className="px-3 py-2 font-bold text-right">Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.siteByCampaign.map((row) => (
                          <tr key={`${row.campaign}-${row.source}`} className="border-t border-slate-800">
                            <td className="px-3 py-2">{row.campaign}</td>
                            <td className="px-3 py-2 text-slate-400">{row.source}</td>
                            <td className="px-3 py-2 text-right font-bold">{row.clicks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Client links by tool</h2>
                {data.clientByTool.length === 0 ? (
                  <p className="text-sm text-slate-500">No shared-link clicks yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900">
                        <tr>
                          <th className="px-3 py-2 font-bold">Tool</th>
                          <th className="px-3 py-2 font-bold text-right">Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.clientByTool.map((row) => (
                          <tr key={row.tool} className="border-t border-slate-800">
                            <td className="px-3 py-2">{row.label}</td>
                            <td className="px-3 py-2 text-right font-bold">{row.clicks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Recent clicks</h2>
              {data.recent.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-[28rem] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-bold">When</th>
                        <th className="px-3 py-2 font-bold">What</th>
                        <th className="px-3 py-2 font-bold">Who</th>
                        <th className="px-3 py-2 font-bold">Campaign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.map((row, index) => (
                        <tr key={`${row.createdAt}-${index}`} className="border-t border-slate-800">
                          <td className="px-3 py-2 whitespace-nowrap text-slate-400">{when(row.createdAt)}</td>
                          <td className="px-3 py-2">{TOOL_LABELS[row.tool] || row.tool}</td>
                          <td className="px-3 py-2">{row.agent}</td>
                          <td className="px-3 py-2 text-slate-400">{row.utmCampaign || row.utmSource || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Agents</h2>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name or email"
                  className="bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm w-full max-w-xs"
                />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 font-bold">Agent</th>
                      <th className="px-3 py-2 font-bold">Status</th>
                      <th className="px-3 py-2 font-bold">Email</th>
                      <th className="px-3 py-2 font-bold">Last visit</th>
                      <th className="px-3 py-2 font-bold text-right">Visits</th>
                      <th className="px-3 py-2 font-bold text-right">Listings</th>
                      <th className="px-3 py-2 font-bold text-right">Net sheets</th>
                      <th className="px-3 py-2 font-bold text-right">Tours</th>
                      <th className="px-3 py-2 font-bold text-right">OH reg</th>
                      <th className="px-3 py-2 font-bold text-right">OH fb</th>
                      <th className="px-3 py-2 font-bold text-right">Quizzes</th>
                      <th className="px-3 py-2 font-bold text-right">Replies</th>
                      <th className="px-3 py-2 font-bold text-right">Client clicks</th>
                      <th className="px-3 py-2 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-t border-slate-800 align-top">
                        <td className="px-3 py-2">
                          <div className="font-bold">{agent.name || '—'}</div>
                          <div className="text-xs text-slate-500">{agent.email}</div>
                          <div className="text-xs text-slate-600">{when(agent.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2">{agent.billing}</td>
                        <td className="px-3 py-2">
                          {agent.emailVerified ? (
                            <span className="text-emerald-400 font-bold">Verified</span>
                          ) : (
                            <span className="text-amber-400">Pending</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{when(agent.lastVisit)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="font-bold">{agent.appVisits}</div>
                          {agent.appVisitsThisWeek ? (
                            <div className="text-xs text-slate-500">{agent.appVisitsThisWeek} this week</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right">{agent.listings}</td>
                        <td className="px-3 py-2 text-right">{agent.netSheets}</td>
                        <td className="px-3 py-2 text-right">{agent.tours}</td>
                        <td className="px-3 py-2 text-right">{agent.registration}</td>
                        <td className="px-3 py-2 text-right">{agent.feedback}</td>
                        <td className="px-3 py-2 text-right">{agent.quizzes}</td>
                        <td className="px-3 py-2 text-right">{agent.responses}</td>
                        <td className="px-3 py-2 text-right font-bold">{agent.clientClicks}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('')
                              setPendingDelete(agent)
                            }}
                            disabled={deletingId === agent.id}
                            className="text-xs font-bold text-rose-400 hover:text-rose-300 disabled:opacity-50"
                          >
                            {deletingId === agent.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
      {pendingDelete && (
        <ConfirmDeleteDialog
          message={
            deleteError
              ? deleteError
              : `Delete ${pendingDelete.email || pendingDelete.name || 'this account'} and all of their tools, images, and login? This cannot be undone.`
          }
          confirmLabel={deletingId ? 'Deleting…' : 'Delete everything'}
          cancelLabel={deleteError ? 'Close' : 'Keep them'}
          onCancel={() => {
            if (deletingId) return
            setPendingDelete(null)
            setDeleteError('')
          }}
          onConfirm={() => {
            if (deleteError) {
              setPendingDelete(null)
              setDeleteError('')
              return
            }
            void confirmDelete()
          }}
        />
      )}
    </div>
  )
}
