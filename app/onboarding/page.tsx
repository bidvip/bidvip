'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const ROLES = [
  {
    id: 'vevo' as const,
    ikon: '🛒',
    cim: 'Vevő vagyok',
    leiras: 'Projekteket keresek — böngészek, licitálok, vásárolok.',
    color: 'blue',
  },
  {
    id: 'elado' as const,
    ikon: '💡',
    cim: 'Eladó vagyok',
    leiras: 'El akarom adni a projektemet, ötletemet, nyílt aukción.',
    color: 'amber',
  },
  {
    id: 'mindketto' as const,
    ikon: '🔄',
    cim: 'Mindkettő',
    leiras: 'Eladom az ötleteimet és mások projektjeire is licitálok.',
    color: 'violet',
  },
]

export default function Onboarding() {
  const [valasztott, setValasztott] = useState<'vevo' | 'elado' | 'mindketto' | null>(null)
  const [loading, setLoading] = useState(false)
  const [bonuszKapott, setBonuszKapott] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function mentes() {
    if (!valasztott) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      szerepkor: valasztott,
    })

    if (error) { setLoading(false); return }

    const bonuszRes = await fetch('/api/tokens/welcome-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
    const bonuszAdat = await bonuszRes.json()
    if (bonuszAdat.ok) {
      setBonuszKapott(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <nav className="relative z-10 flex items-center px-8 py-5 border-b border-white/5">
        <span className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </span>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-violet-400 uppercase bg-violet-950/50 border border-violet-800/40 px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              Egy lépés a piactérig
            </span>
            <h1 className="text-3xl font-bold mb-2">Hogyan szeretnéd használni a BidVip-et?</h1>
            <p className="text-gray-500 text-sm">Bármikor megváltoztathatod a beállításokban.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {ROLES.map(r => {
              const selected = valasztott === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => setValasztott(r.id)}
                  className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    selected
                      ? 'border-violet-500 bg-violet-950/30 shadow-[0_0_24px_rgba(124,58,237,0.15)] -translate-y-0.5'
                      : 'border-gray-800 hover:border-gray-600 hover:bg-gray-900/60'
                  }`}
                >
                  <span className="text-4xl">{r.ikon}</span>
                  <div className="text-center">
                    <p className={`font-bold text-base mb-1 ${selected ? 'text-violet-300' : 'text-white'}`}>{r.cim}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{r.leiras}</p>
                  </div>
                  {selected && (
                    <span className="text-xs font-bold text-violet-400 border border-violet-700/50 bg-violet-900/30 px-3 py-1 rounded-full">
                      ✓ Kiválasztva
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {bonuszKapott && (
            <div className="mb-5 bg-violet-950/50 border border-violet-700/60 rounded-2xl px-6 py-5 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-violet-300 font-bold text-lg">50 token welcome bónusz!</p>
              <p className="text-gray-400 text-sm mt-1">Korai hozzáférési jutalom — használd ötletek beküldésére.</p>
            </div>
          )}

          <button
            onClick={mentes}
            disabled={!valasztott || loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition py-4 rounded-xl font-bold text-base shadow-[0_0_24px_rgba(124,58,237,0.2)] hover:shadow-[0_0_32px_rgba(124,58,237,0.35)]"
          >
            {loading ? 'Mentés...' : 'Tovább →'}
          </button>

          <p className="text-center text-xs text-gray-700 mt-4">
            Az első 2000 felhasználó 50 ingyenes tokent kap 🎁
          </p>
        </div>
      </div>
    </main>
  )
}
