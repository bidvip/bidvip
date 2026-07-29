'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const SAV_INFO = {
  fast:     { label: 'FAST',     slogan: '⚡ CHANNEL 01', tagline: 'Fast Deals · Live Now',        perc: 3,  color: '#22C55E', glow: '0 0 24px #22C55E44', bg: '#22C55E11' },
  standard: { label: 'STANDARD', slogan: '📡 CHANNEL 02', tagline: 'Prime Time · Bid To Win',      perc: 5,  color: '#EAB308', glow: '0 0 24px #EAB30844', bg: '#EAB30811' },
  premium:  { label: 'PREMIUM',  slogan: '🏆 CHANNEL 03', tagline: 'High Value · Serious Buyers',  perc: 20, color: '#DC2626', glow: '0 0 24px #DC262644', bg: '#DC262611' },
}

const badge_info: Record<string, { label: string; color: string }> = {
  idea:      { label: 'Concept',   color: '#22C55E' },
  prototype: { label: 'Prototype', color: '#EAB308' },
  proven:    { label: 'Proven',    color: '#DC2626' },
}

type Projekt = {
  id: string; nev: string; rovid_leiras: string; kategoria: string
  badge: string; kikialtasi_ar: number; lejarat: string | null
  sav: string; priority_tokens: number
}

type Licit = { id: string; osszeg: number; user_id: string; anon_nev: string | null }

function minIncrement(ar: number): number {
  if (ar < 500)   return 25
  if (ar < 2000)  return 50
  if (ar < 10000) return 100
  return 250
}

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    if (!target) return
    const update = () => setDiff(Math.max(0, new Date(target).getTime() - Date.now()))
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [target])
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const label = h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return { label, done: diff === 0, diff }
}

