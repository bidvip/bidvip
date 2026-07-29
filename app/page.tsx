'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_WAITLIST = 2000

export default function Home() {
  const [email, setEmail] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [feliratkozokSzam, setFeliratkozokSzam] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist-count')
      .then(r => r.json())
      .then(d => setFeliratkozokSzam(d.count ?? 0))
      .catch(() => setFeliratkozokSzam(0))
  }, [])

  const elesbe = feliratkozokSzam !== null && feliratkozokSzam >= MAX_WAITLIST
  const szazalek = feliratkozokSzam !== null ? Math.min(100, Math.round((feliratkozokSzam / MAX_WAITLIST) * 100)) : 0

  async function feliratkozas(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')

    const { error } = await supabase
      .from('feliratkozok')
      .insert([{ email }])

    if (error) {
      if (error.code === '23505') {
        setAllapot('siker')
      } else {
        setAllapot('hiba')
      }
    } else {
      setAllapot('siker')
      setEmail('')
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </span>
        {elesbe ? (
          <a href="/auth" className="bg-violet-600 hover:bg-violet-700 transition px-5 py-2 rounded-full text-sm font-semibold">
            Get Started
          </a>
        ) : (
          <span className="bg-gray-700 text-gray-400 cursor-not-allowed px-5 py-2 rounded-full text-sm font-semibold select-none" title="Opens when we reach 2,000 early signups">
            Coming Soon
          </span>
        )}
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-16">
        <span className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-4">
          Startup Project Marketplace — Coming Soon
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl mb-6">
          Buy and sell <br />
          <span className="text-violet-500">validated startup projects</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Develop your idea with AI, then auction it to the highest bidder — transparently, securely, and with full escrow protection.
        </p>

        {allapot === 'siker' ? (
          <div className="bg-violet-900/40 border border-violet-700 rounded-2xl px-8 py-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-violet-300 font-semibold text-lg">You&apos;re on the list!</p>
            <p className="text-gray-400 text-sm mt-1">We&apos;ll notify you the moment we launch.</p>
          </div>
        ) : (
          <form onSubmit={feliratkozas} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-5 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={allapot === 'loading'}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition px-6 py-3 rounded-full font-semibold whitespace-nowrap"
            >
              {allapot === 'loading' ? 'Sending...' : 'Notify Me'}
            </button>
          </form>
        )}

        {allapot === 'hiba' && (
          <p className="text-red-400 text-sm mt-3">Something went wrong. Please try again.</p>
        )}

        {allapot !== 'siker' && (
          <p className="text-gray-600 text-xs mt-4">No spam. Unsubscribe in one click.</p>
        )}
        <a href="/marketplace" className="mt-3 text-xs text-gray-600 hover:text-violet-400 transition underline underline-offset-2">
          Or browse live auctions without signing up →
        </a>

        {/* Waitlist progress */}
        <div className="w-full max-w-md mt-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{feliratkozokSzam !== null ? feliratkozokSzam.toLocaleString() : '—'} early signups</span>
            <span>{MAX_WAITLIST.toLocaleString()} to unlock</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-700"
              style={{ width: `${szazalek}%` }}
            />
          </div>
          {elesbe ? (
            <p className="text-violet-400 text-xs text-center mt-2 font-semibold">Platform is live — create your account now!</p>
          ) : (
            <p className="text-gray-600 text-xs text-center mt-2">
              {feliratkozokSzam !== null ? `${MAX_WAITLIST - feliratkozokSzam} spots left until launch` : ''}
            </p>
          )}
        </div>
      </section>

      {/* 3 steps */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-violet-500 text-3xl mb-4">01</div>
            <h3 className="font-bold text-lg mb-2">Idea Development</h3>
            <p className="text-gray-400 text-sm">Our AI helps you structure, validate, and document your project before it goes to market.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-violet-500 text-3xl mb-4">02</div>
            <h3 className="font-bold text-lg mb-2">Open Auction</h3>
            <p className="text-gray-400 text-sm">The market sets the price — time-limited, transparent bidding open to serious buyers worldwide.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-violet-500 text-3xl mb-4">03</div>
            <h3 className="font-bold text-lg mb-2">Secure Handover</h3>
            <p className="text-gray-400 text-sm">The buyer pays and we hold the funds. The seller gets paid only after delivering all files, code, and access credentials.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
