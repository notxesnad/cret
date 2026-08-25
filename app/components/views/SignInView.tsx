import { useState } from 'react'
import { supabase, markAuthSessionOnly, markAuthPersistPending, setAwaitingMagicLink } from '@/utils/supabase'
import { registerWithoutVerify } from '@/app/actions/auth'

export function SignInView({ onExistingUserSent }: { onExistingUserSent?: (email: string, firstName: string) => void }) {
  const [email, setEmail] = useState<string>('')
  const [sent, setSent] = useState<boolean>(false)
  const [welcome, setWelcome] = useState<boolean>(false)
  const [welcomeName, setWelcomeName] = useState<string>('')
  const [message, setMessage] = useState<string>('')

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const result = await registerWithoutVerify(email)
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
  }

  return (
    <div id="view-signin" className="app-view active">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
        {welcome ? (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl mb-2">✨</div>
            <h3 className="text-2xl font-black text-white">Welcome to CoolRealEstateTools</h3>
            <p className="text-base font-medium text-slate-300">We created your account.</p>
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg">
              Continue
            </button>
          </form>
        ) : (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl mb-2">✨</div>
            <h3 className="font-money text-3xl text-emerald-400 tracking-wide">
              Welcome back{welcomeName ? ` ${welcomeName}` : ''}
            </h3>
            <p className="text-base font-medium text-slate-300">Simply click the link we just emailed you to get signed in.</p>
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
