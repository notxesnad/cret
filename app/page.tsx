'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/utils/supabase'

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

  const [netSheetView, setNetSheetView] = useState<string>('calc') 

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
  }, [])

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
    document.querySelectorAll('.app-view').forEach(el => {
      el.classList.remove('active')
    })
    
    const targetView = document.getElementById('view-' + currentView)
    if(targetView) {
      targetView.classList.add('active')
    } else {
      const homeView = document.getElementById('view-home')
      if (homeView) homeView.classList.add('active')
      router.replace('?view=home', { scroll: false })
    }
    
    const navAction = document.getElementById('nav-action')
    if(navAction) {
      navAction.style.display = currentView === 'home' ? 'none' : 'block'
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentView])

  const switchView = (viewId: string) => {
    router.push(`?view=${viewId}`, { scroll: false })
  }

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

  const submitOpenHouse = (e: any) => {
    e.preventDefault()
    document.getElementById('oh-form-container')?.classList.add('hidden')
    document.getElementById('oh-success')?.classList.remove('hidden')
  }

  const resetOpenHouse = () => {
    (document.getElementById('oh-name') as HTMLInputElement).value = '';
    (document.getElementById('oh-phone') as HTMLInputElement).value = '';
    document.getElementById('oh-success')?.classList.add('hidden')
    document.getElementById('oh-form-container')?.classList.remove('hidden')
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
        <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">

          {/* VIEW: HOME */}
          <div id="view-home" className="app-view active space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black tracking-tight">Tap a Tool. Get to Work.</h1>
              <p className="text-xs text-slate-400 mt-1">$29 a month. All tools included. Cancel <a href="/cancel" className="text-blue-400 hover:underline">here</a> anytime.</p>
            </div>

            {/* Profile Button */}
            <div onClick={() => switchView('profile')} className="group relative bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">👤</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Brand your tools &amp; PDF styles</span>
              <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Make My Profile</h2>
            </div>

            {/* Category 1: Money Stuff */}
            <div onClick={() => switchView('money')} className="group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:rotate-12">💵</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Calculator Suite</span>
              <h2 className="font-money text-3xl md:text-4xl tracking-wide uppercase mt-1">Money Stuff</h2>
            </div>

            {/* Category 2: Open House Things */}
            <div onClick={() => switchView('openhouse')} className="group relative bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🏡</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">iPad Sign-In & Text-Back</span>
              <h2 className="font-openhouse text-2xl md:text-3xl tracking-wide mt-1">Open House Things</h2>
            </div>

            {/* Category 3: Make My Seller Happy */}
            <div onClick={() => switchView('seller')} className="group relative bg-amber-100 hover:bg-white text-slate-900 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">✨</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Net Sheets & Instant Reports</span>
              <h2 className="font-seller text-3xl md:text-4xl mt-1">Make My Seller Happy</h2>
            </div>

            {/* Category 4: Driving to a Million Places */}
            <div onClick={() => switchView('driving')} className="group relative bg-rose-600 hover:bg-rose-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:translate-x-2">🚗</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Tour Itineraries & Routing</span>
              <h2 className="font-driving text-xl md:text-2xl mt-1">Driving to a Million Places</h2>
            </div>

            {/* Category 5: Confused Buyer Tools */}
            <div onClick={() => switchView('buyer')} className="group relative bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🧭</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Comparison Cards & Ratings</span>
              <h2 className="font-buyer text-2xl md:text-3xl tracking-tight mt-1">Confused Buyer Tools</h2>
            </div>
            
            {/* Category 6: Crap, my seller is calling! */}
            <div onClick={() => switchView('sellercall')} className="group relative bg-orange-500 hover:bg-orange-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
              <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🚨</div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">Instant Prep Sheet</span>
              <h2 className="font-sellercall text-2xl md:text-3xl mt-1 leading-tight">&quot;Crap, my seller is calling in 5 mins&quot;</h2>
            </div>
            
            {/* Pricing Section */}
            <div className="mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
              
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight relative z-10">One price.<br />All the tools.</h2>
              <p className="text-slate-400 text-sm mb-8 relative z-10">No confusing tiers. No hidden setup fees.</p>
              
              <div className="flex items-end justify-center mb-6 relative z-10">
                <span className="text-6xl font-black text-white">$29</span>
                <span className="text-xl text-slate-500 font-medium mb-2 ml-1">/month</span>
              </div>
              
              <ul className="text-left space-y-4 mb-8 max-w-[280px] mx-auto relative z-10">
                <li className="flex items-center text-slate-300 font-medium text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  Access to all micro-apps
                </li>
                <li className="flex items-center text-slate-300 font-medium text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  Automated text & email
                </li>
                <li className="flex items-center text-slate-300 font-medium text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  Client-ready branded PDFs
                </li>
                <li className="flex items-center text-slate-300 font-medium text-sm">
                  <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  24/7 Priority Support
                </li>
              </ul>
              
              <a href="#view-home" onClick={() => switchView('home')} className="block w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-xl transition shadow-lg text-center uppercase tracking-wide text-sm relative z-10">
                Start your 14-day free trial
              </a>
            </div>
          </div>

          {/* VIEW: SIGN IN */}
          <div id="view-signin" className="app-view">
            <EmailLoginWidget />
          </div>

          {/* TOOL 1: MONEY STUFF (QUICK NET SHEET) */}
          <div id="view-money" className="app-view bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase font-money text-lg">Money Stuff</span>
              <h1 className="text-2xl font-black mt-1">60-Second Net Sheet</h1>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Sale Price ($)</label>
                <input type="number" value={netData.salePrice} onChange={(e) => handleNetInputChange('salePrice', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Mortgage Payoff ($)</label>
                <input type="number" value={netData.mortgagePayoff} onChange={(e) => handleNetInputChange('mortgagePayoff', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Commission (%)</label>
                  <input type="number" step="0.5" value={netData.agentCommissionPct} onChange={(e) => handleNetInputChange('agentCommissionPct', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Transfer Tax (%)</label>
                  <input type="number" step="0.25" value={netData.transferTaxPct} onChange={(e) => handleNetInputChange('transferTaxPct', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Title &amp; Escrow Fees ($)</label>
                <input type="number" value={netData.titleEscrowFee} onChange={(e) => handleNetInputChange('titleEscrowFee', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Estimated Net Proceeds</span>
              <div className="text-4xl font-black text-emerald-400">${calculatedNetProceeds > 0 ? calculatedNetProceeds.toLocaleString('en-US', {maximumFractionDigits: 0}) : 0}</div>
            </div>

            <button onClick={() => switchView('seller')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-xs border border-slate-700">
              ➕ Add More Detailed Fields
            </button>

            <button onClick={() => showCustomModal('Pro Feature Unlocked: Branded PDF and SMS link sent!')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg text-xs">
              📱 Generate Branded PDF / SMS
            </button>
          </div>

          {/* TOOL 2: OPEN HOUSE THINGS */}
          <div id="view-openhouse" className="app-view bg-indigo-900/60 border border-indigo-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div id="oh-form-container">
              <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase font-openhouse">Open House Things</span>
              <h1 className="text-2xl font-black mt-2">123 Ocean Drive</h1>
              <p className="text-xs text-indigo-200 mt-1 mb-4">Sign in to instantly receive the brochure &amp; floor plan.</p>
              <form onSubmit={submitOpenHouse} className="space-y-4 text-left">
                <input id="oh-name" type="text" placeholder="Your Full Name" required className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors" />
                <input id="oh-phone" type="tel" placeholder="Cell Phone Number" required className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors" />
                <button type="submit" className="w-full bg-white hover:bg-indigo-50 text-indigo-950 font-black py-4 rounded-xl transition shadow-lg">
                  Get Property Brochure →
                </button>
              </form>
            </div>
            <div id="oh-success" className="hidden py-6 space-y-3">
              <div className="text-4xl animate-bounce">✨</div>
              <h2 className="text-xl font-black">You&apos;re checked in!</h2>
              <p className="text-xs text-indigo-200">The property link has been texted to your phone.</p>
              <button onClick={resetOpenHouse} className="text-xs font-bold text-indigo-300 hover:text-white transition underline pt-2">Next Visitor</button>
            </div>
          </div>

          {/* TOOL 3: MAKE MY SELLER HAPPY */}
          <div id="view-seller" className="app-view bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-5">
            
            {netSheetView === 'calc' ? (
              <>
                {renderAgentHeader()}

                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Customizable Seller Net Sheet</h2>
                    <p className="text-[11px] text-slate-500">Core figures plus any active detailed line items.</p>
                  </div>
                  <button 
                    onClick={() => setNetSheetView('checkboxes')}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow"
                  >
                    ➕ Add / Edit Fields
                  </button>
                </div>

                {/* Core Basic Fields Inputs */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Sale Price ($)</label>
                      <input type="number" value={netData.salePrice} onChange={(e) => handleNetInputChange('salePrice', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Mortgage Payoff ($)</label>
                      <input type="number" value={netData.mortgagePayoff} onChange={(e) => handleNetInputChange('mortgagePayoff', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Commission %</label>
                      <input type="number" step="0.5" value={netData.agentCommissionPct} onChange={(e) => handleNetInputChange('agentCommissionPct', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-bold text-slate-900" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Transfer Tax %</label>
                      <input type="number" step="0.25" value={netData.transferTaxPct} onChange={(e) => handleNetInputChange('transferTaxPct', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-bold text-slate-900" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Title &amp; Escrow ($)</label>
                      <input type="number" value={netData.titleEscrowFee} onChange={(e) => handleNetInputChange('titleEscrowFee', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 font-bold text-slate-900" />
                    </div>
                  </div>

                  {/* Render inputs for any checked detailed fields */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {activeFields.sellerConcessions && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Seller Concessions ($)</label><input type="number" value={netData.sellerConcessions} onChange={(e) => handleNetInputChange('sellerConcessions', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.personalProperty && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Personal Property Value ($)</label><input type="number" value={netData.personalProperty} onChange={(e) => handleNetInputChange('personalProperty', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.secondMortgage && <div><label className="text-[10px] font-bold text-slate-500 uppercase">2nd Mortgage / HELOC ($)</label><input type="number" value={netData.secondMortgage} onChange={(e) => handleNetInputChange('secondMortgage', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.prepaymentPenalties && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Prepayment Penalties ($)</label><input type="number" value={netData.prepaymentPenalties} onChange={(e) => handleNetInputChange('prepaymentPenalties', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.propertyLiens && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Outstanding Property Liens ($)</label><input type="number" value={netData.propertyLiens} onChange={(e) => handleNetInputChange('propertyLiens', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.transactionCoordFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Transaction Coordination / Admin Fee ($)</label><input type="number" value={netData.transactionCoordFees} onChange={(e) => handleNetInputChange('transactionCoordFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.attorneyFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Attorney Fees ($)</label><input type="number" value={netData.attorneyFees} onChange={(e) => handleNetInputChange('attorneyFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.recordingFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Recording Fees ($)</label><input type="number" value={netData.recordingFees} onChange={(e) => handleNetInputChange('recordingFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.ownersTitleInsurance && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Owner&apos;s Title Insurance Policy ($)</label><input type="number" value={netData.ownersTitleInsurance} onChange={(e) => handleNetInputChange('ownersTitleInsurance', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.courierWireFees && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Courier / Wire Fees ($)</label><input type="number" value={netData.courierWireFees} onChange={(e) => handleNetInputChange('courierWireFees', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.propertyTaxesPrarated && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Prorated Property Taxes ($)</label><input type="number" value={netData.propertyTaxesPrarated} onChange={(e) => handleNetInputChange('propertyTaxesPrarated', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.hoaDues && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Prorated HOA Dues ($)</label><input type="number" value={netData.hoaDues} onChange={(e) => handleNetInputChange('hoaDues', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.hoaEstoppel && <div><label className="text-[10px] font-bold text-slate-500 uppercase">HOA Estoppel / Transfer Fee ($)</label><input type="number" value={netData.hoaEstoppel} onChange={(e) => handleNetInputChange('hoaEstoppel', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.specialAssessments && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Special Assessments ($)</label><input type="number" value={netData.specialAssessments} onChange={(e) => handleNetInputChange('specialAssessments', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.utilitiesProration && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Utilities Proration ($)</label><input type="number" value={netData.utilitiesProration} onChange={(e) => handleNetInputChange('utilitiesProration', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.homeWarranty && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Home Warranty ($)</label><input type="number" value={netData.homeWarranty} onChange={(e) => handleNetInputChange('homeWarranty', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.stagingPhotography && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Staging &amp; Photography ($)</label><input type="number" value={netData.stagingPhotography} onChange={(e) => handleNetInputChange('stagingPhotography', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                    {activeFields.repairCredits && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Repair Credits ($)</label><input type="number" value={netData.repairCredits} onChange={(e) => handleNetInputChange('repairCredits', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2 py-1" /></div>}
                  </div>
                </div>

                {/* Itemized list for PDF preview */}
                <div className="space-y-1.5 text-xs border-t border-b border-slate-100 py-3">
                  <div className="flex justify-between py-1"><span>Gross Sale Price</span><span className="font-bold">${netData.salePrice.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 text-rose-600"><span>1st Mortgage Payoff</span><span>-${Number(netData.mortgagePayoff).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 text-rose-600"><span>Brokerage Commission ({netData.agentCommissionPct}%)</span><span>-${(netData.salePrice * (netData.agentCommissionPct / 100)).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 text-rose-600"><span>Transfer & Documentary Stamps</span><span>-${(netData.salePrice * (netData.transferTaxPct / 100)).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 text-rose-600"><span>Title & Escrow Settlement Fees</span><span>-${Number(netData.titleEscrowFee).toLocaleString()}</span></div>

                  {activeFields.sellerConcessions && <div className="flex justify-between py-1 text-rose-600"><span>Seller Concessions</span><span>-${Number(netData.sellerConcessions).toLocaleString()}</span></div>}
                  {activeFields.personalProperty && <div className="flex justify-between py-1 text-rose-600"><span>Personal Property</span><span>-${Number(netData.personalProperty).toLocaleString()}</span></div>}
                  {activeFields.secondMortgage && <div className="flex justify-between py-1 text-rose-600"><span>2nd Mortgage Payoff</span><span>-${Number(netData.secondMortgage).toLocaleString()}</span></div>}
                  {activeFields.prepaymentPenalties && <div className="flex justify-between py-1 text-rose-600"><span>Prepayment Penalties</span><span>-${Number(netData.prepaymentPenalties).toLocaleString()}</span></div>}
                  {activeFields.propertyLiens && <div className="flex justify-between py-1 text-rose-600"><span>Outstanding Liens</span><span>-${Number(netData.propertyLiens).toLocaleString()}</span></div>}
                  {activeFields.transactionCoordFees && <div className="flex justify-between py-1 text-rose-600"><span>Admin / TC Fees</span><span>-${Number(netData.transactionCoordFees).toLocaleString()}</span></div>}
                  {activeFields.attorneyFees && <div className="flex justify-between py-1 text-rose-600"><span>Attorney Fees</span><span>-${Number(netData.attorneyFees).toLocaleString()}</span></div>}
                  {activeFields.recordingFees && <div className="flex justify-between py-1 text-rose-600"><span>Recording Fees</span><span>-${Number(netData.recordingFees).toLocaleString()}</span></div>}
                  {activeFields.ownersTitleInsurance && <div className="flex justify-between py-1 text-rose-600"><span>Owner&apos;s Title Policy</span><span>-${Number(netData.ownersTitleInsurance).toLocaleString()}</span></div>}
                  {activeFields.courierWireFees && <div className="flex justify-between py-1 text-rose-600"><span>Courier & Wire Fees</span><span>-${Number(netData.courierWireFees).toLocaleString()}</span></div>}
                  {activeFields.propertyTaxesPrarated && <div className="flex justify-between py-1 text-rose-600"><span>Prorated Taxes</span><span>-${Number(netData.propertyTaxesPrarated).toLocaleString()}</span></div>}
                  {activeFields.hoaDues && <div className="flex justify-between py-1 text-rose-600"><span>HOA Dues</span><span>-${Number(netData.hoaDues).toLocaleString()}</span></div>}
                  {activeFields.hoaEstoppel && <div className="flex justify-between py-1 text-rose-600"><span>HOA Estoppel Fee</span><span>-${Number(netData.hoaEstoppel).toLocaleString()}</span></div>}
                  {activeFields.specialAssessments && <div className="flex justify-between py-1 text-rose-600"><span>Special Assessments</span><span>-${Number(netData.specialAssessments).toLocaleString()}</span></div>}
                  {activeFields.utilitiesProration && <div className="flex justify-between py-1 text-rose-600"><span>Utilities Proration</span><span>-${Number(netData.utilitiesProration).toLocaleString()}</span></div>}
                  {activeFields.homeWarranty && <div className="flex justify-between py-1 text-rose-600"><span>Home Warranty</span><span>-${Number(netData.homeWarranty).toLocaleString()}</span></div>}
                  {activeFields.stagingPhotography && <div className="flex justify-between py-1 text-rose-600"><span>Staging & Photo</span><span>-${Number(netData.stagingPhotography).toLocaleString()}</span></div>}
                  {activeFields.repairCredits && <div className="flex justify-between py-1 text-rose-600"><span>Repair Credits</span><span>-${Number(netData.repairCredits).toLocaleString()}</span></div>}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Estimated Seller Net Proceeds</span>
                  <div className="text-3xl font-black text-amber-950">${calculatedNetProceeds > 0 ? calculatedNetProceeds.toLocaleString('en-US', {maximumFractionDigits: 0}) : 0}</div>
                </div>

                <button onClick={() => showCustomModal('Net Sheet PDF Exported & Ready to Text!')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition shadow-lg">
                  📄 Export Client-Ready Net Sheet PDF
                </button>
              </>
            ) : (
              /* CHECKBOX SELECTION VIEW */
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Select Detailed Fields</h2>
                    <p className="text-xs text-slate-500">Check items to include in your net sheet calculations.</p>
                  </div>
                  <button 
                    onClick={() => setNetSheetView('calc')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow"
                  >
                    ✓ Done &amp; Return
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2 text-xs">
                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.sellerConcessions} onChange={() => toggleFieldCheckbox('sellerConcessions')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Seller Concessions</span><span className="text-[10px] text-slate-500">Buyer closing cost assistance credits</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.personalProperty} onChange={() => toggleFieldCheckbox('personalProperty')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Personal Property Value</span><span className="text-[10px] text-slate-500">Bill of sale items (furniture, appliances)</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.secondMortgage} onChange={() => toggleFieldCheckbox('secondMortgage')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">2nd Mortgage / HELOC Payoff</span><span className="text-[10px] text-slate-500">Secondary loan balances</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.prepaymentPenalties} onChange={() => toggleFieldCheckbox('prepaymentPenalties')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Prepayment Penalties</span><span className="text-[10px] text-slate-500">Early loan termination fees</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.propertyLiens} onChange={() => toggleFieldCheckbox('propertyLiens')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Outstanding Property Liens</span><span className="text-[10px] text-slate-500">Judgments or solar leases</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.transactionCoordFees} onChange={() => toggleFieldCheckbox('transactionCoordFees')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Transaction Coordination / Admin Fee</span><span className="text-[10px] text-slate-500">Brokerage administrative fees</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.attorneyFees} onChange={() => toggleFieldCheckbox('attorneyFees')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Attorney Fees</span><span className="text-[10px] text-slate-500">Legal contract review</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.recordingFees} onChange={() => toggleFieldCheckbox('recordingFees')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Recording Fees</span><span className="text-[10px] text-slate-500">Mortgage releases &amp; deed recording</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.ownersTitleInsurance} onChange={() => toggleFieldCheckbox('ownersTitleInsurance')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Owner&apos;s Title Insurance Policy</span><span className="text-[10px] text-slate-500">Customary seller title insurance cost</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.courierWireFees} onChange={() => toggleFieldCheckbox('courierWireFees')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Courier / Wire Fees</span><span className="text-[10px] text-slate-500">Settlement wire and delivery charges</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.propertyTaxesPrarated} onChange={() => toggleFieldCheckbox('propertyTaxesPrarated')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Prorated Property Taxes</span><span className="text-[10px] text-slate-500">Taxes adjusted up to closing date</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.hoaDues} onChange={() => toggleFieldCheckbox('hoaDues')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Prorated HOA Dues</span><span className="text-[10px] text-slate-500">Association fee adjustments</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.hoaEstoppel} onChange={() => toggleFieldCheckbox('hoaEstoppel')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">HOA Estoppel / Transfer Fee</span><span className="text-[10px] text-slate-500">Association status document fee</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.specialAssessments} onChange={() => toggleFieldCheckbox('specialAssessments')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Special Assessments</span><span className="text-[10px] text-slate-500">Neighborhood improvement balances</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.utilitiesProration} onChange={() => toggleFieldCheckbox('utilitiesProration')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Utilities Proration</span><span className="text-[10px] text-slate-500">Water, sewer, or gas adjustments</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.homeWarranty} onChange={() => toggleFieldCheckbox('homeWarranty')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Home Warranty</span><span className="text-[10px] text-slate-500">Coverage provided to buyer</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.stagingPhotography} onChange={() => toggleFieldCheckbox('stagingPhotography')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Staging &amp; Photography</span><span className="text-[10px] text-slate-500">Marketing media expenses</span></div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input type="checkbox" checked={activeFields.repairCredits} onChange={() => toggleFieldCheckbox('repairCredits')} className="w-4 h-4 rounded text-emerald-600" />
                    <div><span className="font-bold block text-slate-900">Repair Credits</span><span className="text-[10px] text-slate-500">Inspection negotiation credits</span></div>
                  </label>
                </div>

                <button 
                  onClick={() => setNetSheetView('calc')}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition shadow"
                >
                  Save Selections &amp; Return
                </button>
              </div>
            )}

          </div>

          {/* TOOL 4: DRIVING TO A MILLION PLACES */}
          <div id="view-driving" className="app-view space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold tracking-widest text-rose-400 uppercase font-driving">Tour Itinerary</span>
              <h1 className="text-xl font-black mt-1">Saturday Buyer Tour</h1>
              <p className="text-xs text-slate-400">3 Stops • Optimized Route</p>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition cursor-default">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">STOP #1</span>
                    <h3 className="font-bold mt-1 text-sm">124 Ocean Blvd</h3>
                  </div>
                  <div className="text-right font-black text-emerald-400 text-sm">$1,250,000</div>
                </div>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="block bg-slate-800 text-center py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition">📍 Open in Google Maps</a>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition cursor-default">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">STOP #2</span>
                    <h3 className="font-bold mt-1 text-sm">88 Palm Lane</h3>
                  </div>
                  <div className="text-right font-black text-emerald-400 text-sm">$1,150,000</div>
                </div>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="block bg-slate-800 text-center py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition">📍 Open in Google Maps</a>
              </div>
            </div>
          </div>

          {/* TOOL 5: CONFUSED BUYER TOOLS */}
          <div id="view-buyer" className="app-view bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-buyer">Buyer Matrix</span>
              <h1 className="text-xl font-black mt-1">Compare Property #1 vs #2</h1>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800 p-3 rounded-2xl space-y-2 border border-cyan-500/30">
                <div className="font-bold text-cyan-400">124 Ocean Blvd</div>
                <div>Price: <span className="font-bold text-white">$1.25M</span></div>
                <div>Yard: <span className="font-bold text-white">Huge</span></div>
                <div>Kitchen: <span className="font-bold text-white">Needs reno</span></div>
              </div>
              <div className="bg-slate-800 p-3 rounded-2xl space-y-2 border border-slate-700 hover:border-slate-600 transition cursor-default">
                <div className="font-bold text-slate-300">88 Palm Lane</div>
                <div>Price: <span className="font-bold text-white">$1.15M</span></div>
                <div>Yard: <span className="font-bold text-white">Small</span></div>
                <div>Kitchen: <span className="font-bold text-white">Modern</span></div>
              </div>
            </div>
            <button onClick={() => showCustomModal('Comparison card texted to buyer!')} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg mt-2">
              📲 Text Side-by-Side to Buyer
            </button>
          </div>

          {/* TOOL 6: SELLER CALLING */}
          <div id="view-sellercall" className="app-view bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <span className="text-xs font-bold tracking-widest text-orange-500 uppercase font-sellercall">Instant Prep Sheet</span>
              <h1 className="text-2xl font-black mt-1">Seller Survival Guide</h1>
              <p className="text-xs text-slate-400 mt-1">Get your talking points ready before you pick up.</p>
            </div>
            
            <div className="relative">
              <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer">
                <option>124 Ocean Blvd</option>
                <option>88 Palm Lane</option>
                <option>456 Mountain View Rd</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Days on Mkt</div>
                <div className="text-xl font-black text-white">42</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Showings</div>
                <div className="text-xl font-black text-white">3 <span className="text-xs text-slate-400 font-normal block -mt-1">this wk</span></div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Feedback</div>
                <div className="text-lg font-black text-rose-400">Price</div>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-10 text-6xl">💬</div>
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest relative z-10">What to say:</h3>
              <p className="text-sm text-slate-300 italic relative z-10 leading-relaxed">&quot;Hey Bob! I was just reviewing your file. We had 3 showings this week, but the feedback keeps pointing to the price. We also had a new listing hit the market nearby for $10k less. Let&apos;s discuss a strategic adjustment so we don&apos;t lose momentum.&quot;</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Comps (Last 7 Days)</h3>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="text-[9px] font-black text-rose-400 bg-rose-400/20 px-2 py-0.5 rounded inline-block mb-1 uppercase tracking-wider">New</div>
                  <div className="text-xs font-bold text-white">125 Ocean Dr</div>
                </div>
                <div className="text-sm font-black text-white">$1,150,000</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="text-[9px] font-black text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded inline-block mb-1 uppercase tracking-wider">Pending</div>
                  <div className="text-xs font-bold text-white">90 Palm Lane</div>
                </div>
                <div className="text-sm font-black text-white">$1,225,000</div>
              </div>
            </div>

            <button onClick={() => showCustomModal('Cheat sheet texted to your phone for easy reading during the call!')} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg mt-2 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Text Me This Cheat Sheet
            </button>
          </div>

          {/* TOOL 7: PROFILE BUILDER */}
          <div id="view-profile" className="app-view bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col h-[700px]">
            
            {/* Duolingo style progress header */}
            <div className="flex items-center px-6 py-6 border-b border-slate-800">
              {profileStep > 1 ? (
                <button onClick={() => setProfileStep(profileStep - 1)} className="text-slate-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                </button>
              ) : (
                <button onClick={() => switchView('home')} className="text-slate-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
              
              <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-fuchsia-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(profileStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-x-hidden overflow-y-hidden">
              <div className="flex transition-transform duration-500 ease-in-out h-full" style={{ width: '300%', transform: profileStep === 1 ? 'translateX(0%)' : profileStep === 2 ? 'translateX(-33.333333%)' : 'translateX(-66.666667%)' }}>
                
                {/* --- STEP 1: Details --- */}
                <div className="w-1/3 flex-shrink-0 px-6 py-6 overflow-y-auto hide-scrollbar pb-32">
                  <h3 className="text-xl font-black text-white mb-6">Design PDF Header</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Jane Doe" 
                        value={profile.full_name}
                        onChange={(e: any) => setProfile({...profile, full_name: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="name@example.com" 
                        value={profile.email}
                        onChange={(e: any) => setProfile({...profile, email: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="(555) 123-4567" 
                        value={profile.phone}
                        onChange={(e: any) => setProfile({...profile, phone: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Brokerage</label>
                      <input 
                        type="text" 
                        placeholder="Luxury Real Estate Inc." 
                        value={profile.brokerage}
                        onChange={(e: any) => setProfile({...profile, brokerage: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                      />
                    </div>
                  </div>
                </div>

                {/* --- STEP 2: Branding & Selection --- */}
                <div className="w-1/3 flex-shrink-0 px-6 py-6 overflow-y-auto hide-scrollbar pb-32">
                  <h3 className="text-xl font-black text-white mb-6">Upload Your Pic and Logo</h3>

                  <div className="space-y-6">
                    {/* File Uploads */}
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-400 uppercase block mb-3 tracking-wider">Brokerage Logo</label>
                        <div className="flex flex-col gap-4">
                          {profile.logo_url && (
                            <img src={profile.logo_url} alt="Logo" className="h-16 w-auto object-contain bg-white p-2 rounded max-w-full" />
                          )}
                          <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl text-center transition inline-block w-full">
                            <span>{profile.logo_url ? 'Change File' : 'Choose File'}</span>
                            <input 
                              type="file" 
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleImageUpload(e, 'logo_url')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="border-t border-slate-700/50 pt-6">
                        <label className="text-sm font-bold text-slate-400 uppercase block mb-3 tracking-wider">Agent Headshot</label>
                        <div className="flex flex-col gap-4">
                          {profile.headshot_url && (
                            <img src={profile.headshot_url} alt="Headshot" className="w-20 h-20 rounded-full object-cover border-2 border-slate-600 self-center" />
                          )}
                          <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl text-center transition inline-block w-full">
                            <span>{profile.headshot_url ? 'Change File' : 'Choose File'}</span>
                            <input 
                              type="file" 
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleImageUpload(e, 'headshot_url')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      {uploading && <p className="text-sm text-fuchsia-400 font-bold animate-pulse text-center">Uploading asset...</p>}
                    </div>

                    {/* Big Headshot Toggle */}
                    <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-slate-600 transition">
                      <div>
                        <span className="block text-sm font-bold text-white">Show Headshot in PDFs</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 max-w-[200px]">Turn this off if you prefer the focus to be solely on your brokerage logo.</span>
                      </div>
                      <div className="relative flex-shrink-0 ml-4">
                        <input type="checkbox" className="sr-only" checked={profile.show_headshot} onChange={() => setProfile({...profile, show_headshot: !profile.show_headshot})} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${profile.show_headshot ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profile.show_headshot ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* --- STEP 3: Layout Selection --- */}
                <div className="w-1/3 flex-shrink-0 px-6 py-6 overflow-y-auto hide-scrollbar pb-32">
                  <h3 className="text-xl font-black text-white mb-6">Pick Your PDF Header Design</h3>

                  <div className="space-y-6">
                    {/* Choose PDF Layout */}
                    <div>
                      <div className="grid grid-cols-1 gap-4">
                        
                        {[
                          { id: 'look1', title: '1. Minimalist Core (Logo Hero)' },
                          { id: 'look5', title: '2. The Agency (Massive Center Logo)' },
                          { id: 'look3', title: '3. Coastal Elegance' },
                          { id: 'look9', title: '4. Warm Florida Sunset' },
                          { id: 'look2', title: '5. Obsidian Luxury Split' },
                          { id: 'look4', title: '6. Editorial Serif Arch' },
                          { id: 'look6', title: '7. Classic Executive Framed' },
                          { id: 'look7', title: '8. Vibrant Gradient Edge' },
                          { id: 'look8', title: '9. Stark Monochrome' },
                          { id: 'look10', title: '10. Glassmorphism Modern' }
                        ].map((look) => (
                          <div 
                            key={look.id}
                            onClick={() => savePdfLookSelection(look.id)}
                            className={`p-1 rounded-xl border cursor-pointer transition ${profile.pdf_look === look.id ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20' : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'}`}
                          >
                            <div className="bg-slate-900 rounded-lg p-2 text-[10px] font-bold tracking-wider uppercase text-slate-300 border-b border-slate-800 mb-2">
                              {look.title}
                            </div>
                            <div className="pointer-events-none transform scale-[0.95] origin-top">
                              {renderAgentHeader(look.id)}
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Static Action Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur border-t border-slate-800">
              <button 
                onClick={handleNextStep} 
                className={`w-full font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${profileStep === 1 && (!profile.full_name?.trim() || !profile.email?.trim()) ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : profileStep === 3 ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'}`}
              >
                {profileStep === 1 ? 'Continue to Brand Assets \u2192' : profileStep === 2 ? 'Continue to Layout \u2192' : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Save All Preferences
                  </>
                )}
              </button>
            </div>
          </div>

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

function EmailLoginWidget() {
  const [email, setEmail] = useState<string>('')
  const [sent, setSent] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  const handleSendMagicLink = async (e: any) => {
    e.preventDefault()
    setMessage('')
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { 
        shouldCreateUser: true,
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
      {!sent ? (
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Email Address</label>
            <input 
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg">
            Send Magic Link →
          </button>
        </form>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="text-4xl mb-2">✨</div>
          <h3 className="font-money text-3xl text-emerald-400 tracking-wide">Magic Link Sent!</h3>
          <p className="text-sm font-medium text-slate-300">Check your email inbox and click the link to log straight in.</p>
          <button 
            type="button" 
            onClick={() => { setSent(false); setEmail(''); setMessage(''); }}
            className="text-xs text-slate-400 hover:text-white underline pt-4 block mx-auto"
          >
            Use a different email
          </button>
        </div>
      )}

      {message && !sent && (
        <p className="text-xs text-center font-medium mt-4 text-rose-400">
          {message}
        </p>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a]" />}>
      <HomeContent />
    </Suspense>
  )
}