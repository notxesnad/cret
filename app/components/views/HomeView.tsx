import { useState, useEffect } from 'react'

export function HomeView({ switchView, showCustomModal }: { switchView: (view: string) => void, showCustomModal: (msg: string, requireAuth?: boolean) => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt for Android/Chrome
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      setDeferredPrompt(null)
    } else {
      // For iOS Safari or if already installed
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      if (isIOS) {
        showCustomModal("To install this app on your iPhone: Tap the 'Share' icon at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.")
      } else {
        showCustomModal("It looks like the app is already installed or your browser doesn't support automatic installation. You can usually install it from your browser's menu (look for 'Install app' or 'Add to Home screen').")
      }
    }
  }

  return (
    <div id="view-home" className="app-view active space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Tap a Tool. Get to Work.</h1>
        <p className="text-base text-slate-400 mt-1">$29 a month. All tools included. Cancel <a href="/cancel" className="text-blue-400 hover:underline">here</a> anytime.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-20">
        <div onClick={() => switchView('profile')} className="group relative bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">👤</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Brand your tools &amp; PDF styles</span>
          <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Make My Profile</h2>
        </div>

        <div onClick={() => switchView('seller')} className="group relative bg-amber-100 hover:bg-white text-slate-900 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">✨</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Net Sheets & Instant Reports</span>
          <h2 className="font-seller text-3xl md:text-4xl mt-1">Make My Seller Happy</h2>
        </div>

        <div onClick={() => switchView('driving')} className="group relative bg-rose-600 hover:bg-rose-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:translate-x-2">🚗</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Tour Itineraries & Routing</span>
          <h2 className="font-driving text-xl md:text-2xl mt-1">Driving to a Million Places</h2>
        </div>

        <div onClick={() => switchView('openhouse')} className="group relative bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🏡</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">iPad Sign-In & Text-Back</span>
          <h2 className="font-openhouse text-2xl md:text-3xl tracking-wide mt-1">Open House Tools</h2>
        </div>

        <div onClick={() => switchView('outreach')} className="group relative bg-sky-100 hover:bg-white text-slate-900 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer border-2 border-transparent hover:border-sky-300">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🤝</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Collect Advice & Feedback</span>
          <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Ask for Advice</h2>
        </div>

        <div onClick={() => switchView('money')} className="group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:rotate-12">💵</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Calculator Suite</span>
          <h2 className="font-money text-3xl md:text-4xl tracking-wide uppercase mt-1">Money Stuff</h2>
        </div>

        <div onClick={() => switchView('buyer')} className="group relative bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🧭</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Comparison Cards & Ratings</span>
          <h2 className="font-buyer text-2xl md:text-3xl tracking-tight mt-1">Confused Buyer Tools</h2>
        </div>

        <div onClick={() => switchView('sellercall')} className="group relative bg-orange-500 hover:bg-orange-400 text-slate-950 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🚨</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Instant Prep Sheet</span>
          <h2 className="font-sellercall text-2xl md:text-3xl mt-1 leading-tight">Crap my seller is calling in 5 minutes</h2>
        </div>

        <div onClick={handleInstallClick} className="group relative bg-slate-800 hover:bg-slate-700 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer border-2 border-slate-700 hover:border-slate-600">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">📱</div>
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase opacity-90">Progressive Web App</span>
          <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Install to Phone</h2>
        </div>

        <a
          href="mailto:hello@coolrealestatetools.com?subject=Tool%20Idea%20or%20Help"
          className="group relative bg-slate-900 hover:bg-slate-800 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer border-2 border-slate-700 hover:border-fuchsia-400"
        >
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">💡</div>
          <span className="text-xs font-bold tracking-wider uppercase text-fuchsia-400 opacity-90">Support</span>
          <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Got a Tool Idea or Need Help</h2>
        </a>

        <div onClick={() => switchView('neighborhoods')} className="group relative bg-fuchsia-100 hover:bg-white text-slate-900 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer border-2 border-transparent hover:border-fuchsia-300">
          <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🏡</div>
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">AI Data & Quizzes</span>
          <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Learn My Market</h2>
        </div>
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
  )
}
