'use client'

import { useState } from 'react'
import { ALAP_URL } from '@/lib/beallitasok'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mod, setMod] = useState<'belepes' | 'regisztracio' | 'elfelejtett'>('belepes')
  const [email, setEmail]           = useState('')
  const [jelszo, setJelszo]         = useState('')
  const [allapot, setAllapot]       = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hibaUzenet, setHibaUzenet] = useState('')
  const [jelszoLatszik, setJelszoLatszik] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')
    setHibaUzenet('')

    if (mod === 'elfelejtett') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: '${ALAP_URL}/auth/reset',
      })
      if (error) { setHibaUzenet(error.message); setAllapot('hiba') }
      else { setAllapot('siker') }
      return
    }

    if (mod === 'regisztracio') {
      const { error } = await supabase.auth.signUp({ email, password: jelszo })
      if (error) { setHibaUzenet(error.message); setAllapot('hiba') }
      else { setAllapot('siker') }
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password: jelszo })
      if (error) { setHibaUzenet('Incorrect email or password.'); setAllapot('hiba') }
      else {
        const { data: profil } = await supabase.from('profiles').select('szerepkor').eq('id', data.user.id).single()
        router.push(profil ? '/dashboard' : '/onboarding')
      }
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '8px',
    background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal)',
    color: 'var(--v-szoveg)', fontSize: '14px',
  }

  return (
    <main className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.015,
          backgroundImage: 'radial-gradient(circle, var(--v-szoveg) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--v-vonal)', backdropFilter: 'blur(8px)' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: 'var(--v-rozsa)' }}>Vip</span>
        </a>
        <a href="/aukciosHaz" className="text-sm transition" style={{ color: 'var(--v-szoveg-2)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}>
          Aukciós Ház →
        </a>
      </nav>

      {/* Center card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Header */}
          {mod === 'elfelejtett' ? (
            <div className="mb-8">
              <button onClick={() => { setMod('belepes'); setAllapot('idle') }}
                className="text-sm flex items-center gap-1 mb-6 transition" style={{ color: 'var(--v-szoveg-2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}>
                ← Vissza
              </button>
              <h1 className="text-2xl font-black mb-1" style={{ letterSpacing: '-0.03em' }}>Jelszó visszaállítása</h1>
              <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>Add meg az e-mail címed és küldünk egy linket.</p>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-6"
                style={{ color: 'var(--v-rozsa)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--v-rozsa)' }} />
                {mod === 'belepes' ? 'Üdv vissza' : 'Csatlakozz most'}
              </div>
              <h1 className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
                {mod === 'belepes' ? 'Jelentkezz be' : 'Hozz létre fiókot'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--v-szoveg-2)' }}>
                {mod === 'belepes'
                  ? 'Licitálj, adj el, keresj — minden egy helyen.'
                  : 'Ingyenes. 50 token welcome bonus az első 2000 usernek.'}
              </p>
            </div>
          )}

          {/* Tab switcher */}
          {mod !== 'elfelejtett' && (
            <div className="flex p-1 mb-6 rounded-lg" style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)' }}>
              {(['belepes', 'regisztracio'] as const).map(t => (
                <button key={t} onClick={() => { setMod(t); setAllapot('idle') }}
                  className="flex-1 py-2.5 rounded-md text-sm font-bold transition"
                  style={{
                    background: mod === t ? 'var(--v-rozsa)' : 'transparent',
                    color: mod === t ? '#fff' : 'var(--v-szoveg-2)',
                    boxShadow: mod === t ? '0 0 16px rgba(244,63,94,0.25)' : 'none',
                  }}>
                  {t === 'belepes' ? 'Bejelentkezés' : 'Regisztráció'}
                </button>
              ))}
            </div>
          )}

          {/* Success */}
          {allapot === 'siker' ? (
            <div className="px-6 py-8 text-center rounded-lg"
              style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <p className="font-black text-lg mb-2" style={{ color: 'var(--v-rozsa)' }}>Ellenőrizd az inboxod!</p>
              <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>
                Küldtünk egy linket ide: <span className="font-semibold" style={{ color: 'var(--v-szoveg)' }}>{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-mail cím" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />

              {mod !== 'elfelejtett' && (
                <div className="relative">
                  <input type={jelszoLatszik ? 'text' : 'password'} required minLength={6}
                    value={jelszo} onChange={e => setJelszo(e.target.value)}
                    placeholder="Jelszó (min. 6 karakter)"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
                  <button type="button" onClick={() => setJelszoLatszik(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm transition"
                    style={{ color: 'var(--v-szoveg-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-3)')}>
                    {jelszoLatszik ? '••' : '◎'}
                  </button>
                </div>
              )}

              {allapot === 'hiba' && (
                <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <p className="text-sm text-center" style={{ color: '#EF4444' }}>{hibaUzenet}</p>
                </div>
              )}

              <button type="submit" disabled={allapot === 'loading'}
                className="w-full py-3.5 rounded-lg font-black text-sm mt-1 transition"
                style={{ background: 'var(--v-rozsa)', color: '#fff', boxShadow: '0 0 24px rgba(244,63,94,0.2)',
                  opacity: allapot === 'loading' ? 0.6 : 1 }}
                onMouseEnter={e => { if (allapot !== 'loading') e.currentTarget.style.background = '#EF4444' }}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                {allapot === 'loading'
                  ? 'Feldolgozás...'
                  : mod === 'belepes' ? 'Bejelentkezés'
                  : mod === 'elfelejtett' ? 'Link küldése'
                  : 'Fiók létrehozása'}
              </button>

              {mod === 'belepes' && (
                <button type="button" onClick={() => { setMod('elfelejtett'); setAllapot('idle') }}
                  className="text-xs text-center py-1 transition" style={{ color: 'var(--v-szoveg-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-3)')}>
                  Elfelejtetted a jelszavad?
                </button>
              )}
            </form>
          )}

          {/* Footer trust */}
          <div className="mt-8 pt-6 flex items-center justify-center gap-3 text-xs" style={{ borderTop: '1px solid var(--v-vonal)', color: 'var(--v-szoveg-3)' }}>
            <span>Biztonságos</span>
            <span>·</span>
            <span>Email megerősítés</span>
            <span>·</span>
            <span>Escrow védelem</span>
          </div>
        </div>
      </div>
    </main>
  )
}
