'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [jelszo, setJelszo] = useState('')
  const [jelszo2, setJelszo2] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    if (jelszo !== jelszo2) { setHiba('Passwords do not match.'); setAllapot('hiba'); return }
    setAllapot('loading')
    const { error } = await supabase.auth.updateUser({ password: jelszo })
    if (error) { setHiba(error.message); setAllapot('hiba') }
    else { setAllapot('siker'); setTimeout(() => router.push('/dashboard'), 2000) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '8px',
    background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal)',
    color: 'var(--v-szoveg)', fontSize: '14px',
  }

  return (
    <main className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.015,
          backgroundImage: 'radial-gradient(circle, var(--v-szoveg) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <nav className="relative z-10 flex items-center px-8 py-5" style={{ borderBottom: '1px solid var(--v-vonal)', backdropFilter: 'blur(8px)' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: 'var(--v-rozsa)' }}>Vip</span>
        </a>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-6"
              style={{ color: 'var(--v-rozsa)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--v-rozsa)' }} />
              Új jelszó
            </div>
            <h1 className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Jelszó visszaállítása</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--v-szoveg-2)' }}>Válassz egy új jelszót a fiókodhoz.</p>
          </div>

          {allapot === 'siker' ? (
            <div className="px-6 py-8 text-center rounded-lg"
              style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <p className="font-black text-lg mb-2" style={{ color: '#22C55E' }}>Jelszó frissítve!</p>
              <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>Visszairányítás a dashboardra...</p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-3">
              <input type="password" required minLength={6} value={jelszo}
                onChange={e => setJelszo(e.target.value)}
                placeholder="Új jelszó (min. 6 karakter)"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
              <input type="password" required minLength={6} value={jelszo2}
                onChange={e => setJelszo2(e.target.value)}
                placeholder="Jelszó megerősítése"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
              {allapot === 'hiba' && (
                <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <p className="text-sm text-center" style={{ color: '#EF4444' }}>{hiba}</p>
                </div>
              )}
              <button type="submit" disabled={allapot === 'loading'}
                className="w-full py-3.5 rounded-lg font-black text-sm mt-1 transition"
                style={{ background: 'var(--v-rozsa)', color: '#fff', boxShadow: '0 0 24px rgba(244,63,94,0.2)', opacity: allapot === 'loading' ? 0.6 : 1 }}
                onMouseEnter={e => { if (allapot !== 'loading') e.currentTarget.style.background = '#EF4444' }}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                {allapot === 'loading' ? 'Mentés...' : 'Új jelszó beállítása'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
