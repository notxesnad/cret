import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export function SignInView() {
  const [email, setEmail] = useState<string>('')
  const [sent, setSent] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  const handleSendMagicLink = async (e: React.FormEvent) => {
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
    <div id="view-signin" className="app-view active">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
        {!sent ? (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Email Address</label>
              <input 
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
    </div>
  )
}
