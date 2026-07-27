'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const badge_info: Record<string, { label: string; szin: string }> = {
  idea: { label: '🌱 Concept', szin: 'bg-green-900/40 text-green-400 border-green-800' },
  prototype: { label: '🛠️ Prototype', szin: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  proven: { label: '✅ Proven', szin: 'bg-violet-900/40 text-violet-400 border-violet-800' },
}

type Projekt = {
  id: string
  nev: string
  rovid_leiras: string
  kategoria: string
  badge: string
  kikialtasi_ar: number
  van_domain: boolean
  van_kod: boolean
  van_feliratkozok: boolean
  van_bevetel: boolean
  letrehozva: string
  lejarat: string | null
}

function timeLeft(lejarat: string | null): string {
  if (!lejarat) return ''
  const diff = new Date(lejarat).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h left`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m left`
}

export default function Marketplace() {
  const [projektek, setProjektek] = useState<Projekt[]>([])
  const [loading, setLoading] = useState(true)
  const [szuro, setSzuro] = useState('mind')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('projektek')
      .select('*')
      .eq('statusz', 'aktiv')
      .order('letrehozva', { ascending: false })
      .then(({ data }) => {
        setProjektek(data || [])
        setLoading(false)
      })
  }, [])

  const szurt = szuro === 'mind' ? projektek : projektek.filter(p => p.badge === szuro)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">Dashboard</a>
          <a href="/submit" className="bg-violet-600 hover:bg-violet-700 transition px-4 py-2 rounded-full text-sm font-semibold">
            + List Project
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-gray-400 mb-8">Browse verified projects and place your bid on the ones you want to acquire.</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { ertek: 'mind', label: 'All' },
            { ertek: 'idea', label: '🌱 Concept' },
            { ertek: 'prototype', label: '🛠️ Prototype' },
            { ertek: 'proven', label: '✅ Proven' },
          ].map(s => (
            <button
              key={s.ertek}
              onClick={() => setSzuro(s.ertek)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${szuro === s.ertek ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : szurt.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400">No projects in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {szurt.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-violet-700 transition">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge_info[p.badge]?.szin}`}>
                    {badge_info[p.badge]?.label}
                  </span>
                  <span className="text-xs text-gray-500">{p.kategoria}</span>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-1">{p.nev}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{p.rovid_leiras}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {p.van_domain && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">🌐 Domain</span>}
                  {p.van_kod && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">💻 Source Code</span>}
                  {p.van_feliratkozok && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">📧 Email List</span>}
                  {p.van_bevetel && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">💰 Revenue</span>}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500">Starting bid</p>
                    <p className="text-xl font-bold text-violet-400">€{p.kikialtasi_ar.toLocaleString()}</p>
                    {p.lejarat && (
                      <p className={`text-xs mt-1 ${new Date(p.lejarat) < new Date() ? 'text-red-400' : 'text-amber-400'}`}>
                        ⏱ {timeLeft(p.lejarat)}
                      </p>
                    )}
                  </div>
                  <a href={`/project/${p.id}`} className="bg-violet-600 hover:bg-violet-700 transition px-4 py-2 rounded-full text-sm font-semibold">
                    View Details →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
