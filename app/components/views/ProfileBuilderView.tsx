'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { HeadshotCropper } from '@/app/components/HeadshotCropper'

interface ProfileBuilderViewProps {
  profileStep: number;
  setProfileStep: Dispatch<SetStateAction<number>>;
  profile: any;
  setProfile: Dispatch<SetStateAction<any>>;
  uploading: boolean;
  handleImageUpload: (source: File | React.ChangeEvent<HTMLInputElement>, fieldName: string, extra?: { headshot_shape?: 'square' | 'circle' }) => void;
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
  const [cropFile, setCropFile] = useState<File | null>(null)

  const toggleHeadshot = () => {
    const next = !profile.show_headshot
    setProfile({ ...profile, show_headshot: next })
    if (next && !profile.headshot_url) setProfileStep(3)
  }

  const toggleLogo = () => {
    const next = !profile.show_logo
    setProfile({ ...profile, show_logo: next })
    if (next && !profile.logo_url) setProfileStep(3)
  }

  const onHeadshotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setCropFile(file)
  }

  return (
    <div id="view-profile" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl h-[100dvh] z-50 flex flex-col">
      {cropFile && (
        <HeadshotCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(blob, shape) => {
            const cropped = new File([blob], 'headshot.jpg', { type: 'image/jpeg' })
            setCropFile(null)
            handleImageUpload(cropped, 'headshot_url', { headshot_shape: shape })
          }}
        />
      )}

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

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full" style={{ width: '300%', transform: profileStep === 1 ? 'translateX(0%)' : profileStep === 2 ? 'translateX(-33.333333%)' : 'translateX(-66.666667%)' }}>
            
            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Design Your PDF HEADER</h3>
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

            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Choose Your Header</h3>

            <div className="space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-4">
                <button type="button" onClick={toggleHeadshot} className="w-full flex items-center justify-between text-left">
                  <div>
                    <span className="block text-sm font-bold text-white">Show Profile Pic</span>
                    <span className="block text-xs text-slate-400 mt-0.5">Off until you turn it on</span>
                  </div>
                  <div className="relative flex-shrink-0 ml-4">
                    <div className={`block w-14 h-8 rounded-full transition-colors ${profile.show_headshot ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profile.show_headshot ? 'translate-x-6' : ''}`}></div>
                  </div>
                </button>
                
                <div className="h-px bg-slate-700 w-full"></div>
                
                <button type="button" onClick={toggleLogo} className="w-full flex items-center justify-between text-left">
                  <div>
                    <span className="block text-sm font-bold text-white">Show Brokerage Logo</span>
                    <span className="block text-xs text-slate-400 mt-0.5">Off until you turn it on</span>
                  </div>
                  <div className="relative flex-shrink-0 ml-4">
                    <div className={`block w-14 h-8 rounded-full transition-colors ${profile.show_logo ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profile.show_logo ? 'translate-x-6' : ''}`}></div>
                  </div>
                </button>
              </div>

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
                    { id: 'look10', title: '10. Glassmorphism Modern' },
                    { id: 'look11', title: '11. Indigo Edge (No Curve)' },
                    { id: 'look12', title: '12. Rose Pop Minimal' },
                    { id: 'look13', title: '13. Deep Emerald Card' },
                    { id: 'look14', title: '14. Architect Studio (Square Cut)' },
                    { id: 'look15', title: '15. Neon Tech Hub (Soft Square)' },
                    { id: 'look16', title: '16. Gold Standard Arch' },
                    { id: 'look17', title: '17. Cyan Studio Split' },
                    { id: 'look18', title: '18. Pastel Sunset Standard' },
                    { id: 'look19', title: '19. Brutalist Grid' },
                    { id: 'look20', title: '20. Dark Mode Spotlight' }
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

            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            <h3 className="text-xl font-black text-white mb-6">Upload Your Pic and Logo</h3>

            <div className="space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase block mb-3 tracking-wider">Agent Headshot</label>
                  <div className="flex flex-col gap-4">
                    {profile.headshot_url && (
                      <img
                        src={profile.headshot_url}
                        alt="Headshot"
                        className={`w-20 h-20 object-cover border-2 border-slate-600 self-center ${profile.headshot_shape === 'square' ? 'rounded-none' : 'rounded-full'}`}
                      />
                    )}
                    <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl text-center transition inline-block w-full">
                      <span>{profile.headshot_url ? 'Change File' : 'Choose File'}</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onHeadshotFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-6">
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
                  <label className="text-sm font-bold text-slate-400 uppercase block mb-1 tracking-wider"><span className="text-fuchsia-400">OPTIONAL:</span> Custom Canva Header</label>
                  <p className="text-xs text-slate-400 mb-3">Perfect size is 2550x600px. This custom design will only be used on printed PDFs, not the mobile link views.</p>
                  <div className="flex flex-col gap-4">
                    {profile.custom_header_url && (
                      <img src={profile.custom_header_url} alt="Custom Header" className="w-full h-auto object-cover bg-slate-900 border border-slate-700 rounded-md" />
                    )}
                    <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl text-center transition inline-block w-full">
                      <span>{profile.custom_header_url ? 'Change Canva Image' : 'Upload Canva Image'}</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageUpload(e, 'custom_header_url')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {uploading && <p className="text-sm text-fuchsia-400 font-bold animate-pulse text-center">Uploading asset...</p>}
              </div>
            </div>
          </div>

          </div>
      </div>

      <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
        <button 
          onClick={handleNextStep} 
          className={`w-full font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${profileStep === 1 && (!profile.full_name?.trim() || !profile.email?.trim()) ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : profileStep === 3 ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'}`}
        >
          {profileStep === 1 ? 'Continue to Header \u2192' : profileStep === 2 ? 'Continue to Uploads \u2192' : (
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
