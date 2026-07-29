'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_WAITLIST = 2000
const BID_DELAYS = [4200, 6800, 9500]

const PREVIEW_AUCTIONS = [
  { id: 1, nev: 'TaskFlow AI', kat: 'SaaS / Software', bid: 4800, badge: '✅ Proven',    sav: 'PREMIUM',  color: '#ef4444', time: 847 },
  { id: 2, nev: 'LocalEats',   kat: 'Marketplace',     bid: 1250, badge: '🛠️ Prototype', sav: 'STANDARD', color: '#eab308', time: 192 },
  { id: 3, nev: 'GreenTrack',  kat: 'Healthtech',      bid: 320,  badge: '🌱 Concept',   sav: 'FAST',     color: '#22c55e', time: 54  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden transition">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-900/40 transition"
      >
        <span className="font-semibold text-sm pr-4">{q}</span>
        <span className={`text-gray-500 text-lg transition-transform duration-200 shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-800/60 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

function AuctionCard({ a, idx }: { a: typeof PREVIEW_AUCTIONS[0]; idx: number }) {
  const [bid, setBid] = useState(a.bid)
  const [time, setTime] = useState(a.time)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(s => (s > 0 ? s - 1 : a.time)), 1000)
    const b = setInterval(() => {
      setBid(prev => {
        const next = prev + Math.floor(Math.random() * 80 + 25)
        setFlash(true)
        setTimeout(() => setFlash(false), 600)
        return next
      })
    }, BID_DELAYS[idx])
    return () => { clearInterval(t); clearInterval(b) }
  }, [a.time, idx])

  const urgent = time < 60
  const mm = Math.floor(time / 60)
  const ss = time % 60

  return (
    <div
      style={{
        borderColor: flash ? a.color : `${a.color}33`,
        boxShadow: flash ? `0 0 28px ${a.color}44` : `0 0 10px ${a.color}11`,
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
      }}
      className="bg-gray-950/90 backdrop-blur-sm border rounded-xl overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5"
        style={{ background: `${a.color}0d` }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: a.color }} />
          <span className="text-[10px] font-black tracking-widest" style={{ color: a.color }}>{a.sav}</span>
          <span className="text-[10px] font-bold bg-red-600 text-white px-1 rounded">LIVE</span>
        </div>
        <span className="text-[9px] text-gray-700">#{idx + 1}</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ color: a.color, background: `${a.color}1a` }}>{a.badge}</span>
          <span className="text-[10px] text-gray-600">{a.kat}</span>
        </div>
        <p className="font-bold text-sm mb-0.5">{a.nev}</p>
        <div className="flex items-end justify-between mt-2.5 pt-2.5 border-t border-white/5">
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Current bid</p>
            <p className="text-base font-bold tabular-nums transition-colors duration-300"
              style={{ color: flash ? '#4ade80' : a.color }}>
              €{bid.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-600 mb-0.5">Time left</p>
            <p className={`text-base font-mono font-bold ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `0:${String(ss).padStart(2, '0')}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [feliratkozokSzam, setFeliratkozokSzam] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const mouseRef = useRef({ x: 0, y: 0 })
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/waitlist-count')
      .then(r => r.json())
      .then(d => setFeliratkozokSzam(d.count ?? 0))
      .catch(() => setFeliratkozokSzam(0))
    setTimeout(() => setVisible(true), 80)

    // Subtle parallax on background orbs
    function onMove(e: MouseEvent) {
      const dx = (e.clientX / window.innerWidth - 0.5) * 30
      const dy = (e.clientY / window.innerHeight - 0.5) * 30
      if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${dx}px, ${dy}px)`
      if (orb2Ref.current) orb2Ref.current.style.transform = `translate(${-dx * 0.6}px, ${-dy * 0.6}px)`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Count-up animation
  useEffect(() => {
    if (feliratkozokSzam === null || feliratkozokSzam === 0) { setDisplayCount(0); return }
    let cur = 0
    const end = feliratkozokSzam
    const step = Math.max(1, Math.ceil(end / 60))
    const timer = setInterval(() => {
      cur = Math.min(cur + step, end)
      setDisplayCount(cur)
      if (cur >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [feliratkozokSzam])

  const elesbe = feliratkozokSzam !== null && feliratkozokSzam >= MAX_WAITLIST
  const szazalek = feliratkozokSzam !== null ? Math.min(100, Math.round((feliratkozokSzam / MAX_WAITLIST) * 100)) : 0

  async function feliratkozas(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')
    const { error } = await supabase.from('feliratkozok').insert([{ email }])
    if (error) {
      setAllapot(error.code === '23505' ? 'siker' : 'hiba')
    } else {
      setAllapot('siker')
      setEmail('')
      setFeliratkozokSzam(prev => (prev ?? 0) + 1)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div ref={orb1Ref} className="absolute -top-32 left-1/3 w-[600px] h-[600px] rounded-full transition-transform duration-700 ease-out"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div ref={orb2Ref} className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full transition-transform duration-700 ease-out"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm">
        <span className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 bg-green-950/60 border border-green-800/30 px-3 py-1.5 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live now
          </div>
          <a href="/marketplace"
            className="text-sm text-gray-400 hover:text-white transition px-4 py-2 rounded-full hover:bg-white/5">
            Aukciós Ház
          </a>
          {elesbe ? (
            <a href="/auth"
              className="bg-violet-600 hover:bg-violet-500 transition px-5 py-2 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              Get Started →
            </a>
          ) : (
            <a href="/auth"
              className="bg-violet-600 hover:bg-violet-500 transition px-5 py-2 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              Sign In
            </a>
          )}
        </div>
      </nav>

      {/* Hero — 2 column */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12 lg:pt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left: copy + form */}
        <div>
          <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-violet-400 uppercase bg-violet-950/50 border border-violet-800/40 px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              Startup Project Marketplace
            </span>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6">
              <span className="block text-white">Buy and sell</span>
              <span className="block bg-gradient-to-r from-violet-400 via-violet-300 to-violet-500 bg-clip-text text-transparent">
                validated startups
              </span>
              <span className="block text-gray-500 text-4xl md:text-5xl font-bold mt-1">
                at auction speed.
              </span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
              Develop your idea with AI, then auction it to serious buyers — transparently, securely, with full escrow protection.
            </p>
          </div>

          <div className={`transition-all duration-700 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {allapot === 'siker' ? (
              <div className="bg-violet-950/40 border border-violet-700/50 rounded-2xl px-8 py-7 text-center max-w-md">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-violet-300 font-bold text-lg">You&apos;re on the list!</p>
                <p className="text-gray-400 text-sm mt-2 mb-5">We&apos;ll notify you the moment we launch.</p>
                <a href="/marketplace"
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition px-6 py-2.5 rounded-full text-sm font-semibold">
                  Browse live auctions →
                </a>
              </div>
            ) : (
              <form onSubmit={feliratkozas} className="flex flex-col sm:flex-row gap-2.5 max-w-md">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-5 py-3.5 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition text-sm"
                />
                <button
                  type="submit"
                  disabled={allapot === 'loading'}
                  className="relative bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition px-6 py-3.5 rounded-xl font-semibold text-sm whitespace-nowrap shadow-[0_0_24px_rgba(124,58,237,0.25)] hover:shadow-[0_0_32px_rgba(124,58,237,0.4)]"
                >
                  {allapot === 'loading' ? 'Sending...' : 'Join Waitlist'}
                </button>
              </form>
            )}

            {allapot === 'hiba' && (
              <p className="text-red-400 text-xs mt-2">Something went wrong. Please try again.</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <p className="text-gray-600 text-xs">No spam. Unsubscribe anytime.</p>
              <a href="/marketplace" className="text-xs text-gray-600 hover:text-violet-400 transition">
                Browse without signing up →
              </a>
            </div>

            {/* Waitlist progress */}
            <div className="mt-8 max-w-md">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500">
                  {feliratkozokSzam !== null ? (
                    <><span className="text-violet-400 font-bold tabular-nums">{displayCount.toLocaleString()}</span> early signups</>
                  ) : (
                    <span className="text-gray-700">Loading...</span>
                  )}
                </span>
                <span className="text-gray-600">{MAX_WAITLIST.toLocaleString()} goal</span>
              </div>
              <div className="w-full h-1 bg-gray-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${szazalek}%`,
                    background: 'linear-gradient(90deg, #6d28d9, #a855f7)',
                    boxShadow: '0 0 12px rgba(168,85,247,0.5)',
                  }}
                />
              </div>
              <p className="text-gray-700 text-xs mt-2">
                {elesbe
                  ? <span className="text-violet-400 font-semibold">🚀 Platform is live!</span>
                  : feliratkozokSzam !== null
                    ? `${(MAX_WAITLIST - feliratkozokSzam).toLocaleString()} spots left until full launch`
                    : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Right: animated live auction preview */}
        <div className={`relative transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Glow behind cards */}
          <div className="absolute inset-8 bg-violet-700/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex flex-col gap-3 max-w-sm mx-auto lg:ml-auto lg:mr-0">
            <div className="flex items-center gap-2 mb-1 pl-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Élő Aukciós Ház Preview</span>
            </div>
            {PREVIEW_AUCTIONS.map((a, i) => (
              <AuctionCard key={a.id} a={a} idx={i} />
            ))}
            <p className="text-center text-xs text-gray-600 mt-1">
              Real projects · real bids · real money ·{' '}
              <a href="/marketplace" className="text-violet-500 hover:text-violet-400 transition">View all →</a>
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className={`relative z-10 border-y border-white/5 py-6 transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {[
            { val: '3 min', label: 'Fastest auction' },
            { val: '10%', label: 'Platform fee' },
            { val: '100%', label: 'Escrow protected' },
            { val: 'AI', label: 'Powered validation' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black text-violet-400">{s.val}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-3">Simple process</p>
            <h2 className="text-3xl font-bold">How BidVip works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: '01', icon: '🤖', title: 'AI Development', desc: 'Our AI helps you structure, validate, and document your project with expert feedback before it hits the market.' },
              { num: '02', icon: '📺', title: 'Aukciós Ház', desc: 'Time-limited bidding in our Auction House — Fast (3 min), Standard (5 min), or Premium (20 min) channels.' },
              { num: '03', icon: '🔒', title: 'Secure Handover', desc: 'Buyer pays via Stripe. We hold funds in escrow. Seller gets paid only after delivering all files and credentials.' },
            ].map((s, i) => (
              <div key={i}
                className="group relative bg-gray-900/50 border border-gray-800 hover:border-violet-800/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(124,58,237,0.08)]">
                <div className="absolute top-5 right-5 text-5xl font-black text-white/[0.03] select-none tabular-nums">{s.num}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-base mb-2 group-hover:text-violet-300 transition-colors">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 border-t border-white/5 px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-3">FAQ</p>
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { q: 'How does the auction work?', a: 'Each project gets a time slot — Fast (3 min), Standard (5 min), or Premium (20 min). The highest bidder at the end wins. You can also use proxy bidding to auto-bid up to your maximum.' },
              { q: 'What is escrow protection?', a: 'The winning buyer pays through Stripe. BidVip holds the funds. The seller delivers all files and credentials — only then is the payment released. Neither party can lose money.' },
              { q: 'Do I need tokens to bid?', a: "No. Bidding is free. Tokens are only used for AI features (project analysis for €1 each) and seller priority boosting to move up the queue." },
              { q: 'How is my identity protected?', a: 'All buyers and sellers appear under randomly generated anonymous names. Real identities are only exchanged after a successful sale, as part of the handover.' },
              { q: "What's the platform fee?", a: 'BidVip takes 10% of the final sale price, paid by the seller. There are no listing fees or buyer fees — just pay if you sell.' },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust footer strip */}
      <div className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {[
            { icon: '🔐', label: 'Stripe Payments' },
            { icon: '🤖', label: 'AI-Powered' },
            { icon: '🛡️', label: 'Escrow Protected' },
            { icon: '👁️', label: 'Anonymous Bidding' },
            { icon: '⚡', label: 'Real-time Updates' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-400 transition">
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-700 mt-6">
          © 2026 BidVip · Built for entrepreneurs, bought by visionaries.
        </p>
      </div>
    </main>
  )
}