function TvPanel({ projekt, sav, slot, onKattint, topLicit, bidderCount }: {
  projekt: Projekt | null; sav: keyof typeof SAV_INFO; slot: number
  onKattint: (p: Projekt) => void; topLicit?: number; bidderCount?: number
}) {
  const info = SAV_INFO[sav]
  const countdown = useCountdown(projekt?.lejarat ?? null)
  const isLive   = !!projekt && !countdown.done
  const isUrgent = isLive && countdown.diff < 60000
  const [copied, setCopied] = useState(false)

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    if (!projekt) return
    navigator.clipboard.writeText(`${window.location.origin}/project/${projekt.id}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div onClick={() => projekt && onKattint(projekt)}
      style={{
        background: '#1A1217',
        border: `1px solid ${isUrgent ? '#DC262699' : isLive ? `${info.color}55` : '#2E2028'}`,
        boxShadow: isUrgent ? '0 0 28px rgba(220,38,38,0.18)' : isLive ? info.glow : 'none',
        animation: isUrgent ? 'urgentPulse 1s ease-in-out infinite' : 'none',
        cursor: projekt ? 'pointer' : 'default',
        borderRadius: '8px', overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      className="relative flex flex-col group hover:scale-[1.015] transition-transform">
      {isLive && <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
        style={{ background: 'repeating-linear-gradient(0deg, #F5F0E8 0px, #F5F0E8 1px, transparent 1px, transparent 3px)' }} />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: isLive ? info.bg : '#100C0F', borderBottom: '1px solid #2E2028' }}>
        <div className="flex items-center gap-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: info.color }} />}
          <span className="text-[10px] font-black tracking-widest" style={{ color: info.color }}>{info.label}</span>
          {isLive && <span className="text-[10px] font-black px-1 rounded" style={{ background: '#DC2626', color: '#fff' }}>LIVE</span>}
        </div>
        <div className="flex items-center gap-2">
          {projekt && (
            <button onClick={handleShare} title="Copy link"
              className="text-[10px] font-bold transition"
              style={{ color: copied ? '#22C55E' : '#5A4F4A' }}>
              {copied ? '✓' : '🔗'}
            </button>
          )}
          <span className="text-[10px] font-mono" style={{ color: '#3E3040' }}>#{slot}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col min-h-[200px]">
        {projekt ? (
          <>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: badge_info[projekt.badge]?.color, background: `${badge_info[projekt.badge]?.color}1a` }}>
                {badge_info[projekt.badge]?.label ?? projekt.badge}
              </span>
              <span className="text-[10px]" style={{ color: '#5A4F4A' }}>{projekt.kategoria}</span>
            </div>

            <h3 className="font-bold text-sm mb-1 leading-snug line-clamp-2" style={{ color: '#F5F0E8' }}>{projekt.nev}</h3>
            <p className="text-xs line-clamp-2 flex-1" style={{ color: '#9C8B7A' }}>{projekt.rovid_leiras}</p>

            <div className="mt-3 pt-3 flex items-end justify-between" style={{ borderTop: '1px solid #2E2028' }}>
              <div>
                <p className="text-[10px] mb-0.5" style={{ color: '#5A4F4A' }}>{topLicit ? 'Current bid' : 'Starting price'}</p>
                <p className="text-lg font-black tabular-nums" style={{ color: info.color }}>
                  €{(topLicit ?? projekt.kikialtasi_ar).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] mb-0.5" style={{ color: '#5A4F4A' }}>Time left</p>
                <p className={`text-lg font-mono font-black ${isUrgent ? 'animate-pulse' : ''}`}
                  style={{ color: countdown.done ? '#EF4444' : isUrgent ? '#DC2626' : '#F5F0E8' }}>
                  {countdown.label}
                </p>
              </div>
            </div>

            {bidderCount != null && bidderCount > 0 && (
              <p className="mt-2 text-[10px] text-center" style={{ color: '#5A4F4A' }}>
                {bidderCount} {bidderCount === 1 ? 'bidder' : 'bidders'}
              </p>
            )}
            <div className="mt-2 text-center text-[11px] font-black py-1.5 rounded opacity-0 group-hover:opacity-100 transition"
              style={{ background: info.color, color: info.color === '#EAB308' ? '#100C0F' : '#fff' }}>
              Click to Bid →
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-2xl mb-2" style={{ opacity: 0.15 }}>◻</p>
            <p className="text-xs" style={{ color: '#3E3040' }}>Empty slot</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BidModal({ projekt, user, onZar }: { projekt: Projekt; user: User | null; onZar: () => void }) {
  const router   = useRouter()
  const supabase = createClient()
  const info     = SAV_INFO[projekt.sav as keyof typeof SAV_INFO]
  const countdown = useCountdown(projekt.lejarat)

  const [licitek, setLicitek]     = useState<Licit[]>([])
  const [licitOsszeg, setLicitOsszeg] = useState('')
  const [allapot, setAllapot]     = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba]           = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.from('licitek').select('*').eq('projekt_id', projekt.id).order('osszeg', { ascending: false })
      .then(({ data }) => { setLicitek(data || []); setLoading(false) })
    const channel = supabase.channel(`modal-licitek-${projekt.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'licitek', filter: `projekt_id=eq.${projekt.id}` }, (payload) => {
        setLicitek(prev => [payload.new as Licit, ...prev.filter(l => l.id !== (payload.new as Licit).id)].sort((a, b) => b.osszeg - a.osszeg))
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projekt.id])

  const legmagasabb  = licitek[0]?.osszeg || projekt.kikialtasi_ar
  const increment    = minIncrement(legmagasabb)
  const minimumLicit = legmagasabb + increment
  const modalUrgent  = countdown.diff > 0 && countdown.diff < 60000
  const auctionEnded = countdown.done && !!projekt.lejarat
  const isSeller     = user?.id === (projekt as any).user_id

  async function licitBeküldes(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    const osszeg = parseInt(licitOsszeg)
    if (!osszeg || osszeg < minimumLicit) { setHiba(`Minimum: €${minimumLicit.toLocaleString()} (+€${increment})`); setAllapot('hiba'); return }
    setAllapot('loading'); setHiba('')
    const res  = await fetch('/api/bid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projekt_id: projekt.id, user_id: user.id, osszeg, proxy_max: null }) })
    const data = await res.json()
    if (!res.ok) { setHiba((data.error || 'Something went wrong.') + (data.debug ? ` [${data.debug}]` : '')); setAllapot('hiba') }
    else {
      setAllapot('siker'); setLicitOsszeg('')
      const { data: fresh } = await supabase.from('licitek').select('*').eq('projekt_id', projekt.id).order('osszeg', { ascending: false })
      if (fresh) setLicitek(fresh)
      setTimeout(() => setAllapot('idle'), 2500)
    }
  }

  const bdgColor = badge_info[projekt.badge]?.color ?? '#9C8B7A'
  const isDark = info?.color === '#EAB308'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onZar() }}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onZar} />
      <div className="relative w-full max-w-md rounded-lg overflow-hidden"
        style={{ background: '#1A1217', border: `1px solid ${info?.color}44`, boxShadow: `0 0 50px ${info?.color}22` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: `linear-gradient(to right, ${info?.color}18, transparent)`, borderBottom: '1px solid #2E2028' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: info?.color }} />
            <span className="text-xs font-black tracking-widest" style={{ color: info?.color }}>LIVE AUCTION</span>
          </div>
          <button onClick={onZar} className="text-lg leading-none transition" style={{ color: '#5A4F4A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5A4F4A')}>✕</button>
        </div>

        {/* Project info */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #2E2028' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ color: bdgColor, background: `${bdgColor}1a` }}>
              {badge_info[projekt.badge]?.label ?? projekt.badge}
            </span>
            <span className="text-[10px]" style={{ color: '#5A4F4A' }}>{projekt.kategoria}</span>
          </div>
          <h2 className="font-black text-xl leading-tight" style={{ letterSpacing: '-0.02em' }}>{projekt.nev}</h2>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9C8B7A' }}>{projekt.rovid_leiras}</p>
        </div>

        {/* Bid + timer */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: `${info?.color}08` }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#5A4F4A' }}>Current Bid</p>
            <p className="text-4xl font-black tabular-nums" style={{ color: info?.color, letterSpacing: '-0.03em' }}>
              €{legmagasabb.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#5A4F4A' }}>Time Left</p>
            <p className={`text-2xl font-mono font-black tabular-nums ${modalUrgent ? 'animate-pulse' : ''}`}
              style={{ color: countdown.done ? '#EF4444' : modalUrgent ? '#DC2626' : '#F5F0E8' }}>
              {countdown.label}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          {auctionEnded ? (
            <div className="text-center text-sm py-3 rounded-lg" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#EF4444' }}>
              Auction ended — no more bids
            </div>
          ) : isSeller ? (
            <div className="text-center text-xs py-3" style={{ color: '#5A4F4A' }}>This is your project</div>
          ) : !user ? (
            <button onClick={() => router.push('/auth')}
              className="w-full py-3.5 rounded-lg font-black text-sm transition"
              style={{ background: info?.color, color: isDark ? '#100C0F' : '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Sign in to bid →
            </button>
          ) : (
            <form onSubmit={licitBeküldes} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => setLicitOsszeg(v => String(Math.max(minimumLicit, (parseInt(v) || minimumLicit) - increment)))}
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold shrink-0 transition active:scale-95"
                  style={{ background: `${info?.color}15`, border: `1px solid ${info?.color}33`, color: info?.color }}>−</button>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#5A4F4A' }}>€</span>
                  <input type="number" required min={minimumLicit} value={licitOsszeg}
                    onChange={e => setLicitOsszeg(e.target.value)}
                    placeholder={`${minimumLicit.toLocaleString()}`}
                    className="w-full pl-8 pr-4 py-3.5 rounded-lg text-lg font-black text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none transition"
                    style={{ background: '#221820', border: `1px solid ${info?.color}33`, color: '#F5F0E8' }}
                    onFocus={e => (e.currentTarget.style.borderColor = info?.color ?? '#DC2626')}
                    onBlur={e => (e.currentTarget.style.borderColor = `${info?.color ?? '#DC2626'}33`)} />
                </div>
                <button type="button"
                  onClick={() => setLicitOsszeg(v => String((parseInt(v) || minimumLicit) + increment))}
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold shrink-0 transition active:scale-95"
                  style={{ background: `${info?.color}15`, border: `1px solid ${info?.color}33`, color: info?.color }}>+</button>
              </div>
              <p className="text-center text-[10px]" style={{ color: '#5A4F4A' }}>min. €{minimumLicit.toLocaleString()} · increment +€{increment}</p>
              {allapot === 'hiba' && <p className="text-xs text-center" style={{ color: '#EF4444' }}>{hiba}</p>}
              {allapot === 'siker' && <p className="text-xs font-bold text-center" style={{ color: '#22C55E' }}>Bid placed!</p>}
              <button type="submit" disabled={allapot === 'loading'}
                className="py-4 rounded-lg font-black text-base transition active:scale-[0.98]"
                style={{ background: info?.color, color: isDark ? '#100C0F' : '#fff', boxShadow: allapot !== 'loading' ? info?.glow : 'none', opacity: allapot === 'loading' ? 0.7 : 1 }}
                onMouseEnter={e => { if (allapot !== 'loading') e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                {allapot === 'loading' ? 'Submitting...' : 'Place Bid →'}
              </button>
            </form>
          )}

          {!loading && licitek.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2E2028' }}>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#5A4F4A' }}>Bid History ({licitek.length})</p>
              <div className="flex flex-col gap-1">
                {licitek.slice(0, 5).map((l, i) => (
                  <div key={l.id} className="flex justify-between items-center py-1.5 px-3 rounded text-xs"
                    style={{ background: i === 0 ? '#221820' : 'transparent' }}>
                    <span className="font-mono" style={{ color: i === 0 ? '#F5F0E8' : '#9C8B7A' }}>
                      {i === 0 ? '— ' : `${i + 1}. `}{l.anon_nev || `Buyer#${i + 1}`}
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: i === 0 ? info?.color : '#5A4F4A' }}>
                      €{l.osszeg.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <a href={`/project/${projekt.id}`}
            className="block mt-4 text-center text-xs transition"
            style={{ color: '#5A4F4A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9C8B7A')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5A4F4A')}>
            View full details →
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const supabase = createClient()
  const [aktivak, setAktivak]   = useState<Record<string, Projekt[]>>({ fast: [], standard: [], premium: [] })
  const [sor, setSor]           = useState<Projekt[]>([])
  const [topLicitek, setTopLicitek]   = useState<Record<string, number>>({})
  const [licitekSzama, setLicitekSzama] = useState<Record<string, number>>({})
  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const [kivalasztott, setKivalasztott] = useState<Projekt | null>(null)
  const [keresoszoveg, setKeresoszoveg] = useState('')

  const betolt = useCallback(async () => {
    const { data: aktivProjektek } = await supabase.from('projektek').select('*').eq('statusz', 'aktiv')
    const ujAktivak: Record<string, Projekt[]> = { fast: [], standard: [], premium: [] }
    for (const p of aktivProjektek || []) { if (ujAktivak[p.sav]) ujAktivak[p.sav].push(p) }
    setAktivak(ujAktivak)

    const aktivIdk = (aktivProjektek || []).map(p => p.id)
    if (aktivIdk.length > 0) {
      const { data: licitData } = await supabase.from('licitek').select('projekt_id, osszeg, user_id').in('projekt_id', aktivIdk)
      const topMap: Record<string, number> = {}
      const bidderMap: Record<string, Set<string>> = {}
      for (const l of licitData || []) {
        if (!topMap[l.projekt_id] || l.osszeg > topMap[l.projekt_id]) topMap[l.projekt_id] = l.osszeg
        if (!bidderMap[l.projekt_id]) bidderMap[l.projekt_id] = new Set()
        bidderMap[l.projekt_id].add(l.user_id)
      }
      setTopLicitek(topMap)
      setLicitekSzama(Object.fromEntries(Object.entries(bidderMap).map(([k, v]) => [k, v.size])))
    }

    const { data: sorban } = await supabase.from('projektek').select('id, nev, rovid_leiras, badge, kategoria, kikialtasi_ar, lejarat, sav, priority_tokens')
      .eq('statusz', 'varakozas').order('priority_tokens', { ascending: false }).order('varakozas_kezd', { ascending: true }).limit(12)
    setSor(sorban || [])

    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    setLoading(false)
  }, [])

  useEffect(() => { betolt(); const i = setInterval(betolt, 20000); return () => clearInterval(i) }, [betolt])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setKivalasztott(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const skeletonCard = (
    <div className="rounded-lg h-52 animate-pulse" style={{ background: '#1A1217', border: '1px solid #2E2028' }} />
  )

  if (loading) return (
    <main className="min-h-screen" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2E2028' }}>
        <span className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Bid<span style={{ color: '#DC2626' }}>Vip</span></span>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-10 w-48 rounded mb-2 animate-pulse" style={{ background: '#1A1217' }} />
        <div className="h-4 w-64 rounded mb-10 animate-pulse" style={{ background: '#1A1217' }} />
        {['fast','standard','premium'].map(s => (
          <div key={s} className="mb-10">
            <div className="h-3 w-40 rounded mb-4 animate-pulse" style={{ background: '#1A1217' }} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{skeletonCard}{skeletonCard}{skeletonCard}</div>
          </div>
        ))}
      </div>
    </main>
  )

  const savok = ['fast', 'standard', 'premium'] as const

  return (
    <main className="min-h-screen" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.012, backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2E2028', backdropFilter: 'blur(8px)' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm transition" style={{ color: '#9C8B7A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>Dashboard</a>
          <a href="/submit" className="text-sm font-black px-4 py-2 rounded-lg transition"
            style={{ background: '#DC2626', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
            + List Project
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-1" style={{ letterSpacing: '-0.04em' }}>Aukciós Ház</h1>
          <p className="text-sm uppercase tracking-widest font-mono" style={{ color: '#5A4F4A' }}>
            <span className="animate-pulse" style={{ color: '#22C55E' }}>●</span> 9 live channels · tune in · place your bid
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 flex items-center gap-4 flex-wrap">
          <div className="relative max-w-md flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#5A4F4A' }}>◎</span>
            <input type="text" placeholder="Search projects, categories..."
              value={keresoszoveg} onChange={e => setKeresoszoveg(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm focus:outline-none transition"
              style={{ background: '#1A1217', border: '1px solid #2E2028', color: '#F5F0E8' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
            {keresoszoveg && (
              <button onClick={() => setKeresoszoveg('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition"
                style={{ color: '#5A4F4A' }}>✕</button>
            )}
          </div>
          {keresoszoveg.trim() && (() => {
            const q = keresoszoveg.trim().toLowerCase()
            const n = savok.reduce((acc, s) => acc + aktivak[s].filter(p =>
              p.nev.toLowerCase().includes(q) || p.rovid_leiras.toLowerCase().includes(q) || p.kategoria.toLowerCase().includes(q)
            ).length, 0)
            return <span className="text-sm" style={{ color: '#5A4F4A' }}>{n === 0 ? 'No results' : `${n} result${n !== 1 ? 's' : ''}`}</span>
          })()}
        </div>

        {/* 3 channel lanes */}
        <div className="flex flex-col gap-10 mb-14">
          {savok.map(sav => {
            const info = SAV_INFO[sav]
            const q    = keresoszoveg.trim().toLowerCase()
            const projektek = q
              ? aktivak[sav].filter(p => p.nev.toLowerCase().includes(q) || p.rovid_leiras.toLowerCase().includes(q) || p.kategoria.toLowerCase().includes(q))
              : aktivak[sav]
            return (
              <div key={sav}>
                {/* Lane header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${info.color}55, transparent)` }} />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black tracking-widest font-mono" style={{ color: info.color }}>{info.slogan}</span>
                    <span className="text-[10px] uppercase tracking-widest hidden sm:block" style={{ color: '#5A4F4A' }}>{info.tagline}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: info.color }} />
                      <span className="text-[10px] font-black tracking-widest" style={{ color: info.color }}>ON AIR</span>
                    </span>
                  </div>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${info.color}55, transparent)` }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0,1,2].map(i => (
                    <TvPanel key={i} slot={i + 1} sav={sav}
                      projekt={projektek[i] ?? null} onKattint={setKivalasztott}
                      topLicit={projektek[i] ? topLicitek[projektek[i].id] : undefined}
                      bidderCount={projektek[i] ? licitekSzama[projektek[i].id] : undefined} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Queue */}
        {sor.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px flex-1" style={{ background: '#2E2028' }} />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#5A4F4A' }}>Sorban Következő</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#221820', color: '#9C8B7A' }}>{sor.length}</span>
              </div>
              <div className="h-px flex-1" style={{ background: '#2E2028' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              {sor.filter(p => {
                const q = keresoszoveg.trim().toLowerCase()
                return !q || p.nev.toLowerCase().includes(q) || p.rovid_leiras.toLowerCase().includes(q) || p.kategoria.toLowerCase().includes(q)
              }).map((p, idx) => {
                const si = SAV_INFO[p.sav as keyof typeof SAV_INFO]
                return (
                  <div key={p.id} className="group rounded-lg px-4 py-3 flex items-center gap-4 transition"
                    style={{ background: '#1A1217', border: '1px solid #2E2028' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#3E3040')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2E2028')}>
                    <span className="text-xs font-mono w-5 shrink-0 tabular-nums" style={{ color: '#3E3040' }}>{idx + 1}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ color: si?.color, background: `${si?.color}15` }}>{si?.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate transition" style={{ color: '#F5F0E8' }}>{p.nev}</p>
                      <p className="text-xs truncate" style={{ color: '#9C8B7A' }}>{p.rovid_leiras}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm tabular-nums" style={{ color: si?.color }}>€{p.kikialtasi_ar.toLocaleString()}</p>
                      {p.priority_tokens > 0 && <p className="text-[10px]" style={{ color: '#EAB308' }}>⚡ {p.priority_tokens} boost</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {kivalasztott && <BidModal projekt={kivalasztott} user={user} onZar={() => setKivalasztott(null)} />}
    </main>
  )
}
