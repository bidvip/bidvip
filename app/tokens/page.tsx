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
    label: 'Starter',
    description: 'Great for trying out AI development',
    features: ['1 full AI development session', 'Project review & feedback', 'Auto-publish to marketplace'],
  },
  {
    id: 'medium',
    tokens: 300,
    price: '€13',
    label: 'Builder',
    description: 'Best value for active sellers',
    features: ['3 full AI development sessions', 'Project review & feedback', 'Auto-publish to marketplace', 'Priority review'],
    popular: true,
  },
  {
    id: 'large',
    tokens: 700,
    price: '€27',
    label: 'Pro',
    description: 'For serious entrepreneurs',
    features: ['7+ full AI development sessions', 'Project review & feedback', 'Auto-publish to marketplace', 'Priority review', '100 bonus tokens'],
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
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">Dashboard</a>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {status === 'success' && (
          <div className="bg-green-900/40 border border-green-800 rounded-2xl px-6 py-4 text-center text-green-400 font-semibold mb-8">
            🎉 Payment successful! Your tokens have been added to your balance.
            {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('redirect') && (
              <p className="text-green-300 text-sm font-normal mt-1">Redirecting you back...</p>
            )}
          </div>
        )}
        {status === 'cancelled' && (
          <div className="bg-red-900/40 border border-red-800 rounded-2xl px-6 py-4 text-center text-red-400 mb-8">
            Payment was cancelled.
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Buy Tokens</h1>
          {egyenleg !== null && (
            <div className="bg-violet-900/40 border border-violet-800 rounded-full px-5 py-2">
              <span className="text-violet-300 text-sm font-semibold">⚡ {egyenleg} tokens remaining</span>
            </div>
          )}
        </div>
        <p className="text-gray-400 mb-10">Use tokens to develop your project with AI and publish it to the marketplace.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className={`relative bg-gray-900 border rounded-2xl p-6 flex flex-col gap-4 ${pkg.popular ? 'border-violet-500' : 'border-gray-800'}`}>
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div>
                <p className="text-gray-400 text-sm">{pkg.label}</p>
                <p className="text-3xl font-bold mt-1">{pkg.price}</p>
                <p className="text-violet-400 font-semibold">⚡ {pkg.tokens} tokens</p>
                <p className="text-gray-500 text-xs mt-1">{pkg.description}</p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => vasarlas(pkg.id)}
                disabled={loading === pkg.id}
                className={`w-full py-3 rounded-full font-semibold transition disabled:opacity-60 ${pkg.popular ? 'bg-violet-600 hover:bg-violet-700' : 'border border-gray-700 hover:border-gray-500'}`}
              >
                {loading === pkg.id ? 'Redirecting...' : `Get ${pkg.tokens} Tokens`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">How tokens work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tokens: '80', action: 'Full AI development session', desc: 'AI develops your idea into a complete, marketable project' },
              { tokens: '30', action: 'Project rewrite', desc: 'Improve an existing project description with AI' },
              { tokens: '20', action: 'Quick review', desc: 'Get AI feedback on your project before publishing' },
            ].map(item => (
              <div key={item.action} className="bg-gray-800 rounded-xl p-4">
                <p className="text-violet-400 font-bold text-lg">⚡ {item.tokens}</p>
                <p className="font-semibold text-sm mt-1">{item.action}</p>
                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
