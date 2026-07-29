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
  return (
    <section style={{ background: '#1A1217', border: '1px solid #2E2028', borderRadius: '8px', padding: '24px' }}
      className="flex flex-col gap-4">
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: '#5A4F4A' }}>{children}</h2>
}

function Row({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #2E2028' }}>
      <div>
        <p className="text-xs mb-0.5" style={{ color: '#5A4F4A' }}>{label}</p>
        <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{value}</p>
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
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#100C0F' }}>
      <p className="text-sm" style={{ color: '#5A4F4A' }}>Loading...</p>
    </main>
  )

  const inputStyle = {
    background: '#221820', border: '1px solid #2E2028', borderRadius: '8px',
    padding: '11px 16px', color: '#F5F0E8', width: '100%', fontSize: '14px',
  }

  return (
    <main className="min-h-screen" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2E2028' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </a>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#5A4F4A' }}>
          <a href="/dashboard" className="transition" style={{ color: '#9C8B7A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>Dashboard</a>
          <span>/</span>
          <span style={{ color: '#F5F0E8' }}>Beállítások</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Fiókbeállítások</h1>
          <p className="text-sm mt-1" style={{ color: '#9C8B7A' }}>Profilod, biztonságod és preferenciáid kezelése.</p>
        </div>

        {/* Profile */}
        <Card>
          <Label>Profile</Label>
          <Row label="Email" value={user?.email ?? ''} action={
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: '#5A4F4A', border: '1px solid #2E2028' }}>read-only</span>
          } />
          <Row label="Role" value={SZEREPKOR_LABEL[szerepkor ?? ''] ?? (szerepkor ?? '—')} action={
            <a href="/onboarding" className="text-xs transition" style={{ color: '#EAB308' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')}
              onMouseLeave={e => (e.currentTarget.style.color = '#EAB308')}>Change →</a>
          } />
          {(anonVevo || anonElado) && (
            <div className="pt-1">
              <p className="text-xs mb-2" style={{ color: '#5A4F4A' }}>Your anonymous names on BidVip</p>
              <div className="flex flex-col gap-1.5">
                {anonVevo && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(234,179,8,0.1)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.2)' }}>Buyer</span>
                    <span className="text-sm font-mono" style={{ color: '#F5F0E8' }}>{anonVevo}</span>
                  </div>
                )}
                {anonElado && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Seller</span>
                    <span className="text-sm font-mono" style={{ color: '#F5F0E8' }}>{anonElado}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] mt-2" style={{ color: '#5A4F4A' }}>Anonymous names protect your identity. They reset daily.</p>
            </div>
          )}
        </Card>

        {/* Tokens */}
        <Card>
          <Label>Token Balance</Label>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black tabular-nums" style={{ color: '#EAB308' }}>⚡ {tokenEgyenleg ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: '#9C8B7A' }}>tokens available for AI features</p>
            </div>
            <a href="/tokens" className="text-sm font-black px-5 py-2.5 rounded-lg transition"
              style={{ background: '#DC2626', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
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
              onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
            <input type="password" placeholder="Confirm new password" value={ujJelszoMegint}
              onChange={e => { setUjJelszoMegint(e.target.value); setJelszoAllapot('idle') }}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
            {jelszoAllapot === 'hiba' && <p className="text-xs" style={{ color: '#EF4444' }}>{jelszoHiba}</p>}
            {jelszoAllapot === 'ok' && <p className="text-xs font-bold" style={{ color: '#16A34A' }}>Password updated.</p>}
            <button type="submit" disabled={jelszoAllapot === 'loading' || !ujJelszo}
              className="text-sm font-bold py-3 rounded-lg transition"
              style={{ background: '#2E2028', color: '#F5F0E8', opacity: (jelszoAllapot === 'loading' || !ujJelszo) ? 0.4 : 1 }}
              onMouseEnter={e => { if (ujJelszo) e.currentTarget.style.background = '#3E3040' }}
              onMouseLeave={e => (e.currentTarget.style.background = '#2E2028')}>
              {jelszoAllapot === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Card>

        {/* Sign out */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#F5F0E8' }}>Sign Out</p>
              <p className="text-xs mt-0.5" style={{ color: '#9C8B7A' }}>You will be redirected to the homepage.</p>
            </div>
            <button onClick={kijelentkezes} className="text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              style={{ border: '1px solid #2E2028', color: '#9C8B7A' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3E3040'; e.currentTarget.style.color = '#F5F0E8' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2028'; e.currentTarget.style.color = '#9C8B7A' }}>
              Sign Out
            </button>
          </div>
        </Card>

        {/* Danger zone */}
        <section style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '24px' }}>
          <Label><span style={{ color: '#DC2626' }}>Danger Zone</span></Label>
          {!torlesAllapot ? (
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>Delete Account</p>
                <p className="text-xs mt-0.5" style={{ color: '#9C8B7A' }}>Permanently delete all your data. This cannot be undone.</p>
              </div>
              <button onClick={() => setTorlesAllapot(true)}
                className="text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                style={{ border: '1px solid rgba(220,38,38,0.4)', color: '#DC2626' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Delete
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              <p className="text-sm font-bold" style={{ color: '#DC2626' }}>Are you sure? This is permanent.</p>
              <div className="flex gap-3">
                <button onClick={() => setTorlesAllapot(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm transition"
                  style={{ border: '1px solid #2E2028', color: '#9C8B7A' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>Cancel</button>
                <a href="mailto:support@bidvip.com?subject=Account deletion request"
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-center transition"
                  style={{ background: '#DC2626', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
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
