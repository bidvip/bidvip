'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = email ? email[0].toUpperCase() : '?'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-700 hover:border-gray-500 transition bg-gray-900 hover:bg-gray-800"
      >
        <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
          {initials}
        </span>
        <span className="text-sm text-gray-300 max-w-[120px] truncate hidden sm:block">{email}</span>
        <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-[11px] text-gray-500">Signed in as</p>
            <p className="text-xs font-medium text-gray-200 truncate mt-0.5">{email}</p>
          </div>
          <div className="py-1">
            <a href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Settings
            </a>
          </div>
          <div className="border-t border-gray-800 py-1">
            <button onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [szerepkor, setSzerepkor] = useState<string | null>(null)
  const [sajatProjektek, setSajatProjektek] = useState<any[]>([])
  const [sajatLicitek, setSajatLicitek] = useState<any[]>([])
  const [tokenEgyenleg, setTokenEgyenleg] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [ujrakuldes, setUjrakuldes] = useState<string | null>(null)
  const [topBids, setTopBids] = useState<Record<string, number>>({})
  const [projektLicitek, setProjektLicitek] = useState<Record<string, { top: number; db: number }>>({})
  const [boostAktiv, setBoostAktiv] = useState<string | null>(null)
  const [boostTokenek, setBoostTokenek] = useState('5')
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostUzenet, setBoostUzenet] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function betolt() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)

      const { data: profil } = await supabase
        .from('profiles')
        .select('szerepkor')
        .eq('id', u.id)
        .single()

      if (!profil) { router.push('/onboarding'); return }
      setSzerepkor(profil.szerepkor)

      if (profil.szerepkor === 'elado' || profil.szerepkor === 'mindketto') {
        const { data: projektek } = await supabase
          .from('projektek')
          .select('*')
          .eq('user_id', u.id)
          .order('letrehozva', { ascending: false })
        setSajatProjektek(projektek || [])

        const elado_idk = (projektek || []).filter(p => p.statusz === 'aktiv').map((p: any) => p.id)
        if (elado_idk.length > 0) {
          const { data: pLicitek } = await supabase
            .from('licitek').select('projekt_id, osszeg').in('projekt_id', elado_idk)
          const pMap: Record<string, { top: number; db: number }> = {}
          for (const b of pLicitek || []) {
            if (!pMap[b.projekt_id]) pMap[b.projekt_id] = { top: 0, db: 0 }
            pMap[b.projekt_id].db++
            if (b.osszeg > pMap[b.projekt_id].top) pMap[b.projekt_id].top = b.osszeg
          }
          setProjektLicitek(pMap)
        }
      }
      if (profil.szerepkor === 'vevo' || profil.szerepkor === 'mindketto') {
        const { data: licitek } = await supabase
          .from('licitek')
          .select('*, projektek(nev, kikialtasi_ar, badge, statusz)')
          .eq('user_id', u.id)
          .order('letrehozva', { ascending: false })
        setSajatLicitek(licitek || [])

        const projektIdk = (licitek || []).map((l: any) => l.projekt_id)
        if (projektIdk.length > 0) {
          const { data: osszes } = await supabase
            .from('licitek').select('projekt_id, osszeg').in('projekt_id', projektIdk)
            .order('osszeg', { ascending: false })
          const topMap: Record<string, number> = {}
          for (const b of osszes || []) {
            if (!topMap[b.projekt_id]) topMap[b.projekt_id] = b.osszeg
          }
          setTopBids(topMap)
        }
      }

      const { data: tokenData } = await supabase
        .from('tokenek')
        .select('egyenleg')
        .eq('user_id', u.id)
        .single()
      setTokenEgyenleg(tokenData?.egyenleg ?? 0)

      setLoading(false)
    }
    betolt()
  }, [])

  async function ujraBekuldes(projekt_id: string) {
    if (!user) return
    setUjrakuldes(projekt_id)
    const res = await fetch('/api/project/resubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projekt_id, user_id: user.id }),
    })
    if (res.ok) {
      setSajatProjektek(prev => prev.map(p => p.id === projekt_id ? { ...p, statusz: 'felulvizsgalat' } : p))
    }
    setUjrakuldes(null)
  }

  async function boostBekuldes(projekt_id: string) {
    if (!user) return
    const amount = parseInt(boostTokenek)
    if (!amount || amount < 1) return
    setBoostLoading(true)
    setBoostUzenet('')
    const res = await fetch('/api/queue/boost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projekt_id, user_id: user.id, token_amount: amount }),
    })
    const data = await res.json()
    if (res.ok) {
      setBoostUzenet(`✓ Now #${data.position} in queue`)
      setSajatProjektek(prev => prev.map(p => p.id === projekt_id ? { ...p, priority_tokens: data.priority_tokens } : p))
      setTokenEgyenleg(prev => prev !== null ? prev - amount : null)
      setTimeout(() => { setBoostAktiv(null); setBoostUzenet('') }, 2500)
    } else {
      setBoostUzenet(data.error || 'Failed')
    }
    setBoostLoading(false)
  }

  async function kilepes() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="/marketplace"
            className="text-gray-400 text-sm hover:text-white transition px-3 py-2 rounded-lg hover:bg-gray-800">
            Aukciós Ház
          </a>
          <a href="/tokens"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-violet-950/60 border border-violet-800/40 text-violet-300 hover:bg-violet-900/60 transition font-semibold">
            <span>⚡</span>
            <span>{tokenEgyenleg ?? '...'}</span>
          </a>
          <UserMenu email={user?.email ?? ''} onSignOut={kilepes} />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Welcome, <span className="text-violet-400">{user?.email?.split('@')[0]}</span>!</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            szerepkor === 'elado' ? 'bg-amber-900/40 text-amber-400 border-amber-800' :
            szerepkor === 'mindketto' ? 'bg-violet-900/40 text-violet-400 border-violet-800' :
            'bg-blue-900/40 text-blue-400 border-blue-800'
          }`}>
            {szerepkor === 'elado' ? '💡 Seller' : szerepkor === 'mindketto' ? '🔄 Seller & Buyer' : '🛒 Buyer'}
          </span>
        </div>
        <p className="text-gray-400 mb-10">
          {szerepkor === 'elado' ? 'Manage your listings and track incoming bids.' :
           szerepkor === 'mindketto' ? 'Manage your listings and track your bids in one place.' :
           'Track your bids and purchase winning projects.'}
        </p>

        {szerepkor === 'elado' || szerepkor === 'mindketto' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {[
                { label: 'Összes', val: sajatProjektek.filter(p => p.statusz !== 'draft').length, color: 'text-white', bg: '' },
                { label: 'Élő', val: sajatProjektek.filter(p => p.statusz === 'aktiv').length, color: 'text-green-400', bg: 'border-green-900/40' },
                { label: 'Felülvizsgálat', val: sajatProjektek.filter(p => p.statusz === 'felulvizsgalat').length, color: 'text-amber-400', bg: 'border-amber-900/40' },
                { label: 'Lezárt', val: sajatProjektek.filter(p => p.statusz === 'lezart').length, color: 'text-gray-500', bg: '' },
              ].map(s => (
                <div key={s.label} className={`bg-gray-900 border ${s.bg || 'border-gray-800'} rounded-2xl p-5 hover:border-gray-700 transition`}>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-3xl font-black tabular-nums ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            {sajatProjektek.length === 0 ? (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">💡</div>
                <h2 className="text-xl font-bold mb-2">List your first project</h2>
                <p className="text-gray-400 text-sm mb-6 max-w-sm">Sell an idea, prototype, or proven project — the market decides what it&apos;s worth.</p>
                <a href="/submit" className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
                  + List a Project
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">My Projects</h2>
                  <a href="/submit" className="bg-violet-600 hover:bg-violet-700 transition px-4 py-2 rounded-full text-sm font-semibold">
                    + New Project
                  </a>
                </div>
                {sajatProjektek.map(p => (
                  <div key={p.id} className={`bg-gray-900 border rounded-2xl p-5 flex items-center justify-between gap-4 transition hover:border-gray-700 ${
                    p.statusz === 'aktiv' ? 'border-green-900/40' :
                    p.statusz === 'elutasitva' ? 'border-red-900/30' :
                    'border-gray-800'
                  }`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {p.statusz === 'aktiv' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shrink-0" />}
                        <p className="font-semibold truncate">{p.nev}</p>
                      </div>
                      <p className="text-gray-500 text-sm truncate">{p.rovid_leiras}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {p.statusz === 'aktiv' && projektLicitek[p.id] && projektLicitek[p.id].db > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Top licit</p>
                          <p className="text-sm font-bold text-green-400">€{projektLicitek[p.id].top.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-600">{projektLicitek[p.id].db} licit</p>
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        p.statusz === 'aktiv' ? 'bg-green-900/40 text-green-400 border border-green-800/40' :
                        p.statusz === 'elutasitva' ? 'bg-red-900/40 text-red-400 border border-red-800/40' :
                        p.statusz === 'lezart' ? 'bg-gray-800 text-gray-500 border border-gray-700' :
                        p.statusz === 'draft' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/40' :
                        'bg-amber-900/40 text-amber-400 border border-amber-800/40'
                      }`}>
                        {p.statusz === 'aktiv' ? '🟢 Élő' : p.statusz === 'elutasitva' ? 'Elutasítva' : p.statusz === 'lezart' ? 'Lezárt' : p.statusz === 'draft' ? 'Vázlat' : 'Felülvizsgálat'}
                      </span>
                      {p.statusz !== 'draft' && <span className="text-violet-400 font-bold tabular-nums">€{p.kikialtasi_ar.toLocaleString()}</span>}
                      {p.statusz === 'elutasitva' && (
                        <button
                          onClick={() => ujraBekuldes(p.id)}
                          disabled={ujrakuldes === p.id}
                          className="text-xs border border-violet-700 text-violet-400 hover:bg-violet-900/20 disabled:opacity-50 transition px-3 py-1 rounded-full"
                        >
                          {ujrakuldes === p.id ? '...' : 'Resubmit'}
                        </button>
                      )}
                      {p.statusz === 'varakozas' && (
                        boostAktiv === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number" min={1} max={tokenEgyenleg ?? 999}
                              value={boostTokenek}
                              onChange={e => setBoostTokenek(e.target.value)}
                              className="w-14 bg-gray-800 border border-amber-700 text-white text-xs px-2 py-1 rounded-lg text-center"
                            />
                            <span className="text-xs text-amber-400">⚡</span>
                            <button onClick={() => boostBekuldes(p.id)} disabled={boostLoading}
                              className="text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition px-2 py-1 rounded-lg font-semibold text-white">
                              {boostLoading ? '...' : 'Boost'}
                            </button>
                            <button onClick={() => { setBoostAktiv(null); setBoostUzenet('') }}
                              className="text-xs text-gray-500 hover:text-gray-300">✕</button>
                            {boostUzenet && <span className="text-xs text-green-400">{boostUzenet}</span>}
                          </div>
                        ) : (
                          <button onClick={() => { setBoostAktiv(p.id); setBoostTokenek('5') }}
                            className="text-xs border border-amber-700/60 text-amber-400 hover:bg-amber-900/20 transition px-2.5 py-1 rounded-full flex items-center gap-1">
                            ⚡ Boost{p.priority_tokens > 0 ? ` (${p.priority_tokens})` : ''}
                          </button>
                        )
                      )}
                      {p.statusz === 'draft' ? (
                        <a href={`/submit?draft=${p.id}`} className="text-xs bg-violet-600 hover:bg-violet-700 transition px-3 py-1 rounded-full font-semibold">
                          Continue →
                        </a>
                      ) : (
                        <a href={`/project/${p.id}`} className="text-gray-400 hover:text-white text-sm transition">View →</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}

        {szerepkor === 'vevo' || szerepkor === 'mindketto' ? (
          <div className={szerepkor === 'mindketto' ? 'mt-12 pt-12 border-t border-gray-800' : ''}>
          {szerepkor === 'mindketto' && <h2 className="text-2xl font-bold mb-6">My Bids</h2>}
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Bids Placed</p>
                <p className="text-3xl font-bold">{sajatLicitek.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Böngéssz az Aukciós Házban</p>
                <a href="/marketplace" className="text-violet-400 font-semibold hover:text-violet-300 transition">Aukciós Ház megnyitása →</a>
              </div>
            </div>

            {sajatLicitek.length === 0 ? (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🛒</div>
                <h2 className="text-xl font-bold mb-2">You haven&apos;t placed any bids yet</h2>
                <p className="text-gray-400 text-sm mb-6">Böngéssz az Aukciós Házban és add be az első ajánlatod!</p>
                <a href="/marketplace" className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
                  Aukciós Ház →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold mb-2">My Bids</h2>
                {sajatLicitek.map((l: any) => {
                  const top = topBids[l.projekt_id]
                  const winning = top != null && l.osszeg >= top
                  const lezart = l.projektek?.statusz === 'lezart'
                  return (
                    <div key={l.id} className={`bg-gray-900 border rounded-2xl p-5 flex items-center justify-between gap-4 ${winning && !lezart ? 'border-green-800' : 'border-gray-800'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{l.projektek?.nev}</p>
                          {lezart ? (
                            winning
                              ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800">🏆 Won</span>
                              : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">Ended</span>
                          ) : winning ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800">🥇 Winning</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-800">Outbid</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">My bid: <span className="text-violet-400 font-bold">€{l.osszeg.toLocaleString()}</span>
                          {!winning && top && <span className="text-gray-600 ml-1">· Top: €{top.toLocaleString()}</span>}
                        </p>
                      </div>
                      <a href={`/project/${l.projekt_id}`} className="text-gray-400 hover:text-white text-sm transition shrink-0">View →</a>
                    </div>
                  )
                })}
              </div>
            )}
          </>
          </div>
        ) : null}
      </div>
    </main>
  )
}
