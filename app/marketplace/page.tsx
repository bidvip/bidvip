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
  lejarat: string | null
  priority_tokens: number
}

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    if (!target) return
    const update = () => setDiff(Math.max(0, new Date(target).getTime() - Date.now()))
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [target])
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, done: diff === 0 }
}

function LiveAuction({ projekt }: { projekt: Projekt }) {
  const { h, m, s, done } = useCountdown(projekt.lejarat)
  return (
    <div className="bg-gray-900 border-2 border-violet-600 rounded-2xl p-8 mb-12 relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
        🔴 LIVE NOW
      </div>
      <div className="flex items-start gap-3 mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge_info[projekt.badge]?.szin}`}>
          {badge_info[projekt.badge]?.label}
        </span>
        <span className="text-xs text-gray-500">{projekt.kategoria}</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">{projekt.nev}</h2>
      <p className="text-gray-400 mb-6">{projekt.rovid_leiras}</p>
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Starting bid</p>
          <p className="text-3xl font-bold text-violet-400">€{projekt.kikialtasi_ar.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">{done ? 'Auction ended' : 'Time remaining'}</p>
          <div className="flex gap-2">
            {[{ v: h, l: 'h' }, { v: m, l: 'm' }, { v: s, l: 's' }].map(({ v, l }) => (
              <div key={l} className="bg-gray-800 rounded-xl px-4 py-3 min-w-[56px] text-center">
                <p className="text-2xl font-bold text-white">{String(v).padStart(2, '0')}</p>
                <p className="text-xs text-gray-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <a href={`/project/${projekt.id}`}
          className="bg-violet-600 hover:bg-violet-700 transition px-8 py-3 rounded-full font-bold text-lg">
          Place Bid →
        </a>
      </div>
    </div>
  )
}

function BreakCountdown({ szunetVege }: { szunetVege: Date }) {
  const { m, s } = useCountdown(szunetVege.toISOString())
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-12 text-center">
      <p className="text-gray-400 text-sm mb-2">Next auction starts in</p>
      <p className="text-4xl font-bold text-amber-400">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</p>
      <p className="text-gray-500 text-sm mt-2">Get ready — the next project is coming up</p>
    </div>
  )
}

export default function Marketplace() {
  const [aktiv, setAktiv] = useState<Projekt | null>(null)
  const [sor, setSor] = useState<Projekt[]>([])
  const [szunetVege, setSzunetVege] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function betolt() {
      // Load live auction
      const { data: aktivProjekt } = await supabase
        .from('projektek')
        .select('*')
        .eq('statusz', 'aktiv')
        .limit(1)
        .single()

      setAktiv(aktivProjekt || null)

      // If no live auction, check for break period
      if (!aktivProjekt) {
        const { data: utolsoLezart } = await supabase
          .from('projektek')
          .select('lejarat')
          .eq('statusz', 'lezart')
          .order('lejarat', { ascending: false })
          .limit(1)
          .single()

        if (utolsoLezart?.lejarat) {
          const vege = new Date(new Date(utolsoLezart.lejarat).getTime() + 15 * 60 * 1000)
          if (vege > new Date()) setSzunetVege(vege)
        }
      }

      // Load queue
      const { data: sorban } = await supabase
        .from('projektek')
        .select('*')
        .eq('statusz', 'varakozas')
        .order('priority_tokens', { ascending: false })
        .order('varakozas_kezd', { ascending: true })
        .limit(10)

      setSor(sorban || [])
      setLoading(false)
    }
    betolt()
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </main>
  )

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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Live Auction</h1>
        <p className="text-gray-400 mb-8">One project at a time — bid before the clock runs out.</p>

        {aktiv ? (
          <LiveAuction projekt={aktiv} />
        ) : szunetVege ? (
          <BreakCountdown szunetVege={szunetVege} />
        ) : (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-12 text-center mb-12">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold mb-2">No active auction right now</h2>
            <p className="text-gray-400 text-sm">Check back soon — the next project will go live shortly.</p>
          </div>
        )}

        {sor.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Up Next <span className="text-gray-500 text-sm font-normal">({sor.length} in queue)</span></h2>
            <div className="flex flex-col gap-3">
              {sor.map((p, i) => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
                  <span className="text-gray-600 font-bold text-lg w-6">#{i + 1}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${badge_info[p.badge]?.szin}`}>
                    {badge_info[p.badge]?.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.nev}</p>
                    <p className="text-gray-500 text-xs truncate">{p.rovid_leiras}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-violet-400 font-bold">€{p.kikialtasi_ar.toLocaleString()}</p>
                    {p.priority_tokens > 0 && (
                      <p className="text-xs text-amber-400">⚡ {p.priority_tokens} boost</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
