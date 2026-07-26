'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mod, setMod] = useState<'belepes' | 'regisztracio' | 'elfelejtett'>('belepes')
  const [email, setEmail] = useState('')
  const [jelszo, setJelszo] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hibaUzenet, setHibaUzenet] = useState('')
  const [jelszoLatszik, setJelszoLatszik] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')
    setHibaUzenet('')

    if (mod === 'elfelejtett') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://bidvip.vercel.app/auth/reset',
      })
      if (error) {
        setHibaUzenet(error.message)
        setAllapot('hiba')
      } else {
        setAllapot('siker')
      }
      return
    }

    if (mod === 'regisztracio') {
      const { error } = await supabase.auth.signUp({ email, password: jelszo })
      if (error) {
        setHibaUzenet(error.message)
        setAllapot('hiba')
      } else {
        setAllapot('siker')
      }
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password: jelszo })
      if (error) {
        setHibaUzenet('Incorrect email or password.')
        setAllapot('hiba')
      } else {
        const { data: profil } = await supabase
          .from('profiles')
          .select('szerepkor')
          .eq('id', data.user.id)
          .single()

        if (!profil) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="flex items-center px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {mod !== 'elfelejtett' && (
            <div className="flex rounded-full bg-gray-800 p-1 mb-8">
              <button
                onClick={() => { setMod('belepes'); setAllapot('idle') }}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mod === 'belepes' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMod('regisztracio'); setAllapot('idle') }}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mod === 'regisztracio' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
              >
                Create Account
              </button>
            </div>
          )}
          {mod === 'elfelejtett' && (
            <div className="mb-8">
              <button onClick={() => { setMod('belepes'); setAllapot('idle') }} className="text-gray-400 text-sm hover:text-white transition">← Back to Sign In</button>
              <h2 className="text-xl font-bold mt-4 mb-1">Reset password</h2>
              <p className="text-gray-400 text-sm">Enter your email and we&apos;ll send a reset link.</p>
            </div>
          )}

          {allapot === 'siker' ? (
            <div className="bg-violet-900/40 border border-violet-700 rounded-2xl px-6 py-8 text-center">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-violet-300 font-semibold text-lg">Check your inbox!</p>
              <p className="text-gray-400 text-sm mt-2">We sent a confirmation link to <span className="text-white">{email}</span>.</p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="px-5 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              {mod !== 'elfelejtett' && (
                <div className="relative">
                  <input
                    type={jelszoLatszik ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={jelszo}
                    onChange={(e) => setJelszo(e.target.value)}
                    placeholder="Password (min. 6 characters)"
                    className="w-full px-5 py-3 pr-12 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setJelszoLatszik(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-sm"
                  >
                    {jelszoLatszik ? '🙈' : '👁️'}
                  </button>
                </div>
              )}
              {allapot === 'hiba' && (
                <p className="text-red-400 text-sm text-center">{hibaUzenet}</p>
              )}
              <button
                type="submit"
                disabled={allapot === 'loading'}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-3 rounded-full font-semibold"
              >
                {allapot === 'loading' ? 'Processing...' : mod === 'belepes' ? 'Sign In' : mod === 'elfelejtett' ? 'Send Reset Link' : 'Create Account'}
              </button>
              {mod === 'belepes' && (
                <button type="button" onClick={() => { setMod('elfelejtett'); setAllapot('idle') }} className="text-gray-500 text-sm hover:text-gray-300 transition text-center">
                  Forgot password?
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
