'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_WAITLIST = 2000

/* Preview auction data — channels match the real marketplace */
const PREVIEW_AUCTIONS = [
  { id: 1, nev: 'TaskFlow AI',  kat: 'SaaS / Software', bid: 4800, badge: 'Proven',    sav: 'PREMIUM',  color: '#DC2626', time: 847 },
  { id: 2, nev: 'LocalEats',    kat: 'Marketplace',     bid: 1250, badge: 'Prototype', sav: 'STANDARD', color: '#F97316', time: 192 },
  { id: 3, nev: 'GreenTrack',   kat: 'Healthtech',      bid: 320,  badge: 'Concept',   sav: 'FAST',     color: '#EAB308', time: 54  },
]

/* ── Scroll-reveal wrapper ── */
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      {children}
    </div>
  )
}

/* ── FAQ accordion ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderColor: '#2E2028', background: open ? '#1A1217' : 'transparent' }}
      className="border rounded-lg overflow-hidden transition-colors duration-200">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition"
        style={{ color: '#F5F0E8' }}>
        <span className="font-semibold text-sm pr-4">{q}</span>
        <span className="text-lg transition-transform duration-200 shrink-0"
          style={{ color: '#9C8B7A', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 text-sm leading-relaxed" style={{ color: '#9C8B7A', borderTop: '1px solid #2E2028' }}>
          {a}
        </div>
      )}
    </div>
  )
}

/* ── Live auction preview card ── */
function AuctionCard({ a, idx }: { a: typeof PREVIEW_AUCTIONS[0]; idx: number }) {
  const [bid, setBid] = useState(a.bid)
  const [time, setTime] = useState(a.time)
  const [flash, setFlash] = useState(false)
  const DELAYS = [4200, 6800, 9500]

  useEffect(() => {
    const t = setInterval(() => setTime(s => s > 0 ? s - 1 : a.time), 1000)
    const b = setInterval(() => {
      setBid(prev => {
        const next = prev + Math.floor(Math.random() * 80 + 25)
        setFlash(true)
        setTimeout(() => setFlash(false), 500)
        return next
      })
    }, DELAYS[idx])
    return () => { clearInterval(t); clearInterval(b) }
  }, [a.time, idx])

  const urgent = time < 60
  const mm = Math.floor(time / 60)
  const ss = time % 60
  const label = `${mm}:${String(ss).padStart(2, '0')}`

  return (
    <div style={{
      background: '#1A1217',
      borderColor: flash ? a.color : `${a.color}44`,
      boxShadow: flash ? `0 0 24px ${a.color}33` : 'none',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }} className="border rounded-lg overflow-hidden">
      {/* Channel bar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #2E2028', background: `${a.color}0d` }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: a.color }} />
          <span className="text-[10px] font-black tracking-widest font-mono" style={{ color: a.color }}>{a.sav}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#DC2626', color: '#fff' }}>LIVE</span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: '#5A4F4A' }}>#{idx + 1}</span>
      </div>
      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: a.color, background: `${a.color}1a` }}>{a.badge}</span>
          <span className="text-[10px]" style={{ color: '#5A4F4A' }}>{a.kat}</span>
        </div>
        <p className="font-bold text-sm mb-2.5" style={{ color: '#F5F0E8' }}>{a.nev}</p>
        <div className="flex items-end justify-between pt-2.5" style={{ borderTop: '1px solid #2E2028' }}>
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#5A4F4A' }}>Current bid</p>
            <p className="text-base font-black tabular-nums font-mono transition-colors duration-300"
              style={{ color: flash ? '#EAB308' : a.color }}>
              €{bid.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#5A4F4A' }}>Time left</p>
            <p className="text-base font-black font-mono tabular-nums"
              style={{ color: urgent ? '#DC2626' : '#F5F0E8', animation: urgent ? 'urgentPulse 1s infinite' : 'none' }}>
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
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
    <main style={{ background: '#100C0F', color: '#F5F0E8' }} className="min-h-screen overflow-hidden">

      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.018,
        backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Warm ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 65%)' }} />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid #2E2028', backdropFilter: 'blur(8px)' }}>
        <span className="text-2xl font-black tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: '#EAB308', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', padding: '5px 12px', borderRadius: '999px' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#EAB308' }} />
            Live now
          </div>
          <a href="/marketplace" className="text-sm transition px-4 py-2 rounded-lg"
            style={{ color: '#9C8B7A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9C8B7A')}>
            Aukciós Ház
          </a>
          <a href="/auth" className="text-sm font-bold px-5 py-2.5 rounded-lg transition"
            style={{ background: '#DC2626', color: '#fff', boxShadow: '0 0 20px rgba(220,38,38,0.25)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
            {launched ? 'Get Started →' : 'Sign In'}
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12 lg:pt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left: copy + form */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transition: 'all 0.7s ease' }}>

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-8"
            style={{ color: '#EAB308', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#EAB308' }} />
            Startup · Aukciós Ház
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 0.93, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
            <span className="block" style={{ color: '#F5F0E8' }}>Buy &amp; sell</span>
            <span className="block" style={{ color: '#DC2626' }}>validated</span>
            <span className="block" style={{ color: '#F5F0E8' }}>startups.</span>
          </h1>

          <p className="mb-10 leading-relaxed" style={{ color: '#9C8B7A', fontSize: '1.05rem', maxWidth: '440px' }}>
            Develop your idea with AI, then auction it to serious buyers — transparently, securely, with full escrow protection.
          </p>

          {/* Waitlist form */}
          {allapot === 'siker' ? (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', padding: '28px 32px' }} className="text-center max-w-md">
              <p className="font-black text-lg mb-1" style={{ color: '#DC2626' }}>You&apos;re on the list.</p>
              <p className="text-sm mb-5" style={{ color: '#9C8B7A' }}>We&apos;ll notify you the moment we launch.</p>
              <a href="/marketplace" className="inline-block text-sm font-bold px-5 py-2.5 rounded-lg"
                style={{ background: '#DC2626', color: '#fff' }}>
                Browse live auctions →
              </a>
            </div>
          ) : (
            <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 text-sm focus:outline-none transition"
                style={{ background: '#1A1217', border: '1px solid #2E2028', borderRadius: '8px',
                  padding: '12px 18px', color: '#F5F0E8' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#DC2626')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2E2028')} />
              <button type="submit" disabled={allapot === 'loading'}
                className="text-sm font-black whitespace-nowrap transition"
                style={{ background: '#DC2626', color: '#fff', borderRadius: '8px', padding: '12px 22px',
                  boxShadow: '0 0 24px rgba(220,38,38,0.3)', opacity: allapot === 'loading' ? 0.6 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
                {allapot === 'loading' ? 'Sending...' : 'Join Waitlist'}
              </button>
            </form>
          )}

          {allapot === 'hiba' && <p className="text-xs mt-2" style={{ color: '#EF4444' }}>Something went wrong. Please try again.</p>}

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <p className="text-xs" style={{ color: '#5A4F4A' }}>No spam. Unsubscribe anytime.</p>
            <a href="/marketplace" className="text-xs transition"
              style={{ color: '#5A4F4A' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EAB308')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5A4F4A')}>
              Browse without signing up →
            </a>
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-md">
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: '#9C8B7A' }}>
                {waitlist !== null
                  ? <><span className="font-black tabular-nums" style={{ color: '#EAB308' }}>{display.toLocaleString()}</span> early signups</>
                  : <span style={{ color: '#5A4F4A' }}>Loading...</span>}
              </span>
              <span style={{ color: '#5A4F4A' }}>{MAX_WAITLIST.toLocaleString()} goal</span>
            </div>
            <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: '#2E2028' }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #EAB308, #F59E0B)', boxShadow: '0 0 10px rgba(234,179,8,0.5)' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#5A4F4A' }}>
              {launched
                ? <span style={{ color: '#EAB308', fontWeight: 700 }}>Platform is live</span>
                : waitlist !== null ? `${(MAX_WAITLIST - waitlist).toLocaleString()} spots left until full launch` : ''}
            </p>
          </div>
        </div>

        {/* Right: live auction preview */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)', transition: 'all 0.7s 0.25s ease' }}>
          <div className="relative max-w-sm mx-auto lg:ml-auto lg:mr-0">
            {/* ambient glow behind cards */}
            <div className="absolute inset-6 blur-3xl rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.08), transparent)' }} />
            <div className="relative flex flex-col gap-2.5">
              <div className="flex items-center gap-2 mb-1 pl-0.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#5A4F4A' }}>Élő Aukciós Ház Preview</span>
              </div>
              {PREVIEW_AUCTIONS.map((a, i) => <AuctionCard key={a.id} a={a} idx={i} />)}
              <p className="text-center text-xs mt-1" style={{ color: '#5A4F4A' }}>
                Real projects · real bids · real money ·{' '}
                <a href="/marketplace" className="transition"
                  style={{ color: '#EAB308' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#EAB308')}>
                  View all →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <ScrollReveal>
        <div className="relative z-10 py-8 px-6" style={{ borderTop: '1px solid #2E2028', borderBottom: '1px solid #2E2028' }}>
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-10 md:gap-20">
            {[
              { val: '3 min', label: 'Fastest auction' },
              { val: '10%',   label: 'Platform fee' },
              { val: '100%',  label: 'Escrow protected' },
              { val: 'AI',    label: 'Powered validation' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black tabular-nums" style={{ color: '#EAB308', letterSpacing: '-0.02em' }}>{s.val}</p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#5A4F4A' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="mb-14">
              <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: '#DC2626' }}>The process</p>
              <h2 className="font-black" style={{ fontSize: '2rem', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
                How BidVip works
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: '#2E2028', borderRadius: '8px', overflow: 'hidden' }}>
            {[
              { step: 'Step 1', title: 'AI Development',  desc: 'Our AI helps you structure, validate, and document your project with expert feedback before it hits the market.' },
              { step: 'Step 2', title: 'Aukciós Ház',     desc: 'Time-limited bidding in our Auction House — Fast (3 min), Standard (5 min), or Premium (20 min) channels.' },
              { step: 'Step 3', title: 'Secure Handover', desc: 'Buyer pays via Stripe. We hold funds in escrow. Seller gets paid only after delivering all files and credentials.' },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="group p-7 h-full transition-colors duration-200"
                  style={{ background: '#1A1217' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#221820')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1A1217')}>
                  <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: '#DC2626' }}>{s.step}</p>
                  <h3 className="font-black text-lg mb-3 transition-colors duration-200"
                    style={{ color: '#F5F0E8', letterSpacing: '-0.02em' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EAB308')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#F5F0E8')}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#9C8B7A' }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 py-20" style={{ borderTop: '1px solid #2E2028' }}>
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <div className="mb-12">
              <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: '#DC2626' }}>FAQ</p>
              <h2 className="font-black" style={{ fontSize: '2rem', letterSpacing: '-0.03em', color: '#F5F0E8' }}>
                Frequently asked questions
              </h2>
            </div>
          </ScrollReveal>
          <div className="flex flex-col gap-2">
            {[
              { q: 'How does the auction work?', a: 'Each project gets a time slot — Fast (3 min), Standard (5 min), or Premium (20 min). The highest bidder at the end wins. You can also use proxy bidding to auto-bid up to your maximum.' },
              { q: 'What is escrow protection?', a: 'The winning buyer pays through Stripe. BidVip holds the funds. The seller delivers all files and credentials — only then is the payment released. Neither party can lose money.' },
              { q: 'Do I need tokens to bid?', a: 'No. Bidding is free. Tokens are only used for AI features (project analysis for €1 each) and seller priority boosting to move up the queue.' },
              { q: 'How is my identity protected?', a: 'All buyers and sellers appear under randomly generated anonymous names. Real identities are only exchanged after a successful sale, as part of the handover.' },
              { q: "What's the platform fee?", a: 'BidVip takes 10% of the final sale price, paid by the seller. There are no listing fees or buyer fees — just pay if you sell.' },
            ].map((faq, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <FaqItem q={faq.q} a={faq.a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="relative z-10 px-6 py-10" style={{ borderTop: '1px solid #2E2028' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-lg" style={{ color: '#F5F0E8', letterSpacing: '-0.02em' }}>
            Bid<span style={{ color: '#DC2626' }}>Vip</span>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: '#5A4F4A' }}>
            {['Stripe Payments', 'AI-Powered', 'Escrow Protected', 'Anonymous Bidding', 'Real-time Updates'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#5A4F4A' }}>© 2026 BidVip</p>
        </div>
      </div>
    </main>
  )
}
