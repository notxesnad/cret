import { useState } from 'react'
import { supabase, markAuthSessionOnly, markAuthPersistPending, setAwaitingMagicLink } from '@/utils/supabase'
import { registerWithoutVerify } from '@/app/actions/auth'

export function SignInView({ onExistingUserSent }: { onExistingUserSent?: (email: string, firstName: string) => void }) {
  const [email, setEmail] = useState<string>('')
  const [sent, setSent] = useState<boolean>(false)
  const [welcome, setWelcome] = useState<boolean>(false)
  const [welcomeName, setWelcomeName] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setMessage('')
    setLoading(true)

    try {
    const result = await registerWithoutVerify(email, typeof window !== 'undefined' ? window.location.origin : undefined)
    if (result.error) {
      setMessage(result.error)
      return
    }

    if (result.exists) {
      markAuthPersistPending()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
        }
      })
      if (error) {
        setMessage(error.message)
        return
      }
      const firstName = result.firstName || ''
      setAwaitingMagicLink({ email, firstName })
      setWelcomeName(firstName)
      setSent(true)
      onExistingUserSent?.(email, firstName)
      return
    }

    if (!result.password) {
      setMessage('Could not create your account.')
      return
    }

    markAuthSessionOnly()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: result.password
    })
    if (signInError) {
      setMessage(signInError.message)
      return
    }
    setWelcome(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="view-signin" className="app-view active">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
        {welcome ? (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-base font-bold text-white">Welcome to</p>
            <p className="text-lg font-bold tracking-widest text-white uppercase">
              Cool<span className="text-emerald-400">RealEstate</span>Tools
            </p>
            <p className="text-base font-bold text-white">We created your account.</p>
            <p className="text-sm text-slate-400">
              (Play around for now, but we will need you to eventually click the verification email sent to {email || 'your email'})
            </p>
          </div>
        ) : !sent ? (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white mb-2">Sign In or Register</h2>
              <p className="text-base text-slate-400">Enter your email. We&apos;ll save your work. If you&apos;re new, we create your account right away.</p>
            </div>
            <div>
              <label className="text-base font-bold text-slate-300 uppercase block mb-1">Email Address</label>
              <input 
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={`w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-150 ${loading ? 'cursor-wait scale-[0.98] brightness-95' : 'hover:bg-emerald-400 active:scale-[0.97] active:brightness-95'}`}
            >
              {loading ? (
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
        ) : (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl mb-2">✨</div>
            <h3 className="font-money text-3xl text-emerald-400 tracking-wide">
              Welcome back{welcomeName ? ` ${welcomeName}` : ''}
            </h3>
            <div className="space-y-2">
              <p className="text-base font-medium text-slate-300">Click the link we sent to {email || 'your email'}.</p>
              <p className="text-base font-medium text-slate-300">You&apos;ll stay logged in on this device.</p>
              <p className="text-sm font-normal text-slate-500">(We know it&apos;s a pain in the butt, but it&apos;s easier than remembering a password)</p>
            </div>
          </div>
        )}

        {message && !sent && !welcome && (
          <p className="text-xs text-center font-medium mt-4 text-rose-400">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
