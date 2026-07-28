'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const badge_info: Record<string, { label: string; szin: string }> = {
  idea: { label: '🌱 Concept', szin: 'bg-green-900/40 text-green-400 border-green-800' },
  prototype: { label: '🛠️ Prototype', szin: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  proven: { label: '✅ Proven', szin: 'bg-violet-900/40 text-violet-400 border-violet-800' },
}

const SAV_INFO = {
  fast:     { label: '🟢 Fast',     perc: 3,  szin: 'border-green-600',  badge: 'bg-green-900/40 text-green-400' },
  standard: { label: '🟡 Standard', perc: 5,  szin: 'border-yellow-500', badge: 'bg-yellow-900/40 text-yellow-400' },
  premium:  { label: '🔴 Premium',  perc: 20, szin: 'border-red-500',    badge: 'bg-red-900/40 text-red-400' },
}

type Projekt = {
  id: string
  nev: string
  rovid_leiras: string
  kategoria: string
  badge: string
  kikialtasi_ar: number
  lejarat: string | null
  sav: string
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
  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { label: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, done: diff === 0 }
}

function AuctionSlot({ sav, projekt, szunetVege }: {
  sav: keyof typeof SAV_INFO
  projekt: Projekt | null
  szunetVege: Date | null
}) {
  const info = SAV_INFO[sav]
  const countdown = useCountdown(projekt?.lejarat ?? null)
  const breakCountdown = useCountdown(szunetVege?.toISOString() ?? null)

  return (
    <div className={`bg-gray-900 border-2 ${info.szin} rounded-2xl p-5 flex flex-col gap-4 min-h-[320px]`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${info.badge}`}>{info.label}</span>
        <span className="text-xs text-gray-500">{info.perc} min</span>
      </div>

      {projekt ? (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${badge_info[projekt.badge]?.szin}`}>
              {badge_info[projekt.badge]?.label}
            </span>
            <span className="text-xs text-gray-500">{projekt.kategoria}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 line-clamp-2">{projekt.nev}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{projekt.rovid_leiras}</p>
          </div>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
            <div>
              <p className="text-xs text-gray-500">Starting bid</p>
              <p className="text-xl font-bold text-violet-400">€{projekt.kikialtasi_ar.toLocaleString()}</p>
              <p className={`text-lg font-mono font-bold mt-1 ${countdown.done ? 'text-red-400' : 'text-amber-400'}`}>
                ⏱ {countdown.label}
              </p>
            </div>
            <a href={`/project/${projekt.id}`}
              className="bg-violet-600 hover:bg-violet-700 transition px-4 py-2 rounded-full text-sm font-semibold">
              Bid →
            </a>
          </div>
        </>
      ) : szunetVege && !breakCountdown.done ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm mb-2">Next auction in</p>
          <p className="text-3xl font-bold font-mono text-amber-400">{breakCountdown.label}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-500 text-sm">No project in queue</p>
        </div>
      )}
    </div>
  )
}

export default function Marketplace() {
  const [aktiv, setAktiv] = useState<Record<string, Projekt | null>>({ fast: null, standard: null, premium: null })
  const [szunetek, setSzunetek] = useState<Record<string, Date | null>>({ fast: null, standard: null, premium: null })
  const [sor, setSor] = useState<Projekt[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function betolt() {
      const { data: aktivProjektek } = await supabase
        .from('projektek')
        .select('*')
        .eq('statusz', 'aktiv')

      const ujAktiv: Record<string, Projekt | null> = { fast: null, standard: null, premium: null }
      for (const p of aktivProjektek || []) ujAktiv[p.sav] = p
      setAktiv(ujAktiv)

      // Check break times for empty lanes
      const ujSzunetek: Record<string, Date | null> = { fast: null, standard: null, premium: null }
      for (const sav of ['fast', 'standard', 'premium']) {
        if (!ujAktiv[sav]) {
          const { data: utolso } = await supabase
            .from('projektek')
            .select('lejarat')
            .eq('statusz', 'lezart')
            .eq('sav', sav)
            .order('lejarat', { ascending: false })
            .limit(1)
            .single()

          if (utolso?.lejarat) {
            const vege = new Date(new Date(utolso.lejarat).getTime() + 30 * 1000)
            if (vege > new Date()) ujSzunetek[sav] = vege
          }
        }
      }
      setSzunetek(ujSzunetek)

      // Load queue
      const { data: sorban } = await supabase
        .from('projektek')
        .select('id, nev, rovid_leiras, badge, kategoria, kikialtasi_ar, sav, priority_tokens')
        .eq('statusz', 'varakozas')
        .order('priority_tokens', { ascending: false })
        .order('varakozas_kezd', { ascending: true })
        .limit(9)

      setSor(sorban || [])
      setLoading(false)
    }
    betolt()
    const i = setInterval(betolt, 30000)
    return () => clearInterval(i)
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

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Live Auctions</h1>
        <p className="text-gray-400 mb-8">Three lanes running simultaneously — bid before the clock runs out.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(['fast', 'standard', 'premium'] as const).map(sav => (
            <AuctionSlot key={sav} sav={sav} projekt={aktiv[sav]} szunetVege={szunetek[sav]} />
          ))}
        </div>

        {sor.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Up Next <span className="text-gray-500 text-sm font-normal">({sor.length} in queue)</span></h2>
            <div className="flex flex-col gap-3">
              {sor.map((p) => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${SAV_INFO[p.sav as keyof typeof SAV_INFO]?.badge}`}>
                    {SAV_INFO[p.sav as keyof typeof SAV_INFO]?.label}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${badge_info[p.badge]?.szin}`}>
                    {badge_info[p.badge]?.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.nev}</p>
                    <p className="text-gray-500 text-xs truncate">{p.rovid_leiras}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-violet-400 font-bold">€{p.kikialtasi_ar.toLocaleString()}</p>
                    {p.priority_tokens > 0 && <p className="text-xs text-amber-400">⚡ {p.priority_tokens} boost</p>}
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
