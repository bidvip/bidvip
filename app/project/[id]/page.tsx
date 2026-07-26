'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const badge_info: Record<string, { label: string; szin: string }> = {
  papir: { label: '🌱 Concept', szin: 'bg-green-900/40 text-green-400 border-green-800' },
  prototipus: { label: '🛠️ Prototype', szin: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  bizonyitott: { label: '✅ Proven', szin: 'bg-violet-900/40 text-violet-400 border-violet-800' },
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
  van_domain: boolean
  van_kod: boolean
  van_feliratkozok: boolean
  van_bevetel: boolean
  letrehozva: string
}

type Licit = {
  id: string
  osszeg: number
  letrehozva: string
  user_id: string
}

export default function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [projekt, setProjekt] = useState<Projekt | null>(null)
  const [licitek, setLicitek] = useState<Licit[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [licitOsszeg, setLicitOsszeg] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const [loading, setLoading] = useState(true)

  const paymentStatus = searchParams?.get('fizetes')

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
    }
    betolt()
  }, [id])

  const legmagasabb = licitek[0]?.osszeg || projekt?.kikialtasi_ar || 0
  const minimumLicit = legmagasabb + 1

  async function vasarlas() {
    if (!user) { router.push('/auth'); return }
    setAllapot('loading')
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projekt_id: projekt?.id,
        projekt_nev: projekt?.nev,
        osszeg: legmagasabb,
        vevo_email: user.email,
      }),
    })
    const { url, error } = await res.json()
    if (error || !url) {
      setHiba('Payment error. Please try again.')
      setAllapot('hiba')
    } else {
      window.location.href = url
    }
  }

  async function licitBeküldes(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    if (parseInt(licitOsszeg) < minimumLicit) {
      setHiba(`Minimum bid is €${minimumLicit}.`)
      setAllapot('hiba')
      return
    }
    setAllapot('loading')
    setHiba('')

    const { error } = await supabase.from('licitek').insert([{
      projekt_id: id,
      user_id: user.id,
      osszeg: parseInt(licitOsszeg),
    }])

    if (error) {
      setHiba('Something went wrong. Please try again.')
      setAllapot('hiba')
    } else {
      setAllapot('siker')
      setLicitOsszeg('')
      const { data: lics } = await supabase.from('licitek').select('*').eq('projekt_id', id).order('osszeg', { ascending: false })
      setLicitek(lics || [])
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
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <a href="/marketplace" className="text-gray-400 text-sm hover:text-white transition">← Marketplace</a>
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
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-semibold mb-3">About this project</h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{projekt.reszletes_leiras}</p>
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-6">
            <p className="text-gray-400 text-sm mb-1">Current highest bid</p>
            <p className="text-4xl font-bold text-violet-400 mb-1">€{legmagasabb.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mb-6">Starting price: €{projekt.kikialtasi_ar.toLocaleString()}</p>

            {user?.id === projekt.user_id ? (
              <div className="text-center text-gray-400 text-sm py-4">
                This is your project — you cannot bid on it.
              </div>
            ) : (
              <form onSubmit={licitBeküldes} className="flex flex-col gap-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                  <input
                    type="number"
                    required
                    min={minimumLicit}
                    value={licitOsszeg}
                    onChange={e => setLicitOsszeg(e.target.value)}
                    placeholder={`min. ${minimumLicit}`}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                {allapot === 'hiba' && <p className="text-red-400 text-xs">{hiba}</p>}
                {allapot === 'siker' && <p className="text-green-400 text-xs">Bid placed successfully!</p>}
                <button
                  type="submit"
                  disabled={allapot === 'loading'}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-3 rounded-full font-semibold"
                >
                  {allapot === 'loading' ? 'Submitting...' : 'Place Bid →'}
                </button>
                {!user && <p className="text-gray-500 text-xs text-center">You need to sign in to place a bid.</p>}
              </form>
            )}

            {licitek.length > 0 && user?.id !== projekt.user_id && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-400 mb-3">If you&apos;re the highest bidder, you can purchase this project:</p>
                <button
                  onClick={vasarlas}
                  disabled={licitek[0]?.user_id !== user?.id || allapot === 'loading'}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition py-3 rounded-full font-semibold text-sm"
                >
                  💳 Buy Now — €{legmagasabb.toLocaleString()}
                </button>
                {licitek[0]?.user_id !== user?.id && user && (
                  <p className="text-gray-500 text-xs text-center mt-2">Only the highest bidder can purchase.</p>
                )}
              </div>
            )}

            {licitek.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm font-semibold mb-3">Bid history ({licitek.length})</p>
                <div className="flex flex-col gap-2">
                  {licitek.slice(0, 5).map((l, i) => (
                    <div key={l.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">#{i + 1}</span>
                      <span className={i === 0 ? 'text-violet-400 font-bold' : 'text-gray-300'}>€{l.osszeg.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
