'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'nemesszilard2005@gmail.com'

const badge_info: Record<string, string> = {
  papir: '🌱 Concept',
  prototipus: '🛠️ Prototype',
  bizonyitott: '✅ Proven',
}

type Projekt = {
  id: string
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
  statusz: string
  letrehozva: string
  user_id: string
}

export default function AdminPage() {
  const [projektek, setProjektek] = useState<Projekt[]>([])
  const [loading, setLoading] = useState(true)
  const [hozzaferes, setHozzaferes] = useState(false)
  const [aktiv, setAktiv] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function betolt() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setHozzaferes(true)

      const { data } = await supabase
        .from('projektek')
        .select('*')
        .eq('statusz', 'felulvizsgalat')
        .order('letrehozva', { ascending: true })

      setProjektek(data || [])
      setLoading(false)
    }
    betolt()
  }, [])

  async function jovahagyas(id: string) {
    setAktiv(id)
    const { error } = await supabase
      .from('projektek')
      .update({ statusz: 'aktiv' })
      .eq('id', id)

    if (!error) {
      setProjektek(prev => prev.filter(p => p.id !== id))
    }
    setAktiv(null)
  }

  async function elutasitas(id: string) {
    setAktiv(id)
    const { error } = await supabase
      .from('projektek')
      .update({ statusz: 'elutasitva' })
      .eq('id', id)

    if (!error) {
      setProjektek(prev => prev.filter(p => p.id !== id))
    }
    setAktiv(null)
  }

  if (!hozzaferes) return null

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
          <span className="ml-3 text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-1 rounded-full font-normal">Admin</span>
        </a>
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">Dashboard</a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Review Queue</h1>
        <p className="text-gray-400 mb-10">
          {projektek.length === 0
            ? 'No projects pending review.'
            : `${projektek.length} project${projektek.length > 1 ? 's' : ''} waiting for approval.`}
        </p>

        {projektek.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-400">All caught up — no projects pending review.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {projektek.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{badge_info[p.badge]}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{p.kategoria}</span>
                    </div>
                    <h2 className="text-xl font-bold">{p.nev}</h2>
                    <p className="text-gray-400 text-sm mt-1">{p.rovid_leiras}</p>
                  </div>
                  <span className="text-violet-400 font-bold text-lg shrink-0">€{p.kikialtasi_ar.toLocaleString()}</span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-4 border-l-2 border-gray-700 pl-4">
                  {p.reszletes_leiras}
                </p>

                <div className="flex gap-2 flex-wrap mb-5">
                  {p.van_domain && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">🌐 Domain</span>}
                  {p.van_kod && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">💻 Source Code</span>}
                  {p.van_feliratkozok && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">📧 Email List</span>}
                  {p.van_bevetel && <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">💰 Revenue</span>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => jovahagyas(p.id)}
                    disabled={aktiv === p.id}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm font-semibold"
                  >
                    {aktiv === p.id ? 'Saving...' : '✓ Approve & Publish'}
                  </button>
                  <button
                    onClick={() => elutasitas(p.id)}
                    disabled={aktiv === p.id}
                    className="border border-red-800 text-red-400 hover:bg-red-900/20 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm font-semibold"
                  >
                    ✕ Reject
                  </button>
                  <a
                    href={`/project/${p.id}`}
                    className="border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition px-5 py-2 rounded-full text-sm"
                    target="_blank"
                  >
                    Preview →
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
