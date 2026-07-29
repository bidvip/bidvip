'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useParams, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const badge_info: Record<string, { label: string; color: string; bg: string }> = {
  idea:      { label: 'Concept',   color: '#22C55E', bg: 'rgba(22,163,74,0.1)' },
  prototype: { label: 'Prototype', color: '#EAB308', bg: 'rgba(234,179,8,0.08)' },
  proven:    { label: 'Proven',    color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
}

type Fajl = { nev: string; url: string; tipus: string }

function minIncrement(ar: number): number {
  if (ar < 500)   return 25
  if (ar < 2000)  return 50
  if (ar < 10000) return 100
  return 250
}

type Projekt = {
  id: string; user_id: string; nev: string; rovid_leiras: string; reszletes_leiras: string
  kategoria: string; badge: string; kikialtasi_ar: number; reserve_ar: number | null
  van_domain: boolean; van_kod: boolean; van_feliratkozok: boolean; van_bevetel: boolean
  letrehozva: string; lejarat: string | null; fajlok: Fajl[] | null
  ai_elemzes: string | null; statusz: string | null; vevo_email: string | null; anon_elado_nev: string | null
}

type Licit = { id: string; osszeg: number; letrehozva: string; user_id: string; anon_nev: string | null }

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
  return { label, done, diff }
}

