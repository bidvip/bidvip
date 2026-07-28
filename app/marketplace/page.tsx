'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const SAV_INFO = {
  fast:     { label: 'FAST',     perc: 3,  color: '#22c55e', glow: '0 0 30px #22c55e55' },
  standard: { label: 'STANDARD', perc: 5,  color: '#eab308', glow: '0 0 30px #eab30855' },
  premium:  { label: 'PREMIUM',  perc: 20, color: '#ef4444', glow: '0 0 30px #ef444455' },
}

const badge_info: Record<string, { label: string; color: string }> = {
  idea:      { label: '🌱 Concept',   color: '#86efac' },
  prototype: { label: '🛠️ Prototype', color: '#93c5fd' },
  proven:    { label: '✅ Proven',    color: '#c4b5fd' },
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
  return { label: `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, done: diff === 0, diff }
}

function TvWindow({ sav, projekt, szunetVege }: {
  sav: keyof typeof SAV_INFO
  projekt: Projekt | null
  szunetVege: Date | null
}) {
  const info = SAV_INFO[sav]
  const countdown = useCountdown(projekt?.lejarat ?? null)
  const breakCountdown = useCountdown(szunetVege?.toISOString() ?? null)
  const isLive = !!projekt && !countdown.done

  return (
    <div style={{ boxShadow: isLive ? info.glow : 'none' }}
      className="relative bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col"
    >
      {/* TV top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800"
        style={{ background: isLive ? `${info.color}18` : '#111' }}>
        <div className="flex items-center gap-2">
          {isLive && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: info.color }} />}
          <span className="text-xs font-bold tracking-widest" style={{ color: info.color }}>
            {info.label}
          </span>
          {isLive && <span className="text-xs font-bold text-white bg-red-600 px-1.5 rounded">LIVE</span>}
        </div>
        <span className="text-xs text-gray-600">{info.perc} MIN</span>
      </div>

      {/* TV screen content */}
      <div className="flex-1 p-5 flex flex-col min-h-[280px]">
        {projekt ? (
          <>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: badge_info[projekt.badge]?.color, background: `${badge_info[projekt.badge]?.color}22` }}>
                {badge_info[projekt.badge]?.label}
              </span>
              <span className="text-xs text-gray-500">{projekt.kategoria}</span>
            </div>

            <h3 className="font-bold text-xl mb-2 leading-snug">{projekt.nev}</h3>
            <p className="text-gray-400 text-sm line-clamp-3 flex-1">{projekt.rovid_leiras}</p>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Starting bid</p>
                  <p className="text-2xl font-bold" style={{ color: info.color }}>
                    €{projekt.kikialtasi_ar.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Time left</p>
                  <p className={`text-2xl font-mono font-bold ${countdown.done ? 'text-red-400' : 'text-white'}`}>
                    {countdown.label}
                  </p>
                </div>
              </div>
              <a href={`/project/${projekt.id}`}
                className="mt-3 block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition"
                style={{ background: info.color, color: '#000' }}>
                Place Bid →
              </a>
            </div>
          </>
        ) : szunetVege && !breakCountdown.done ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">Next auction in</p>
            <p className="text-4xl font-mono font-bold text-white">{breakCountdown.label}</p>
            <p className="text-gray-600 text-xs mt-2">Break</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-gray-600 text-sm">No project in queue</p>
          </div>
        )}
      </div>
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
        .from('projektek').select('*').eq('statusz', 'aktiv')

      const ujAktiv: Record<string, Projekt | null> = { fast: null, standard: null, premium: null }
      for (const p of aktivProjektek || []) ujAktiv[p.sav] = p
      setAktiv(ujAktiv)

      const ujSzunetek: Record<string, Date | null> = { fast: null, standard: null, premium: null }
      for (const sav of ['fast', 'standard', 'premium']) {
        if (!ujAktiv[sav]) {
          const { data: utolso } = await supabase
            .from('projektek').select('lejarat')
            .eq('statusz', 'lezart').eq('sav', sav)
            .order('lejarat', { ascending: false }).limit(1).single()
          if (utolso?.lejarat) {
            const vege = new Date(new Date(utolso.lejarat).getTime() + 30 * 1000)
            if (vege > new Date()) ujSzunetek[sav] = vege
          }
        }
      }
      setSzunetek(ujSzunetek)

      const { data: sorban } = await supabase
        .from('projektek').select('id, nev, rovid_leiras, badge, kategoria, kikialtasi_ar, sav, priority_tokens')
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
      <div className="text-gray-400 text-sm">Loading...</div>
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

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Live Auctions</h1>
          <p className="text-gray-500 mt-1 text-sm">3 channels running simultaneously — bid before time runs out</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {(['fast', 'standard', 'premium'] as const).map(sav => (
            <TvWindow key={sav} sav={sav} projekt={aktiv[sav]} szunetVege={szunetek[sav]} />
          ))}
        </div>

        {sor.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-gray-300">
              Up Next <span className="text-gray-600 font-normal text-sm">({sor.length} queued)</span>
            </h2>
            <div className="flex flex-col gap-2">
              {sor.map((p) => {
                const si = SAV_INFO[p.sav as keyof typeof SAV_INFO]
                return (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ color: si?.color, background: `${si?.color}22` }}>
                      {si?.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.nev}</p>
                      <p className="text-gray-500 text-xs truncate">{p.rovid_leiras}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ color: si?.color }}>€{p.kikialtasi_ar.toLocaleString()}</p>
                      {p.priority_tokens > 0 && <p className="text-xs text-amber-400">⚡ {p.priority_tokens}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
