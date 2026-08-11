'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import {
  HomeView,
  SignInView,
  MoneyStuffView,
  OpenHouseView,
  MakeMySellerHappyView,
  DrivingView,
  BuyerView,
  SellerCallView,
  ProfileBuilderView
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
          // If they already finished setup before, stay home or let them edit
          if (savedStep === '2') {
            setProfileStep(2)
            switchView('profile')
          }
        } else {
          setProfile((prev: any) => ({ ...prev, email: currentUser.email || '' }))
          if (savedStep === '2') {
            setProfileStep(2)
            switchView('profile')
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
    const validViews = ['home', 'signin', 'money', 'openhouse', 'seller', 'driving', 'buyer', 'sellercall', 'profile']
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

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      email: profile.email || user.email,
      phone: profile.phone,
      brokerage: profile.brokerage,
      [fieldName]: publicUrl,
      updated_at: new Date()
    })

    setUploading(false)
  }

  const savePdfLookSelection = (lookKey: string) => {
    setProfile((prev: any) => ({ ...prev, pdf_look: lookKey }))
  }

  const renderAgentHeader = (themeOverride: string | null = null) => {
    const look = themeOverride || profile.pdf_look || 'look1'
    const name = profile.full_name || 'Jane Doe'
    const brokerage = profile.brokerage || 'Luxury Real Estate'
    const phone = profile.phone || '(555) 123-4567'
    const showHeadshot = profile.show_headshot && profile.headshot_url
    const headshot = profile.headshot_url
    const logo = profile.logo_url

    switch(look) {
      case 'look1': 
        return (
          <div className="bg-white border-b border-slate-100 pb-5 mb-5 flex flex-col items-center text-center px-4 pt-2">
            {logo ? (
              <img src={logo} alt="Logo" className="h-10 md:h-12 w-auto max-w-full object-contain mb-4" />
            ) : (
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4 uppercase">{brokerage}</h2>
            )}
            <div className="flex items-center gap-4">
              {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200" />}
              <div className={showHeadshot ? "text-left" : "text-center"}>
                <h3 className="font-semibold text-slate-900 text-sm tracking-wide">{name}</h3>
                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">{phone}</p>
              </div>
            </div>
          </div>
        )

      case 'look2': 
        return (
          <div className="bg-slate-950 text-amber-50 p-5 rounded-xl flex justify-between items-center mb-5 shadow-lg border border-slate-800">
            <div className="flex-1 flex flex-col justify-center">
              {logo ? (
                <img src={logo} alt="Logo" className="h-8 md:h-10 w-auto max-w-[160px] object-contain object-left mb-2 brightness-0 invert" />
              ) : (
                <span className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2 block">{brokerage}</span>
              )}
              <h3 className="font-serif text-lg tracking-wide text-white">{name}</h3>
              <p className="text-[10px] text-slate-400 tracking-widest">{phone}</p>
            </div>
            {showHeadshot && (
              <div className="ml-4 flex-shrink-0">
                <img src={headshot} alt="Agent" className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/30" />
              </div>
            )}
          </div>
        )

      case 'look3': 
        return (
          <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl flex justify-between items-center mb-5">
            <div className="flex items-center gap-4">
              {showHeadshot && <img src={headshot} alt="Agent" className="w-14 h-14 rounded-xl object-cover shadow-sm" />}
              <div>
                <h3 className="font-bold text-teal-950 text-lg">{name}</h3>
                <p className="text-[11px] text-teal-700 font-medium">{phone}</p>
              </div>
            </div>
            <div className="text-right">
              {logo ? (
                <img src={logo} alt="Logo" className="h-9 w-auto max-w-[140px] object-contain object-right" />
              ) : (
                <span className="font-serif italic text-teal-800 text-sm">{brokerage}</span>
              )}
            </div>
          </div>
        )

      case 'look4': 
        return (
          <div className="border-t-4 border-b border-slate-900 py-5 mb-5 flex justify-between items-start text-slate-900 bg-white">
            <div className="flex-1">
              {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[150px] object-contain object-left mb-3 grayscale" />}
              <h3 className="font-serif text-2xl tracking-tight leading-none mb-1">{name}</h3>
              <p className="text-[9px] font-mono tracking-widest uppercase text-slate-500 mt-1">{phone} &mdash; {brokerage}</p>
            </div>
            {showHeadshot && <img src={headshot} alt="Agent" className="w-16 h-16 object-cover grayscale contrast-125 rounded-tl-full rounded-tr-full" />}
          </div>
        )

      case 'look5': 
        return (
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col items-center mb-5">
            {logo ? (
              <img src={logo} alt="Logo" className="h-14 md:h-16 w-auto max-w-full object-contain mb-5" />
            ) : (
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-5">{brokerage}</h2>
            )}
            <div className="w-full border-t border-slate-200 pt-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {showHeadshot && <img src={headshot} alt="Agent" className="w-10 h-10 rounded-full object-cover" />}
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{name}</h3>
              </div>
              <p className="text-[11px] font-medium text-slate-600">{phone}</p>
            </div>
          </div>
        )

      case 'look6': 
        return (
          <div className="bg-blue-950 p-1 mb-5 shadow-sm rounded-lg">
            <div className="bg-white p-4 rounded-md border-2 border-blue-900/10 flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-bold text-blue-950 text-xl tracking-tight">{name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-4 h-[1px] bg-amber-500"></span>
                  <p className="text-[10px] text-blue-900 uppercase font-semibold tracking-wider">{brokerage}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">{phone}</p>
              </div>
              <div className="flex items-center gap-4">
                {logo && <img src={logo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />}
                {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded object-cover shadow-sm border border-slate-100" />}
              </div>
            </div>
          </div>
        )

      case 'look7': 
        return (
          <div className="relative p-5 rounded-2xl mb-5 overflow-hidden bg-white shadow-md border border-slate-100">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-fuchsia-500 to-rose-500"></div>
            <div className="flex justify-between items-center pl-2">
              <div>
                {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[150px] object-contain object-left mb-2" />}
                <h3 className="font-black text-slate-900 text-lg">{name}</h3>
                <p className="text-[11px] font-medium text-slate-500">{phone}</p>
              </div>
              {showHeadshot && <img src={headshot} alt="Agent" className="w-14 h-14 rounded-2xl object-cover shadow-sm" />}
            </div>
          </div>
        )

      case 'look8': 
        return (
          <div className="border-4 border-black p-4 mb-5 bg-white flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="font-black text-black text-xl uppercase tracking-tighter">{name}</h3>
              <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">{brokerage}</p>
              <p className="text-[10px] font-medium text-slate-600 mt-1">{phone}</p>
            </div>
            <div className="flex items-center gap-3">
              {logo && <img src={logo} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain grayscale" />}
              {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 object-cover grayscale border-2 border-black" />}
            </div>
          </div>
        )

      case 'look9': 
        return (
          <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-5 rounded-xl flex justify-between items-center mb-5">
            <div className="flex items-center gap-4">
              {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />}
              <div>
                <h3 className="font-bold text-slate-900 text-base">{name}</h3>
                <p className="text-[10px] text-orange-800 font-medium uppercase tracking-wider">{brokerage}</p>
              </div>
            </div>
            <div className="text-right">
              {logo && <img src={logo} alt="Logo" className="h-9 w-auto max-w-[120px] object-contain object-right mix-blend-multiply" />}
              <p className="text-[10px] text-slate-500 font-medium mt-1">{phone}</p>
            </div>
          </div>
        )

      case 'look10': 
      default:
        return (
          <div className="bg-slate-100/50 backdrop-blur-md border border-white/60 p-4 rounded-2xl flex justify-between items-center mb-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col justify-center">
              {logo && <img src={logo} alt="Logo" className="h-7 w-auto max-w-[140px] object-contain object-left mb-1.5" />}
              <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
              <p className="text-[10px] text-slate-500">{phone}</p>
            </div>
            {showHeadshot && <img src={headshot} alt="Agent" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white" />}
          </div>
        )
    }
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
          #view-profile.active { display: flex !important; flex-direction: column !important; }
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
          {currentView === 'openhouse' && <OpenHouseView />}
          {currentView === 'seller' && <MakeMySellerHappyView netData={netData} handleNetInputChange={handleNetInputChange} calculatedNetProceeds={calculatedNetProceeds} activeFields={activeFields} toggleFieldCheckbox={toggleFieldCheckbox} showCustomModal={showCustomModal} renderAgentHeader={renderAgentHeader} />}
          {currentView === 'driving' && <DrivingView />}
          {currentView === 'buyer' && <BuyerView showCustomModal={showCustomModal} />}
          {currentView === 'sellercall' && <SellerCallView showCustomModal={showCustomModal} />}
          {currentView === 'profile' && (
            <ProfileBuilderView 
              profileStep={profileStep} 
              setProfileStep={setProfileStep}
              profile={profile}
              setProfile={setProfile}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              savePdfLookSelection={savePdfLookSelection}
              renderAgentHeader={renderAgentHeader}
              handleNextStep={handleNextStep}
              switchView={switchView}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="max-w-xl mx-auto w-full text-center pt-8 pb-2 text-xs text-slate-500 font-medium">
          coolrealestatetools.com • $29/mo
        </footer>

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