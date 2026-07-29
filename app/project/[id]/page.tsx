'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useParams, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const badge_info: Record<string, { label: string; szin: string }> = {
  idea:      { label: '🌱 Concept',   szin: 'bg-green-900/40 text-green-400 border-green-800' },
  prototype: { label: '🛠️ Prototype', szin: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  proven:    { label: '✅ Proven',    szin: 'bg-violet-900/40 text-violet-400 border-violet-800' },
}

type Fajl = { nev: string; url: string; tipus: string }

function minIncrement(ar: number): number {
  if (ar < 500) return 25
  if (ar < 2000) return 50
  if (ar < 10000) return 100
  return 250
}

type Projekt = {
  id: string
  user_id: string
  nev: string
  rovid_leiras: string
  reszletes_leiras: string
  kategoria: string
  badge: string
  kikialtasi_ar: number
  reserve_ar: number | null
  van_domain: boolean
  van_kod: boolean
  van_feliratkozok: boolean
  van_bevetel: boolean
  letrehozva: string
  lejarat: string | null
  fajlok: Fajl[] | null
  ai_elemzes: string | null
  statusz: string | null
  vevo_email: string | null
  anon_elado_nev: string | null
}

function useCountdown(lejarat: string | null) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    if (!lejarat) return
    const update = () => setDiff(Math.max(0, new Date(lejarat).getTime() - Date.now()))
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [lejarat])
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const done = diff === 0
  const label = done ? 'Auction ended' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return { label, done }
}

type Licit = {
  id: string
  osszeg: number
  letrehozva: string
  user_id: string
  anon_nev: string | null
}

