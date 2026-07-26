'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [szerepkor, setSzerepkor] = useState<string | null>(null)
  const [sajatProjektek, setSajatProjektek] = useState<any[]>([])
  const [sajatLicitek, setSajatLicitek] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

      if (profil.szerepkor === 'elado') {
        const { data: projektek } = await supabase
          .from('projektek')
          .select('*')
          .eq('user_id', u.id)
          .order('letrehozva', { ascending: false })
        setSajatProjektek(projektek || [])
      } else {
        const { data: licitek } = await supabase
          .from('licitek')
          .select('*, projektek(nev, kikialtasi_ar, badge)')
          .eq('user_id', u.id)
          .order('letrehozva', { ascending: false })
        setSajatLicitek(licitek || [])
      }

      setLoading(false)
    }
    betolt()
  }, [])

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
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/marketplace" className="text-gray-300 text-sm hover:text-white transition font-semibold">Marketplace</a>
          <span className="text-gray-400 text-sm hidden sm:inline">{user?.email}</span>
          <button
            onClick={kilepes}
            className="border border-gray-700 hover:border-gray-500 transition px-4 py-2 rounded-full text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Welcome, <span className="text-violet-400">{user?.email?.split('@')[0]}</span>!</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${szerepkor === 'elado' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>
            {szerepkor === 'elado' ? '💡 Seller' : '🛒 Buyer'}
          </span>
        </div>
        <p className="text-gray-400 mb-10">
          {szerepkor === 'elado' ? 'Manage your listings and track incoming bids.' : 'Track your bids and purchase winning projects.'}
        </p>

        {szerepkor === 'elado' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">My Projects</p>
                <p className="text-3xl font-bold">{sajatProjektek.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Live Auctions</p>
                <p className="text-3xl font-bold">{sajatProjektek.filter(p => p.statusz === 'aktiv').length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Under Review</p>
                <p className="text-3xl font-bold">{sajatProjektek.filter(p => p.statusz === 'felulvizsgalat').length}</p>
              </div>
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
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{p.nev}</p>
                      <p className="text-gray-400 text-sm">{p.rovid_leiras}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.statusz === 'aktiv' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                        {p.statusz === 'aktiv' ? 'Live' : 'Under Review'}
                      </span>
                      <span className="text-violet-400 font-bold">€{p.kikialtasi_ar}</span>
                      <a href={`/project/${p.id}`} className="text-gray-400 hover:text-white text-sm transition">View →</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Bids Placed</p>
                <p className="text-3xl font-bold">{sajatLicitek.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Browse the marketplace</p>
                <a href="/marketplace" className="text-violet-400 font-semibold hover:text-violet-300 transition">Open Marketplace →</a>
              </div>
            </div>

            {sajatLicitek.length === 0 ? (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🛒</div>
                <h2 className="text-xl font-bold mb-2">You haven&apos;t placed any bids yet</h2>
                <p className="text-gray-400 text-sm mb-6">Browse the marketplace and place your first offer!</p>
                <a href="/marketplace" className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
                  Browse Marketplace →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold mb-2">My Bids</h2>
                {sajatLicitek.map((l: any) => (
                  <div key={l.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{l.projektek?.nev}</p>
                      <p className="text-gray-400 text-sm">My bid: <span className="text-violet-400 font-bold">€{l.osszeg}</span></p>
                    </div>
                    <a href={`/project/${l.projekt_id}`} className="text-gray-400 hover:text-white text-sm transition shrink-0">View →</a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
