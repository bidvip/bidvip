'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = email ? email[0].toUpperCase() : '?'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition"
        style={{ border: '1px solid #2E2028', background: '#1A1217' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#3E3040')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2E2028')}>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ background: '#DC2626' }}>{initials}</span>
        <span className="text-sm max-w-[120px] truncate hidden sm:block" style={{ color: '#9C8B7A' }}>{email}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#5A4F4A' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-2xl overflow-hidden z-50"
          style={{ background: '#1A1217', border: '1px solid #2E2028' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #2E2028' }}>
            <p className="text-[11px]" style={{ color: '#5A4F4A' }}>Signed in as</p>
            <p className="text-xs font-medium truncate mt-0.5" style={{ color: '#F5F0E8' }}>{email}</p>
          </div>
          <div className="py-1">
            <a href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition"
              style={{ color: '#9C8B7A' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#221820'; e.currentTarget.style.color = '#F5F0E8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9C8B7A' }}>
              Settings
            </a>
          </div>
          <div className="py-1" style={{ borderTop: '1px solid #2E2028' }}>
            <button onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition"
              style={{ color: '#DC2626' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#221820')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, val, color }: { label: string; val: number; color?: string }) {
  const [hover, setHover] = useState(false)
  return (
    <div className="rounded-lg p-5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#221820' : '#1A1217',
        border: `1px solid ${hover && color ? color + '55' : color ? color + '33' : hover ? '#3E3040' : '#2E2028'}`,
        boxShadow: hover && color ? `0 8px 24px rgba(0,0,0,0.3), 0 0 20px ${color}18` : hover ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#5A4F4A' }}>{label}</p>
      <p className="text-3xl font-black tabular-nums" style={{ color: color ?? '#F5F0E8' }}>{val}</p>
    </div>
  )
}

function StatusBadge({ statusz }: { statusz: string }) {
  const map: Record<string, { text: string; color: string; bg: string }> = {
    aktiv:          { text: 'Élő',           color: '#22C55E', bg: 'rgba(22,163,74,0.12)' },
    elutasitva:     { text: 'Elutasítva',    color: '#EF4444', bg: 'rgba(220,38,38,0.1)' },
    lezart:         { text: 'Lezárt',        color: '#5A4F4A', bg: '#221820' },
    draft:          { text: 'Vázlat',        color: '#EAB308', bg: 'rgba(234,179,8,0.08)' },
    felulvizsgalat: { text: 'Felülvizsgálat', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    varakozas:      { text: 'Várakozás',     color: '#9C8B7A', bg: '#221820' },
  }
  const s = map[statusz] ?? { text: statusz, color: '#9C8B7A', bg: '#221820' }
  return (
    <span className="text-xs px-2.5 py-1 rounded font-bold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}>
      {statusz === 'aktiv' && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ background: '#22C55E' }} />}
      {s.text}
    </span>
  )
}

export default function Dashboard() {
  const [user, setUser]             = useState<User | null>(null)
  const [szerepkor, setSzerepkor]   = useState<string | null>(null)
  const [sajatProjektek, setSajatProjektek] = useState<any[]>([])
  const [sajatLicitek, setSajatLicitek]     = useState<any[]>([])
  const [tokenEgyenleg, setTokenEgyenleg]   = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)
  const [ujrakuldes, setUjrakuldes] = useState<string | null>(null)
  const [topBids, setTopBids]       = useState<Record<string, number>>({})
  const [projektLicitek, setProjektLicitek] = useState<Record<string, { top: number; db: number }>>({})
  const [boostAktiv, setBoostAktiv]       = useState<string | null>(null)
  const [boostTokenek, setBoostTokenek]   = useState('5')
  const [boostLoading, setBoostLoading]   = useState(false)
  const [boostUzenet, setBoostUzenet]     = useState('')
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function betolt() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)

      const { data: profil } = await supabase.from('profiles').select('szerepkor').eq('id', u.id).single()
      if (!profil) { router.push('/onboarding'); return }
      setSzerepkor(profil.szerepkor)

      if (profil.szerepkor === 'elado' || profil.szerepkor === 'mindketto') {
        const { data: projektek } = await supabase.from('projektek').select('*').eq('user_id', u.id).order('letrehozva', { ascending: false })
        setSajatProjektek(projektek || [])
        const elado_idk = (projektek || []).filter(p => p.statusz === 'aktiv').map((p: any) => p.id)
        if (elado_idk.length > 0) {
          const { data: pLicitek } = await supabase.from('licitek').select('projekt_id, osszeg').in('projekt_id', elado_idk)
          const pMap: Record<string, { top: number; db: number }> = {}
          for (const b of pLicitek || []) {
            if (!pMap[b.projekt_id]) pMap[b.projekt_id] = { top: 0, db: 0 }
            pMap[b.projekt_id].db++
            if (b.osszeg > pMap[b.projekt_id].top) pMap[b.projekt_id].top = b.osszeg
          }
          setProjektLicitek(pMap)
        }
      }
      if (profil.szerepkor === 'vevo' || profil.szerepkor === 'mindketto') {
        const { data: licitek } = await supabase.from('licitek').select('*, projektek(nev, kikialtasi_ar, badge, statusz)').eq('user_id', u.id).order('letrehozva', { ascending: false })
        setSajatLicitek(licitek || [])
        const projektIdk = (licitek || []).map((l: any) => l.projekt_id)
        if (projektIdk.length > 0) {
          const { data: osszes } = await supabase.from('licitek').select('projekt_id, osszeg').in('projekt_id', projektIdk).order('osszeg', { ascending: false })
          const topMap: Record<string, number> = {}
          for (const b of osszes || []) { if (!topMap[b.projekt_id]) topMap[b.projekt_id] = b.osszeg }
          setTopBids(topMap)
        }
      }
      const { data: tokenData } = await supabase.from('tokenek').select('egyenleg').eq('user_id', u.id).single()
      setTokenEgyenleg(tokenData?.egyenleg ?? 0)
      setLoading(false)
    }
    betolt()
  }, [])

  async function ujraBekuldes(projekt_id: string) {
    if (!user) return
    setUjrakuldes(projekt_id)
    const res = await fetch('/api/project/resubmit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projekt_id, user_id: user.id }) })
    if (res.ok) setSajatProjektek(prev => prev.map(p => p.id === projekt_id ? { ...p, statusz: 'felulvizsgalat' } : p))
    setUjrakuldes(null)
  }

  async function boostBekuldes(projekt_id: string) {
    if (!user) return
    const amount = parseInt(boostTokenek)
    if (!amount || amount < 1) return
    setBoostLoading(true); setBoostUzenet('')
    const res  = await fetch('/api/queue/boost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projekt_id, user_id: user.id, token_amount: amount }) })
    const data = await res.json()
    if (res.ok) {
      setBoostUzenet(`#${data.position} in queue`)
      setSajatProjektek(prev => prev.map(p => p.id === projekt_id ? { ...p, priority_tokens: data.priority_tokens } : p))
      setTokenEgyenleg(prev => prev !== null ? prev - amount : null)
      setTimeout(() => { setBoostAktiv(null); setBoostUzenet('') }, 2500)
    } else { setBoostUzenet(data.error || 'Failed') }
    setBoostLoading(false)
  }

  async function kilepes() { await supabase.auth.signOut(); router.push('/') }

  const skeletonRow = (
    <div className="rounded-lg p-5 flex items-center justify-between" style={{ background: '#1A1217', border: '1px solid #2E2028' }}>
      <div>
        <div className="h-4 w-40 rounded mb-2 animate-pulse" style={{ background: '#2E2028' }} />
        <div className="h-3 w-56 rounded animate-pulse" style={{ background: '#221820' }} />
      </div>
      <div className="h-6 w-16 rounded animate-pulse" style={{ background: '#2E2028' }} />
    </div>
  )

  if (loading) return (
    <main className="min-h-screen" style={{ background: '#100C0F' }}>
      <nav className="flex items-center px-8 py-4" style={{ borderBottom: '1px solid #2E2028' }}>
        <span className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Bid<span style={{ color: '#DC2626' }}>Vip</span></span>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="h-8 w-64 rounded mb-3 animate-pulse" style={{ background: '#1A1217' }} />
        <div className="h-4 w-80 rounded mb-10 animate-pulse" style={{ background: '#1A1217' }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg p-5 animate-pulse" style={{ background: '#1A1217', border: '1px solid #2E2028' }}>
              <div className="h-3 w-16 rounded mb-3" style={{ background: '#2E2028' }} />
              <div className="h-8 w-10 rounded" style={{ background: '#2E2028' }} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">{skeletonRow}{skeletonRow}{skeletonRow}</div>
      </div>
    </main>
  )

  const roleLabel = szerepkor === 'elado' ? 'Seller' : szerepkor === 'mindketto' ? 'Seller & Buyer' : 'Buyer'

  return (
    <main className="min-h-screen" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      <nav className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid #2E2028' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="/marketplace" className="text-sm px-3 py-2 rounded-lg transition" style={{ color: '#9C8B7A' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.background = '#1A1217' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9C8B7A'; e.currentTarget.style.background = 'transparent' }}>
            Aukciós Ház
          </a>
          <a href="/tokens" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-bold transition"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#EAB308' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,179,8,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(234,179,8,0.08)')}>
            <span>⚡</span><span>{tokenEgyenleg ?? '...'}</span>
          </a>
          <UserMenu email={user?.email ?? ''} onSignOut={kilepes} />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-black" style={{ letterSpacing: '-0.03em' }}>
            Welcome, <span style={{ color: '#EAB308' }}>{user?.email?.split('@')[0]}</span>!
          </h1>
          <span className="text-xs font-bold px-3 py-1 rounded"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>
            {roleLabel}
          </span>
        </div>
        <p className="mb-10 text-sm" style={{ color: '#9C8B7A' }}>
          {szerepkor === 'elado' ? 'Manage your listings and track incoming bids.' :
           szerepkor === 'mindketto' ? 'Manage listings and track bids in one place.' :
           'Track your bids and purchase winning projects.'}
        </p>

        {/* ── SELLER ── */}
        {(szerepkor === 'elado' || szerepkor === 'mindketto') && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <StatCard label="Összes" val={sajatProjektek.filter(p => p.statusz !== 'draft').length} />
              <StatCard label="Élő" val={sajatProjektek.filter(p => p.statusz === 'aktiv').length} color="#22C55E" />
              <StatCard label="Felülvizsgálat" val={sajatProjektek.filter(p => p.statusz === 'felulvizsgalat').length} color="#F97316" />
              <StatCard label="Lezárt" val={sajatProjektek.filter(p => p.statusz === 'lezart').length} />
            </div>

            {sajatProjektek.length === 0 ? (
              <div className="rounded-lg p-10 flex flex-col items-center text-center"
                style={{ background: '#1A1217', border: '1px dashed #3E3040' }}>
                <h2 className="text-xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>List your first project</h2>
                <p className="text-sm mb-6 max-w-sm" style={{ color: '#9C8B7A' }}>Sell an idea, prototype, or proven project — the market decides what it&apos;s worth.</p>
                <a href="/submit" className="text-sm font-black px-6 py-3 rounded-lg transition"
                  style={{ background: '#DC2626', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                  + List a Project
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black" style={{ letterSpacing: '-0.02em' }}>My Projects</h2>
                  <a href="/submit" className="text-sm font-bold px-4 py-2 rounded-lg transition"
                    style={{ background: '#DC2626', color: '#fff' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                    + New
                  </a>
                </div>
                {sajatProjektek.map(p => (
                  <div key={p.id} className="rounded-lg p-5 flex items-center justify-between gap-4 transition"
                    style={{ background: '#1A1217', border: `1px solid ${p.statusz === 'aktiv' ? 'rgba(22,163,74,0.25)' : p.statusz === 'elutasitva' ? 'rgba(220,38,38,0.2)' : '#2E2028'}` }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = p.statusz === 'aktiv' ? 'rgba(22,163,74,0.4)' : '#3E3040')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = p.statusz === 'aktiv' ? 'rgba(22,163,74,0.25)' : p.statusz === 'elutasitva' ? 'rgba(220,38,38,0.2)' : '#2E2028')}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {p.statusz === 'aktiv' && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: '#22C55E' }} />}
                        <p className="font-semibold truncate" style={{ color: '#F5F0E8' }}>{p.nev}</p>
                      </div>
                      <p className="text-sm truncate" style={{ color: '#9C8B7A' }}>{p.rovid_leiras}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {p.statusz === 'aktiv' && projektLicitek[p.id]?.db > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#5A4F4A' }}>Top bid</p>
                          <p className="text-sm font-bold" style={{ color: '#22C55E' }}>€{projektLicitek[p.id].top.toLocaleString()}</p>
                          <p className="text-[10px]" style={{ color: '#5A4F4A' }}>{projektLicitek[p.id].db} licit</p>
                        </div>
                      )}
                      <StatusBadge statusz={p.statusz} />
                      {p.statusz !== 'draft' && (
                        <span className="font-bold tabular-nums" style={{ color: '#EAB308' }}>€{p.kikialtasi_ar.toLocaleString()}</span>
                      )}
                      {p.statusz === 'elutasitva' && (
                        <button onClick={() => ujraBekuldes(p.id)} disabled={ujrakuldes === p.id}
                          className="text-xs px-3 py-1 rounded transition"
                          style={{ border: '1px solid rgba(220,38,38,0.4)', color: '#DC2626' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {ujrakuldes === p.id ? '...' : 'Resubmit'}
                        </button>
                      )}
                      {p.statusz === 'varakozas' && (
                        boostAktiv === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input type="number" min={1} max={tokenEgyenleg ?? 999} value={boostTokenek}
                              onChange={e => setBoostTokenek(e.target.value)}
                              className="w-14 text-xs px-2 py-1 rounded text-center"
                              style={{ background: '#221820', border: '1px solid rgba(234,179,8,0.4)', color: '#F5F0E8' }} />
                            <span className="text-xs" style={{ color: '#EAB308' }}>⚡</span>
                            <button onClick={() => boostBekuldes(p.id)} disabled={boostLoading}
                              className="text-xs px-2 py-1 rounded font-bold text-white transition"
                              style={{ background: '#EAB308', opacity: boostLoading ? 0.6 : 1 }}>
                              {boostLoading ? '...' : 'Boost'}
                            </button>
                            <button onClick={() => { setBoostAktiv(null); setBoostUzenet('') }}
                              className="text-xs" style={{ color: '#5A4F4A' }}>✕</button>
                            {boostUzenet && <span className="text-xs" style={{ color: '#22C55E' }}>{boostUzenet}</span>}
                          </div>
                        ) : (
                          <button onClick={() => { setBoostAktiv(p.id); setBoostTokenek('5') }}
                            className="text-xs px-2.5 py-1 rounded flex items-center gap-1 transition"
                            style={{ border: '1px solid rgba(234,179,8,0.3)', color: '#EAB308' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,179,8,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            ⚡ Boost{p.priority_tokens > 0 ? ` (${p.priority_tokens})` : ''}
                          </button>
                        )
                      )}
                      {p.statusz === 'draft' ? (
                        <a href={`/submit?draft=${p.id}`} className="text-xs font-bold px-3 py-1 rounded transition"
                          style={{ background: '#DC2626', color: '#fff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                          Continue →
                        </a>
                      ) : (
                        <a href={`/project/${p.id}`} className="text-sm transition" style={{ color: '#9C8B7A' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>View →</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BUYER ── */}
        {(szerepkor === 'vevo' || szerepkor === 'mindketto') && (
          <div className={szerepkor === 'mindketto' ? 'mt-14 pt-12' : ''} style={szerepkor === 'mindketto' ? { borderTop: '1px solid #2E2028' } : {}}>
            {szerepkor === 'mindketto' && <h2 className="text-2xl font-black mb-8" style={{ letterSpacing: '-0.02em' }}>My Bids</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
              <StatCard label="Leadott licitek" val={sajatLicitek.length} />
              <StatCard label="Nyerő licitek" color="#22C55E"
                val={sajatLicitek.filter((l: any) => topBids[l.projekt_id] != null && l.osszeg >= topBids[l.projekt_id] && l.projektek?.statusz !== 'lezart').length} />
              <div className="rounded-lg p-5 flex flex-col justify-between"
                style={{ background: '#1A1217', border: '1px solid #2E2028' }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#5A4F4A' }}>Aukciós Ház</p>
                <a href="/marketplace" className="text-sm font-bold transition" style={{ color: '#EAB308' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#EAB308')}>
                  Megnyitás →
                </a>
              </div>
            </div>

            {sajatLicitek.length === 0 ? (
              <div className="rounded-lg p-10 flex flex-col items-center text-center"
                style={{ background: '#1A1217', border: '1px dashed #3E3040' }}>
                <h2 className="text-xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>No bids yet</h2>
                <p className="text-sm mb-6" style={{ color: '#9C8B7A' }}>Böngéssz az Aukciós Házban és add be az első ajánlatod!</p>
                <a href="/marketplace" className="text-sm font-black px-6 py-3 rounded-lg transition"
                  style={{ background: '#DC2626', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                  Aukciós Ház →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {szerepkor === 'vevo' && <h2 className="text-xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>My Bids</h2>}
                {sajatLicitek.map((l: any) => {
                  const top = topBids[l.projekt_id]
                  const winning = top != null && l.osszeg >= top
                  const lezart = l.projektek?.statusz === 'lezart'
                  return (
                    <div key={l.id} className="rounded-lg p-5 flex items-center justify-between gap-4"
                      style={{ background: '#1A1217', border: `1px solid ${winning && !lezart ? 'rgba(22,163,74,0.25)' : '#2E2028'}` }}>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold" style={{ color: '#F5F0E8' }}>{l.projektek?.nev}</p>
                          {lezart
                            ? winning
                              ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(234,179,8,0.1)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.2)' }}>Won</span>
                              : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#221820', color: '#5A4F4A' }}>Ended</span>
                            : winning
                              ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(22,163,74,0.1)', color: '#22C55E', border: '1px solid rgba(22,163,74,0.2)' }}>Winning</span>
                              : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(220,38,38,0.08)', color: '#EF4444', border: '1px solid rgba(220,38,38,0.2)' }}>Outbid</span>
                          }
                        </div>
                        <p className="text-sm" style={{ color: '#9C8B7A' }}>
                          My bid: <span className="font-bold" style={{ color: '#EAB308' }}>€{l.osszeg.toLocaleString()}</span>
                          {!winning && top && <span className="ml-1" style={{ color: '#5A4F4A' }}>· Top: €{top.toLocaleString()}</span>}
                        </p>
                      </div>
                      <a href={`/project/${l.projekt_id}`} className="text-sm shrink-0 transition" style={{ color: '#9C8B7A' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>View →</a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
