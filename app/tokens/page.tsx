'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

function TokenCalculator({ onSelect }: { onSelect: (pkg: string) => void }) {
  const [analyses, setAnalyses] = useState(10)
  const [boosts, setBoosts] = useState(3)
  const total = analyses * 1 + boosts * 5
  const recommended = total <= 100 ? 'small' : total <= 300 ? 'medium' : 'large'
  const recLabel = recommended === 'small' ? 'Starter' : recommended === 'medium' ? 'Builder' : 'Pro'
  const recPrice = recommended === 'small' ? '€5' : recommended === 'medium' ? '€13' : '€27'
  const recTokens = recommended === 'small' ? 100 : recommended === 'medium' ? 300 : 700

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
        <span className="text-white font-semibold text-sm">Token Calculator</span>
        <span className="text-[11px] text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">How many tokens do I need?</span>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          {/* Slider: AI analyses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 font-medium">AI Quick Analyses</label>
              <span className="text-violet-400 font-bold text-sm">{analyses}×</span>
            </div>
            <input type="range" min={0} max={200} step={5} value={analyses}
              onChange={e => setAnalyses(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #7c3aed ${analyses / 2}%, #374151 ${analyses / 2}%)` }}
            />
            <div className="flex justify-between text-[11px] text-gray-600 mt-1"><span>0</span><span>200</span></div>
          </div>

          {/* Slider: Boosts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 font-medium">Listing Priority Boosts</label>
              <span className="text-amber-400 font-bold text-sm">{boosts}×</span>
            </div>
            <input type="range" min={0} max={40} step={1} value={boosts}
              onChange={e => setBoosts(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #d97706 ${boosts / 40 * 100}%, #374151 ${boosts / 40 * 100}%)` }}
            />
            <div className="flex justify-between text-[11px] text-gray-600 mt-1"><span>0</span><span>40</span></div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-800/60 rounded-xl p-4 flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>{analyses} analyses × 1 token</span>
              <span className="text-white font-semibold">⚡ {analyses}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>{boosts} boosts × 5 tokens avg</span>
              <span className="text-white font-semibold">⚡ {boosts * 5}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-sm">
              <span className="text-gray-300">Total needed</span>
              <span className="text-violet-400">⚡ {total}</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Recommended for you</p>
          <div className="rounded-xl border border-violet-600/50 bg-violet-950/30 p-5">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">{recLabel}</p>
            <p className="text-3xl font-black text-white mb-1">{recPrice}</p>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-violet-400 font-bold">⚡ {recTokens.toLocaleString()}</span>
              <span className="text-gray-500 text-sm">tokens</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total / recTokens) * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {recTokens - total > 0
                ? `${recTokens - total} tokens left over after your planned usage`
                : 'Covers your usage exactly'}
            </p>
            <button
              onClick={() => onSelect(recommended)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition">
              Get {recLabel} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const packages = [
  {
    id: 'small',
    tokens: 100,
    price: '€5',
    priceNum: 5,
    label: 'Starter',
    description: 'Perfect for casual buyers',
    features: [
      '100 AI analyses',
      'Boost your listings in the queue',
      'Tokens never expire',
    ],
  },
  {
    id: 'medium',
    tokens: 300,
    price: '€13',
    priceNum: 13,
    label: 'Builder',
    description: 'Best value for active bidders',
    features: [
      '300 AI analyses',
      'Boost your listings in the queue',
      'Tokens never expire',
      'Save €2 vs. buying Starter x3',
    ],
    popular: true,
  },
  {
    id: 'large',
    tokens: 700,
    price: '€27',
    priceNum: 27,
    label: 'Pro',
    description: 'For serious deal-makers',
    features: [
      '700 AI analyses',
      'Boost your listings in the queue',
      'Tokens never expire',
      '100 bonus tokens included',
    ],
  },
]

const howItWorks = [
  {
    tokens: '1',
    action: 'AI Quick Analysis',
    desc: 'Get a full investment report on any project — market opportunity, growth scenarios, acquisition value.',
  },
  {
    tokens: '1–10',
    action: 'Listing Priority Boost',
    desc: 'Move your project up the Auction House queue. The more tokens you spend, the higher you rank.',
  },
  {
    tokens: '0',
    action: 'AI Overview',
    desc: 'Every project page auto-loads a compelling AI-written introduction at no cost to you.',
  },
]

export default function TokensPage() {
  const [user, setUser] = useState<User | null>(null)
  const [egyenleg, setEgyenleg] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const packagesRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const st = params.get('status')
    setStatus(st)

    const redirect = params.get('redirect')
    if (st === 'success' && redirect) {
      setTimeout(() => router.push(redirect), 2000)
    }

    async function betolt() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)

      const { data } = await supabase
        .from('tokenek')
        .select('egyenleg')
        .eq('user_id', u.id)
        .single()
      setEgyenleg(data?.egyenleg ?? 0)
    }
    betolt()
  }, [])

  function scrollToPkg(pkg: string) {
    setHighlighted(pkg)
    packagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => setHighlighted(null), 2000)
  }

  async function vasarlas(pkg: string) {
    if (!user) return
    setLoading(pkg)
    const redirect = new URLSearchParams(window.location.search).get('redirect') || ''
    const res = await fetch('/api/tokens/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg, user_id: user.id, user_email: user.email, redirect }),
    })
    const { url, error } = await res.json()
    if (url) {
      window.location.href = url
    } else {
      console.error(error)
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">Bid<span className="text-violet-500">Vip</span></a>
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">← Dashboard</a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-14">

        {status === 'success' && (
          <div className="bg-green-900/30 border border-green-800 rounded-2xl px-6 py-4 text-center text-green-400 font-semibold mb-8">
            🎉 Payment successful! Your tokens have been added.
            {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('redirect') && (
              <p className="text-green-300 text-sm font-normal mt-1">Redirecting you back...</p>
            )}
          </div>
        )}
        {status === 'cancelled' && (
          <div className="bg-red-900/30 border border-red-800 rounded-2xl px-6 py-4 text-center text-red-400 mb-8">
            Payment cancelled. No charge was made.
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Get Tokens</h1>
              <p className="text-gray-500 mt-2 text-sm max-w-md">
                Tokens power AI features on BidVip — analyse any project before you bid, or boost your listing to the top of the Auction House.
              </p>
            </div>
            {egyenleg !== null && (
              <div className="flex-shrink-0 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-2">
                <span className="text-violet-400 text-sm">⚡</span>
                <span className="text-white font-semibold text-sm">{egyenleg}</span>
                <span className="text-gray-500 text-xs">left</span>
              </div>
            )}
          </div>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {packages.map(pkg => (
            <div key={pkg.id}
              className={`relative flex flex-col rounded-2xl p-6 border transition
                ${pkg.popular
                  ? 'bg-violet-950/30 border-violet-600 shadow-[0_0_40px_-8px_rgba(139,92,246,0.25)]'
                  : 'bg-gray-900 border-gray-800'}`}>

              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                    BEST VALUE
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${pkg.popular ? 'text-violet-400' : 'text-gray-500'}`}>
                  {pkg.label}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{pkg.price}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-violet-400 font-bold text-lg">⚡ {pkg.tokens.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">tokens</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">{pkg.description}</p>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className={`mt-0.5 text-xs font-bold ${pkg.popular ? 'text-violet-400' : 'text-green-400'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => vasarlas(pkg.id)}
                disabled={loading === pkg.id}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60
                  ${pkg.popular
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'}`}
              >
                {loading === pkg.id ? 'Redirecting...' : `Get ${pkg.tokens} Tokens`}
              </button>
            </div>
          ))}
        </div>

        {/* Feature bento */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-5">What tokens unlock</p>
          <div className="grid grid-cols-2 gap-4" style={{gridTemplateRows: 'auto auto'}}>

            {/* Big card — AI Analysis */}
            <div className="col-span-2 relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-8 flex gap-10 items-center">
              {/* BG glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-950/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-52 h-52 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex-shrink-0 flex flex-col items-start">
                <div className="text-[72px] font-black leading-none text-white tracking-tighter">1</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-violet-400">⚡</span>
                  <span className="text-violet-400 text-sm font-semibold">token per use</span>
                </div>
              </div>

              <div className="relative flex-1">
                <div className="inline-flex items-center gap-2 bg-violet-900/40 border border-violet-700/40 rounded-full px-3 py-1 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-300 text-xs font-semibold">Most used feature</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Quick Analysis</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                  Get an institutional-grade investment report on any project — market opportunity, growth scenarios over 5–10 years, strategic value, and acquisition assessment.
                </p>
                <div className="flex gap-3 mt-4">
                  {['Market Opportunity', 'Growth Scenarios', 'Acquisition Value'].map(tag => (
                    <span key={tag} className="text-[11px] text-gray-500 border border-gray-700 rounded-full px-2.5 py-1">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Boost */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-800/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">1–10</span>
                  <p className="text-amber-400 text-xs font-semibold">tokens</p>
                </div>
              </div>
              <h3 className="font-bold text-white mb-1.5">Listing Priority Boost</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Spend tokens to move your project up the Auction House queue. The more you spend, the higher your ranking — outbid competitors for top placement.</p>
            </div>

            {/* AI Overview — free */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/8 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-800/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">Free</span>
                  <p className="text-gray-600 text-xs">always included</p>
                </div>
              </div>
              <h3 className="font-bold text-white mb-1.5">AI Overview</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Every project page auto-loads a compelling AI-written introduction — no tokens required. You only spend tokens when you want the full deep analysis.</p>
            </div>

          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Tokens are non-refundable. Payments processed securely via Stripe.
        </p>
      </div>
    </main>
  )
}
