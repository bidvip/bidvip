'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

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

        {/* How it works */}
        <div className="border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/60">
            <h2 className="font-semibold text-sm text-gray-300">What tokens unlock</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {howItWorks.map(item => (
              <div key={item.action} className="flex items-start gap-5 px-6 py-4 hover:bg-gray-900/40 transition">
                <div className="flex-shrink-0 w-14 text-center">
                  <span className="text-violet-400 font-bold text-base">⚡ {item.tokens}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{item.action}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Tokens are non-refundable. Payments processed securely via Stripe.
        </p>
      </div>
    </main>
  )
}
