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
  const recLabel  = recommended === 'small' ? 'Starter' : recommended === 'medium' ? 'Builder' : 'Pro'
  const recPrice  = recommended === 'small' ? '€5' : recommended === 'medium' ? '€13' : '€27'
  const recTokens = recommended === 'small' ? 100 : recommended === 'medium' ? 300 : 700

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--v-vonal)', background: 'var(--v-bg-2)' }}>
      <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--v-vonal)' }}>
        <span className="font-bold text-sm" style={{ color: 'var(--v-szoveg)' }}>Token Calculator</span>
        <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: 'var(--v-szoveg-2)', background: 'var(--v-bg-3)' }}>
          How many tokens do I need?
        </span>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--v-szoveg-2)' }}>AI Quick Analyses</label>
              <span className="font-bold text-sm" style={{ color: 'var(--v-rozsa)' }}>{analyses}×</span>
            </div>
            <input type="range" min={0} max={200} step={5} value={analyses}
              onChange={e => setAnalyses(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--v-rozsa) ${analyses / 2}%, var(--v-vonal) ${analyses / 2}%)` }} />
            <div className="flex justify-between text-[11px] mt-1" style={{ color: 'var(--v-szoveg-3)' }}><span>0</span><span>200</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--v-szoveg-2)' }}>Listing Priority Boosts</label>
              <span className="font-bold text-sm" style={{ color: 'var(--v-arany)' }}>{boosts}×</span>
            </div>
            <input type="range" min={0} max={40} step={1} value={boosts}
              onChange={e => setBoosts(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--v-arany) ${boosts / 40 * 100}%, var(--v-vonal) ${boosts / 40 * 100}%)` }} />
            <div className="flex justify-between text-[11px] mt-1" style={{ color: 'var(--v-szoveg-3)' }}><span>0</span><span>40</span></div>
          </div>

          <div className="flex flex-col gap-2 text-xs p-4 rounded-lg" style={{ background: 'var(--v-bg-3)' }}>
            <div className="flex justify-between" style={{ color: 'var(--v-szoveg-2)' }}>
              <span>{analyses} analyses × 1 token</span>
              <span className="font-semibold" style={{ color: 'var(--v-szoveg)' }}>⚡ {analyses}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--v-szoveg-2)' }}>
              <span>{boosts} boosts × 5 tokens avg</span>
              <span className="font-semibold" style={{ color: 'var(--v-szoveg)' }}>⚡ {boosts * 5}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-sm" style={{ borderTop: '1px solid var(--v-vonal)' }}>
              <span style={{ color: 'var(--v-szoveg-2)' }}>Total needed</span>
              <span style={{ color: 'var(--v-arany)' }}>⚡ {total}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--v-szoveg-3)' }}>Recommended for you</p>
          <div className="p-5 rounded-lg" style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--v-rozsa)' }}>{recLabel}</p>
            <p className="text-3xl font-black mb-1" style={{ color: 'var(--v-szoveg)' }}>{recPrice}</p>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="font-bold" style={{ color: 'var(--v-arany)' }}>⚡ {recTokens.toLocaleString()}</span>
              <span className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>tokens</span>
            </div>
            <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--v-vonal)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total / recTokens) * 100)}%`, background: 'var(--v-rozsa)' }} />
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--v-szoveg-2)' }}>
              {recTokens - total > 0 ? `${recTokens - total} tokens left over after your planned usage` : 'Covers your usage exactly'}
            </p>
            <button onClick={() => onSelect(recommended)}
              className="w-full py-2.5 rounded-lg text-sm font-black transition"
              style={{ background: 'var(--v-rozsa)', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
              Get {recLabel} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const packages = [
  { id: 'small',  tokens: 100, price: '€5',  priceNum: 5,  label: 'Starter', description: 'Perfect for casual buyers',       features: ['100 AI analyses', 'Boost your listings in the queue', 'Tokens never expire'] },
  { id: 'medium', tokens: 300, price: '€13', priceNum: 13, label: 'Builder', description: 'Best value for active bidders',    features: ['300 AI analyses', 'Boost your listings in the queue', 'Tokens never expire', 'Save €2 vs. buying Starter x3'], popular: true },
  { id: 'large',  tokens: 700, price: '€27', priceNum: 27, label: 'Pro',     description: 'For serious deal-makers',         features: ['700 AI analyses', 'Boost your listings in the queue', 'Tokens never expire', '100 bonus tokens included'] },
]

export default function TokensPage() {
  const [user, setUser]         = useState<User | null>(null)
  const [egyenleg, setEgyenleg] = useState<number | null>(null)
  const [loading, setLoading]   = useState<string | null>(null)
  const [status, setStatus]     = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const packagesRef = useRef<HTMLDivElement>(null)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const st = params.get('status')
    setStatus(st)
    const redirect = params.get('redirect')
    if (st === 'success' && redirect) setTimeout(() => router.push(redirect), 2000)

    async function betolt() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)
      const { data } = await supabase.from('tokenek').select('egyenleg').eq('user_id', u.id).single()
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
    const redirect = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('redirect') || ''
    const res = await fetch('/api/tokens/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ package: pkg, user_id: user.id, user_email: user.email, redirect }) })
    const { url, error } = await res.json()
    if (url) { window.location.href = url }
    else { console.error(error); setLoading(null) }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 70%)' }} />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid var(--v-vonal)', backdropFilter: 'blur(8px)' }}>
        <a href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Bid<span style={{ color: 'var(--v-rozsa)' }}>Vip</span></a>
        <div className="flex items-center gap-3">
          {egyenleg !== null && (
            <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span style={{ color: 'var(--v-arany)' }}>⚡</span>
              <span className="font-black tabular-nums" style={{ color: 'var(--v-arany)' }}>{egyenleg}</span>
              <span className="text-xs" style={{ color: 'var(--v-szoveg-2)' }}>tokens</span>
            </div>
          )}
          <a href="/dashboard" className="text-sm transition" style={{ color: 'var(--v-szoveg-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}>← Dashboard</a>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
        {status === 'success' && (
          <div className="px-6 py-4 text-center font-semibold mb-8 rounded-lg"
            style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', color: '#22C55E' }}>
            Sikeres fizetés! A tokenek hozzáadva a fiókodhoz.
            {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('redirect') && (
              <p className="text-sm font-normal mt-1" style={{ color: '#16A34A' }}>Visszairányítás...</p>
            )}
          </div>
        )}
        {status === 'cancelled' && (
          <div className="px-6 py-4 text-center mb-8 rounded-lg"
            style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', color: '#EF4444' }}>
            Fizetés megszakítva. Semmilyen összeg nem lett terhelve.
          </div>
        )}

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-6"
            style={{ color: 'var(--v-arany)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
            <span>⚡</span> BidVip Tokenek
          </span>
          <h1 className="text-4xl font-black mb-3" style={{ letterSpacing: '-0.04em' }}>Töltsd fel a fiókod</h1>
          <p className="max-w-md mx-auto leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>
            A tokenek AI funkciókat és versenylistázást tesznek lehetővé — elemezz projekteket licitálás előtt, vagy emeld ki a sajátodat az Aukciós Ház tetejére.
          </p>
        </div>

        {/* Calculator */}
        <div className="mb-8">
          <TokenCalculator onSelect={scrollToPkg} />
        </div>

        {/* Packages */}
        <div ref={packagesRef} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {packages.map(pkg => {
            const isHighlighted = highlighted === pkg.id
            return (
              <div key={pkg.id} className="relative flex flex-col rounded-lg p-6"
                style={{
                  background: pkg.popular ? 'rgba(244,63,94,0.06)' : 'var(--v-bg-2)',
                  border: `1px solid ${isHighlighted ? 'var(--v-rozsa)' : pkg.popular ? 'rgba(244,63,94,0.4)' : 'var(--v-vonal)'}`,
                  boxShadow: isHighlighted ? '0 0 50px rgba(244,63,94,0.25)' : pkg.popular ? '0 0 32px rgba(244,63,94,0.08)' : 'none',
                  transform: isHighlighted ? 'scale(1.03)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={e => {
                  if (!isHighlighted) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = pkg.popular ? '0 16px 40px rgba(244,63,94,0.2), 0 0 32px rgba(244,63,94,0.12)' : '0 16px 32px rgba(0,0,0,0.3)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isHighlighted) {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = pkg.popular ? '0 0 32px rgba(244,63,94,0.08)' : 'none'
                  }
                }}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[11px] font-black px-3 py-1 rounded" style={{ background: 'var(--v-rozsa)', color: '#fff' }}>BEST VALUE</span>
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: pkg.popular ? 'var(--v-rozsa)' : 'var(--v-szoveg-3)' }}>{pkg.label}</p>
                  <span className="text-4xl font-black" style={{ letterSpacing: '-0.03em' }}>{pkg.price}</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="font-bold text-lg" style={{ color: 'var(--v-arany)' }}>⚡ {pkg.tokens.toLocaleString()}</span>
                    <span className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>tokens</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--v-szoveg-2)' }}>{pkg.description}</p>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--v-szoveg-2)' }}>
                      <span className="mt-0.5 text-xs font-bold" style={{ color: pkg.popular ? 'var(--v-rozsa)' : '#22C55E' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => vasarlas(pkg.id)} disabled={loading === pkg.id}
                  className="w-full py-3 rounded-lg font-bold text-sm transition"
                  style={{
                    background: pkg.popular ? 'var(--v-rozsa)' : 'var(--v-bg-3)',
                    color: pkg.popular ? '#fff' : 'var(--v-szoveg)',
                    border: pkg.popular ? 'none' : '1px solid var(--v-vonal)',
                    opacity: loading === pkg.id ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = pkg.popular ? '#EF4444' : 'var(--v-vonal)' }}
                  onMouseLeave={e => (e.currentTarget.style.background = pkg.popular ? 'var(--v-rozsa)' : 'var(--v-bg-3)')}>
                  {loading === pkg.id ? 'Redirecting...' : `Get ${pkg.tokens} Tokens`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Feature bento */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: 'var(--v-szoveg-3)' }}>What tokens unlock</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Big card */}
            <div className="col-span-2 relative overflow-hidden rounded-lg p-8 flex gap-10 items-center"
              style={{ border: '1px solid var(--v-vonal)', background: 'var(--v-bg-2)', backgroundImage: 'linear-gradient(135deg, rgba(244,63,94,0.05) 0%, transparent 50%)' }}>
              <div className="relative flex-shrink-0 flex flex-col items-start">
                <div className="text-[72px] font-black leading-none tracking-tighter" style={{ color: 'var(--v-szoveg)' }}>1</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span style={{ color: 'var(--v-arany)' }}>⚡</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--v-arany)' }}>token per use</span>
                </div>
              </div>
              <div className="relative flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded"
                  style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--v-rozsa)' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--v-rozsa)' }}>Most used feature</span>
                </div>
                <h3 className="text-xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>AI Quick Analysis</h3>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--v-szoveg-2)' }}>
                  Get an institutional-grade investment report on any project — market opportunity, growth scenarios over 5–10 years, strategic value, and acquisition assessment.
                </p>
                <div className="flex gap-3 mt-4 flex-wrap">
                  {['Market Opportunity', 'Growth Scenarios', 'Acquisition Value'].map(tag => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded" style={{ color: 'var(--v-szoveg-3)', border: '1px solid var(--v-vonal)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Boost */}
            <div className="relative overflow-hidden rounded-lg p-6" style={{ border: '1px solid var(--v-vonal)', background: 'var(--v-bg-2)', backgroundImage: 'linear-gradient(135deg, rgba(251,191,36,0.03) 0%, transparent 60%)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <span style={{ color: 'var(--v-arany)' }}>↑</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black" style={{ color: 'var(--v-szoveg)' }}>1–10</span>
                  <p className="text-xs font-bold" style={{ color: 'var(--v-arany)' }}>tokens</p>
                </div>
              </div>
              <h3 className="font-black mb-1.5" style={{ letterSpacing: '-0.02em' }}>Listing Priority Boost</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>Spend tokens to move your project up the Aukciós Ház queue. The more you spend, the higher your ranking.</p>
            </div>

            {/* AI Overview — free */}
            <div className="relative overflow-hidden rounded-lg p-6" style={{ border: '1px solid var(--v-vonal)', background: 'var(--v-bg-2)', backgroundImage: 'linear-gradient(135deg, rgba(22,163,74,0.03) 0%, transparent 60%)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <span style={{ color: '#22C55E' }}>✦</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black" style={{ color: '#22C55E' }}>Free</span>
                  <p className="text-xs" style={{ color: 'var(--v-szoveg-3)' }}>always included</p>
                </div>
              </div>
              <h3 className="font-black mb-1.5" style={{ letterSpacing: '-0.02em' }}>AI Overview</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>Every project page auto-loads a compelling AI-written introduction — no tokens required. You only spend tokens when you want the full deep analysis.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'var(--v-szoveg-3)' }}>
          Tokens are non-refundable. Payments processed securely via Stripe.
        </p>
      </div>
    </main>
  )
}
