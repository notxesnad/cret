'use client'
import { useState } from 'react'
import { supabase } from '@/utils/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState('request') // 'request' or 'verify'
  const [message, setMessage] = useState('')

  // 1. Send the OTP / Magic Link to Email
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: true, // Automatically registers new clients/agents on first login
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setStep('verify')
      setMessage('Check your email and click the link we sent.')
    }
  }

  // 2. Verify the 6-digit code entered by the user
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      setMessage(error.message)
    } else {
      window.location.href = '/' // Redirect to your app home/dashboard
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-white shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Sign In</h1>
        <p className="text-base text-slate-400 mt-1">We&apos;ll save your work. Enter your email, then click the link we send you.</p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
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
            Send Login Code →
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Enter 6-Digit Email Code</label>
            <input 
              type="text"
              placeholder="123456"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black tracking-widest text-center text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition shadow-lg">
            Verify & Sign In
          </button>
          <button 
            type="button" 
            onClick={() => setStep('request')}
            className="w-full text-xs text-slate-400 hover:text-white underline pt-2 text-center block"
          >
            Use a different email
          </button>
        </form>
      )}

      {message && (
        <p className={`text-xs text-center font-medium mt-4 ${message.includes('Check') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {message}
        </p>
      )}
    </div>
  )
}