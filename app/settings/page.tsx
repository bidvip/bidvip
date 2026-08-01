'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const SZEREPKOR_LABEL: Record<string, string> = {
  elado: 'Seller',
  vevo: 'Buyer',
  mindketto: 'Buyer & Seller',
}

function Card({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState(false)
  return (
    <section
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1E1419' : 'var(--v-bg-2)',
        border: `1px solid ${hover ? 'var(--v-vonal-2)' : 'var(--v-vonal)'}`,
        borderRadius: '8px', padding: '24px',
        boxShadow: hover ? '0 8px 32px rgba(0,0,0,0.25)' : 'none',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'all 0.2s ease',
      }}
      className="flex flex-col gap-4">
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--v-szoveg-3)' }}>{children}</h2>
}

function Row({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--v-vonal)' }}>
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--v-szoveg-3)' }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--v-szoveg)' }}>{value}</p>
      </div>
      {action}
    </div>
  )
}

export default function Settings() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser]               = useState<User | null>(null)
  const [szerepkor, setSzerepkor]     = useState<string | null>(null)
  const [tokenEgyenleg, setTokenEgyenleg] = useState<number | null>(null)
  const [anonVevo, setAnonVevo]       = useState<string | null>(null)
  const [anonElado, setAnonElado]     = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)

  const [ujJelszo, setUjJelszo]           = useState('')
  const [ujJelszoMegint, setUjJelszoMegint] = useState('')
  const [jelszoAllapot, setJelszoAllapot] = useState<'idle' | 'loading' | 'ok' | 'hiba'>('idle')
  const [jelszoHiba, setJelszoHiba]       = useState('')
  const [torlesAllapot, setTorlesAllapot] = useState(false)

  useEffect(() => {
    async function betolt() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)

      const [{ data: profil }, { data: tokenek }, { data: anonok }] = await Promise.all([
        supabase.from('profiles').select('szerepkor').eq('id', u.id).single(),
        supabase.from('tokenek').select('egyenleg').eq('user_id', u.id).single(),
        supabase.from('anon_nevek').select('nev, szerepkor').eq('user_id', u.id),
      ])

      setSzerepkor(profil?.szerepkor ?? null)
      setTokenEgyenleg(tokenek?.egyenleg ?? 0)
      const vevo = anonok?.find((a: any) => a.szerepkor === 'vevo')
      const elado = anonok?.find((a: any) => a.szerepkor === 'elado')
      setAnonVevo(vevo?.nev ?? null)
      setAnonElado(elado?.nev ?? null)
      setLoading(false)
    }
    betolt()
  }, [])

  async function jelszoValtoztat(e: React.FormEvent) {
    e.preventDefault()
    if (ujJelszo !== ujJelszoMegint) { setJelszoHiba('Passwords do not match.'); setJelszoAllapot('hiba'); return }
    if (ujJelszo.length < 8) { setJelszoHiba('Minimum 8 characters.'); setJelszoAllapot('hiba'); return }
    setJelszoAllapot('loading')
    const { error } = await supabase.auth.updateUser({ password: ujJelszo })
    if (error) { setJelszoHiba(error.message); setJelszoAllapot('hiba') }
    else { setJelszoAllapot('ok'); setUjJelszo(''); setUjJelszoMegint('') }
  }

  async function kijelentkezes() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--v-bg)' }}>
      <p className="text-sm" style={{ color: 'var(--v-szoveg-3)' }}>Loading...</p>
    </main>
  )

  const inputStyle = {
    background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal)', borderRadius: '8px',
    padding: '11px 16px', color: 'var(--v-szoveg)', width: '100%', fontSize: '14px',
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/3 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.012, backgroundImage: 'radial-gradient(circle, var(--v-szoveg) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--v-vonal)', backdropFilter: 'blur(8px)' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: 'var(--v-rozsa)' }}>Vip</span>
        </a>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--v-szoveg-3)' }}>
          <a href="/dashboard" className="transition" style={{ color: 'var(--v-szoveg-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}>Dashboard</a>
          <span>/</span>
          <span style={{ color: 'var(--v-szoveg)' }}>Beállítások</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Fiókbeállítások</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--v-szoveg-2)' }}>Profilod, biztonságod és preferenciáid kezelése.</p>
        </div>

        {/* Profile */}
        <Card>
          <Label>Profile</Label>
          <Row label="Email" value={user?.email ?? ''} action={
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: 'var(--v-szoveg-3)', border: '1px solid var(--v-vonal)' }}>read-only</span>
          } />
          <Row label="Role" value={SZEREPKOR_LABEL[szerepkor ?? ''] ?? (szerepkor ?? '—')} action={
            <a href="/onboarding" className="text-xs transition" style={{ color: 'var(--v-arany)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-arany)')}>Change →</a>
          } />
          {(anonVevo || anonElado) && (
            <div className="pt-1">
              <p className="text-xs mb-2" style={{ color: 'var(--v-szoveg-3)' }}>Your anonymous names on BidVip</p>
              <div className="flex flex-col gap-1.5">
                {anonVevo && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--v-arany)', border: '1px solid rgba(251,191,36,0.2)' }}>Buyer</span>
                    <span className="text-sm font-mono" style={{ color: 'var(--v-szoveg)' }}>{anonVevo}</span>
                  </div>
                )}
                {anonElado && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Seller</span>
                    <span className="text-sm font-mono" style={{ color: 'var(--v-szoveg)' }}>{anonElado}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--v-szoveg-3)' }}>Anonymous names protect your identity. They reset daily.</p>
            </div>
          )}
        </Card>

        {/* Tokens */}
        <Card>
          <Label>Token Balance</Label>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--v-arany)' }}>⚡ {tokenEgyenleg ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--v-szoveg-2)' }}>tokens available for AI features</p>
            </div>
            <a href="/tokens" className="text-sm font-black px-5 py-2.5 rounded-lg transition"
              style={{ background: 'var(--v-rozsa)', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
              Buy Tokens →
            </a>
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <Label>Change Password</Label>
          <form onSubmit={jelszoValtoztat} className="flex flex-col gap-2.5">
            <input type="password" placeholder="New password" value={ujJelszo}
              onChange={e => { setUjJelszo(e.target.value); setJelszoAllapot('idle') }}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
            <input type="password" placeholder="Confirm new password" value={ujJelszoMegint}
              onChange={e => { setUjJelszoMegint(e.target.value); setJelszoAllapot('idle') }}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
            {jelszoAllapot === 'hiba' && <p className="text-xs" style={{ color: '#EF4444' }}>{jelszoHiba}</p>}
            {jelszoAllapot === 'ok' && <p className="text-xs font-bold" style={{ color: '#16A34A' }}>Password updated.</p>}
            <button type="submit" disabled={jelszoAllapot === 'loading' || !ujJelszo}
              className="text-sm font-bold py-3 rounded-lg transition"
              style={{ background: 'var(--v-vonal)', color: 'var(--v-szoveg)', opacity: (jelszoAllapot === 'loading' || !ujJelszo) ? 0.4 : 1 }}
              onMouseEnter={e => { if (ujJelszo) e.currentTarget.style.background = 'var(--v-vonal-2)' }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-vonal)')}>
              {jelszoAllapot === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Card>

        {/* Sign out */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--v-szoveg)' }}>Sign Out</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--v-szoveg-2)' }}>You will be redirected to the homepage.</p>
            </div>
            <button onClick={kijelentkezes} className="text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              style={{ border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg-2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v-vonal-2)'; e.currentTarget.style.color = 'var(--v-szoveg)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-vonal)'; e.currentTarget.style.color = 'var(--v-szoveg-2)' }}>
              Sign Out
            </button>
          </div>
        </Card>

        {/* Danger zone */}
        <section style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '24px' }}>
          <Label><span style={{ color: 'var(--v-rozsa)' }}>Danger Zone</span></Label>
          {!torlesAllapot ? (
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--v-szoveg)' }}>Delete Account</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--v-szoveg-2)' }}>Permanently delete all your data. This cannot be undone.</p>
              </div>
              <button onClick={() => setTorlesAllapot(true)}
                className="text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                style={{ border: '1px solid rgba(244,63,94,0.4)', color: 'var(--v-rozsa)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Delete
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              <p className="text-sm font-bold" style={{ color: 'var(--v-rozsa)' }}>Are you sure? This is permanent.</p>
              <div className="flex gap-3">
                <button onClick={() => setTorlesAllapot(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm transition"
                  style={{ border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg-2)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}>Cancel</button>
                <a href="mailto:support@bidvip.com?subject=Account deletion request"
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-center transition"
                  style={{ background: 'var(--v-rozsa)', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                  Contact Support →
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
