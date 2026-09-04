'use client'
import { useState, useEffect, Suspense, useCallback, useRef, type ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, markAuthSessionOnly, markAuthPersistPending, markAuthPersisted, clearAuthPersistFlags, setAwaitingMagicLink, getAwaitingMagicLink, clearAwaitingMagicLink } from '@/utils/supabase'
import { renderAgentHeader } from './components/AgentHeader'
import { OPENHOUSE_FEEDBACK_KIND } from '@/app/lib/openhouseFeedback'
import { PROSPECT_KIND, PROSPECT_STORE_KIND } from '@/app/lib/prospects'
import { NET_SHEET_KIND, isNetSheet, type NetSheet } from '@/app/lib/netSheet'
import { unpackTourData, packPeopleAndProspects, hydrateTourWorkspace, mergeTourHomes, type TourHome } from '@/app/lib/tourHomes'
import { workspaceFromProfileJson, type WorkspaceData } from '@/app/lib/workspace'
import { loadOrMigrateWorkspace, saveWorkspaceTables } from '@/app/lib/workspaceDb'
import { isSellerDemoListing, withSellerDemoListing } from '@/app/lib/sellerDemo'
import { registerWithoutVerify } from '@/app/actions/auth'
import { startCheckout, startPortal } from '@/app/actions/billing'
import { appTrialFields, billingFromProfile, emptyBilling, hasShareAccess, isPaid, trialPeriodDays, type BillingState } from '@/app/lib/billing'
import {
  HomeView,
  SignInView,
  OpenHouseView,
  OpenHouseSignInView,
  OpenHouseFeedbackView,
  SellerMenuView,
  NetSheetView,
  SellerTrackerView,
  DrivingView,
  BuyerView,
  SellerCallView,
  ProfileBuilderView,
  NeighborhoodExpertView,
  OutreachView,
  ContactView,
  AccountView
} from './components/views'

function extraHomesFrom(source: { homes?: TourHome[] } | null | undefined): TourHome[] {
  return Array.isArray(source?.homes) ? source.homes : []
}

function mergeById(dbArr: any[], pendingArr: any[] | undefined) {
  if (!pendingArr || !Array.isArray(pendingArr)) return dbArr
  const dbIds = new Set(dbArr.map(item => item.id))
  const newItems = pendingArr.filter(item => item.id && !dbIds.has(item.id))
  return [...newItems, ...dbArr]
}

const VALID_VIEWS = [
  'home', 'signin', 'money', 'openhouse', 'ohsignin', 'ohfeedback', 'seller', 'netsheet',
  'sellertracker', 'driving', 'buyer', 'sellercall', 'profile', 'neighborhoods', 'outreach',
  'contact', 'account',
] as const

const VIEW_PARENT: Record<string, string> = {
  sellertracker: 'seller',
  netsheet: 'seller',
  ohfeedback: 'openhouse',
  ohsignin: 'openhouse',
}

function parentOf(view: string) {
  if (view === 'home') return null
  return VIEW_PARENT[view] || 'home'
}

function viewFromLocation(search: string | URLSearchParams) {
  const params = typeof search === 'string' ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search) : search
  const queryView = params.get('view')
  if (queryView && (VALID_VIEWS as readonly string[]).includes(queryView)) return queryView
  return 'home'
}

