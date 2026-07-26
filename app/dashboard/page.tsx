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

      if (!profil) { router.push('/szerepvalasztas'); return }
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
        <div className="text-gray-400">Betöltés...</div>
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
          <a href="/piac" className="text-gray-300 text-sm hover:text-white transition font-semibold">Piactér</a>
          <span className="text-gray-400 text-sm hidden sm:inline">{user?.email}</span>
          <button
            onClick={kilepes}
            className="border border-gray-700 hover:border-gray-500 transition px-4 py-2 rounded-full text-sm"
          >
            Kilépés
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Üdv, <span className="text-violet-400">{user?.email?.split('@')[0]}</span>!</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${szerepkor === 'elado' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-blue-900/40 text-blue-400 border-blue-800'}`}>
            {szerepkor === 'elado' ? '💡 Eladó' : '🛒 Vevő'}
          </span>
        </div>
        <p className="text-gray-400 mb-10">
          {szerepkor === 'elado' ? 'Kezeld a projektjeidet és kövesd a beérkező liciteket.' : 'Kövesd a licitjeidet és vásárold meg a nyertes projekteket.'}
        </p>

        {szerepkor === 'elado' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Saját projektek</p>
                <p className="text-3xl font-bold">{sajatProjektek.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Aktív projektek</p>
                <p className="text-3xl font-bold">{sajatProjektek.filter(p => p.statusz === 'aktiv').length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Felülvizsgálat alatt</p>
                <p className="text-3xl font-bold">{sajatProjektek.filter(p => p.statusz === 'felulvizsgalat').length}</p>
              </div>
            </div>

            {sajatProjektek.length === 0 ? (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">💡</div>
                <h2 className="text-xl font-bold mb-2">Töltsd fel az első projektedet</h2>
                <p className="text-gray-400 text-sm mb-6 max-w-sm">Adj el egy ötletet, prototípust vagy bizonyított projektet — a piac dönti el az árat.</p>
                <a href="/projekt-feltoltes" className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
                  + Projekt feltöltése
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">Saját projektjeim</h2>
                  <a href="/projekt-feltoltes" className="bg-violet-600 hover:bg-violet-700 transition px-4 py-2 rounded-full text-sm font-semibold">
                    + Új projekt
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
                        {p.statusz === 'aktiv' ? 'Aktív' : 'Felülvizsgálat'}
                      </span>
                      <span className="text-violet-400 font-bold">€{p.kikialtasi_ar}</span>
                      <a href={`/projekt/${p.id}`} className="text-gray-400 hover:text-white text-sm transition">Megtekint →</a>
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
                <p className="text-gray-400 text-sm mb-1">Leadott licitek</p>
                <p className="text-3xl font-bold">{sajatLicitek.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">Böngéssz a piactéren</p>
                <a href="/piac" className="text-violet-400 font-semibold hover:text-violet-300 transition">Piactér megnyitása →</a>
              </div>
            </div>

            {sajatLicitek.length === 0 ? (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🛒</div>
                <h2 className="text-xl font-bold mb-2">Még nem licitáltál semmire</h2>
                <p className="text-gray-400 text-sm mb-6">Böngéssz a piactéren és tedd meg az első ajánlatod!</p>
                <a href="/piac" className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
                  Piactér böngészése →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold mb-2">Licitjeim</h2>
                {sajatLicitek.map((l: any) => (
                  <div key={l.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{l.projektek?.nev}</p>
                      <p className="text-gray-400 text-sm">Az én ajánlatom: <span className="text-violet-400 font-bold">€{l.osszeg}</span></p>
                    </div>
                    <a href={`/projekt/${l.projekt_id}`} className="text-gray-400 hover:text-white text-sm transition shrink-0">Megtekint →</a>
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