export default function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [projekt, setProjekt] = useState<Projekt | null>(null)
  const [licitek, setLicitek] = useState<Licit[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [licitOsszeg, setLicitOsszeg] = useState('')
  const [proxyMax, setProxyMax] = useState('')
  const [proxyMode, setProxyMode] = useState(false)
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const countdown = useCountdown(projekt?.lejarat ?? null)
  const [aiElemzes, setAiElemzes] = useState('')
  const [aiAllapot, setAiAllapot] = useState<'idle' | 'loading' | 'kesz' | 'nincs_token'>('idle')
  const [tokenEgyenleg, setTokenEgyenleg] = useState<number | null>(null)
  const [aiIntro, setAiIntro] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPaymentStatus(params.get('fizetes'))
  }, [])

  useEffect(() => {
    async function betolt() {
      const [{ data: proj }, { data: { user: u } }, { data: lics }] = await Promise.all([
        supabase.from('projektek').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
        supabase.from('licitek').select('*').eq('projekt_id', id).order('osszeg', { ascending: false }),
      ])
      setProjekt(proj)
      setUser(u)
      setLicitek(lics || [])
      setLoading(false)
      if (u) {
        supabase.from('tokenek').select('egyenleg').eq('user_id', u.id).single()
          .then(({ data }) => setTokenEgyenleg(data?.egyenleg ?? 0))
      }
      if (proj) {
        fetch('/api/ai/intro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nev: proj.nev, rovid_leiras: proj.rovid_leiras, kategoria: proj.kategoria, badge: proj.badge, kikialtasi_ar: proj.kikialtasi_ar }),
        }).then(r => r.json()).then(d => { if (d.intro) setAiIntro(d.intro) }).catch(() => {})
      }
    }
    betolt()

    // Real-time bid updates
    const channel = supabase
      .channel(`licitek-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'licitek',
        filter: `projekt_id=eq.${id}`,
      }, (payload) => {
        setLicitek(prev => {
          const ujLicit = payload.new as Licit
          const frissitett = [ujLicit, ...prev.filter(l => l.id !== ujLicit.id)]
          return frissitett.sort((a, b) => b.osszeg - a.osszeg)
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const legmagasabb = licitek[0]?.osszeg || projekt?.kikialtasi_ar || 0
  const increment = minIncrement(legmagasabb)
  const minimumLicit = legmagasabb + increment
  const reserveTeljesitve = !projekt?.reserve_ar || legmagasabb >= projekt.reserve_ar

  const AI_ELEMZES_COST = 1

  async function aiElemzesKer() {
    if (!projekt) return
    if (!user) { router.push('/auth'); return }

    setAiAllapot('loading')

    const spendRes = await fetch('/api/tokens/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: AI_ELEMZES_COST }),
    })
    const spendData = await spendRes.json()
    if (!spendRes.ok) {
      setTokenEgyenleg(spendData.egyenleg ?? 0)
      setAiAllapot('nincs_token')
      return
    }
    setTokenEgyenleg(spendData.uj_egyenleg)

    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nev: projekt.nev,
        rovid_leiras: projekt.rovid_leiras,
        kategoria: projekt.kategoria,
        badge: projekt.badge,
        kikialtasi_ar: projekt.kikialtasi_ar,
      }),
    })
    const data = await res.json()
    setAiElemzes(data.analysis || '')
    setAiAllapot('kesz')
  }


  async function licitBeküldes(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    const osszeg = parseInt(proxyMode ? proxyMax : licitOsszeg)
    if (!osszeg || osszeg < minimumLicit) {
      setHiba(`Minimum bid is €${minimumLicit.toLocaleString()} (increment: €${increment})`)
      setAllapot('hiba')
      return
    }
    setAllapot('loading')
    setHiba('')

    const res = await fetch('/api/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projekt_id: id,
        user_id: user.id,
        osszeg: proxyMode ? minimumLicit : osszeg,
        proxy_max: proxyMode ? osszeg : null,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setHiba(data.error || 'Something went wrong.')
      setAllapot('hiba')
    } else {
      setAllapot('siker')
      setLicitOsszeg('')
      setProxyMax('')
      setTimeout(() => setAllapot('idle'), 3000)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    )
  }

  if (!projekt) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Project not found.</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <a href="/marketplace" className="hover:text-white transition">Aukciós Ház</a>
          <span>/</span>
          <span className="text-gray-300 font-medium truncate max-w-[200px]">{projekt.nev}</span>
        </div>
      </nav>

      {paymentStatus === 'siker' && (
        <div className="bg-green-900/40 border-b border-green-800 px-8 py-4 text-center text-green-400 font-semibold">
          🎉 Payment successful! The seller will be in touch with the handover details.
        </div>
      )}
      {paymentStatus === 'megszakitva' && (
        <div className="bg-red-900/40 border-b border-red-800 px-8 py-4 text-center text-red-400">
          Payment was cancelled. You can try again below.
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — project details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge_info[projekt.badge]?.szin}`}>
                {badge_info[projekt.badge]?.label}
              </span>
              <span className="text-xs text-gray-500">{projekt.kategoria}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{projekt.nev}</h1>
            <p className="text-gray-400">{projekt.rovid_leiras}</p>
            {projekt.anon_elado_nev && (
              <p className="text-xs text-gray-500 mt-2">Listed by <span className="text-gray-400 font-medium">{projekt.anon_elado_nev}</span></p>
            )}
          </div>

          {aiIntro && (
            <div className="bg-gradient-to-br from-violet-950/40 to-gray-900 border border-violet-800/40 rounded-2xl p-5">
              <p className="text-[11px] font-bold tracking-widest text-violet-400 uppercase mb-3">🤖 AI Overview</p>
              <p className="text-gray-200 leading-relaxed text-sm">{aiIntro}</p>
            </div>
          )}

          {(() => {
            const isSeller = user?.id === projekt.user_id
            const isBuyer = projekt.statusz === 'sold' && user?.email === projekt.vevo_email
            const canSeeDetails = isSeller || isBuyer

            return canSeeDetails ? (
              <>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="font-semibold mb-3">About this project</h2>
                  <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{projekt.reszletes_leiras}</p>
                </div>

                {projekt.fajlok && projekt.fajlok.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="font-semibold mb-4">Files & Media</h2>
                    {projekt.fajlok.some(f => f.tipus.startsWith('image/')) && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {projekt.fajlok.filter(f => f.tipus.startsWith('image/')).map((f, i) => (
                          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.url} alt={f.nev} className="w-full h-40 object-cover rounded-xl border border-gray-700 hover:border-violet-500 transition cursor-pointer" />
                          </a>
                        ))}
                      </div>
                    )}
                    {projekt.fajlok.filter(f => !f.tipus.startsWith('image/')).map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-violet-500 rounded-xl transition mb-2">
                        <span className="text-xl">{f.tipus === 'application/pdf' ? '📄' : f.tipus.includes('word') ? '📝' : '📊'}</span>
                        <span className="text-sm text-gray-300 truncate">{f.nev}</span>
                        <span className="ml-auto text-xs text-gray-500 shrink-0">Download ↓</span>
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
                <div className="text-3xl mb-3">🔒</div>
                <h2 className="font-semibold mb-2">Full details locked</h2>
                <p className="text-gray-400 text-sm">The detailed description and files are only available to the winning buyer after payment.</p>
              </div>
            )
          })()}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">AI Analysis</h2>
              {projekt.ai_elemzes && <span className="text-xs text-violet-400 border border-violet-800 px-2 py-1 rounded-full">Sonnet 5 · Deep</span>}
              {aiAllapot === 'kesz' && !projekt.ai_elemzes && (
                <button onClick={aiElemzesKer} className="text-xs text-gray-500 hover:text-gray-300 transition">Refresh</button>
              )}
            </div>

            {/* Show saved Sonnet 5 analysis (free for buyers) */}
            {projekt.ai_elemzes ? (
              <div className="text-sm text-gray-300 leading-relaxed flex flex-col gap-3">
                {projekt.ai_elemzes.split('\n').map((sor, i) => {
                  if (sor.startsWith('## ')) return <h3 key={i} className="font-bold text-white text-base mt-2">{sor.slice(3)}</h3>
                  if (sor.startsWith('- ')) return <p key={i} className="text-gray-400 pl-3 border-l border-gray-700">• {sor.slice(2)}</p>
                  if (sor.trim() === '') return null
                  return <p key={i} className="text-gray-400">{sor}</p>
                })}
              </div>
            ) : (
              <>
                {aiAllapot === 'idle' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={aiElemzesKer}
                      className="w-full py-3 rounded-xl border border-violet-700 text-violet-400 hover:bg-violet-900/20 transition font-semibold"
                    >
                      🤖 Quick Analysis — 1 token (Haiku)
                    </button>
                    {tokenEgyenleg !== null && (
                      <p className="text-center text-xs text-gray-500">
                        Your balance: <span className="text-violet-400 font-semibold">⚡ {tokenEgyenleg} tokens</span>
                        {tokenEgyenleg < 5 && <> · <a href="/tokens" className="text-violet-400 underline">Buy more →</a></>}
                      </p>
                    )}
                  </div>
                )}
                {aiAllapot === 'nincs_token' && (
                  <div className="text-center py-4">
                    <p className="text-red-400 text-sm mb-2">Not enough tokens. You have {tokenEgyenleg ?? 0}, need {AI_ELEMZES_COST}.</p>
                    <a href="/tokens" className="text-violet-400 text-sm hover:underline">Buy tokens →</a>
                  </div>
                )}
                {aiAllapot === 'loading' && (
                  <div className="text-center text-gray-400 py-4 text-sm animate-pulse">Analyzing...</div>
                )}
              </>
            )}
            {aiAllapot === 'kesz' && (
              <div className="text-sm text-gray-300 leading-relaxed flex flex-col gap-3">
                {aiElemzes.split('\n').map((sor, i) => {
                  if (sor.startsWith('## ')) return <h3 key={i} className="font-bold text-white text-base mt-2">{sor.slice(3)}</h3>
                  if (sor.startsWith('- ')) return <p key={i} className="text-gray-400 pl-3 border-l border-gray-700">• {sor.slice(2)}</p>
                  if (sor.trim() === '') return null
                  return <p key={i} className="text-gray-400">{sor}</p>
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-semibold mb-4">What&apos;s included?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { mezo: 'van_domain', label: 'Domain / URL', ikon: '🌐' },
                { mezo: 'van_kod', label: 'Source Code', ikon: '💻' },
                { mezo: 'van_feliratkozok', label: 'Email List', ikon: '📧' },
                { mezo: 'van_bevetel', label: 'Real Revenue', ikon: '💰' },
              ].map(item => (
                <div key={item.mezo} className={`flex items-center gap-2 p-3 rounded-xl border ${projekt[item.mezo as keyof Projekt] ? 'border-green-800 bg-green-900/20 text-green-400' : 'border-gray-700 text-gray-600'}`}>
                  <span>{item.ikon}</span>
                  <span className="text-sm">{item.label}</span>
                  <span className="ml-auto">{projekt[item.mezo as keyof Projekt] ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — bid panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden sticky top-6"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.06)' }}>

            {/* Status bar */}
            {projekt.statusz === 'aktiv' && !countdown.done && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-green-950/50 border-b border-green-900/50">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-400 tracking-widest uppercase">Live Auction</span>
              </div>
            )}
            {countdown.done && projekt.lejarat && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-red-950/50 border-b border-red-900/50">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                <span className="text-xs font-bold text-red-400 tracking-widest uppercase">Auction Ended</span>
              </div>
            )}

            <div className="p-6">
              {/* Price */}
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Legmagasabb licit</p>
              <p className="text-5xl font-black text-violet-400 tabular-nums mb-1">
                €{legmagasabb.toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs">Induló ár: €{projekt.kikialtasi_ar.toLocaleString()}</p>
              {projekt.reserve_ar && (
                <p className={`text-xs mt-1.5 font-semibold ${reserveTeljesitve ? 'text-green-400' : 'text-amber-400'}`}>
                  {reserveTeljesitve ? '✓ Reserve teljesítve' : '⚠️ Reserve még nem teljesült'}
                </p>
              )}

              {/* Countdown */}
              {projekt.lejarat && (
                <div className={`mt-4 mb-4 px-4 py-3 rounded-xl text-center border ${
                  countdown.done
                    ? 'border-red-900/50 bg-red-950/30 text-red-400'
                    : countdown.label.startsWith('0:') || countdown.label.startsWith('00:')
                    ? 'border-red-800/50 bg-red-950/20 text-red-400 animate-pulse'
                    : 'border-amber-900/40 bg-amber-950/20 text-amber-400'
                }`}>
                  <p className="text-xs text-gray-500 mb-0.5">Lejárat</p>
                  <p className="text-2xl font-bold font-mono">⏱ {countdown.label}</p>
                </div>
              )}
              {!projekt.lejarat && <div className="mb-4" />}

              {countdown.done && projekt.lejarat ? (
                <div className="text-center text-red-400 text-sm py-3">
                  Az aukció véget ért. Nem lehet több licitálni.
                </div>
              ) : user?.id === projekt.user_id ? (
                <div className="text-center text-gray-500 text-sm py-3 border border-gray-800 rounded-xl">
                  Ez a te projekted — nem licitálhatsz rá.
                </div>
              ) : (
                <form onSubmit={licitBeküldes} className="flex flex-col gap-3">
                  <button type="button" onClick={() => setProxyMode(p => !p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${proxyMode ? 'border-violet-500 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                    {proxyMode ? '🤖 Proxy licit BE — a rendszer licitál helyetted' : '🤖 Proxy licit engedélyezése'}
                  </button>

                  {proxyMode ? (
                    <div className="flex flex-col gap-1">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                        <input type="number" required min={minimumLicit} value={proxyMax}
                          onChange={e => setProxyMax(e.target.value)}
                          placeholder={`Maximum (min. €${minimumLicit.toLocaleString()})`}
                          className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-violet-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <p className="text-gray-500 text-xs">A rendszer most €{minimumLicit.toLocaleString()}-t tesz, és auto-licitál a max-ig ha valaki felülmúl.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => setLicitOsszeg(v => String(Math.max(minimumLicit, (parseInt(v) || minimumLicit) - increment)))}
                        className="w-11 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xl font-bold flex items-center justify-center flex-shrink-0 transition border border-gray-700">−</button>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        <input type="number" required min={minimumLicit} value={licitOsszeg}
                          onChange={e => setLicitOsszeg(e.target.value)}
                          placeholder={`${minimumLicit.toLocaleString()}`}
                          className="w-full pl-7 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <button type="button"
                        onClick={() => setLicitOsszeg(v => String((parseInt(v) || minimumLicit) + increment))}
                        className="w-11 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xl font-bold flex items-center justify-center flex-shrink-0 transition border border-gray-700">+</button>
                    </div>
                  )}

                  {allapot === 'hiba' && (
                    <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-3 py-2">
                      <p className="text-red-400 text-xs text-center">{hiba}</p>
                    </div>
                  )}
                  {allapot === 'siker' && (
                    <div className="bg-green-950/40 border border-green-800/40 rounded-xl px-3 py-2">
                      <p className="text-green-400 text-xs text-center">✓ Licit sikeresen elhelyezve!</p>
                    </div>
                  )}
                  <button type="submit" disabled={allapot === 'loading'}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition py-3.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                    {allapot === 'loading' ? 'Feldolgozás...' : proxyMode ? '🤖 Proxy licit beállítása →' : '⚡ Licitálás →'}
                  </button>
                </form>
              )}

              {licitek.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Licit előzmények ({licitek.length})</p>
                  <div className="flex flex-col gap-2">
                    {licitek.slice(0, 5).map((l, i) => (
                      <div key={l.id} className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg ${i === 0 ? 'bg-violet-950/30' : ''}`}>
                        <span className={i === 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}>{l.anon_nev || `Vevő#${i + 1}`}</span>
                        <span className={i === 0 ? 'text-violet-400 font-bold' : 'text-gray-400'}>€{l.osszeg.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
