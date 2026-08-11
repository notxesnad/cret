import { useState } from 'react'

export function OpenHouseView({ listings }: { listings: any[] }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const submitOpenHouse = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  const resetOpenHouse = () => {
    setName('')
    setPhone('')
    setIsSubmitted(false)
  }

  return (
    <div id="view-openhouse" className="app-view active bg-indigo-900/60 border border-indigo-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl text-center space-y-5">
      {!isSubmitted ? (
        <div id="oh-form-container">
          <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase font-openhouse">Open House Things</span>
          
          {listings.length > 0 ? (
            <div className="relative mt-2 mb-4 text-left">
              <select className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-indigo-400 transition-colors appearance-none cursor-pointer">
                {listings.map(listing => (
                  <option key={listing.id} value={listing.id}>{listing.address}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-black mt-2">123 Ocean Drive</h1>
          )}

          <p className="text-xs text-indigo-200 mt-1 mb-4">Sign in to instantly receive the brochure &amp; floor plan.</p>
          <form onSubmit={submitOpenHouse} className="space-y-4 text-left">
            <input 
              type="text" 
              placeholder="Your Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors" 
            />
            <input 
              type="tel" 
              placeholder="Cell Phone Number" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required 
              className="w-full bg-indigo-950/80 border border-indigo-700/50 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors" 
            />
            <button type="submit" className="w-full bg-white hover:bg-indigo-50 text-indigo-900 font-black py-4 rounded-xl transition shadow-lg mt-2">
              Sign In &amp; Get Info
            </button>
          </form>
        </div>
      ) : (
        <div id="oh-success" className="py-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-white mb-2">You&apos;re on the list!</h2>
          <p className="text-sm text-indigo-200">The property details have been texted to you.</p>
          <button onClick={resetOpenHouse} className="mt-8 text-xs font-bold text-indigo-300 hover:text-white underline">
            Next Guest
          </button>
        </div>
      )}
    </div>
  )
}
