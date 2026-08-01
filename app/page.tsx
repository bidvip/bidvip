'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { type KirakatElem } from '@/lib/kirakat'

const MAX_WAITLIST = 2000

const PREVIEW_AUCTIONS = [
  { id: 1, nev: 'TaskFlow AI',  kat: 'SaaS / Software', bid: 4800, badge: 'Proven',    sav: 'PREMIUM',  color: '#DC2626', time: 847 },
  { id: 2, nev: 'LocalEats',    kat: 'Marketplace',     bid: 1250, badge: 'Prototype', sav: 'STANDARD', color: '#F97316', time: 192 },
  { id: 3, nev: 'GreenTrack',   kat: 'Healthtech',      bid: 320,  badge: 'Concept',   sav: 'FAST',     color: '#EAB308', time: 54  },
]

function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{ transitionDelay: `${delay}ms`, transition: 'opacity 0.7s ease, transform 0.7s ease', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)' }}>
      {children}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useEffect(() => { if (bodyRef.current) setHeight(open ? bodyRef.current.scrollHeight : 0) }, [open])
  return (
    <div style={{ border: '1px solid #2E2028', background: open ? '#1A1217' : 'transparent', borderRadius: '10px', overflow: 'hidden', transition: 'background 0.2s' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
        style={{ color: '#F5F0E8' }}>
        <span className="font-semibold text-sm pr-4">{q}</span>
        <span style={{ color: '#DC2626', fontSize: '1.2rem', fontWeight: 900, transition: 'transform 0.3s ease', transform: open ? 'rotate(45deg)' : 'none', display: 'inline-block', flexShrink: 0 }}>+</span>
      </button>
      <div ref={bodyRef} style={{ maxHeight: `${height}px`, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
        <div className="px-6 pb-5 pt-1 text-sm leading-relaxed" style={{ color: '#9C8B7A', borderTop: '1px solid #2E2028' }}>{a}</div>
      </div>
    </div>
  )
}

function AuctionCard({ a, idx }: { a: typeof PREVIEW_AUCTIONS[0]; idx: number }) {
  const [bid, setBid] = useState(a.bid)
  const [time, setTime] = useState(a.time)
  const [flash, setFlash] = useState(false)
  const [hover, setHover] = useState(false)
  const [bidJump, setBidJump] = useState(false)
  const DELAYS = [4200, 6800, 9500]

  useEffect(() => {
    const t = setInterval(() => setTime(s => s > 0 ? s - 1 : a.time), 1000)
    const b = setInterval(() => {
      setBid(prev => { const next = prev + Math.floor(Math.random() * 80 + 25); setFlash(true); setBidJump(true); setTimeout(() => setFlash(false), 600); setTimeout(() => setBidJump(false), 400); return next })
    }, DELAYS[idx])
    return () => { clearInterval(t); clearInterval(b) }
  }, [a.time, idx])

  const urgent = time < 60
  const mm = Math.floor(time / 60)
  const ss = time % 60
  const label = `${mm}:${String(ss).padStart(2, '0')}`

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#221820' : '#1A1217',
        border: `1px solid ${flash ? a.color : hover ? `${a.color}66` : `${a.color}33`}`,
        boxShadow: flash ? `0 0 32px ${a.color}44, 0 8px 32px rgba(0,0,0,0.4)` : hover ? `0 8px 24px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
        borderRadius: '10px', overflow: 'hidden',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #2E2028', background: `${a.color}0d` }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: a.color }} />
          <span className="text-[10px] font-black tracking-widest font-mono" style={{ color: a.color }}>{a.sav}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#DC2626', color: '#fff' }}>LIVE</span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: '#5A4F4A' }}>#{idx + 1}</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: a.color, background: `${a.color}1a` }}>{a.badge}</span>
          <span className="text-[10px]" style={{ color: '#5A4F4A' }}>{a.kat}</span>
        </div>
        <p className="font-bold text-sm mb-2.5" style={{ color: '#F5F0E8' }}>{a.nev}</p>
        <div className="flex items-end justify-between pt-2.5" style={{ borderTop: '1px solid #2E2028' }}>
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#5A4F4A' }}>Current bid</p>
            <p className="text-base font-black tabular-nums font-mono"
              style={{ color: flash ? '#EAB308' : a.color, transform: bidJump ? 'scale(1.15)' : 'scale(1)', transition: 'color 0.3s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'inline-block' }}>
              €{bid.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#5A4F4A' }}>Time left</p>
            <p className="text-base font-black font-mono tabular-nums"
              style={{ color: urgent ? '#DC2626' : '#F5F0E8' }}>
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const KAT_SZIN: Record<string, string> = {
  'SaaS / Software': '#8B5CF6',
  'E-commerce':      '#F97316',
  'Mobile App':      '#3B82F6',
  'Content / Blog':  '#F43F5E',
  'Marketplace':     '#14B8A6',
  'Fintech':         '#06B6D4',
  'Edtech':          '#3B82F6',
  'Healthtech':      '#EC4899',
  'Környezet':       '#22C55E',
  'Oktatás':         '#60A5FA',
  'Egészség':        '#F472B6',
  'Tech / SaaS':     '#A78BFA',
  'Mezőgazdaság':    '#F59E0B',
  'Pénzügy':         '#22D3EE',
  'Közlekedés':      '#FB923C',
  'Ingatlan':        '#2DD4BF',
  'Sport / Wellness':'#84CC16',
  'AI / Robotika':   '#C084FC',
  'Other':           '#94A3B8',
}

type LiveProjekt = {
  id: string; nev: string; rovid_leiras: string; kategoria: string
  badge: string; kikialtasi_ar: number; lejarat: string | null
}

function LiveCountdown({ lejarat }: { lejarat: string | null }) {
  const [label, setLabel] = useState('--:--')
  useEffect(() => {
    if (!lejarat) return
    const tick = () => {
      const diff = Math.max(0, new Date(lejarat).getTime() - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLabel(h > 0 ? `${h}ó ${m}p` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [lejarat])
  return <span>{label}</span>
}

function LiveListings() {
  const [projektek, setProjektek] = useState<LiveProjekt[]>([])
  const [sorban, setSorban] = useState<KirakatElem[]>([])
  const [aktKat, setAktKat] = useState('Összes')
  const [kereses, setKereses] = useState('')

  useEffect(() => {
    // A projektek táblát RLS védi, anon kulccsal nem olvasható. A publikus
    // kirakat szerveroldalon készül, és a várólistáról csak anonimizált
    // mezőket ad vissza.
    fetch('/api/kirakat')
      .then(r => r.json())
      .then(d => { setProjektek(d.elo ?? []); setSorban(d.sorban ?? []) })
      .catch(() => {})
  }, [])

  const kategoriak = ['Összes', ...Array.from(new Set(projektek.map(p => p.kategoria).filter(Boolean)))]

  const szurt = projektek.filter(p => {
    const katOk = aktKat === 'Összes' || p.kategoria === aktKat
    const kOk = !kereses || p.nev.toLowerCase().includes(kereses.toLowerCase()) || p.rovid_leiras.toLowerCase().includes(kereses.toLowerCase())
    return katOk && kOk
  })

  const badgeLabel: Record<string, string> = { idea: 'Concept', prototype: 'Prototype', proven: 'Proven' }
  const badgeColor: Record<string, string> = { idea: '#22C55E', prototype: '#EAB308', proven: '#DC2626' }

  return (
    <section className="relative z-10 px-6 pb-24" style={{ borderTop: '1px solid #1F1519' }}>
      <div className="max-w-5xl mx-auto pt-24">
        <ScrollReveal>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
              <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#DC2626' }}>Élő aukciók</p>
            </div>
            <h2 className="font-black mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
              Mit lehet most megvenni?
            </h2>
            <p className="text-sm" style={{ color: '#9C8B7A' }}>
              Böngészés ingyenes — licitáláshoz regisztráció szükséges
            </p>
          </div>
        </ScrollReveal>

        {/* Kereső */}
        <ScrollReveal>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Keresés az ötletek között..."
              value={kereses}
              onChange={e => setKereses(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition"
              style={{ background: '#1A1217', border: '1px solid #2E2028', color: '#F5F0E8' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')}
            />
          </div>
        </ScrollReveal>

        {/* Kategória szűrő */}
        {kategoriak.length > 1 && (
          <ScrollReveal>
            <div className="flex flex-wrap gap-2 mb-8">
              {kategoriak.map(k => {
                const szin = k === 'Összes' ? '#DC2626' : (KAT_SZIN[k] ?? '#94A3B8')
                const aktiv = aktKat === k
                return (
                  <button
                    key={k}
                    onClick={() => setAktKat(k)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      border: `1.5px solid ${aktiv ? szin : '#2E2028'}`,
                      background: aktiv ? `${szin}18` : 'transparent',
                      color: aktiv ? szin : '#5A4F4A',
                    }}>
                    {k}
                  </button>
                )
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Lista */}
        {projektek.length === 0 ? (
          sorban.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#3D3035' }}>
              <p className="text-2xl mb-2">—</p>
              <p className="text-sm">Hamarosan érkeznek az első ötletek</p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <p className="text-sm mb-1" style={{ color: '#F5F0E8' }}>
                  <span className="font-black">{sorban.length}</span> ötlet vár az első aukcióra
                </p>
                <p className="text-xs" style={{ color: '#5A4F4A' }}>
                  A részletek induláskor derülnek ki — addig védve vannak a másolástól
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sorban.map((k, i) => (
                  <ScrollReveal key={k.id} delay={i * 40}>
                    <div className="rounded-xl overflow-hidden h-full"
                      style={{ background: '#1A1217', border: '1px solid #2E2028' }}>
                      <div className="h-0.5 w-full" style={{ background: k.szin }} />
                      <div className="p-4">
                        <p className="text-[10px] font-black tracking-widest uppercase mb-2 truncate" style={{ color: k.szin }}>
                          {k.cimke}
                        </p>
                        <p className="text-sm font-bold mb-1" style={{ color: '#3D3035', letterSpacing: '0.15em' }}>
                          ● ● ● ● ● ● ●
                        </p>
                        <p className="text-[11px] mb-3" style={{ color: '#5A4F4A' }}>
                          Induláskor derül ki
                        </p>
                        <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid #2E2028' }}>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: k.szin, background: `${k.szin}18` }}>{k.erettseg}</span>
                          <span className="text-[11px] tabular-nums" style={{ color: '#9C8B7A' }}>{k.arsav}</span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="text-center mt-8">
                <a href="/auth?tab=register"
                  className="inline-block px-6 py-3 rounded-xl font-black text-sm transition-all"
                  style={{ background: '#DC2626', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Értesíts amikor indul →
                </a>
              </div>
            </div>
          )
        ) : szurt.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#5A4F4A' }}>
            <p className="text-sm">Nincs találat</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {szurt.map((p, i) => {
              const szin = KAT_SZIN[p.kategoria] ?? '#94A3B8'
              return (
                <ScrollReveal key={p.id} delay={i * 40}>
                  <div className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
                    style={{ background: '#1A1217', border: `1px solid #2E2028` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${szin}44`; e.currentTarget.style.background = '#1F141C' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2028'; e.currentTarget.style.background = '#1A1217' }}>

                    {/* Színes bal sáv */}
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: szin }} />

                    {/* Tartalom */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: szin }}>{p.kategoria}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: badgeColor[p.badge] ?? '#94A3B8', background: `${badgeColor[p.badge] ?? '#94A3B8'}18` }}>
                          {badgeLabel[p.badge] ?? p.badge}
                        </span>
                      </div>
                      <p className="font-bold text-sm truncate" style={{ color: '#F5F0E8' }}>{p.nev}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#5A4F4A' }}>{p.rovid_leiras}</p>
                    </div>

                    {/* Ár + idő */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-xs mb-0.5" style={{ color: '#5A4F4A' }}>Kikiáltási ár</p>
                      <p className="font-black text-sm tabular-nums" style={{ color: '#F5F0E8' }}>€{p.kikialtasi_ar.toLocaleString()}</p>
                      <p className="text-[10px] tabular-nums mt-0.5" style={{ color: '#DC2626' }}>
                        <LiveCountdown lejarat={p.lejarat} />
                      </p>
                    </div>

                    {/* CTA */}
                    <a href="/auth?tab=register"
                      className="flex-shrink-0 text-xs font-black px-4 py-2 rounded-lg transition-all"
                      style={{ background: `${szin}18`, color: szin, border: `1px solid ${szin}44` }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${szin}30` }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${szin}18` }}>
                      Regisztrálj →
                    </a>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        )}

        {szurt.length > 0 && (
          <div className="text-center mt-8">
            <a href="/aukciosHaz"
              className="text-sm font-bold transition-colors"
              style={{ color: '#DC2626' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#DC2626')}>
              Összes aukció megtekintése →
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const [email, setEmail]       = useState('')
  const [allapot, setAllapot]   = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [waitlist, setWaitlist] = useState<number | null>(null)
  const [display, setDisplay]   = useState(0)
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    fetch('/api/waitlist-count').then(r => r.json()).then(d => setWaitlist(d.count ?? 0)).catch(() => setWaitlist(0))
    setTimeout(() => setVisible(true), 60)
  }, [])

  useEffect(() => {
    if (!waitlist) { setDisplay(0); return }
    let cur = 0
    const step = Math.max(1, Math.ceil(waitlist / 60))
    const t = setInterval(() => { cur = Math.min(cur + step, waitlist); setDisplay(cur); if (cur >= waitlist) clearInterval(t) }, 16)
    return () => clearInterval(t)
  }, [waitlist])

  const launched = waitlist !== null && waitlist >= MAX_WAITLIST
  const pct = waitlist !== null ? Math.min(100, Math.round((waitlist / MAX_WAITLIST) * 100)) : 0

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')
    const { error } = await supabase.from('feliratkozok').insert([{ email }])
    if (error) { setAllapot(error.code === '23505' ? 'siker' : 'hiba') }
    else { setAllapot('siker'); setEmail(''); setWaitlist(p => (p ?? 0) + 1) }
  }

  return (
    <main style={{ background: '#0D0A0C', color: '#F5F0E8' }} className="min-h-screen overflow-hidden">

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Mesh gradient aurora */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220,38,38,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(234,179,8,0.05) 0%, transparent 50%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(220,38,38,0.04) 0%, transparent 60%)'
        }} />
        {/* Dot grid */}
        <div className="absolute inset-0" style={{ opacity: 0.015, backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-10 py-4"
        style={{ borderBottom: '1px solid rgba(46,32,40,0.6)', backdropFilter: 'blur(12px)', background: 'rgba(13,10,12,0.8)' }}>
        <span className="text-xl font-black tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </span>
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: 'Aukciós Ház', href: '/aukciosHaz' },
            { label: 'Hogyan működik?', href: '#how' },
            { label: 'FAQ', href: '#faq' },
          ].map(link => (
            <a key={link.label} href={link.href}
              className="text-sm transition-colors"
              style={{ color: '#9C8B7A' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a href="/auth" className="text-sm font-bold px-5 py-2.5 rounded-lg transition-all"
            style={{ background: '#DC2626', color: '#fff', boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.boxShadow = '0 0 30px rgba(220,38,38,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.boxShadow = '0 0 20px rgba(220,38,38,0.3)' }}>
            {launched ? 'Kezdés →' : 'Bejelentkezés'}
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: 'all 0.8s ease' }}>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-8"
            style={{ color: '#EAB308', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.18)', padding: '6px 14px', borderRadius: '6px' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#EAB308' }} />
            Startup · Aukciós Ház
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 6.5vw, 5rem)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: '1.75rem' }}>
            <span className="block" style={{ color: '#F5F0E8' }}>Buy &amp; sell</span>
            <span className="block" style={{ color: '#DC2626', textShadow: '0 0 60px rgba(220,38,38,0.3)' }}>validated</span>
            <span className="block" style={{ color: '#F5F0E8' }}>startups.</span>
          </h1>

          <p className="mb-10 leading-relaxed text-base" style={{ color: '#9C8B7A', maxWidth: '420px' }}>
            Fejleszd az ötletedet AI-jal, majd árverezd el komoly vevőknek — átláthatóan, biztonságosan, teljes letéti védelemmel.
          </p>

          {allapot === 'siker' ? (
            <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '12px', padding: '28px 32px' }} className="max-w-md">
              <p className="font-black text-lg mb-1" style={{ color: '#DC2626' }}>Felkerültél a listára!</p>
              <p className="text-sm mb-5" style={{ color: '#9C8B7A' }}>Értesítünk amint elindulunk.</p>
              <a href="/auth" className="inline-block text-sm font-bold px-5 py-2.5 rounded-lg"
                style={{ background: '#DC2626', color: '#fff' }}>
                Élő aukciók böngészése →
              </a>
            </div>
          ) : (
            <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-md">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-mail cím"
                className="flex-1 text-sm focus:outline-none transition-all"
                style={{ background: '#1A1217', border: '1px solid #2E2028', borderRadius: '10px', padding: '13px 18px', color: '#F5F0E8' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
              <button type="submit" disabled={allapot === 'loading'}
                className="text-sm font-black whitespace-nowrap transition-all"
                style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', color: '#fff', borderRadius: '10px', padding: '13px 24px', boxShadow: '0 4px 20px rgba(220,38,38,0.35)', opacity: allapot === 'loading' ? 0.6 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 30px rgba(220,38,38,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(220,38,38,0.35)')}>
                {allapot === 'loading' ? 'Küldés...' : 'Csatlakozás →'}
              </button>
            </form>
          )}

          {allapot === 'hiba' && <p className="text-xs mt-2" style={{ color: '#EF4444' }}>Hiba történt. Kérjük próbáld újra.</p>}

          {/* Waitlist progress */}
          <div className="mt-8 max-w-md">
            <div className="flex justify-between text-xs mb-2.5">
              <span style={{ color: '#9C8B7A' }}>
                {waitlist !== null
                  ? <><span className="font-black tabular-nums" style={{ color: '#EAB308' }}>{display.toLocaleString()}</span> korai feliratkozó</>
                  : <span style={{ color: '#5A4F4A' }}>Betöltés...</span>}
              </span>
              <span style={{ color: '#5A4F4A' }}>{MAX_WAITLIST.toLocaleString()} a cél</span>
            </div>
            <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: '#2E2028' }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #EAB308, #F59E0B)', boxShadow: '0 0 12px rgba(234,179,8,0.6)' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#5A4F4A' }}>
              {launched
                ? <span style={{ color: '#EAB308', fontWeight: 700 }}>Platform élő</span>
                : waitlist !== null ? `Még ${(MAX_WAITLIST - waitlist).toLocaleString()} hely a teljes elindulásig` : ''}
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: '🔒', label: 'Letéti védelem' },
              { icon: '💳', label: 'Stripe fizetés' },
              { icon: '🎭', label: 'Anonim licitálás' },
            ].map(b => (
              <span key={b.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ color: '#5A4F4A', border: '1px solid #2E2028' }}>
                <span>{b.icon}</span>{b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Live auction preview */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)', transition: 'all 0.8s 0.2s ease' }}>
          <div className="relative max-w-sm mx-auto lg:ml-auto lg:mr-0">
            <div className="absolute inset-0 blur-3xl rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.1), transparent)' }} />
            <div className="relative p-4 rounded-2xl" style={{ background: 'rgba(26,18,23,0.8)', border: '1px solid #2E2028', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#5A4F4A' }}>Élő Aukciós Ház Preview</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {PREVIEW_AUCTIONS.map((a, i) => <AuctionCard key={a.id} a={a} idx={i} />)}
              </div>
              <p className="text-center text-xs mt-3" style={{ color: '#5A4F4A' }}>
                Valós projektek · valós ajánlatok ·{' '}
                <a href="/auth" style={{ color: '#EAB308' }}>Összes megtekintése →</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS / TRUST STRIP ── */}
      <ScrollReveal>
        <div className="relative z-10 py-12 px-6" style={{ borderTop: '1px solid #1F1519', borderBottom: '1px solid #1F1519', background: 'rgba(26,18,23,0.5)' }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs font-bold tracking-widest uppercase mb-8" style={{ color: '#5A4F4A' }}>Miért bíznak bennünk</p>
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-20">
              {[
                { val: '3 perc', label: 'Leggyorsabb aukció', icon: '⚡' },
                { val: '10%',    label: 'Platform díj',       icon: '💎' },
                { val: '100%',   label: 'Letéti védelem',     icon: '🔒' },
                { val: 'AI',     label: 'Validáció',          icon: '🤖' },
              ].map((s, i) => (
                <ScrollReveal key={s.label} delay={i * 80}>
                  <div className="text-center group cursor-default">
                    <div className="text-xl mb-2">{s.icon}</div>
                    <p className="text-2xl font-black tabular-nums transition-all duration-300 group-hover:scale-110"
                      style={{ color: '#EAB308', letterSpacing: '-0.02em', display: 'inline-block', textShadow: '0 0 20px rgba(234,179,8,0.3)' }}>{s.val}</p>
                    <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#5A4F4A' }}>{s.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: '#DC2626' }}>A folyamat</p>
              <h2 className="font-black" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
                Hogyan működik a BidVip?
              </h2>
              <p className="mt-4 text-sm max-w-md mx-auto" style={{ color: '#9C8B7A' }}>
                Három egyszerű lépés az ötlettől az eladásig
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01', icon: '🤖', accent: '#DC2626',
                title: 'AI Fejlesztés',
                desc: 'Az AI segít strukturálni, validálni és dokumentálni a projektedet — szakértői visszajelzéssel mielőtt piacra kerülne.',
              },
              {
                step: '02', icon: '🏛️', accent: '#EAB308',
                title: 'Aukciós Ház',
                desc: 'Időkorlátozott licitálás — Gyors (3 perc), Standard (5 perc) vagy Prémium (20 perc) csatornán.',
              },
              {
                step: '03', icon: '🔒', accent: '#16A34A',
                title: 'Biztonságos átadás',
                desc: 'A vevő Stripe-on fizet. A pénzt letétben tartjuk. Az eladó csak az összes fájl és hozzáférés átadása után kap fizetést.',
              },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 120}>
                <div className="relative p-7 rounded-2xl h-full overflow-hidden group"
                  style={{ background: '#130F12', border: '1px solid #2E2028', transition: 'border-color 0.3s, transform 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent + '55'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2028'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${s.accent}88, transparent)` }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                    style={{ background: `${s.accent}12`, border: `1px solid ${s.accent}25` }}>
                    {s.icon}
                  </div>
                  <span className="text-xs font-black tracking-widest uppercase mb-3 block" style={{ color: s.accent }}>{s.step}</span>
                  <h3 className="font-black text-lg mb-3" style={{ color: '#F5F0E8', letterSpacing: '-0.02em' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#9C8B7A' }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: '#DC2626' }}>Funkciók</p>
              <h2 className="font-black" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
                Mindent ami kell
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: 'Valós idejű licitálás', desc: 'Live ajánlatok frissítése, visszaszámlálás és automatikus nyertes meghatározás.', accent: '#EAB308' },
              { icon: '🤖', title: 'AI Validáció', desc: 'Automatikus projekt elemzés, piaci pozicionálás és értékelési javaslat.', accent: '#DC2626' },
              { icon: '🔒', title: 'Letéti védelem', desc: 'A pénz biztonságban van amíg az átadás meg nem történik — mindkét félnek.', accent: '#16A34A' },
              { icon: '🎭', title: 'Anonim licitálás', desc: 'Valódi identitás csak sikeres eladás után kerül megosztásra.', accent: '#8B5CF6' },
              { icon: '💳', title: 'Stripe fizetés', desc: 'Biztonságos, azonnali fizetési feldolgozás minden főbb kártyával.', accent: '#3B82F6' },
              { icon: '📊', title: 'Részletes statisztikák', desc: 'Projekt nézettség, licit előzmények és piaci trendek elemzése.', accent: '#F97316' },
            ].map((f, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="p-6 rounded-2xl group cursor-default"
                  style={{ background: '#130F12', border: '1px solid #2E2028', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = f.accent + '44'; e.currentTarget.style.background = '#180E15' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2028'; e.currentTarget.style.background = '#130F12' }}>
                  <div className="text-2xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: '#F5F0E8' }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#9C8B7A' }}>{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <LiveListings />

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 px-6 pb-24" style={{ borderTop: '1px solid #1F1519' }}>
        <div className="max-w-2xl mx-auto pt-24">
          <ScrollReveal>
            <div className="mb-12">
              <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: '#DC2626' }}>FAQ</p>
              <h2 className="font-black" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
                Gyakran ismételt kérdések
              </h2>
            </div>
          </ScrollReveal>
          <div className="flex flex-col gap-2">
            {[
              { q: 'Hogyan működik az aukció?', a: 'Minden projekt egy időkeretet kap — Gyors (3 perc), Standard (5 perc) vagy Prémium (20 perc). Az aukció végén a legmagasabb ajánlatot tevő nyer. Automatikus licitálással is beállíthatod a maximumodat.' },
              { q: 'Mi az a letéti védelem?', a: 'A nyertes vevő Stripe-on keresztül fizet. A BidVip tárolja a pénzt. Az eladó átadja az összes fájlt és hozzáférést — csak ezután kerül kifizetésre. Egyik fél sem veszíthet.' },
              { q: 'Kell tokeneket venni a licitáláshoz?', a: 'Nem. A licitálás ingyenes. A tokenek csak AI funkciókhoz (projekt elemzés, 1 €/db) és eladói sorrend-előnyhöz szükségesek.' },
              { q: 'Hogyan védett az identitásom?', a: 'Minden vevő és eladó véletlenszerűen generált névvel jelenik meg. Valódi személyazonosság csak sikeres eladás után, az átadás részeként kerül megosztásra.' },
              { q: 'Mennyi a platform díj?', a: 'A BidVip a végső eladási ár 10%-át veszi el, amit az eladó fizet. Nincs listázási vagy vevői díj — csak sikeres eladásnál fizetsz.' },
            ].map((faq, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <FaqItem q={faq.q} a={faq.a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <ScrollReveal>
        <section className="relative z-10 px-6 pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative p-14 rounded-2xl overflow-hidden"
              style={{ background: '#130F12', border: '1px solid #2E2028' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(220,38,38,0.08) 0%, transparent 70%)' }} />
              <div className="relative">
                <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: '#DC2626' }}>Készen állsz?</p>
                <h2 className="font-black mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
                  Kezdd el ma az első<br />aukciót
                </h2>
                <p className="text-sm mb-8" style={{ color: '#9C8B7A', maxWidth: '380px', margin: '0 auto 2rem' }}>
                  Csatlakozz a várólistához és értesítünk az induláskor. Nincs spam, bármikor leiratkozhatsz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/auth"
                    className="text-sm font-black px-8 py-3.5 rounded-xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', color: '#fff', boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 30px rgba(220,38,38,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(220,38,38,0.4)')}>
                    Aukciók böngészése →
                  </a>
                  <a href="/auth"
                    className="text-sm font-bold px-8 py-3.5 rounded-xl transition-all"
                    style={{ border: '1px solid #2E2028', color: '#9C8B7A' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#5A4F4A'; e.currentTarget.style.color = '#F5F0E8' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2028'; e.currentTarget.style.color = '#9C8B7A' }}>
                    Regisztráció
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 lg:px-10 py-12" style={{ borderTop: '1px solid #1F1519' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <span className="font-black text-xl block mb-3" style={{ letterSpacing: '-0.03em' }}>
                Bid<span style={{ color: '#DC2626' }}>Vip</span>
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#5A4F4A', maxWidth: '220px' }}>
                A startup ötlet aukciós piactér — AI validációval és letéti védelemmel.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#5A4F4A' }}>Platform</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Aukciós Ház', href: '/aukciosHaz' },
                  { label: 'Projekt beküldése', href: '/submit' },
                  { label: 'Bejelentkezés', href: '/aukciosHaz' },
                ].map(l => (
                  <a key={l.label} href={l.href} className="text-xs transition-colors"
                    style={{ color: '#9C8B7A' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#5A4F4A' }}>Értesítés induláskor</p>
              <form onSubmit={subscribe} className="flex gap-2">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="E-mail cím"
                  className="flex-1 text-xs focus:outline-none"
                  style={{ background: '#1A1217', border: '1px solid #2E2028', borderRadius: '8px', padding: '10px 14px', color: '#F5F0E8' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
                <button type="submit"
                  className="text-xs font-bold px-4 py-2 rounded-lg transition-all"
                  style={{ background: '#DC2626', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                  Küldés
                </button>
              </form>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid #1F1519' }}>
            <p className="text-xs" style={{ color: '#3D3035' }}>© 2026 BidVip. Minden jog fenntartva.</p>
            <div className="flex items-center gap-4">
              {['Stripe', 'Supabase', 'Vercel'].map(t => (
                <span key={t} className="text-xs" style={{ color: '#3D3035' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
