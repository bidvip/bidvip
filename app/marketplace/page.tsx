'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const SAV_INFO = {
  fast:     { label: 'FAST',     perc: 3,  color: '#22c55e', glow: '0 0 24px #22c55e44', bg: '#22c55e11' },
  standard: { label: 'STANDARD', perc: 5,  color: '#eab308', glow: '0 0 24px #eab30844', bg: '#eab30811' },
  premium:  { label: 'PREMIUM',  perc: 20, color: '#ef4444', glow: '0 0 24px #ef444444', bg: '#ef444411' },
}

const badge_info: Record<string, { label: string; color: string }> = {
  idea:      { label: '🌱 Concept',   color: '#86efac' },
  prototype: { label: '🛠️ Prototype', color: '#93c5fd' },
  proven:    { label: '✅ Proven',    color: '#c4b5fd' },
}

type Projekt = {
  id: string
  nev: string
  rovid_leiras: string
  kategoria: string
  badge: string
  kikialtasi_ar: number
  lejarat: string | null
  sav: string
  priority_tokens: number
}

type Licit = {
  id: string
  osszeg: number
  user_id: string
  anon_nev: string | null
}

function minIncrement(ar: number): number {
  if (ar < 500) return 25
  if (ar < 2000) return 50
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
  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { label: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, done: diff === 0, diff }
}