function hrefForView(viewId: string, search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (viewId === 'home') params.delete('view')
  else params.set('view', viewId)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlView = viewFromLocation(searchParams)
  const [currentView, setCurrentView] = useState(urlView)
  const viewRef = useRef(urlView)
  const viewStackRef = useRef<string[]>([urlView])
  const billingParam = searchParams.get('billing')
  const promoParam = (searchParams.get('promo') || '').trim().toUpperCase()

  const [user, setUser] = useState<any>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [profileStep, setProfileStep] = useState<number>(1) 
  const [profile, setProfile] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    brokerage: '',
    headshot_url: '',
    logo_url: '',
    custom_header_url: '',
    pdf_look: 'look1',
    show_headshot: false,
    show_logo: false,
    show_custom_header: false,
    headshot_shape: 'square'
  })
  const [uploading, setUploading] = useState<boolean>(false)


  const [modalData, setModalData] = useState<{isOpen: boolean; msg: string; requiresAuth: boolean; welcomeNew?: boolean; paywall?: boolean}>({ isOpen: false, msg: '', requiresAuth: false })
  const [modalEmail, setModalEmail] = useState('')
  const [modalAuthSent, setModalAuthSent] = useState(false)
  const [modalAuthError, setModalAuthError] = useState('')
  const [modalWelcomeName, setModalWelcomeName] = useState('')
  const [modalAuthLoading, setModalAuthLoading] = useState(false)

  const switchView = useCallback((viewId: string) => {
    const next = (VALID_VIEWS as readonly string[]).includes(viewId) ? viewId : 'home'
    const current = viewRef.current
    if (next === current) return

    const stack = viewStackRef.current
    const goingUp = next === parentOf(current) || (next === 'home' && current !== 'home')
    const href = hrefForView(next, typeof window !== 'undefined' ? window.location.search : '')

    viewRef.current = next
    setCurrentView(next)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)

    if (goingUp && stack.length > 1 && stack[stack.length - 2] === next) {
      viewStackRef.current = stack.slice(0, -1)
      router.back()
      return
    }

    if (goingUp) {
      viewStackRef.current = [...stack.slice(0, -1), next]
      router.replace(href, { scroll: false })
      return
    }

    viewStackRef.current = [...stack, next]
    router.push(href, { scroll: false })
  }, [router])

  const closeView = useCallback(() => {
    if (viewStackRef.current.length > 1) {
      router.back()
      return
    }
    switchView(parentOf(viewRef.current) || 'home')
  }, [router, switchView])
 

  const [activeFields, setActiveFields] = useState<any>({
    sellerConcessions: false,
    personalProperty: false,
    secondMortgage: false,
    prepaymentPenalties: false,
    propertyLiens: false,
    transactionCoordFees: false,
    attorneyFees: false,
    recordingFees: false,
    ownersTitleInsurance: false,
    courierWireFees: false,
    propertyTaxesPrarated: false,
    hoaDues: false,
    hoaEstoppel: false,
    specialAssessments: false,
    utilitiesProration: false,
    homeWarranty: false,
    stagingPhotography: false,
    repairCredits: false
  })

  const [netData, setNetData] = useState<any>({
    salePrice: 750000,
    mortgagePayoff: 400000,
    agentCommissionPct: 5,
    transferTaxPct: 0.75,
    titleEscrowFee: 1500,
    sellerConcessions: 0,
    personalProperty: 0,
    secondMortgage: 0,
    prepaymentPenalties: 0,
    propertyLiens: 0,
    transactionCoordFees: 0,
    attorneyFees: 750,
    recordingFees: 150,
    ownersTitleInsurance: 2200,
    courierWireFees: 100,
    propertyTaxesPrarated: 2500,
    hoaDues: 300,
    hoaEstoppel: 250,
    specialAssessments: 0,
    utilitiesProration: 150,
    homeWarranty: 600,
    stagingPhotography: 0,
    repairCredits: 0
  })

  // --- Listings & Neighborhoods State ---
  const [listings, setListings] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const [outreachCampaigns, setOutreachCampaigns] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [tourHomes, setTourHomes] = useState<TourHome[]>([])
  const [billing, setBilling] = useState<BillingState>(emptyBilling())
  const [billingBusy, setBillingBusy] = useState(false)
  const [profileNextBusy, setProfileNextBusy] = useState(false)
  const listingsRef = useRef(listings)
  const neighborhoodsRef = useRef(neighborhoods)
  const campaignsRef = useRef(outreachCampaigns)
  const clientsRef = useRef(clients)
  const tourHomesRef = useRef(tourHomes)
  const tablesReadyRef = useRef(false)
  const billingHandledRef = useRef(false)
  listingsRef.current = listings
  neighborhoodsRef.current = neighborhoods
  campaignsRef.current = outreachCampaigns
  clientsRef.current = clients
  tourHomesRef.current = tourHomes

  const currentWorkspace = (overrides?: Partial<WorkspaceData>): WorkspaceData => ({
    listings: overrides?.listings ?? listingsRef.current,
    neighborhoods: overrides?.neighborhoods ?? neighborhoodsRef.current,
    outreachCampaigns: overrides?.outreachCampaigns ?? campaignsRef.current,
    clients: overrides?.clients ?? clientsRef.current,
    homes: overrides?.homes ?? tourHomesRef.current,
  })

  const persistTables = (overrides?: Partial<WorkspaceData>) => {
    if (!user || !tablesReadyRef.current) return
    saveWorkspaceTables(supabase, user.id, currentWorkspace(overrides)).then((error) => {
      if (error) console.error('Error saving workspace tables:', error)
    })
  }

  const applyWorkspace = (workspace: WorkspaceData) => {
    listingsRef.current = workspace.listings
    neighborhoodsRef.current = workspace.neighborhoods
    campaignsRef.current = workspace.outreachCampaigns
    clientsRef.current = workspace.clients
    tourHomesRef.current = workspace.homes
    setListings(workspace.listings)
    setNeighborhoods(workspace.neighborhoods)
    setOutreachCampaigns(workspace.outreachCampaigns)
    setClients(workspace.clients)
    setTourHomes(workspace.homes)
  }

  const sellerDemoIdFor = (userId?: string | null) => {
    if (userId) return `seller-demo-${userId}`
    try {
      let id = localStorage.getItem('crt_seller_demo_id')
      if (!id) {
        id = `seller-demo-guest-${crypto.randomUUID()}`
        localStorage.setItem('crt_seller_demo_id', id)
      }
      return id
    } catch {
      return 'seller-demo-guest'
    }
  }

  const seedSellerDemo = (workspace: WorkspaceData, userId?: string | null) => {
    const listings = withSellerDemoListing(workspace.listings, sellerDemoIdFor(userId))
    return {
      workspace: { ...workspace, listings },
      added: listings.length !== (workspace.listings || []).length,
    }
  }

  const updateListings = (updater: (prev: any[]) => any[]) => {
    setListings(prev => {
      const newListings = updater(prev)
      listingsRef.current = newListings
      if (user) {
        persistTables({ listings: newListings })
      }
      return newListings
    })
  }

  const propertyListings = listings.filter((item: { kind?: string }) => item.kind !== NET_SHEET_KIND)
  const workingListings = propertyListings.filter((item: { id?: string }) => !isSellerDemoListing(item))
  const netSheets = listings.filter(isNetSheet)

  const updatePropertyListings = (updater: (prev: any[]) => any[]) => {
    updateListings(prev => {
      const sheets = prev.filter(isNetSheet)
      const homes = prev.filter((item: { kind?: string }) => item.kind !== NET_SHEET_KIND)
      return [...updater(homes), ...sheets]
    })
  }

  const updateHomesAndSheets = (fn: (ctx: { homes: any[], sheets: NetSheet[] }) => { homes: any[], sheets: NetSheet[] }) => {
    updateListings(prev => {
      const homes = prev.filter((item: { kind?: string }) => item.kind !== NET_SHEET_KIND)
      const sheets = prev.filter(isNetSheet)
      const next = fn({ homes, sheets })
      return [...next.homes, ...next.sheets]
    })
  }

  const updateNeighborhoods = (updater: (prev: any[]) => any[]) => {
    setNeighborhoods(prev => {
      const newNeighborhoods = updater(prev)
      neighborhoodsRef.current = newNeighborhoods
      if (user) {
        persistTables({ neighborhoods: newNeighborhoods })
      }
      return newNeighborhoods
    })
  }

  const updateOutreachCampaigns = (updater: (prev: any[]) => any[]) => {
    setOutreachCampaigns(prev => {
      const newCampaigns = updater(prev)
      campaignsRef.current = newCampaigns
      if (user) {
        persistTables({ outreachCampaigns: newCampaigns })
      }
      return newCampaigns
    })
  }

  const persistClientsAndHomes = (nextClients: any[], nextHomes: TourHome[]) => {
    if (!user) return
    persistTables({ clients: nextClients, homes: nextHomes })
  }

  const updateClients = (updater: (prev: any[]) => any[]) => {
    setClients(prev => {
      const prevTour = unpackTourData(prev)
      const nextRaw = updater(prev)
      const list = Array.isArray(nextRaw) ? nextRaw : []
      const nextTour = unpackTourData(list)
      const hasProspects = list.some((record: { kind?: string; id?: string }) =>
        record?.kind === PROSPECT_KIND || record?.kind === PROSPECT_STORE_KIND || record?.id === '__prospects__'
      )
      const prospects = hasProspects ? nextTour.prospects : prevTour.prospects
      const next = packPeopleAndProspects(nextTour.people, prospects)
      clientsRef.current = next
      persistClientsAndHomes(next, tourHomesRef.current)
      return next
    })
  }

  const updateTourHomes = (updater: (prev: TourHome[]) => TourHome[]) => {
    setTourHomes(prev => {
      const next = updater(prev)
      tourHomesRef.current = next
      persistClientsAndHomes(clientsRef.current, next)
      return next
    })
  }

  useEffect(() => {
    async function loadData() {
        const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)

      const pendingDataStr = localStorage.getItem('crt_pending_data')
      let pendingFromStorage: any = null
      if (pendingDataStr) {
        try {
          pendingFromStorage = JSON.parse(pendingDataStr)
        } catch (e) {}
      }

      if (!currentUser) {
        if (pendingFromStorage) {
          if (pendingFromStorage.profile) setProfile((prev: any) => ({ ...prev, ...pendingFromStorage.profile }))
          if (Array.isArray(pendingFromStorage.neighborhoods)) setNeighborhoods(pendingFromStorage.neighborhoods)
          if (Array.isArray(pendingFromStorage.outreachCampaigns)) setOutreachCampaigns(pendingFromStorage.outreachCampaigns)
          if (Array.isArray(pendingFromStorage.clients) || Array.isArray(pendingFromStorage.homes)) {
            const workspace = hydrateTourWorkspace(pendingFromStorage.clients, extraHomesFrom(pendingFromStorage))
            setClients(workspace.clients)
            setTourHomes(workspace.homes)
          }
          if (pendingFromStorage.netData) setNetData(pendingFromStorage.netData)
          if (pendingFromStorage.activeFields) setActiveFields((prev: any) => ({ ...prev, ...pendingFromStorage.activeFields }))
        }
        const guestListings = withSellerDemoListing(
          Array.isArray(pendingFromStorage?.listings) ? pendingFromStorage.listings : [],
          sellerDemoIdFor(null)
        )
        listingsRef.current = guestListings
        setListings(guestListings)
        const awaiting = getAwaitingMagicLink()
        if (awaiting) {
          setModalData({ isOpen: true, msg: '', requiresAuth: true })
          setModalAuthSent(true)
          setModalEmail(awaiting.email || '')
          setModalWelcomeName(awaiting.firstName || '')
        }
        setSessionChecked(true)
        return
      }

      if (currentUser) {
        clearAwaitingMagicLink()
        const sessionOnly = sessionStorage.getItem('crt-session-only') === '1'
        const created = Date.parse(currentUser.created_at || '')
        const lastSign = Date.parse(currentUser.last_sign_in_at || currentUser.created_at || '')
        const verifiedReturn = Number.isFinite(created) && Number.isFinite(lastSign) && (lastSign - created > 60_000)
        const fromMagicLink = window.location.hash.includes('access_token') || window.location.search.includes('code=')
        if (fromMagicLink || localStorage.getItem('crt-auth-persist-pending') === '1' || (!sessionOnly && verifiedReturn)) {
          markAuthPersisted()
        }
        // Check if user was in the middle of step 2 registration
        const savedStep = localStorage.getItem('crt_profile_step')
        const savedDraft = localStorage.getItem('crt_profile_draft')

        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft)
            setProfile((prev: any) => ({ ...prev, ...parsed }))
          } catch (e) {}
        }

        const pendingData = pendingFromStorage
        if (pendingFromStorage) localStorage.removeItem('crt_pending_data')

        if (pendingData?.netData) setNetData(pendingData.netData)
        if (pendingData?.activeFields) setActiveFields((prev: any) => ({ ...prev, ...pendingData.activeFields }))

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        if (data) {
          const pendingProfile = pendingData?.profile || {}
          const dbHasName = Boolean(data.full_name)
          setProfile({
            full_name: data.full_name || pendingProfile.full_name || '',
            email: data.email || currentUser.email || pendingProfile.email || '',
            phone: data.phone || pendingProfile.phone || '',
            brokerage: data.brokerage || pendingProfile.brokerage || '',
            headshot_url: data.headshot_url || pendingProfile.headshot_url || '',
            logo_url: data.logo_url || pendingProfile.logo_url || '',
            custom_header_url: data.custom_header_url || pendingProfile.custom_header_url || '',
            pdf_look: dbHasName ? (data.pdf_look || 'look1') : (pendingProfile.pdf_look || data.pdf_look || 'look1'),
            show_headshot: dbHasName ? data.show_headshot === true : pendingProfile.show_headshot === true,
            show_logo: dbHasName ? data.show_logo === true : pendingProfile.show_logo === true,
            show_custom_header: dbHasName
              ? (data.show_custom_header === true || data.pdf_look === 'custom')
              : (pendingProfile.show_custom_header === true || pendingProfile.pdf_look === 'custom'),
            headshot_shape: (dbHasName ? data.headshot_shape : pendingProfile.headshot_shape) === 'circle' ? 'circle' : 'square'
          })
          setBilling(billingFromProfile(data))
          if (!isPaid(data.subscription_status) && !data.trial_ends_at) {
            const trial = appTrialFields()
            const { error: trialError } = await supabase.from('profiles').update(trial).eq('id', currentUser.id)
            if (!trialError) setBilling(billingFromProfile({ ...data, ...trial }))
          }
          
          const jsonWorkspace = workspaceFromProfileJson({
            listings: mergeById(data.listings || [], pendingData?.listings),
            neighborhoods: mergeById(data.neighborhoods || [], pendingData?.neighborhoods),
            outreach_campaigns: mergeById(data.outreach_campaigns || [], pendingData?.outreachCampaigns),
            clients: mergeById(data.clients || [], pendingData?.clients),
            homes: mergeTourHomes(extraHomesFrom(data), extraHomesFrom(pendingData)),
          })

          const loaded = await loadOrMigrateWorkspace(
            supabase,
            currentUser.id,
            jsonWorkspace,
            data.workspace_version
          )
          tablesReadyRef.current = loaded.tablesReady

          let nextWorkspace = loaded.workspace
          if (pendingData && loaded.tablesReady) {
            nextWorkspace = {
              listings: mergeById(loaded.workspace.listings, pendingData.listings),
              neighborhoods: mergeById(loaded.workspace.neighborhoods, pendingData.neighborhoods),
              outreachCampaigns: mergeById(loaded.workspace.outreachCampaigns, pendingData.outreachCampaigns),
              clients: mergeById(loaded.workspace.clients, pendingData.clients),
              homes: mergeTourHomes(loaded.workspace.homes, extraHomesFrom(pendingData)),
            }
          }

          const seeded = seedSellerDemo(nextWorkspace, currentUser.id)
          nextWorkspace = seeded.workspace

          if (pendingData || loaded.migrated || seeded.added) {
            if (loaded.tablesReady) {
              const tableError = await saveWorkspaceTables(supabase, currentUser.id, nextWorkspace, { migrateResponses: loaded.migrated })
              if (tableError) console.error("Error saving workspace tables:", tableError)
            }
          }
          if (pendingData?.view && urlView === 'home') {
            switchView(pendingData.view)
          }

          applyWorkspace(nextWorkspace)

          // If they were in the middle of setup, we recovered their draft above.
          // We no longer force them into the profile view on load.
          if (savedStep === '2' || savedStep === '3') {
            setProfileStep(Number(savedStep))
            localStorage.removeItem('crt_profile_step')
            localStorage.removeItem('crt_profile_draft')
          }
        } else {
          const pendingProfile = pendingData?.profile || {}
          setProfile((prev: any) => ({
            ...prev,
            ...pendingProfile,
            email: currentUser.email || pendingProfile.email || ''
          }))
          
          let newListings = pendingData?.listings || []
          let newNeighborhoods = pendingData?.neighborhoods || []
          let newCampaigns = pendingData?.outreachCampaigns || []
          const workspace = hydrateTourWorkspace(pendingData?.clients || [], extraHomesFrom(pendingData))
          let nextWorkspace: WorkspaceData = {
            listings: newListings,
            neighborhoods: newNeighborhoods,
            outreachCampaigns: newCampaigns,
            clients: workspace.clients,
            homes: workspace.homes,
          }

          const trial = appTrialFields()
          const createPayload = { 
            id: currentUser.id, 
            email: currentUser.email || '',
            full_name: pendingProfile.full_name || '',
            phone: pendingProfile.phone || '',
            brokerage: pendingProfile.brokerage || '',
            pdf_look: pendingProfile.pdf_look || 'look1',
            show_headshot: pendingProfile.show_headshot === true,
            show_logo: pendingProfile.show_logo === true,
            show_custom_header: pendingProfile.show_custom_header === true,
            headshot_shape: pendingProfile.headshot_shape === 'circle' ? 'circle' : 'square',
            workspace_version: 2,
            ...trial,
            updated_at: new Date()
          }
          const { error: createError } = await supabase.from('profiles').upsert(createPayload)
          if (createError) {
            const { workspace_version: _v, ...withoutVersion } = createPayload
            const retry = await supabase.from('profiles').upsert(withoutVersion)
            if (retry.error) console.error('Error creating initial profile:', retry.error)
          }
          setBilling(billingFromProfile(trial))
          const seeded = seedSellerDemo(nextWorkspace, currentUser.id)
          nextWorkspace = seeded.workspace
          const tableError = await saveWorkspaceTables(supabase, currentUser.id, nextWorkspace, { migrateResponses: true })
          tablesReadyRef.current = !tableError
          if (tableError) console.error('Error saving workspace tables:', tableError)

          applyWorkspace(nextWorkspace)

          if (pendingData?.view && urlView === 'home') {
            switchView(pendingData.view)
          }

          if (savedStep === '2' || savedStep === '3') {
            setProfileStep(Number(savedStep))
            localStorage.removeItem('crt_profile_step')
            localStorage.removeItem('crt_profile_draft')
          }
        }
      }
      setSessionChecked(true)
    }
    loadData()
  }, [switchView])

  const handleLogout = async () => {
    localStorage.removeItem('crt_profile_step')
    localStorage.removeItem('crt_profile_draft')
    localStorage.removeItem('crt_pending_data')
    clearAuthPersistFlags()
    clearAwaitingMagicLink()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const snapshotGuestWork = () => ({
    view: currentView,
    listings,
    neighborhoods,
    outreachCampaigns,
    clients,
    homes: tourHomes,
    profile,
    netData,
    activeFields,
  })

  useEffect(() => {
    if (!sessionChecked || user) return
    localStorage.setItem('crt_pending_data', JSON.stringify(snapshotGuestWork()))
  }, [sessionChecked, user, currentView, listings, neighborhoods, outreachCampaigns, clients, tourHomes, profile, netData, activeFields])

  const showCustomModal = (msg: string, requireAuth = false) => {
    if (getAwaitingMagicLink()) return
    const requiresAuth = requireAuth || msg.toLowerCase().includes('logged in') || msg.toLowerCase().includes('signed in')
    setModalData({ isOpen: true, msg, requiresAuth, welcomeNew: false, paywall: false })
    setModalAuthSent(false)
    setModalEmail(profile.email || '')
    setModalAuthError('')
    setModalWelcomeName('')
    setModalAuthLoading(false)
  }

  const persistWorkspace = async () => {
    if (!user) return false
    const tableError = await saveWorkspaceTables(supabase, user.id, currentWorkspace())
    tablesReadyRef.current = !tableError
    if (tableError) {
      console.error('Could not save workspace:', tableError)
      showCustomModal('Could not save your work yet. Tap Preview again.')
      return false
    }
    return true
  }

  const saveAccountWork = async (userId: string, email: string) => {
    const payload = {
      id: userId,
      full_name: profile.full_name || '',
      email: email || profile.email || '',
      phone: profile.phone || '',
      brokerage: profile.brokerage || '',
      pdf_look: profile.pdf_look,
      show_headshot: profile.show_headshot === true,
      show_logo: profile.show_logo === true,
      show_custom_header: profile.show_custom_header === true,
      headshot_shape: profile.headshot_shape,
      headshot_url: profile.headshot_url || '',
      logo_url: profile.logo_url || '',
      custom_header_url: profile.custom_header_url || '',
      workspace_version: 2,
      updated_at: new Date()
    }
    const { error } = await supabase.from('profiles').upsert(payload)
    if (error) {
      const { show_custom_header: _c, headshot_shape: _s, workspace_version: _v, ...rest } = payload
      const retry = await supabase.from('profiles').upsert(rest)
      if (retry.error) return retry.error
    }
    const tableError = await saveWorkspaceTables(supabase, userId, currentWorkspace())
    tablesReadyRef.current = !tableError
    return tableError
  }

  const completeEmailAuth = async (email: string) => {
    const trimmed = email.trim()
    localStorage.setItem('crt_pending_data', JSON.stringify({
      ...snapshotGuestWork(),
      profile: { ...profile, email: trimmed }
    }))

    const result = await registerWithoutVerify(trimmed, typeof window !== 'undefined' ? window.location.origin : undefined)
    if (result.error) return { status: 'error' as const, message: result.error }

    if (result.exists) {
      markAuthPersistPending()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const intent = typeof window !== 'undefined' ? sessionStorage.getItem('crt_billing_intent') : null
      const extra = new URLSearchParams()
      if (intent === 'portal') extra.set('billing', 'portal')
      if (intent === 'checkout') extra.set('billing', 'checkout')
      if (promoParam) extra.set('promo', promoParam)
      const redirectUrl = origin ? `${origin}${hrefForView(currentView, extra.toString())}` : ''
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: false, emailRedirectTo: redirectUrl }
      })
      if (error) return { status: 'error' as const, message: error.message }
      setAwaitingMagicLink({ email: trimmed, firstName: result.firstName || '' })
      return { status: 'existing' as const, firstName: result.firstName || '' }
    }

    if (!result.password) return { status: 'error' as const, message: 'Could not create your account.' }

    markAuthSessionOnly()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password: result.password
    })
    if (signInError) return { status: 'error' as const, message: signInError.message }

    const { data: { user: newUser } } = await supabase.auth.getUser()
    if (!newUser) return { status: 'error' as const, message: 'Account created, but sign-in failed. Try again.' }

    setUser(newUser)
    setProfile((prev: any) => ({ ...prev, email: trimmed }))
    const saveError = await saveAccountWork(newUser.id, trimmed)
    if (saveError) return { status: 'error' as const, message: 'Account created, but we could not save your work. Try Save again.' }

    localStorage.removeItem('crt_pending_data')
    return { status: 'new' as const }
  }

  const showWelcomeModal = () => {
    if (getAwaitingMagicLink()) return
    setModalData({
      isOpen: true,
      msg: '',
      requiresAuth: false,
      welcomeNew: true
    })
    setModalAuthSent(false)
    setModalAuthError('')
    setModalWelcomeName('')
    setModalAuthLoading(false)
  }

  const showAuthModal = () => showCustomModal('', true)

  const openContact = () => {
    if (!user) {
      if (typeof window !== 'undefined') sessionStorage.setItem('crt_contact_intent', '1')
      showAuthModal()
      return
    }
    switchView('contact')
  }

  const openAccount = () => {
    if (!user) {
      if (typeof window !== 'undefined') sessionStorage.setItem('crt_account_intent', '1')
      showAuthModal()
      return
    }
    switchView('account')
  }

  const goToCheckout = async (promo?: string) => {
    if (billingBusy) return
    const code = (promo || (typeof window !== 'undefined' ? sessionStorage.getItem('crt_promo') : null) || promoParam || '').trim()
    if (typeof window !== 'undefined' && code) sessionStorage.setItem('crt_promo', code)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      if (typeof window !== 'undefined') sessionStorage.setItem('crt_billing_intent', 'checkout')
      showAuthModal()
      return
    }
    setBillingBusy(true)
    try {
      const result = await startCheckout({ accessToken: token, promoCode: code || undefined })
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('crt_billing_intent')
        sessionStorage.removeItem('crt_promo')
      }
      if ('url' in result && result.url) {
        window.location.href = result.url
        return
      }
      showCustomModal(result.error || 'Could not start checkout.')
    } catch (err) {
      console.error(err)
      showCustomModal('Could not start checkout. Try again in a moment.')
    } finally {
      setBillingBusy(false)
    }
  }

  const goToPortal = async () => {
    if (billingBusy) return
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      if (typeof window !== 'undefined') sessionStorage.setItem('crt_billing_intent', 'portal')
      showAuthModal()
      return
    }
    setBillingBusy(true)
    try {
      const result = await startPortal({ accessToken: token })
      if (typeof window !== 'undefined') sessionStorage.removeItem('crt_billing_intent')
      if ('url' in result && result.url) {
        window.location.href = result.url
        return
      }
      showCustomModal(result.error || 'Could not open billing.')
    } catch (err) {
      console.error(err)
      showCustomModal('Could not open billing. Try again in a moment.')
    } finally {
      setBillingBusy(false)
    }
  }

  const resumeBilling = async () => {
    const intent = typeof window !== 'undefined' ? sessionStorage.getItem('crt_billing_intent') : null
    if (intent === 'portal') return goToPortal()
    if (intent === 'checkout') return goToCheckout()
  }

  const showPaywall = () => {
    setModalData({
      isOpen: true,
      msg: `Your ${trialPeriodDays()}-day free trial has ended. Subscribe for $29/month to create links and download PDFs.`,
      requiresAuth: false,
      paywall: true,
    })
  }

  const persistIfSharingAllowed = async () => {
    if (!hasShareAccess(billing)) {
      showPaywall()
      return false
    }
    return persistWorkspace()
  }

  const closeCustomModal = () => {
    if (getAwaitingMagicLink()) return
    setModalData(prev => ({ ...prev, isOpen: false }))
  }

  const handleModalAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (modalAuthLoading) return
    setModalAuthError('')
    if (!modalEmail) return

    setModalAuthLoading(true)
    try {
      const result = await completeEmailAuth(modalEmail)
      if (result.status === 'error') {
        setModalAuthError(result.message)
        return
      }
      if (result.status === 'existing') {
        setModalWelcomeName(result.firstName || '')
        setModalAuthSent(true)
        return
      }
      const intent = sessionStorage.getItem('crt_billing_intent')
      if (intent === 'checkout' || intent === 'portal') {
        closeCustomModal()
        await resumeBilling()
        return
      }
      if (typeof window !== 'undefined' && sessionStorage.getItem('crt_contact_intent') === '1') {
        sessionStorage.removeItem('crt_contact_intent')
        closeCustomModal()
        switchView('contact')
        return
      }
      if (typeof window !== 'undefined' && sessionStorage.getItem('crt_account_intent') === '1') {
        sessionStorage.removeItem('crt_account_intent')
        closeCustomModal()
        switchView('account')
        return
      }
      showWelcomeModal()
    } finally {
      setModalAuthLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionChecked) return
    const handledKey = billingParam ? `crt_billing_handled_${billingParam}` : ''
    if (handledKey && sessionStorage.getItem(handledKey)) return
    if (billingHandledRef.current) return

    const clearBillingQuery = () => {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString())
      params.delete('billing')
      const qs = params.toString()
      router.replace(qs ? `/?${qs}` : '/', { scroll: false })
    }

    if (billingParam === 'success') {
      billingHandledRef.current = true
      sessionStorage.setItem(handledKey, '1')
      setBilling((prev) => ({ ...prev, status: 'active' }))
      showCustomModal("You're in. The whole toolbox is yours. Go look like a genius.")
      clearBillingQuery()
      return
    }

    if (billingParam === 'checkout_canceled') {
      billingHandledRef.current = true
      clearBillingQuery()
      return
    }

    if (billingParam === 'portal') {
      billingHandledRef.current = true
      clearBillingQuery()
      void goToPortal()
      return
    }

    if (billingParam === 'checkout') {
      billingHandledRef.current = true
      clearBillingQuery()
      void goToCheckout(promoParam)
      return
    }
  }, [sessionChecked, billingParam])

  useEffect(() => {
    if (!sessionChecked || !user) return
    if (sessionStorage.getItem('crt_contact_intent') === '1') {
      sessionStorage.removeItem('crt_contact_intent')
      switchView('contact')
      return
    }
    if (sessionStorage.getItem('crt_account_intent') === '1') {
      sessionStorage.removeItem('crt_account_intent')
      switchView('account')
    }
  }, [sessionChecked, user, switchView])

  useEffect(() => {
    const onPop = () => {
      const view = viewFromLocation(window.location.search)
      viewRef.current = view
      setCurrentView(view)
      const stack = viewStackRef.current
      if (stack[stack.length - 1] === view) return
      const idx = stack.lastIndexOf(view)
      viewStackRef.current = idx >= 0 ? stack.slice(0, idx + 1) : (view === 'home' ? ['home'] : ['home', view])
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (urlView === viewRef.current) return
    viewRef.current = urlView
    setCurrentView(urlView)
  }, [urlView])

  useEffect(() => {
    if (!(VALID_VIEWS as readonly string[]).includes(currentView)) {
      viewRef.current = 'home'
      setCurrentView('home')
      router.replace('/', { scroll: false })
    }
  }, [currentView, router])

  const handleNextStep = async (nextStep: 2 | 3 = 2) => {
    if (profileNextBusy) return
    if (profileStep !== 1) {
      setProfileStep(nextStep)
      return
    }
    if (!profile.full_name?.trim()) {
      showCustomModal('Please enter your full name to continue.')
      return
    }
    if (!profile.email?.trim()) {
      showCustomModal('Please enter your email address to continue.')
      return
    }

    localStorage.setItem('crt_profile_step', String(nextStep))
    localStorage.setItem('crt_profile_draft', JSON.stringify(profile))
    localStorage.setItem('crt_pending_data', JSON.stringify(snapshotGuestWork()))

    setProfileNextBusy(true)
    try {
    if (!user) {
      const result = await completeEmailAuth(profile.email)
      if (result.status === 'error') {
        showCustomModal('Error creating your account: ' + result.message)
        return
      }
      if (result.status === 'existing') {
      const typedFirst = (profile.full_name || '').trim().split(/\s+/)[0] || ''
      setAwaitingMagicLink({ email: profile.email, firstName: result.firstName || typedFirst })
      setModalData({ isOpen: true, msg: '', requiresAuth: true })
      setModalWelcomeName(result.firstName || typedFirst)
      setModalAuthSent(true)
      setModalEmail(profile.email)
      setModalAuthError('')
      return
    }
      setProfileStep(nextStep)
      showWelcomeModal()
      return
    }

    const updates = {
      id: user.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      brokerage: profile.brokerage,
      pdf_look: profile.pdf_look,
      show_headshot: profile.show_headshot,
      show_logo: profile.show_logo,
      show_custom_header: profile.show_custom_header === true,
      headshot_shape: profile.headshot_shape,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
      const { show_custom_header: _custom, headshot_shape: _shape, ...withoutExtras } = updates
      const retry = await supabase.from('profiles').upsert(withoutExtras)
      if (retry.error) {
        showCustomModal('Error saving profile: ' + retry.error.message)
        return
      }
    }
    setProfileStep(nextStep)
    } finally {
      setProfileNextBusy(false)
    }
  }

  const handleFinalSave = async (opts?: { silent?: boolean }) => {
    if (!user) {
      if (opts?.silent) {
        switchView('home')
        return
      }
      showAuthModal()
      return
    }
      const finalPayload = {
        id: user.id,
        full_name: profile.full_name,
        email: profile.email || user.email,
        phone: profile.phone,
        brokerage: profile.brokerage,
        pdf_look: profile.pdf_look,
        show_headshot: profile.show_headshot,
        show_logo: profile.show_logo,
        show_custom_header: profile.show_custom_header === true,
        headshot_shape: profile.headshot_shape,
        headshot_url: profile.headshot_url,
        logo_url: profile.logo_url,
        custom_header_url: profile.custom_header_url,
        updated_at: new Date()
      }

      const { error } = await supabase.from('profiles').upsert(finalPayload)
      if (error) {
        const { show_custom_header: _custom, headshot_shape: _shape, ...withoutExtras } = finalPayload
        const retry = await supabase.from('profiles').upsert(withoutExtras)
        if (retry.error) {
          if (!opts?.silent) showCustomModal('Error saving profile: ' + retry.error.message)
          return
        }
      }

    localStorage.removeItem('crt_profile_step')
    localStorage.removeItem('crt_profile_draft')
    if (!opts?.silent) showCustomModal('Profile fully updated!')
    switchView('home')
  }

  const handleImageUpload = async (
    source: File | ChangeEvent<HTMLInputElement>,
    fieldName: string,
    extra?: { headshot_shape?: 'square' | 'circle' }
  ) => {
    const file = source instanceof File ? source : source.target.files?.[0]
    if (source && !(source instanceof File) && source.target) source.target.value = ''
    if (!file) return
    if (!user) {
      showAuthModal()
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showCustomModal('File size is too large. Please upload an image under 5MB.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showCustomModal('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${fieldName}-${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      showCustomModal('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName)

    const extras = extra?.headshot_shape
      ? { headshot_shape: extra.headshot_shape, show_headshot: true }
      : fieldName === 'logo_url'
        ? { show_logo: true }
        : fieldName === 'custom_header_url'
          ? { show_custom_header: true }
          : {}

    setProfile((prev: any) => ({ ...prev, [fieldName]: publicUrl, ...extras }))

    const payload: Record<string, unknown> = {
      id: user.id,
      full_name: profile.full_name,
      email: profile.email || user.email,
      phone: profile.phone,
      brokerage: profile.brokerage,
      [fieldName]: publicUrl,
      ...extras,
      updated_at: new Date()
    }

    let { error: dbError } = await supabase.from('profiles').upsert(payload)
    if (dbError) {
      const { headshot_shape: _shape, show_custom_header: _custom, ...withoutExtras } = payload
      const retry = await supabase.from('profiles').upsert(withoutExtras)
      dbError = retry.error
    }

    if (dbError) {
      showCustomModal('Database save failed (Image uploaded to storage though): ' + dbError.message)
    }

    setUploading(false)
  }

  const savePdfLookSelection = (lookKey: string) => {
    setProfile((prev: any) => ({
      ...prev,
      pdf_look: lookKey,
      show_custom_header: lookKey === 'custom'
    }))
  }

  const clearCustomHeader = async () => {
    const nextLook = profile.pdf_look && profile.pdf_look !== 'custom' ? profile.pdf_look : 'look1'
    setProfile((prev: any) => ({
      ...prev,
      custom_header_url: '',
      show_custom_header: false,
      pdf_look: nextLook,
    }))
    if (!user) return
    const payload: Record<string, unknown> = {
      id: user.id,
      full_name: profile.full_name,
      email: profile.email || user.email,
      phone: profile.phone,
      brokerage: profile.brokerage,
      custom_header_url: '',
      show_custom_header: false,
      pdf_look: nextLook,
      updated_at: new Date(),
    }
    let { error } = await supabase.from('profiles').upsert(payload)
    if (error) {
      const { show_custom_header: _custom, ...withoutExtras } = payload
      const retry = await supabase.from('profiles').upsert(withoutExtras)
      error = retry.error
    }
    if (error) showCustomModal('Could not remove that image: ' + error.message)
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-[#0f172a] text-[#f8fafc] font-['Inter',sans-serif]">
        
        <style jsx global>{`
          .font-money { font-family: 'VT323', monospace; }
          .font-openhouse { font-family: 'Righteous', cursive; }
          .font-seller { font-family: 'Playfair Display', serif; font-style: italic; }
          .font-driving { font-family: 'Bungee', cursive; }
          .font-buyer { font-family: 'Syne', sans-serif; }
          .font-sellercall { font-family: 'Inter', sans-serif; font-weight: 900; letter-spacing: -1px; }
          .app-view { display: none; }
          .app-view.active { display: block; }
          #view-profile.active, #view-sellertracker.active, #view-neighborhoods.active, #view-outreach.active, #view-driving.active, #view-ohfeedback.active, #view-netsheet.active { display: flex !important; flex-direction: column !important; }
          .tool-tile { -webkit-tap-highlight-color: transparent; }
          
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <header className="max-w-xl mx-auto w-full flex justify-between items-center mb-6">
          {['seller', 'openhouse', 'account', 'contact'].includes(currentView) ? (
            <button
              type="button"
              onClick={closeView}
              className="text-slate-400 hover:text-white transition"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          ) : (
            <div onClick={() => switchView('home')} className="text-xs font-bold tracking-widest text-slate-400 uppercase cursor-pointer hover:text-slate-300 transition">
              Cool<span className="text-emerald-400">RealEstate</span>Tools.com
            </div>
          )}
          <div className="flex items-center gap-3">
            {currentView !== 'home' && !['seller', 'openhouse', 'account', 'contact'].includes(currentView) && (
              <button onClick={closeView} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-[0.97] px-4 py-2 rounded-full border border-slate-700 transition">
                ← Back
              </button>
            )}
            {!user && (
              <button onClick={showAuthModal} className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-[0.97] px-3 py-1.5 rounded-full transition">
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center my-4 sm:my-8 relative">
          {currentView === 'home' && (
            <HomeView
              switchView={switchView}
              showCustomModal={showCustomModal}
              billing={billing}
              billingBusy={billingBusy}
              onStartTrial={showAuthModal}
              onSubscribe={goToCheckout}
              onManageBilling={goToPortal}
              onContact={openContact}
              onAccount={openAccount}
              signedIn={!!user}
            />
          )}
          {currentView === 'signin' && (
            <SignInView
              onExistingUserSent={(email, firstName) => {
                setModalData({ isOpen: true, msg: '', requiresAuth: true })
                setModalAuthSent(true)
                setModalEmail(email)
                setModalWelcomeName(firstName)
                setModalAuthError('')
              }}
            />
          )}
          {currentView === 'money' && (
            <NetSheetView
              listings={workingListings}
              sheets={netSheets}
              updateHomesAndSheets={updateHomesAndSheets}
              showCustomModal={showCustomModal}
              switchView={switchView}
              userId={user?.id}
              persistWorkspace={persistIfSharingAllowed}
              signedIn={!!user}
              exitView="home"
            />
          )}
          {currentView === 'openhouse' && <OpenHouseView switchView={switchView} />}
          {currentView === 'ohsignin' && (
            <OpenHouseSignInView
              listings={workingListings}
              updateListings={updatePropertyListings}
              switchView={switchView}
              showCustomModal={showCustomModal}
              userId={user?.id}
            />
          )}
          {currentView === 'ohfeedback' && (
            <OpenHouseFeedbackView
              campaigns={outreachCampaigns.filter((c: { kind?: string }) => c.kind === OPENHOUSE_FEEDBACK_KIND)}
              updateCampaigns={(updater) => updateOutreachCampaigns(prev => {
                const others = (prev || []).filter((c: { kind?: string }) => c.kind !== OPENHOUSE_FEEDBACK_KIND)
                const mine = (prev || []).filter((c: { kind?: string }) => c.kind === OPENHOUSE_FEEDBACK_KIND)
                return [...updater(mine), ...others]
              })}
              listings={workingListings}
              updateListings={updatePropertyListings}
              switchView={switchView}
              showCustomModal={showCustomModal}
              userId={user?.id}
              persistWorkspace={persistIfSharingAllowed}
            />
          )}
          {currentView === 'seller' && <SellerMenuView switchView={switchView} />}
          {currentView === 'netsheet' && (
            <NetSheetView
              listings={workingListings}
              sheets={netSheets}
              updateHomesAndSheets={updateHomesAndSheets}
              showCustomModal={showCustomModal}
              switchView={switchView}
              userId={user?.id}
              persistWorkspace={persistIfSharingAllowed}
              signedIn={!!user}
              exitView="seller"
            />
          )}
          {currentView === 'sellertracker' && (
            <SellerTrackerView
              listings={propertyListings}
              updateListings={updatePropertyListings}
              showCustomModal={showCustomModal}
              switchView={switchView}
              userId={user?.id}
              persistWorkspace={persistIfSharingAllowed}
              persistDemoShare={async () => {
                if (!user) return true
                return persistWorkspace()
              }}
            />
          )}
          {currentView === 'driving' && (
            <DrivingView
              clients={unpackTourData(clients).people}
              homes={tourHomes}
              updateClients={(updater) => updateClients(prev => {
                const { people, prospects } = unpackTourData(prev)
                return packPeopleAndProspects(updater(people), prospects)
              })}
              updateHomes={updateTourHomes}
              showCustomModal={showCustomModal}
              switchView={switchView}
              userId={user?.id}
              persistWorkspace={persistIfSharingAllowed}
            />
          )}
          {currentView === 'buyer' && <BuyerView showCustomModal={showCustomModal} signedIn={!!user} />}
          {currentView === 'sellercall' && <SellerCallView showCustomModal={showCustomModal} listings={workingListings} signedIn={!!user} />}
          {currentView === 'profile' && (
            <ProfileBuilderView 
              profileStep={profileStep} 
              setProfileStep={setProfileStep}
              profile={profile}
              setProfile={setProfile}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              savePdfLookSelection={savePdfLookSelection}
              clearCustomHeader={clearCustomHeader}
              renderAgentHeader={(theme: string | null) => renderAgentHeader(profile, theme)}
              handleNextStep={handleNextStep}
              handleFinalSave={handleFinalSave}
              switchView={switchView}
              nextStepBusy={profileNextBusy}
            />
          )}
          {currentView === 'neighborhoods' && (
            <NeighborhoodExpertView 
              neighborhoods={neighborhoods}
              updateNeighborhoods={updateNeighborhoods}
              switchView={switchView}
              showCustomModal={showCustomModal}
              userEmail={user?.email}
            />
          )}
          {currentView === 'outreach' && (
            <OutreachView 
              campaigns={outreachCampaigns.filter((c: { kind?: string }) => c.kind !== OPENHOUSE_FEEDBACK_KIND && c.kind !== PROSPECT_STORE_KIND)}
              updateCampaigns={updateOutreachCampaigns}
              switchView={switchView}
              showCustomModal={showCustomModal}
              userId={user?.id}
              persistWorkspace={persistIfSharingAllowed}
            />
          )}
          {currentView === 'contact' && (
            <ContactView
              switchView={switchView}
              signedIn={!!user}
              onNeedAuth={() => {
                if (typeof window !== 'undefined') sessionStorage.setItem('crt_contact_intent', '1')
                showAuthModal()
              }}
            />
          )}
          {currentView === 'account' && (
            <AccountView
              signedIn={!!user}
              firstName={(profile.full_name || '').trim().split(/\s+/)[0] || ''}
              billing={billing}
              billingBusy={billingBusy}
              onNeedAuth={openAccount}
              onSubscribe={goToCheckout}
              onManageBilling={goToPortal}
              onSignOut={handleLogout}
              onContact={openContact}
            />
          )}
        </main>

        {/* Global Footer (Only on Home View) */}
        {currentView === 'home' && (
        <footer className="max-w-xl mx-auto w-full text-center pt-8 pb-2 text-xs text-slate-500 font-medium">
          coolrealestatetools.com • $29/mo
        </footer>
        )}

        {/* Custom Safe Modal Box */}
        {modalData.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="text-3xl mb-4">✨</div>
              
              {!modalData.requiresAuth ? (
                <div className="space-y-4">
                  {modalData.welcomeNew ? (
                    <div className="space-y-3">
                      <p className="text-base font-bold text-white">Welcome to</p>
                      <p className="text-lg font-bold tracking-widest text-white uppercase">
                        Cool<span className="text-emerald-400">RealEstate</span>Tools
                      </p>
                      <p className="text-base font-bold text-white">We created your account.</p>
                      <p className="text-base font-bold text-emerald-400">Your {trialPeriodDays()}-day free trial is on. No credit card needed.</p>
                      <p className="text-sm text-slate-400">
                        (Play around for now, but we will need you to eventually click the verification email sent to {modalEmail || profile.email || 'your email'})
                      </p>
                    </div>
                  ) : (
                    <p className="text-base font-bold text-white">{modalData.msg}</p>
                  )}
            {modalData.paywall ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    closeCustomModal()
                    void goToCheckout()
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition"
                >
                  Subscribe — $29/mo
                </button>
                <button onClick={closeCustomModal} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition">Not now</button>
              </div>
            ) : (
            <button onClick={closeCustomModal} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition">Got it</button>
            )}
          </div>
              ) : (
          <div>
                  {!modalAuthSent ? (
                    <div className="space-y-4 text-left">
                      <div className="text-center mb-2">
                        <h3 className="text-2xl font-black text-white">Sign In or Register</h3>
                        <p className="text-base text-slate-300 mt-3">Enter your email. We&apos;ll save your work. If you&apos;re new, we create your account right away.</p>
                      </div>
                      <form onSubmit={handleModalAuth} className="space-y-3">
            <input 
              type="email"
              placeholder="name@example.com"
                          value={modalEmail}
                          onChange={e => setModalEmail(e.target.value)}
              required
                          disabled={modalAuthLoading}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-base disabled:opacity-60"
            />
                        <button
                          type="submit"
                          disabled={modalAuthLoading}
                          aria-busy={modalAuthLoading}
                          className={`w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-150 ${modalAuthLoading ? 'cursor-wait scale-[0.98] brightness-95' : 'hover:bg-emerald-400 active:scale-[0.97] active:brightness-95'}`}
                        >
                          {modalAuthLoading ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                              One sec...
                            </>
                          ) : 'Continue'}
          </button>
        </form>
                      {modalAuthError && <p className="text-base text-rose-400 text-center">{modalAuthError}</p>}
                      <button onClick={closeCustomModal} disabled={modalAuthLoading} className="w-full text-base text-slate-500 hover:text-slate-300 py-2 disabled:opacity-40">Cancel</button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <h3 className="font-black text-xl text-emerald-400">
                        Welcome back{modalWelcomeName ? ` ${modalWelcomeName}` : ''}
                      </h3>
                      <div className="space-y-2">
                        <p className="text-base text-slate-300">Click the link we sent to {modalEmail || 'your email'}.</p>
                        <p className="text-base text-slate-300">You&apos;ll stay logged in on this device.</p>
                        <p className="text-sm font-normal text-slate-500">(We know it&apos;s a pain in the butt, but it&apos;s easier than remembering a password)</p>
                      </div>
                    </div>
      )}
                </div>
      )}
    </div>
          </div>
        )}

      </div>
    </>
  )
}



export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a]" />}>
      <HomeContent />
    </Suspense>
  )
}