function card(children: React.ReactNode, style?: React.CSSProperties) {
  return (
    <div style={{ background: '#1A1217', border: '1px solid #2E2028', borderRadius: '8px', padding: '24px', ...style }}>
      {children}
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projekt, setProjekt]   = useState<Projekt | null>(null)
  const [licitek, setLicitek]   = useState<Licit[]>([])
  const [user, setUser]         = useState<User | null>(null)
  const [licitOsszeg, setLicitOsszeg] = useState('')
  const [proxyMax, setProxyMax] = useState('')
  const [proxyMode, setProxyMode] = useState(false)
  const [allapot, setAllapot]   = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const countdown = useCountdown(projekt?.lejarat ?? null)
  const [aiElemzes, setAiElemzes] = useState('')
  const [aiAllapot, setAiAllapot] = useState<'idle' | 'loading' | 'kesz' | 'nincs_token'>('idle')
  const [tokenEgyenleg, setTokenEgyenleg] = useState<number | null>(null)
  const [aiIntro, setAiIntro]   = useState('')

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
      setProjekt(proj); setUser(u); setLicitek(lics || []); setLoading(false)
      if (u) supabase.from('tokenek').select('egyenleg').eq('user_id', u.id).single().then(({ data }) => setTokenEgyenleg(data?.egyenleg ?? 0))
      if (proj) fetch('/api/ai/intro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nev: proj.nev, rovid_leiras: proj.rovid_leiras, kategoria: proj.kategoria, badge: proj.badge, kikialtasi_ar: proj.kikialtasi_ar }) }).then(r => r.json()).then(d => { if (d.intro) setAiIntro(d.intro) }).catch(() => {})
    }
    betolt()

    const channel = supabase.channel(`licitek-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'licitek', filter: `projekt_id=eq.${id}` }, (payload) => {
        setLicitek(prev => {
          const ujLicit = payload.new as Licit
          return [ujLicit, ...prev.filter(l => l.id !== ujLicit.id)].sort((a, b) => b.osszeg - a.osszeg)
        })
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const legmagasabb = licitek[0]?.osszeg || projekt?.kikialtasi_ar || 0
  const increment = minIncrement(legmagasabb)
  const minimumLicit = legmagasabb + increment
  const reserveTeljesitve = !projekt?.reserve_ar || legmagasabb >= projekt.reserve_ar
  const urgent = !countdown.done && countdown.diff < 60000

  async function aiElemzesKer() {
    if (!projekt) return
    if (!user) { router.push('/auth'); return }
    setAiAllapot('loading')
    const spendRes = await fetch('/api/tokens/spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, amount: 1 }) })
    const spendData = await spendRes.json()
    if (!spendRes.ok) { setTokenEgyenleg(spendData.egyenleg ?? 0); setAiAllapot('nincs_token'); return }
    setTokenEgyenleg(spendData.uj_egyenleg)
    const res = await fetch('/api/ai/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nev: projekt.nev, rovid_leiras: projekt.rovid_leiras, kategoria: projekt.kategoria, badge: projekt.badge, kikialtasi_ar: projekt.kikialtasi_ar }) })
    const data = await res.json()
    setAiElemzes(data.analysis || ''); setAiAllapot('kesz')
  }

  async function licitBeküldes(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    const osszeg = parseInt(proxyMode ? proxyMax : licitOsszeg)
    if (!osszeg || osszeg < minimumLicit) { setHiba(`Minimum bid is €${minimumLicit.toLocaleString()} (increment: €${increment})`); setAllapot('hiba'); return }
    setAllapot('loading'); setHiba('')
    const res = await fetch('/api/bid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projekt_id: id, user_id: user.id, osszeg: proxyMode ? minimumLicit : osszeg, proxy_max: proxyMode ? osszeg : null }) })
    const data = await res.json()
    if (!res.ok) { setHiba(data.error || 'Something went wrong.'); setAllapot('hiba') }
    else { setAllapot('siker'); setLicitOsszeg(''); setProxyMax(''); setTimeout(() => setAllapot('idle'), 3000) }
  }

  const inputCls: React.CSSProperties = { background: '#221820', border: '1px solid #2E2028', borderRadius: '8px', color: '#F5F0E8', padding: '12px 16px', width: '100%', fontSize: '14px' }

  function aiBlock(text: string) {
    return (
      <div className="flex flex-col gap-2.5">
        {text.split('\n').map((sor, i) => {
          if (sor.startsWith('## ')) return <h3 key={i} className="font-black text-base mt-2" style={{ color: '#F5F0E8', letterSpacing: '-0.02em' }}>{sor.slice(3)}</h3>
          if (sor.startsWith('- ')) return <p key={i} className="text-sm pl-3" style={{ color: '#9C8B7A', borderLeft: '2px solid #2E2028' }}>• {sor.slice(2)}</p>
          if (sor.trim() === '') return null
          return <p key={i} className="text-sm leading-relaxed" style={{ color: '#9C8B7A' }}>{sor}</p>
        })}
      </div>
    )
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#100C0F' }}>
      <p className="text-sm" style={{ color: '#5A4F4A' }}>Loading...</p>
    </main>
  )
  if (!projekt) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#100C0F' }}>
      <p className="text-sm" style={{ color: '#5A4F4A' }}>Project not found.</p>
    </main>
  )

  const bi = badge_info[projekt.badge] ?? { label: projekt.badge, color: '#9C8B7A', bg: '#221820' }

  return (
    <main className="min-h-screen" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.012, backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2E2028', backdropFilter: 'blur(8px)' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </a>
        <div className="flex items-center gap-2 text-sm">
          <a href="/marketplace" className="transition" style={{ color: '#9C8B7A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>Aukciós Ház</a>
          <span style={{ color: '#3E3040' }}>/</span>
          <span className="font-semibold truncate max-w-[200px]" style={{ color: '#F5F0E8' }}>{projekt.nev}</span>
        </div>
      </nav>

      {paymentStatus === 'siker' && (
        <div className="px-8 py-4 text-center font-semibold text-sm" style={{ background: 'rgba(22,163,74,0.08)', borderBottom: '1px solid rgba(22,163,74,0.2)', color: '#22C55E' }}>
          Payment successful! The seller will be in touch with the handover details.
        </div>
      )}
      {paymentStatus === 'megszakitva' && (
        <div className="px-8 py-4 text-center text-sm" style={{ background: 'rgba(220,38,38,0.05)', borderBottom: '1px solid rgba(220,38,38,0.15)', color: '#EF4444' }}>
          Payment was cancelled. You can try again below.
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ color: bi.color, background: bi.bg, border: `1px solid ${bi.color}33` }}>
                {bi.label}
              </span>
              <span className="text-xs" style={{ color: '#5A4F4A' }}>{projekt.kategoria}</span>
            </div>
            <h1 className="text-3xl font-black mb-2" style={{ letterSpacing: '-0.03em' }}>{projekt.nev}</h1>
            <p style={{ color: '#9C8B7A' }}>{projekt.rovid_leiras}</p>
            {projekt.anon_elado_nev && (
              <p className="text-xs mt-2" style={{ color: '#5A4F4A' }}>Listed by <span className="font-medium" style={{ color: '#9C8B7A' }}>{projekt.anon_elado_nev}</span></p>
            )}
          </div>

          {/* AI Intro */}
          {aiIntro && card(
            <>
              <p className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: '#EAB308' }}>AI Overview</p>
              <p className="text-sm leading-relaxed" style={{ color: '#9C8B7A' }}>{aiIntro}</p>
            </>,
            { background: 'linear-gradient(135deg, rgba(234,179,8,0.04) 0%, #1A1217 60%)' }
          )}

          {/* Details (seller/buyer only) */}
          {(() => {
            const isSeller = user?.id === projekt.user_id
            const isBuyer = projekt.statusz === 'sold' && user?.email === projekt.vevo_email
            if (!isSeller && !isBuyer) return card(
              <div className="text-center py-4">
                <div className="text-3xl mb-3">🔒</div>
                <h2 className="font-bold mb-2">Full details locked</h2>
                <p className="text-sm" style={{ color: '#9C8B7A' }}>Detailed description and files are only visible to the winning buyer after payment.</p>
              </div>,
              { borderStyle: 'dashed', borderColor: '#3E3040' }
            )
            return (
              <>
                {card(
                  <>
                    <h2 className="font-bold mb-3">About this project</h2>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#9C8B7A' }}>{projekt.reszletes_leiras}</p>
                  </>
                )}
                {projekt.fajlok && projekt.fajlok.length > 0 && card(
                  <>
                    <h2 className="font-bold mb-4">Files & Media</h2>
                    {projekt.fajlok.some(f => f.tipus.startsWith('image/')) && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {projekt.fajlok.filter(f => f.tipus.startsWith('image/')).map((f, i) => (
                          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.url} alt={f.nev} className="w-full h-40 object-cover rounded-lg transition"
                              style={{ border: '1px solid #2E2028' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    {projekt.fajlok.filter(f => !f.tipus.startsWith('image/')).map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition"
                        style={{ background: '#221820', border: '1px solid #2E2028' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#3E3040')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2E2028')}>
                        <span>{f.tipus === 'application/pdf' ? '📄' : f.tipus.includes('word') ? '📝' : '📊'}</span>
                        <span className="text-sm truncate" style={{ color: '#F5F0E8' }}>{f.nev}</span>
                        <span className="ml-auto text-xs shrink-0" style={{ color: '#5A4F4A' }}>Download ↓</span>
                      </a>
                    ))}
                  </>
                )}
              </>
            )
          })()}

          {/* AI Analysis */}
          {card(
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#DC2626' }}>AI Elemzés</p>
                </div>
                {projekt.ai_elemzes && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded"
                    style={{ color: '#EAB308', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    Sonnet 5 · Deep
                  </span>
                )}
              </div>
              {projekt.ai_elemzes ? aiBlock(projekt.ai_elemzes)
                : aiAllapot === 'kesz' ? aiBlock(aiElemzes)
                : aiAllapot === 'loading' ? <p className="text-sm text-center animate-pulse py-4" style={{ color: '#5A4F4A' }}>Analyzing...</p>
                : aiAllapot === 'nincs_token' ? (
                  <div className="text-center py-4">
                    <p className="text-sm mb-2" style={{ color: '#EF4444' }}>Not enough tokens. You have {tokenEgyenleg ?? 0}.</p>
                    <a href="/tokens" className="text-sm" style={{ color: '#EAB308' }}>Buy tokens →</a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button onClick={aiElemzesKer}
                      className="w-full py-3 rounded-lg font-bold text-sm transition"
                      style={{ border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      AI Quick Analysis — 1 token
                    </button>
                    {tokenEgyenleg !== null && (
                      <p className="text-center text-xs" style={{ color: '#5A4F4A' }}>
                        Balance: <span className="font-bold" style={{ color: '#EAB308' }}>⚡ {tokenEgyenleg}</span>
                        {tokenEgyenleg < 1 && <> · <a href="/tokens" style={{ color: '#EAB308' }}>Buy more →</a></>}
                      </p>
                    )}
                  </div>
                )}
            </>,
            { background: 'linear-gradient(135deg, rgba(220,38,38,0.03) 0%, #1A1217 60%)' }
          )}

          {/* Inclusions */}
          {card(
            <>
              <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#5A4F4A' }}>Mit tartalmaz?</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { mezo: 'van_domain', label: 'Domain / URL' },
                  { mezo: 'van_kod', label: 'Forráskód' },
                  { mezo: 'van_feliratkozok', label: 'Email lista' },
                  { mezo: 'van_bevetel', label: 'Valós bevétel' },
                ].map(item => {
                  const van = projekt[item.mezo as keyof Projekt]
                  return (
                    <div key={item.mezo} className="flex items-center gap-2.5 p-3 rounded-lg"
                      style={{ border: `1px solid ${van ? 'rgba(22,163,74,0.3)' : '#2E2028'}`, background: van ? 'rgba(22,163,74,0.05)' : '#221820' }}>
                      <span className="text-sm font-medium" style={{ color: van ? '#22C55E' : '#5A4F4A' }}>{item.label}</span>
                      <span className="ml-auto font-bold" style={{ color: van ? '#22C55E' : '#3E3040' }}>{van ? '✓' : '✗'}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Right — bid panel */}
        <div className="flex flex-col gap-4">
          <div className="sticky top-6 rounded-lg overflow-hidden"
            style={{ background: '#1A1217', border: `1px solid ${urgent ? '#DC262699' : '#2E2028'}`, boxShadow: urgent ? '0 0 28px rgba(220,38,38,0.12)' : '0 0 40px rgba(0,0,0,0.4)', transition: 'border-color 0.5s, box-shadow 0.5s' }}>

            {/* Status bar */}
            {projekt.statusz === 'aktiv' && !countdown.done && (
              <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: 'rgba(22,163,74,0.08)', borderBottom: '1px solid rgba(22,163,74,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#22C55E' }}>Live Auction</span>
              </div>
            )}
            {countdown.done && projekt.lejarat && (
              <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: 'rgba(220,38,38,0.06)', borderBottom: '1px solid rgba(220,38,38,0.15)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#EF4444' }}>Auction Ended</span>
              </div>
            )}

            <div className="p-6">
              {/* Price */}
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#5A4F4A' }}>Legmagasabb licit</p>
              <p className="text-5xl font-black tabular-nums mb-1 transition-colors duration-300"
                style={{ color: '#EAB308', letterSpacing: '-0.03em' }}>
                €{legmagasabb.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: '#5A4F4A' }}>Induló ár: €{projekt.kikialtasi_ar.toLocaleString()}</p>
              {projekt.reserve_ar && (
                <p className="text-xs mt-1.5 font-bold" style={{ color: reserveTeljesitve ? '#22C55E' : '#F97316' }}>
                  {reserveTeljesitve ? '✓ Reserve teljesítve' : '⚠ Reserve még nem teljesült'}
                </p>
              )}

              {/* Countdown */}
              {projekt.lejarat && (
                <div className="mt-4 mb-4 px-4 py-3 rounded-lg text-center"
                  style={{ border: `1px solid ${countdown.done ? 'rgba(220,38,38,0.3)' : urgent ? 'rgba(220,38,38,0.4)' : 'rgba(234,179,8,0.2)'}`,
                    background: countdown.done ? 'rgba(220,38,38,0.05)' : urgent ? 'rgba(220,38,38,0.04)' : 'rgba(234,179,8,0.04)' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#5A4F4A' }}>Lejárat</p>
                  <p className={`text-2xl font-black font-mono tabular-nums ${urgent ? 'animate-pulse' : ''}`}
                    style={{ color: countdown.done ? '#EF4444' : urgent ? '#DC2626' : '#EAB308' }}>
                    {countdown.label}
                  </p>
                </div>
              )}
              {!projekt.lejarat && <div className="mb-4" />}

              {/* Bid form */}
              {countdown.done && projekt.lejarat ? (
                <div className="text-center text-sm py-3" style={{ color: '#EF4444' }}>Az aukció véget ért.</div>
              ) : user?.id === projekt.user_id ? (
                <div className="text-center text-sm py-3 rounded-lg" style={{ border: '1px solid #2E2028', color: '#9C8B7A' }}>
                  Ez a te projekted — nem licitálhatsz rá.
                </div>
              ) : (
                <form onSubmit={licitBeküldes} className="flex flex-col gap-3">
                  <button type="button" onClick={() => setProxyMode(p => !p)}
                    className="text-xs px-3 py-1.5 rounded transition text-center"
                    style={{ border: `1px solid ${proxyMode ? 'rgba(220,38,38,0.4)' : '#2E2028'}`, color: proxyMode ? '#DC2626' : '#9C8B7A', background: proxyMode ? 'rgba(220,38,38,0.06)' : 'transparent' }}>
                    {proxyMode ? 'Proxy licit BE — a rendszer licitál helyetted' : 'Proxy licit engedélyezése'}
                  </button>

                  {proxyMode ? (
                    <div className="flex flex-col gap-1">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#5A4F4A' }}>€</span>
                        <input type="number" required min={minimumLicit} value={proxyMax}
                          onChange={e => setProxyMax(e.target.value)}
                          placeholder={`Max (min. €${minimumLicit.toLocaleString()})`}
                          style={{ ...inputCls, paddingLeft: '32px', borderColor: '#DC262644' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#DC262644')} />
                      </div>
                      <p className="text-xs" style={{ color: '#5A4F4A' }}>
                        Most: €{minimumLicit.toLocaleString()}. Auto-licitál a max-ig ha valaki felülmúl.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => setLicitOsszeg(v => String(Math.max(minimumLicit, (parseInt(v) || minimumLicit) - increment)))}
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-xl font-bold shrink-0 transition"
                        style={{ background: '#221820', border: '1px solid #2E2028', color: '#F5F0E8' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#3E3040')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2E2028')}>−</button>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#5A4F4A' }}>€</span>
                        <input type="number" required min={minimumLicit} value={licitOsszeg}
                          onChange={e => setLicitOsszeg(e.target.value)}
                          placeholder={`${minimumLicit.toLocaleString()}`}
                          className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ ...inputCls, paddingLeft: '28px', paddingRight: '12px' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
                      </div>
                      <button type="button"
                        onClick={() => setLicitOsszeg(v => String((parseInt(v) || minimumLicit) + increment))}
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-xl font-bold shrink-0 transition"
                        style={{ background: '#221820', border: '1px solid #2E2028', color: '#F5F0E8' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#3E3040')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2E2028')}>+</button>
                    </div>
                  )}

                  {allapot === 'hiba' && (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                      <p className="text-xs text-center" style={{ color: '#EF4444' }}>{hiba}</p>
                    </div>
                  )}
                  {allapot === 'siker' && (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}>
                      <p className="text-xs text-center font-bold" style={{ color: '#22C55E' }}>✓ Licit sikeresen elhelyezve!</p>
                    </div>
                  )}

                  <button type="submit" disabled={allapot === 'loading'}
                    className="py-3.5 rounded-lg font-black text-sm transition"
                    style={{ background: '#DC2626', color: '#fff', boxShadow: '0 0 20px rgba(220,38,38,0.25)', opacity: allapot === 'loading' ? 0.6 : 1 }}
                    onMouseEnter={e => { if (allapot !== 'loading') e.currentTarget.style.background = '#EF4444' }}
                    onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                    {allapot === 'loading' ? 'Feldolgozás...' : proxyMode ? 'Proxy licit beállítása →' : 'Licitálás →'}
                  </button>
                </form>
              )}

              {/* Bid history */}
              {licitek.length > 0 && (
                <div className="mt-5 pt-5" style={{ borderTop: '1px solid #2E2028' }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#5A4F4A' }}>
                    Licit előzmények ({licitek.length})
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {licitek.slice(0, 5).map((l, i) => (
                      <div key={l.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded"
                        style={{ background: i === 0 ? 'rgba(220,38,38,0.06)' : 'transparent' }}>
                        <span style={{ color: i === 0 ? '#F5F0E8' : '#9C8B7A' }}>{l.anon_nev || `Vevő#${i + 1}`}</span>
                        <span className="font-bold" style={{ color: i === 0 ? '#EAB308' : '#9C8B7A' }}>€{l.osszeg.toLocaleString()}</span>
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
