'use client'

import { useState } from 'react'
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
        redirectTo: 'https://bidvip.vercel.app/auth/reset',
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
    background: '#221820', border: '1px solid #2E2028',
    color: '#F5F0E8', fontSize: '14px',
  }

  return (
    <main className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.015,
          backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2E2028' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </a>
        <a href="/marketplace" className="text-sm transition" style={{ color: '#9C8B7A' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>
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
                className="text-sm flex items-center gap-1 mb-6 transition" style={{ color: '#9C8B7A' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>
                ← Vissza
              </button>
              <h1 className="text-2xl font-black mb-1" style={{ letterSpacing: '-0.03em' }}>Jelszó visszaállítása</h1>
              <p className="text-sm" style={{ color: '#9C8B7A' }}>Add meg az e-mail címed és küldünk egy linket.</p>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-6"
                style={{ color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
                {mod === 'belepes' ? 'Üdv vissza' : 'Csatlakozz most'}
              </div>
              <h1 className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
                {mod === 'belepes' ? 'Jelentkezz be' : 'Hozz létre fiókot'}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#9C8B7A' }}>
                {mod === 'belepes'
                  ? 'Licitálj, adj el, keresj — minden egy helyen.'
                  : 'Ingyenes. 50 token welcome bonus az első 2000 usernek.'}
              </p>
            </div>
          )}

          {/* Tab switcher */}
          {mod !== 'elfelejtett' && (
            <div className="flex p-1 mb-6 rounded-lg" style={{ background: '#1A1217', border: '1px solid #2E2028' }}>
              {(['belepes', 'regisztracio'] as const).map(t => (
                <button key={t} onClick={() => { setMod(t); setAllapot('idle') }}
                  className="flex-1 py-2.5 rounded-md text-sm font-bold transition"
                  style={{
                    background: mod === t ? '#DC2626' : 'transparent',
                    color: mod === t ? '#fff' : '#9C8B7A',
                    boxShadow: mod === t ? '0 0 16px rgba(220,38,38,0.25)' : 'none',
                  }}>
                  {t === 'belepes' ? 'Bejelentkezés' : 'Regisztráció'}
                </button>
              ))}
            </div>
          )}

          {/* Success */}
          {allapot === 'siker' ? (
            <div className="px-6 py-8 text-center rounded-lg"
              style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <p className="font-black text-lg mb-2" style={{ color: '#DC2626' }}>Ellenőrizd az inboxod!</p>
              <p className="text-sm" style={{ color: '#9C8B7A' }}>
                Küldtünk egy linket ide: <span className="font-semibold" style={{ color: '#F5F0E8' }}>{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-mail cím" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />

              {mod !== 'elfelejtett' && (
                <div className="relative">
                  <input type={jelszoLatszik ? 'text' : 'password'} required minLength={6}
                    value={jelszo} onChange={e => setJelszo(e.target.value)}
                    placeholder="Jelszó (min. 6 karakter)"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
                  <button type="button" onClick={() => setJelszoLatszik(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm transition"
                    style={{ color: '#5A4F4A' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#9C8B7A')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5A4F4A')}>
                    {jelszoLatszik ? '••' : '◎'}
                  </button>
                </div>
              )}

              {allapot === 'hiba' && (
                <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <p className="text-sm text-center" style={{ color: '#EF4444' }}>{hibaUzenet}</p>
                </div>
              )}

              <button type="submit" disabled={allapot === 'loading'}
                className="w-full py-3.5 rounded-lg font-black text-sm mt-1 transition"
                style={{ background: '#DC2626', color: '#fff', boxShadow: '0 0 24px rgba(220,38,38,0.2)',
                  opacity: allapot === 'loading' ? 0.6 : 1 }}
                onMouseEnter={e => { if (allapot !== 'loading') e.currentTarget.style.background = '#EF4444' }}
                onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                {allapot === 'loading'
                  ? 'Feldolgozás...'
                  : mod === 'belepes' ? 'Bejelentkezés'
                  : mod === 'elfelejtett' ? 'Link küldése'
                  : 'Fiók létrehozása'}
              </button>

              {mod === 'belepes' && (
                <button type="button" onClick={() => { setMod('elfelejtett'); setAllapot('idle') }}
                  className="text-xs text-center py-1 transition" style={{ color: '#5A4F4A' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9C8B7A')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5A4F4A')}>
                  Elfelejtetted a jelszavad?
                </button>
              )}
            </form>
          )}

          {/* Footer trust */}
          <div className="mt-8 pt-6 flex items-center justify-center gap-3 text-xs" style={{ borderTop: '1px solid #2E2028', color: '#5A4F4A' }}>
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
