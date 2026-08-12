'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { renderAgentHeader } from './components/AgentHeader'
import {
  HomeView,
  SignInView,
  MoneyStuffView,
  OpenHouseView,
  SellerMenuView,
  NetSheetView,
  SellerTrackerView,
  DrivingView,
  BuyerView,
  SellerCallView,
  ProfileBuilderView,
  NeighborhoodExpertView,
  OutreachView
} from './components/views'


function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'home'

  const [user, setUser] = useState<any>(null)
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
    show_headshot: true 
  })
  const [uploading, setUploading] = useState<boolean>(false)


  const switchView = useCallback((viewId: string) => {
    router.push(`?view=${viewId}`, { scroll: false })
  }, [router])
 

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

  const updateListings = (updater: (prev: any[]) => any[]) => {
    setListings(prev => {
      const newListings = updater(prev)
      if (user) {
        supabase.from('profiles').update({ listings: newListings }).eq('id', user.id).then(({ error }) => {
          if (error) console.error('Error saving listings:', error)
        })
      }
      return newListings
    })
  }

  const updateNeighborhoods = (updater: (prev: any[]) => any[]) => {
    setNeighborhoods(prev => {
      const newNeighborhoods = updater(prev)
      if (user) {
        supabase.from('profiles').update({ neighborhoods: newNeighborhoods }).eq('id', user.id).then(({ error }) => {
          if (error) console.error('Error saving neighborhoods:', error)
        })
      }
      return newNeighborhoods
    })
  }

  const updateOutreachCampaigns = (updater: (prev: any[]) => any[]) => {
    setOutreachCampaigns(prev => {
      const newCampaigns = updater(prev)
      if (user) {
        supabase.from('profiles').update({ outreach_campaigns: newCampaigns }).eq('id', user.id).then(({ error }) => {
          if (error) console.error('Error saving outreach campaigns:', error)
        })
      }
      return newCampaigns
    })
  }

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)

      if (currentUser) {
        // Check if user was in the middle of step 2 registration
        const savedStep = localStorage.getItem('crt_profile_step')
        const savedDraft = localStorage.getItem('crt_profile_draft')

        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft)
            setProfile((prev: any) => ({ ...prev, ...parsed }))
          } catch (e) {}
        }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || currentUser.email || '',
            phone: data.phone || '',
            brokerage: data.brokerage || '',
            headshot_url: data.headshot_url || '',
            logo_url: data.logo_url || '',
            pdf_look: data.pdf_look || 'look1',
            show_headshot: data.show_headshot !== false
          })
          setListings(data.listings || [])
          setNeighborhoods(data.neighborhoods || [])
          setOutreachCampaigns(data.outreach_campaigns || [])
          // If they were in the middle of setup, we recovered their draft above.
          // We no longer force them into the profile view on load.
          if (savedStep === '2') {
            setProfileStep(2)
            // clear it so it doesn't persist forever
            localStorage.removeItem('crt_profile_step')
            localStorage.removeItem('crt_profile_draft')
          }
        } else {
          setProfile((prev: any) => ({ ...prev, email: currentUser.email || '' }))
          if (savedStep === '2') {
            setProfileStep(2)
            // clear it so it doesn't persist forever
            localStorage.removeItem('crt_profile_step')
            localStorage.removeItem('crt_profile_draft')
          }
        }
      }
    }
    loadData()
  }, [switchView])

  const handleLogout = async () => {
    localStorage.removeItem('crt_profile_step')
    localStorage.removeItem('crt_profile_draft')
    await supabase.auth.signOut()
    window.location.reload()
  }

  const showCustomModal = (msg: string) => {
    const modalMsg = document.getElementById('modal-message')
    const modal = document.getElementById('custom-modal')
    if (modalMsg && modal) {
      modalMsg.innerText = msg
      modal.classList.remove('hidden')
    }
  }

  const closeCustomModal = () => {
    const modal = document.getElementById('custom-modal')
    if (modal) {
      modal.classList.add('hidden')
    }
  }

  useEffect(() => {
    const validViews = ['home', 'signin', 'money', 'openhouse', 'seller', 'netsheet', 'sellertracker', 'driving', 'buyer', 'sellercall', 'profile', 'neighborhoods', 'outreach']
    if (!validViews.includes(currentView)) {
      router.replace('?view=home', { scroll: false })
    }
    
    const navAction = document.getElementById('nav-action')
    if(navAction) {
      navAction.style.display = currentView === 'home' ? 'none' : 'block'
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentView, router])


  const calcTotalDeductions = () => {
    const comm = netData.salePrice * (netData.agentCommissionPct / 100)
    const transfer = netData.salePrice * (netData.transferTaxPct / 100)
    
    let optionalTotal = 0
    if (activeFields.sellerConcessions) optionalTotal += Number(netData.sellerConcessions)
    if (activeFields.personalProperty) optionalTotal += Number(netData.personalProperty)
    if (activeFields.secondMortgage) optionalTotal += Number(netData.secondMortgage)
    if (activeFields.prepaymentPenalties) optionalTotal += Number(netData.prepaymentPenalties)
    if (activeFields.propertyLiens) optionalTotal += Number(netData.propertyLiens)
    if (activeFields.transactionCoordFees) optionalTotal += Number(netData.transactionCoordFees)
    if (activeFields.attorneyFees) optionalTotal += Number(netData.attorneyFees)
    if (activeFields.recordingFees) optionalTotal += Number(netData.recordingFees)
    if (activeFields.ownersTitleInsurance) optionalTotal += Number(netData.ownersTitleInsurance)
    if (activeFields.courierWireFees) optionalTotal += Number(netData.courierWireFees)
    if (activeFields.propertyTaxesPrarated) optionalTotal += Number(netData.propertyTaxesPrarated)
    if (activeFields.hoaDues) optionalTotal += Number(netData.hoaDues)
    if (activeFields.hoaEstoppel) optionalTotal += Number(netData.hoaEstoppel)
    if (activeFields.specialAssessments) optionalTotal += Number(netData.specialAssessments)
    if (activeFields.utilitiesProration) optionalTotal += Number(netData.utilitiesProration)
    if (activeFields.homeWarranty) optionalTotal += Number(netData.homeWarranty)
    if (activeFields.stagingPhotography) optionalTotal += Number(netData.stagingPhotography)
    if (activeFields.repairCredits) optionalTotal += Number(netData.repairCredits)

    return (
      Number(netData.mortgagePayoff) +
      comm +
      transfer +
      Number(netData.titleEscrowFee) +
      optionalTotal
    )
  }

  const calculatedNetProceeds = netData.salePrice - calcTotalDeductions()

  const handleNetInputChange = (field: string, val: any) => {
    setNetData((prev: any) => ({ ...prev, [field]: parseFloat(val) || 0 }))
  }

  const toggleFieldCheckbox = (fieldKey: string) => {
    setActiveFields((prev: any) => ({ ...prev, [fieldKey]: !prev[fieldKey] }))
  }

  const handleNextStep = async () => {
    if (profileStep === 1) {
      if (!profile.full_name?.trim()) {
        showCustomModal('Please enter your full name to continue.')
        return
      }
      if (!profile.email?.trim()) {
        showCustomModal('Please enter your email address to continue.')
        return
      }

      // Save draft state to localStorage so we recover it after magic link verification
      localStorage.setItem('crt_profile_step', '2')
      localStorage.setItem('crt_profile_draft', JSON.stringify(profile))

      if (!user) {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: profile.email,
          options: { 
            shouldCreateUser: true,
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
          }
        })

        if (authError) {
          showCustomModal('Error sending verification link: ' + authError.message)
          return
        }

        showCustomModal('Magic link sent! Check your email to verify your account. You will automatically return to Step 2.')
        return
      }

      // If user is already logged in, save data immediately
      const updates = {
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        brokerage: profile.brokerage,
        pdf_look: profile.pdf_look,
        show_headshot: profile.show_headshot,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        showCustomModal('Error saving profile: ' + error.message)
      } else {
        setProfileStep(2)
      }
    } else if (profileStep === 2) {
      setProfileStep(3)
    } else if (profileStep === 3) {
      handleFinalSave()
    }
  }

  const handleFinalSave = async () => {
    if (user) {
      const finalPayload = {
        id: user.id,
        full_name: profile.full_name,
        email: profile.email || user.email,
        phone: profile.phone,
        brokerage: profile.brokerage,
        pdf_look: profile.pdf_look,
        show_headshot: profile.show_headshot,
        headshot_url: profile.headshot_url,
        logo_url: profile.logo_url,
        custom_header_url: profile.custom_header_url,
        updated_at: new Date()
      }

      const { error } = await supabase.from('profiles').upsert(finalPayload)
      if (error) {
        showCustomModal('Error saving profile: ' + error.message)
        return
      }
    }

    localStorage.removeItem('crt_profile_step')
    localStorage.removeItem('crt_profile_draft')
    showCustomModal('Profile fully updated!')
    switchView('home')
  }

  const handleImageUpload = async (e: any, fieldName: string) => {
    const file = e.target.files[0]
    if (!file || !user) return

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

    const updatedProfile = { ...profile, [fieldName]: publicUrl }
    setProfile(updatedProfile)

    const { error: dbError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      email: profile.email || user.email,
      phone: profile.phone,
      brokerage: profile.brokerage,
      [fieldName]: publicUrl,
      updated_at: new Date()
    })

    if (dbError) {
      showCustomModal('Database save failed (Image uploaded to storage though): ' + dbError.message)
    }

    setUploading(false)
  }

  const savePdfLookSelection = (lookKey: string) => {
    setProfile((prev: any) => ({ ...prev, pdf_look: lookKey }))
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
          .app-view.active { display: block; animation: fadeIn 0.3s ease-out; }
          #view-profile.active, #view-sellertracker.active, #view-neighborhoods.active, #view-outreach.active { display: flex !important; flex-direction: column !important; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <header className="max-w-xl mx-auto w-full flex justify-between items-center mb-6">
          <div onClick={() => switchView('home')} className="text-xs font-bold tracking-widest text-slate-400 uppercase cursor-pointer hover:text-slate-300 transition">
            Cool<span className="text-emerald-400">RealEstate</span>Tools.com
          </div>
          <div className="flex items-center gap-3">
            <div id="nav-action" style={{ display: 'none' }}>
              <button onClick={() => switchView('home')} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700 transition">← Back to Menu</button>
            </div>
            {user ? (
              <button onClick={handleLogout} className="text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 px-3 py-1.5 rounded-full transition">
                Sign Out
              </button>
            ) : (
              <button onClick={() => switchView('signin')} className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition">
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center my-4 sm:my-8 relative">
          {currentView === 'home' && <HomeView switchView={switchView} />}
          {currentView === 'signin' && <SignInView />}
          {currentView === 'money' && <MoneyStuffView netData={netData} handleNetInputChange={handleNetInputChange} calculatedNetProceeds={calculatedNetProceeds} switchView={switchView} showCustomModal={showCustomModal} />}
          {currentView === 'openhouse' && <OpenHouseView listings={listings} />}
          {currentView === 'seller' && <SellerMenuView switchView={switchView} />}
          {currentView === 'netsheet' && <NetSheetView netData={netData} handleNetInputChange={handleNetInputChange} calculatedNetProceeds={calculatedNetProceeds} activeFields={activeFields} toggleFieldCheckbox={toggleFieldCheckbox} showCustomModal={showCustomModal} renderAgentHeader={() => renderAgentHeader(profile)} switchView={switchView} />}
          {currentView === 'sellertracker' && <SellerTrackerView listings={listings} updateListings={updateListings} showCustomModal={showCustomModal} switchView={switchView} userId={user?.id} />}
          {currentView === 'driving' && <DrivingView />}
          {currentView === 'buyer' && <BuyerView showCustomModal={showCustomModal} />}
          {currentView === 'sellercall' && <SellerCallView showCustomModal={showCustomModal} listings={listings} />}
          {currentView === 'profile' && (
            <ProfileBuilderView 
              profileStep={profileStep} 
              setProfileStep={setProfileStep}
              profile={profile}
              setProfile={setProfile}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              savePdfLookSelection={savePdfLookSelection}
              renderAgentHeader={(theme: string | null) => renderAgentHeader(profile, theme)}
              handleNextStep={handleNextStep}
              switchView={switchView}
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
              campaigns={outreachCampaigns}
              updateCampaigns={updateOutreachCampaigns}
              switchView={switchView}
              showCustomModal={showCustomModal}
              userId={user?.id}
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
        <div id="custom-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="text-3xl">✨</div>
            <p id="modal-message" className="text-sm font-bold text-white"></p>
            <button onClick={closeCustomModal} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition">Got it</button>
          </div>
        </div>

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