function TvPanel({ projekt, sav, slot, onKattint }: {
  projekt: Projekt | null
  sav: keyof typeof SAV_INFO
  slot: number
  onKattint: (p: Projekt) => void
}) {
  const info = SAV_INFO[sav]
  const countdown = useCountdown(projekt?.lejarat ?? null)
  const isLive = !!projekt && !countdown.done

  return (
    <div
      onClick={() => projekt && onKattint(projekt)}
      style={{
        boxShadow: isLive ? info.glow : 'none',
        cursor: projekt ? 'pointer' : 'default',
        borderColor: isLive ? `${info.color}66` : '#1f2937',
      }}
      className="relative bg-gray-950 rounded-xl border flex flex-col overflow-hidden transition-all hover:scale-[1.02] group"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800"
        style={{ background: isLive ? info.bg : '#0d0d0d' }}>
        <div className="flex items-center gap-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: info.color }} />}
          <span className="text-[10px] font-bold tracking-widest" style={{ color: info.color }}>
            {info.label}
          </span>
          {isLive && <span className="text-[10px] font-bold text-white bg-red-600 px-1 rounded">LIVE</span>}
        </div>
        <span className="text-[10px] text-gray-600">#{slot}</span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col min-h-[200px]">
        {projekt ? (
          <>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ color: badge_info[projekt.badge]?.color, background: `${badge_info[projekt.badge]?.color}22` }}>
                {badge_info[projekt.badge]?.label}
              </span>
              <span className="text-[10px] text-gray-600">{projekt.kategoria}</span>
            </div>

            <h3 className="font-bold text-sm mb-1 leading-snug line-clamp-2">{projekt.nev}</h3>
            <p className="text-gray-500 text-xs line-clamp-2 flex-1">{projekt.rovid_leiras}</p>

            <div className="mt-3 pt-3 border-t border-gray-800 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-gray-600 mb-0.5">Bid from</p>
                <p className="text-lg font-bold" style={{ color: info.color }}>
                  €{projekt.kikialtasi_ar.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-600 mb-0.5">Time left</p>
                <p className={`text-lg font-mono font-bold ${countdown.done ? 'text-red-400' : 'text-white'}`}>
                  {countdown.label}
                </p>
              </div>
            </div>

            <div className="mt-2 text-center text-[11px] font-semibold py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
              style={{ background: info.color, color: '#000' }}>
              Click to Bid →
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-3xl mb-2 opacity-30">📭</p>
            <p className="text-gray-700 text-xs">Empty slot</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BidModal({ projekt, user, onZar }: {
  projekt: Projekt
  user: User | null
  onZar: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const info = SAV_INFO[projekt.sav as keyof typeof SAV_INFO]
  const countdown = useCountdown(projekt.lejarat)

  const [licitek, setLicitek] = useState<Licit[]>([])
  const [licitOsszeg, setLicitOsszeg] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('licitek').select('*').eq('projekt_id', projekt.id)
      .order('osszeg', { ascending: false })
      .then(({ data }) => { setLicitek(data || []); setLoading(false) })

    const channel = supabase
      .channel(`modal-licitek-${projekt.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'licitek',
        filter: `projekt_id=eq.${projekt.id}`,
      }, (payload) => {
        setLicitek(prev => {
          const ujLicit = payload.new as Licit
          return [ujLicit, ...prev.filter(l => l.id !== ujLicit.id)].sort((a, b) => b.osszeg - a.osszeg)
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projekt.id])

  const legmagasabb = licitek[0]?.osszeg || projekt.kikialtasi_ar
  const increment = minIncrement(legmagasabb)
  const minimumLicit = legmagasabb + increment

  async function licitBeküldes(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    const osszeg = parseInt(licitOsszeg)
    if (!osszeg || osszeg < minimumLicit) {
      setHiba(`Minimum: €${minimumLicit.toLocaleString()} (+€${increment})`)
      setAllapot('hiba')
      return
    }
    setAllapot('loading')
    setHiba('')

    const res = await fetch('/api/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projekt_id: projekt.id, user_id: user.id, osszeg, proxy_max: null }),
    })
    const data = await res.json()

    if (!res.ok) {
      setHiba((data.error || 'Something went wrong.') + (data.debug ? ` [${data.debug}]` : '') + (data.id ? ` id:${data.id}` : ''))
      setAllapot('hiba')
    } else {
      setAllapot('siker')
      setLicitOsszeg('')
      setTimeout(() => setAllapot('idle'), 2500)
    }
  }

  const auctionEnded = countdown.done && !!projekt.lejarat
  const isSeller = user?.id === (projekt as any).user_id

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onZar() }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onZar} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-gray-950 border rounded-2xl overflow-hidden"
        style={{ borderColor: `${info?.color}44` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800"
          style={{ background: info?.bg }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: info?.color }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: info?.color }}>
              {info?.label}
            </span>
            <span className="text-xs font-bold text-white bg-red-600 px-1.5 rounded">LIVE</span>
          </div>
          <button onClick={onZar} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5">
          {/* Project info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: badge_info[projekt.badge]?.color, background: `${badge_info[projekt.badge]?.color}22` }}>
                {badge_info[projekt.badge]?.label}
              </span>
              <span className="text-xs text-gray-500">{projekt.kategoria}</span>
            </div>
            <h2 className="font-bold text-lg leading-snug">{projekt.nev}</h2>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{projekt.rovid_leiras}</p>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mb-5 pb-4 border-b border-gray-800">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Current bid</p>
              <p className="text-2xl font-bold" style={{ color: info?.color }}>
                €{legmagasabb.toLocaleString()}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500 mb-0.5">Time left</p>
              <p className={`text-2xl font-mono font-bold ${countdown.done ? 'text-red-400' : 'text-white'}`}>
                {countdown.label}
              </p>
            </div>
          </div>

          {/* Bid form */}
          {auctionEnded ? (
            <div className="text-center text-red-400 text-sm py-3 border border-red-900/50 rounded-xl bg-red-900/10">
              Auction ended — no more bids
            </div>
          ) : isSeller ? (
            <div className="text-center text-gray-500 text-sm py-3">
              This is your project
            </div>
          ) : !user ? (
            <button onClick={() => router.push('/auth')}
              className="w-full py-3 rounded-full font-semibold text-sm"
              style={{ background: info?.color, color: '#000' }}>
              Sign in to bid →
            </button>
          ) : (
            <form onSubmit={licitBeküldes} className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input
                  type="number" required min={minimumLicit} value={licitOsszeg}
                  onChange={e => setLicitOsszeg(e.target.value)}
                  placeholder={`min. €${minimumLicit.toLocaleString()} (+€${increment})`}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>
              {allapot === 'hiba' && <p className="text-red-400 text-xs">{hiba}</p>}
              {allapot === 'siker' && <p className="text-green-400 text-xs font-semibold">Bid placed!</p>}
              <button type="submit" disabled={allapot === 'loading'}
                className="py-3 rounded-full font-semibold text-sm disabled:opacity-60 transition"
                style={{ background: info?.color, color: '#000' }}>
                {allapot === 'loading' ? 'Submitting...' : 'Place Bid →'}
              </button>
            </form>
          )}

          {/* Bid history */}
          {!loading && licitek.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 font-semibold">Bids ({licitek.length})</p>
              <div className="flex flex-col gap-1.5">
                {licitek.slice(0, 5).map((l, i) => (
                  <div key={l.id} className="flex justify-between text-xs">
                    <span className="text-gray-500">{l.anon_nev || `Buyer#${i + 1}`}</span>
                    <span className={i === 0 ? 'font-bold' : 'text-gray-400'} style={{ color: i === 0 ? info?.color : undefined }}>
                      €{l.osszeg.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a href={`/project/${projekt.id}`}
            className="block mt-4 text-center text-xs text-gray-600 hover:text-gray-400 transition">
            View full details →
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const supabase = createClient()
  const [aktivak, setAktivak] = useState<Record<string, Projekt[]>>({ fast: [], standard: [], premium: [] })
  const [sor, setSor] = useState<Projekt[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [kivalasztott, setKivalasztott] = useState<Projekt | null>(null)

  const betolt = useCallback(async () => {
    const { data: aktivProjektek } = await supabase
      .from('projektek').select('*').eq('statusz', 'aktiv')

    const ujAktivak: Record<string, Projekt[]> = { fast: [], standard: [], premium: [] }
    for (const p of aktivProjektek || []) {
      if (ujAktivak[p.sav]) ujAktivak[p.sav].push(p)
    }
    setAktivak(ujAktivak)

    const { data: sorban } = await supabase
      .from('projektek').select('id, nev, rovid_leiras, badge, kategoria, kikialtasi_ar, lejarat, sav, priority_tokens')
      .eq('statusz', 'varakozas')
      .order('priority_tokens', { ascending: false })
      .order('varakozas_kezd', { ascending: true })
      .limit(12)

    setSor(sorban || [])

    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    setLoading(false)
  }, [])

  useEffect(() => {
    betolt()
    const i = setInterval(betolt, 20000)
    return () => clearInterval(i)
  }, [betolt])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setKivalasztott(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </main>
  )

  const savok = ['fast', 'standard', 'premium'] as const

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">Dashboard</a>
          <a href="/submit" className="bg-violet-600 hover:bg-violet-700 transition px-4 py-2 rounded-full text-sm font-semibold">
            + List Project
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Auction House</h1>
          <p className="text-gray-500 mt-1 text-sm">9 live channels · click any TV to place your bid</p>
        </div>

        {/* 3 lanes, each with 3 TVs */}
        <div className="flex flex-col gap-8 mb-12">
          {savok.map(sav => {
            const info = SAV_INFO[sav]
            const projektek = aktivak[sav]
            return (
              <div key={sav}>
                {/* Lane header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${info.color}44, transparent)` }} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-widest" style={{ color: info.color }}>
                      {info.label}
                    </span>
                    <span className="text-xs text-gray-600">{info.perc} MIN</span>
                  </div>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${info.color}44, transparent)` }} />
                </div>

                {/* 3 TVs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map(i => (
                    <TvPanel
                      key={i}
                      slot={i + 1}
                      sav={sav}
                      projekt={projektek[i] ?? null}
                      onKattint={setKivalasztott}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Queue */}
        {sor.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-3 text-gray-300">
              Up Next <span className="text-gray-600 font-normal text-sm">({sor.length} queued)</span>
            </h2>
            <div className="flex flex-col gap-2">
              {sor.map((p) => {
                const si = SAV_INFO[p.sav as keyof typeof SAV_INFO]
                return (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ color: si?.color, background: `${si?.color}22` }}>
                      {si?.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.nev}</p>
                      <p className="text-gray-500 text-xs truncate">{p.rovid_leiras}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ color: si?.color }}>€{p.kikialtasi_ar.toLocaleString()}</p>
                      {p.priority_tokens > 0 && <p className="text-xs text-amber-400">⚡ {p.priority_tokens}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {kivalasztott && (
        <BidModal
          projekt={kivalasztott}
          user={user}
          onZar={() => setKivalasztott(null)}
        />
      )}
    </main>
  )
}
