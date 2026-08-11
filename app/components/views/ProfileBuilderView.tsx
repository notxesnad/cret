import { Dispatch, SetStateAction } from 'react'

interface ProfileBuilderViewProps {
  profileStep: number;
  setProfileStep: Dispatch<SetStateAction<number>>;
  profile: any;
  setProfile: Dispatch<SetStateAction<any>>;
  uploading: boolean;
  handleImageUpload: (e: any, fieldName: string) => void;
  savePdfLookSelection: (lookKey: string) => void;
  renderAgentHeader: (themeOverride: string | null) => React.ReactNode;
  handleNextStep: () => void;
  switchView: (view: string) => void;
}

export function ProfileBuilderView({
  profileStep,
  setProfileStep,
  profile,
  setProfile,
  uploading,
  handleImageUpload,
  savePdfLookSelection,
  renderAgentHeader,
  handleNextStep,
  switchView
}: ProfileBuilderViewProps) {
  return (
    <div id="view-profile" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50">
      
      {/* Duolingo style progress header */}
      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
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
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full" style={{ width: '300%', transform: profileStep === 1 ? 'translateX(0%)' : profileStep === 2 ? 'translateX(-33.333333%)' : 'translateX(-66.666667%)' }}>
            
            {/* --- STEP 1: Details --- */}
            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-32">
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
            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-32">
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
            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar pb-32">
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
      <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
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
  )
}
