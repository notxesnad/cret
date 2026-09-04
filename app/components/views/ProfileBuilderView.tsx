'use client'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'
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
  handleNextStep: (nextStep?: 2 | 3) => void;
  handleFinalSave: (opts?: { silent?: boolean }) => void;
  switchView: (view: string) => void;
  nextStepBusy?: boolean;
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
  handleFinalSave,
  nextStepBusy
}: ProfileBuilderViewProps) {
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [lastLook, setLastLook] = useState(
    profile.pdf_look && profile.pdf_look !== 'custom' ? profile.pdf_look : 'look1'
  )

  useEffect(() => {
    if (profile.pdf_look && profile.pdf_look !== 'custom') {
      setLastLook(profile.pdf_look)
    }
  }, [profile.pdf_look])

  const customOn = profile.show_custom_header === true || profile.pdf_look === 'custom'

  const toggleHeadshot = () => {
    setProfile({ ...profile, show_headshot: !profile.show_headshot })
  }

  const toggleCustomHeader = () => {
    if (customOn) {
      setProfile({
        ...profile,
        show_custom_header: false,
        pdf_look: profile.pdf_look === 'custom' ? lastLook : profile.pdf_look,
      })
      return
    }
    setProfile({ ...profile, show_custom_header: true })
  }

  const pickLook = (lookId: string) => {
    setLastLook(lookId)
    savePdfLookSelection(lookId)
  }

  const onHeadshotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) {
      setCropSrc(null)
      setCropFile(file)
    }
  }

  const recropHeadshot = async () => {
    if (!profile.headshot_url) return
    try {
      const res = await fetch(profile.headshot_url)
      const blob = await res.blob()
      setCropSrc(null)
      setCropFile(new File([blob], 'headshot.jpg', { type: blob.type || 'image/jpeg' }))
    } catch {
      setCropFile(null)
      setCropSrc(profile.headshot_url)
    }
  }

  const closeCropper = () => {
    setCropFile(null)
    setCropSrc(null)
  }

  const picLabel = profile.headshot_url ? 'Change my Pic' : 'Add my Pic'
  const footerBtn = 'flex-1 font-black py-4 px-2 rounded-xl transition shadow-lg text-sm sm:text-base leading-tight'
  const footerSecondary = `${footerBtn} bg-white hover:bg-slate-100 text-slate-900`
  const footerPrimary = `${footerBtn} bg-fuchsia-500 hover:bg-fuchsia-400 text-white`

  return (
    <div id="view-profile" className="app-view active bg-slate-900 border-x border-slate-800 shadow-2xl overflow-hidden fixed top-0 left-0 right-0 mx-auto w-full max-w-xl md:max-w-3xl h-[100dvh] z-50 flex flex-col">
      {(cropFile || cropSrc) && (
        <HeadshotCropper
          key={cropFile ? `file-${cropFile.name}-${cropFile.size}` : cropSrc || 'crop'}
          file={cropFile}
          src={cropSrc || undefined}
          initialShape={profile.headshot_shape === 'circle' ? 'circle' : 'square'}
          onCancel={closeCropper}
          onConfirm={(blob, shape) => {
            const cropped = new File([blob], 'headshot.jpg', { type: 'image/jpeg' })
            closeCropper()
            handleImageUpload(cropped, 'headshot_url', { headshot_shape: shape })
          }}
        />
      )}

      <div className="flex-none h-[72px] flex items-center px-6 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
        <button
          type="button"
          onClick={() => handleFinalSave({ silent: true })}
          className="text-slate-400 hover:text-white transition"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <div className="flex-1 mx-4 bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-fuchsia-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(profileStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full" style={{ width: '300%', transform: profileStep === 1 ? 'translateX(0%)' : profileStep === 2 ? 'translateX(-33.333333%)' : 'translateX(-66.666667%)' }}>
            
            <div className="w-[33.333333%] flex-shrink-0 h-full overflow-y-auto hide-scrollbar">
            <div className="w-full pt-4 [&>*]:mb-0 [&>*]:overflow-visible">
              {renderAgentHeader(null)}
            </div>
            <div className="px-6 py-6">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Design your custom header</h3>
            <div className="space-y-4">
              <div>
                <label className="text-base font-bold text-slate-300 uppercase block mb-1 tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Jane Doe" 
                  value={profile.full_name}
                  onChange={(e: any) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                />
              </div>
              <div>
                <label className="text-base font-bold text-slate-300 uppercase block mb-1 tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={profile.email}
                  onChange={(e: any) => setProfile({...profile, email: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                />
              </div>
              <div>
                <label className="text-base font-bold text-slate-300 uppercase block mb-1 tracking-wider">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="(555) 123-4567" 
                  value={profile.phone}
                  onChange={(e: any) => setProfile({...profile, phone: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-500 transition-colors" 
                />
              </div>
              <div>
                <label className="text-base font-bold text-slate-300 uppercase block mb-1 tracking-wider">Brokerage</label>
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
          </div>

            <div className="w-[33.333333%] flex-shrink-0 px-6 py-6 h-full overflow-y-auto hide-scrollbar">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Choose Your Header</h3>

            <div className="space-y-6">
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
                      onClick={() => pickLook(look.id)}
                      className={`p-1 rounded-xl border cursor-pointer transition ${!customOn && profile.pdf_look === look.id ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20' : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'}`}
                    >
                      <div className="bg-slate-900 rounded-lg p-2 text-[10px] font-bold tracking-wider uppercase text-slate-300 border-b border-slate-800 mb-2">
                        {look.title}
                      </div>
                      <div className="pointer-events-none overflow-visible">
                        {renderAgentHeader(look.id)}
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </div>

            <div className="w-[33.333333%] flex-shrink-0 h-full overflow-y-auto hide-scrollbar">
            <div className="w-full pt-4 [&>*]:mb-0 [&>*]:overflow-visible">
              {renderAgentHeader(null)}
            </div>
            <div className="px-6 py-6">
            <h3 className="text-xl font-black text-white mb-6">Upload Your Pic and Logo</h3>

            <div className="space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Agent Headshot</label>
                    <button type="button" onClick={toggleHeadshot} className="flex items-center gap-3 text-left">
                      <span className="text-sm font-bold text-white">Show Pic</span>
                      <div className="relative flex-shrink-0">
                        <div className={`block w-14 h-8 rounded-full transition-colors ${profile.show_headshot ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profile.show_headshot ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {profile.headshot_url && (
                      <button
                        type="button"
                        onClick={recropHeadshot}
                        className={`relative w-20 h-20 self-center overflow-hidden cursor-pointer ${profile.headshot_shape === 'circle' ? 'rounded-full' : 'rounded-none'}`}
                        aria-label="Recrop photo"
                      >
                        <img
                          src={profile.headshot_url}
                          alt="Headshot"
                          className="w-20 h-20 object-cover border-2 border-slate-600"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 text-[9px] font-black uppercase tracking-wider text-white py-0.5">
                          Recrop
                        </span>
                      </button>
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
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Brokerage Logo</label>
                    <button type="button" onClick={toggleLogo} className="flex items-center gap-3 text-left">
                      <span className="text-sm font-bold text-white">Show Logo</span>
                      <div className="relative flex-shrink-0">
                        <div className={`block w-14 h-8 rounded-full transition-colors ${profile.show_logo ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${profile.show_logo ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Custom Canva Header</label>
                    <button
                      type="button"
                      onClick={toggleCustomHeader}
                      disabled={!profile.custom_header_url}
                      className="flex items-center gap-3 text-left disabled:opacity-40"
                    >
                      <span className="text-sm font-bold text-white">Use this</span>
                      <div className="relative flex-shrink-0">
                        <div className={`block w-14 h-8 rounded-full transition-colors ${customOn ? 'bg-emerald-500' : 'bg-slate-900 border border-slate-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${customOn ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </button>
                  </div>
                  <p className="text-base text-slate-400 mb-4">
                    Perfect size is 2550x555px.{' '}
                    <a
                      href="https://canva.link/6qinzbo6tjfwx10"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2 font-bold"
                    >
                      Open Canva template
                    </a>
                  </p>
                  <div className="flex flex-col gap-4">
                    {profile.custom_header_url && (
                      <img src={profile.custom_header_url} alt="Custom Header" className="w-full h-auto object-contain bg-slate-900 border border-slate-700 rounded-md" />
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
      </div>

      <div className="flex-none p-6 bg-slate-900 border-t border-slate-800 z-10 pb-safe">
        {profileStep === 1 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleNextStep(2)}
              disabled={nextStepBusy || !profile.full_name?.trim() || !profile.email?.trim()}
              aria-busy={nextStepBusy}
              className={`disabled:opacity-50 disabled:cursor-not-allowed ${footerSecondary}`}
            >
              {nextStepBusy ? 'One sec...' : 'Choose Header'}
            </button>
            <button
              type="button"
              onClick={() => handleNextStep(3)}
              disabled={nextStepBusy || !profile.full_name?.trim() || !profile.email?.trim()}
              aria-busy={nextStepBusy}
              className={`disabled:opacity-50 disabled:cursor-not-allowed ${footerPrimary}`}
            >
              {nextStepBusy ? 'One sec...' : picLabel}
            </button>
          </div>
        )}

        {profileStep === 2 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProfileStep(1)}
              className={footerSecondary}
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setProfileStep(3)}
              className={footerPrimary}
            >
              {picLabel}
            </button>
          </div>
        )}

        {profileStep === 3 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProfileStep(1)}
              className={footerSecondary}
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setProfileStep(2)}
              className={footerPrimary}
            >
              Choose Header
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
