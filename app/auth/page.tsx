'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mod, setMod] = useState<'belepes' | 'regisztracio'>('belepes')
  const [email, setEmail] = useState('')
  const [jelszo, setJelszo] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hibaUzenet, setHibaUzenet] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')
    setHibaUzenet('')

    if (mod === 'regisztracio') {
      const { error } = await supabase.auth.signUp({ email, password: jelszo })
      if (error) {
        setHibaUzenet(error.message)
        setAllapot('hiba')
      } else {
        setAllapot('siker')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: jelszo })
      if (error) {
        setHibaUzenet('Hibás email vagy jelszó.')
        setAllapot('hiba')
      } else {
        router.push('/dashboard')
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
          <div className="flex rounded-full bg-gray-800 p-1 mb-8">
            <button
              onClick={() => { setMod('belepes'); setAllapot('idle') }}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mod === 'belepes' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              Belépés
            </button>
            <button
              onClick={() => { setMod('regisztracio'); setAllapot('idle') }}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mod === 'regisztracio' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              Regisztráció
            </button>
          </div>

          {allapot === 'siker' ? (
            <div className="bg-violet-900/40 border border-violet-700 rounded-2xl px-6 py-8 text-center">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-violet-300 font-semibold text-lg">Erősítsd meg az emailt!</p>
              <p className="text-gray-400 text-sm mt-2">Küldtünk egy megerősítő linket a(z) <span className="text-white">{email}</span> címre.</p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email cím"
                className="px-5 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="password"
                required
                minLength={6}
                value={jelszo}
                onChange={(e) => setJelszo(e.target.value)}
                placeholder="Jelszó (min. 6 karakter)"
                className="px-5 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              {allapot === 'hiba' && (
                <p className="text-red-400 text-sm text-center">{hibaUzenet}</p>
              )}
              <button
                type="submit"
                disabled={allapot === 'loading'}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-3 rounded-full font-semibold"
              >
                {allapot === 'loading' ? 'Feldolgozás...' : mod === 'belepes' ? 'Belépés' : 'Regisztráció'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
