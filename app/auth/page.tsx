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
    <main className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <a href="/marketplace" className="text-sm text-gray-500 hover:text-gray-300 transition">
          Aukciós Ház →
        </a>
      </nav>

      {/* Center card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Header */}
          {mod === 'elfelejtett' ? (
            <div className="mb-8">
              <button
                onClick={() => { setMod('belepes'); setAllapot('idle') }}
                className="text-gray-500 text-sm hover:text-gray-300 transition mb-6 flex items-center gap-1"
              >
                ← Vissza
              </button>
              <h1 className="text-2xl font-bold mb-1">Jelszó visszaállítása</h1>
              <p className="text-gray-500 text-sm">Add meg az e-mail címed és küldünk egy linket.</p>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-violet-400 uppercase bg-violet-950/50 border border-violet-800/40 px-4 py-2 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                {mod === 'belepes' ? 'Üdv vissza' : 'Csatlakozz most'}
              </div>
              <h1 className="text-2xl font-bold">
                {mod === 'belepes' ? 'Jelentkezz be' : 'Hozz létre fiókot'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {mod === 'belepes'
                  ? 'Licitálj, adj el, keresj — minden egy helyen.'
                  : 'Ingyenes. 50 token welcome bonus az első 2000 usernek.'}
              </p>
            </div>
          )}

          {/* Tab switcher */}
          {mod !== 'elfelejtett' && (
            <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setMod('belepes'); setAllapot('idle') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  mod === 'belepes'
                    ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.3)]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Bejelentkezés
              </button>
              <button
                onClick={() => { setMod('regisztracio'); setAllapot('idle') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  mod === 'regisztracio'
                    ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.3)]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Regisztráció
              </button>
            </div>
          )}

          {/* Success state */}
          {allapot === 'siker' ? (
            <div className="bg-violet-950/40 border border-violet-700/50 rounded-2xl px-6 py-8 text-center">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-violet-300 font-bold text-lg">Ellenőrizd az inboxod!</p>
              <p className="text-gray-400 text-sm mt-2">
                Küldtünk egy linket ide: <span className="text-white font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail cím"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition text-sm"
                />
              </div>

              {mod !== 'elfelejtett' && (
                <div className="relative">
                  <input
                    type={jelszoLatszik ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={jelszo}
                    onChange={(e) => setJelszo(e.target.value)}
                    placeholder="Jelszó (min. 6 karakter)"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setJelszoLatszik(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition text-sm"
                  >
                    {jelszoLatszik ? '🙈' : '👁️'}
                  </button>
                </div>
              )}

              {allapot === 'hiba' && (
                <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm text-center">{hibaUzenet}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={allapot === 'loading'}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition py-3.5 rounded-xl font-semibold text-sm shadow-[0_0_24px_rgba(124,58,237,0.2)] hover:shadow-[0_0_32px_rgba(124,58,237,0.35)] mt-1"
              >
                {allapot === 'loading'
                  ? 'Feldolgozás...'
                  : mod === 'belepes'
                  ? 'Bejelentkezés'
                  : mod === 'elfelejtett'
                  ? 'Visszaállító link küldése'
                  : 'Fiók létrehozása'}
              </button>

              {mod === 'belepes' && (
                <button
                  type="button"
                  onClick={() => { setMod('elfelejtett'); setAllapot('idle') }}
                  className="text-gray-600 text-xs hover:text-gray-400 transition text-center py-1"
                >
                  Elfelejtetted a jelszavad?
                </button>
              )}
            </form>
          )}

          {/* Footer trust */}
          <div className="mt-8 pt-6 border-t border-gray-800/60 flex items-center justify-center gap-4 text-xs text-gray-700">
            <span>🔐 Biztonságos</span>
            <span>·</span>
            <span>📧 Megerősítés email-ben</span>
            <span>·</span>
            <span>🛡️ Escrow védelem</span>
          </div>
        </div>
      </div>
    </main>
  )
}
