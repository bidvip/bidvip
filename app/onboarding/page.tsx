'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const ROLES = [
  { id: 'vevo' as const,     cim: 'Vevő vagyok',  leiras: 'Projekteket keresek — böngészek, licitálok, vásárolok.', color: '#EAB308' },
  { id: 'elado' as const,    cim: 'Eladó vagyok',  leiras: 'El akarom adni a projektemet, ötletemet, nyílt aukción.', color: '#DC2626' },
  { id: 'mindketto' as const, cim: 'Mindkettő',    leiras: 'Eladom az ötleteimet és mások projektjeire is licitálok.', color: '#F5F0E8' },
]

export default function Onboarding() {
  const [valasztott, setValasztott] = useState<'vevo' | 'elado' | 'mindketto' | null>(null)
  const [loading, setLoading]       = useState(false)
  const [bonuszKapott, setBonuszKapott] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function mentes() {
    if (!valasztott) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { error } = await supabase.from('profiles').upsert({ id: user.id, szerepkor: valasztott })
    if (error) { setLoading(false); return }
    const bonuszRes = await fetch('/api/tokens/welcome-bonus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) })
    const bonuszAdat = await bonuszRes.json()
    if (bonuszAdat.ok) { setBonuszKapott(true); setTimeout(() => router.push('/dashboard'), 2500) }
    else { router.push('/dashboard') }
  }

  return (
    <main className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.015,
          backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <nav className="relative z-10 flex items-center px-8 py-5" style={{ borderBottom: '1px solid #2E2028', backdropFilter: 'blur(8px)' }}>
        <span className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </span>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-6"
              style={{ color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
              Egy lépés a piactérig
            </span>
            <h1 className="text-3xl font-black mb-2" style={{ letterSpacing: '-0.03em' }}>Hogyan szeretnéd használni a BidVip-et?</h1>
            <p className="text-sm" style={{ color: '#9C8B7A' }}>Bármikor megváltoztathatod a beállításokban.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {ROLES.map(r => {
              const selected = valasztott === r.id
              return (
                <button key={r.id} onClick={() => setValasztott(r.id)}
                  className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 transition-all duration-200 text-center"
                  style={{
                    border: `2px solid ${selected ? r.color : '#2E2028'}`,
                    background: selected ? `${r.color}0d` : '#1A1217',
                    boxShadow: selected ? `0 0 24px ${r.color}18` : 'none',
                    transform: selected ? 'translateY(-2px)' : 'none',
                  }}
                  onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = '#3E3040'; e.currentTarget.style.background = '#221820' } }}
                  onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = '#2E2028'; e.currentTarget.style.background = '#1A1217' } }}>
                  <div>
                    <p className="font-black text-base mb-1 transition-colors" style={{ color: selected ? r.color : '#F5F0E8' }}>{r.cim}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#9C8B7A' }}>{r.leiras}</p>
                  </div>
                  {selected && (
                    <span className="text-xs font-black px-3 py-1 rounded"
                      style={{ color: r.color, border: `1px solid ${r.color}44`, background: `${r.color}10` }}>
                      ✓ Kiválasztva
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {bonuszKapott && (
            <div className="mb-5 px-6 py-5 text-center rounded-lg"
              style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <p className="font-black text-lg" style={{ color: '#EAB308' }}>50 token welcome bónusz!</p>
              <p className="text-sm mt-1" style={{ color: '#9C8B7A' }}>Korai hozzáférési jutalom — használd ötletek beküldésére.</p>
            </div>
          )}

          <button onClick={mentes} disabled={!valasztott || loading}
            className="w-full py-4 rounded-lg font-black text-base transition"
            style={{ background: '#DC2626', color: '#fff', boxShadow: '0 0 24px rgba(220,38,38,0.2)',
              opacity: (!valasztott || loading) ? 0.4 : 1, cursor: (!valasztott || loading) ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (valasztott && !loading) e.currentTarget.style.background = '#EF4444' }}
            onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}>
            {loading ? 'Mentés...' : 'Tovább →'}
          </button>
          <p className="text-center text-xs mt-4" style={{ color: '#5A4F4A' }}>Az első 2000 felhasználó 50 ingyenes tokent kap</p>
        </div>
      </div>
    </main>
  )
}
