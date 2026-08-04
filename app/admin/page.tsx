'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { apiHivas } from '@/lib/api-hivas'

const ADMIN_EMAIL = 'info.webbloki@gmail.com'

const badge_info: Record<string, string> = {
  idea:      '🌱 Concept',
  prototype: '🛠️ Prototype',
  proven:    '✅ Proven',
}

const GYANUS_AR: Record<string, number> = { idea: 5000, prototype: 20000, proven: 100000 }

type Ellenorzes = {
  kulcs: string; cim: string; rendben: boolean
  ertek: string; magyarazat: string; blokkolo: boolean
}
type AllapotValasz = { ellenorzesek: Ellenorzes[]; blokkolok: number; hianyok: number }

/** A státuszok emberi neve, hogy ne nyers adatbázis-kulcsok legyenek kiírva. */
const STATUSZ_NEV: Record<string, string> = {
  draft: 'Vázlat',
  varakozas: 'Sorban',
  aktiv: 'Élő aukció',
  lezart: 'Lezárt',
  sold: 'Eladva',
  elutasitva: 'Elutasítva',
  felulvizsgalat: 'Felülvizsgálat',
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
  user_email: string
  vevo_email: string
  ai_ertekeles: number | null
}

type Report = {
  id: string
  user_id: string
  user_email: string
  nev: string
  rovid_leiras: string
  reszletes_leiras: string
  kategoria: string
  block_reason: string
  fajlok: { nev: string; url: string; tipus: string }[]
  ip_cim: string
  user_agent: string
  created_at: string
  statusz: string
}

export default function AdminPage() {
  const [projektek, setProjektek] = useState<Projekt[]>([])
  const [reportok, setReportok] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [hozzaferes, setHozzaferes] = useState(false)
  const [aktiv, setAktiv] = useState<string | null>(null)
  const [tab, setTab] = useState<'projektek' | 'reportok' | 'tranzakciok'>('projektek')
  const [feliratkozokSzam, setFeliratkozokSzam] = useState<number>(0)
  const [launchAllapot, setLaunchAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [launchEredmeny, setLaunchEredmeny] = useState<{ sent: number; failed: number } | null>(null)
  const [userEmailek, setUserEmailek] = useState<Record<string, string>>({})
  const [allapot, setAllapot] = useState<AllapotValasz | null>(null)
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

      const [{ data: proj }, rep, { count: felCount }] = await Promise.all([
        supabase.from('projektek').select('*').order('letrehozva', { ascending: false }),
        apiHivas('/api/admin/reports').then(r => r.json()),
        supabase.from('feliratkozok').select('id', { count: 'exact', head: true }),
      ])

      const ujProjektek = proj || []
      setProjektek(ujProjektek)
      setReportok(Array.isArray(rep) ? rep : [])
      setFeliratkozokSzam(felCount ?? 0)

      // Üzemi állapot: mi hiányzik még az éles működéshez
      apiHivas('/api/admin/allapot')
        .then(r => r.json())
        .then(setAllapot)
        .catch(() => {})

      // Fetch seller emails for all projects
      const uniqueUserIds = [...new Set(ujProjektek.map((p: Projekt) => p.user_id).filter(Boolean))]
      if (uniqueUserIds.length > 0) {
        const { data: { session } } = await supabase.auth.getSession()
        apiHivas('/api/admin/user-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ user_ids: uniqueUserIds }),
        }).then(r => r.json()).then(map => setUserEmailek(map)).catch(() => {})
      }

      setLoading(false)
    }
    betolt()
  }, [])

  async function jovahagyas(id: string) {
    setAktiv(id)
    const res = await apiHivas('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projekt_id: id }),
    })
    if (res.ok) {
      setProjektek(prev => prev.filter(p => p.id !== id))
    }
    setAktiv(null)
  }

  async function elutasitas(id: string) {
    setAktiv(id)
    const res = await apiHivas('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projekt_id: id }),
    })
    if (res.ok) {
      setProjektek(prev => prev.filter(p => p.id !== id))
    }
    setAktiv(null)
  }

  async function torles(id: string) {
    if (!confirm('Are you sure you want to permanently delete this project?')) return
    setAktiv(id)
    await supabase.from('projektek').delete().eq('id', id)
    setProjektek(prev => prev.filter(p => p.id !== id))
    setAktiv(null)
  }

  async function feloldasReport(report: Report) {
    setAktiv(report.id)
    await apiHivas('/api/admin/lift-suspension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: report.id, user_id: report.user_id }),
    })
    setReportok(prev => prev.map(r => r.id === report.id ? { ...r, statusz: 'feloldva' } : r))
    setAktiv(null)
  }

  async function launchKuldes() {
    if (!confirm(`Send launch notification to ${feliratkozokSzam} subscribers?`)) return
    setLaunchAllapot('loading')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await apiHivas('/api/admin/launch-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      setLaunchEredmeny({ sent: data.sent, failed: data.failed })
      setLaunchAllapot('siker')
    } else {
      setLaunchAllapot('hiba')
    }
  }

  async function vegelegesTiltas(report: Report) {
    if (!confirm(`Permanently ban ${report.user_email}?`)) return
    setAktiv(report.id)
    await apiHivas('/api/admin/permanent-ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: report.id, user_id: report.user_id }),
    })
    setReportok(prev => prev.map(r => r.id === report.id ? { ...r, statusz: 'vegleges_tiltás' } : r))
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
        <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-8 flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Pages</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🏠 Home', href: '/' },
                { label: '📊 Dashboard', href: '/dashboard' },
                { label: '🏛️ Aukciós Ház', href: '/aukciosHaz' },
                { label: '🪙 Tokens', href: '/tokens' },
                { label: '🔐 Auth', href: '/auth' },
              ].map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition text-sm">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Submit Flow</p>
            <div className="flex flex-wrap gap-2">
              <a href="/submit" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-900/30 border border-blue-800 text-blue-300 hover:text-white hover:border-blue-500 transition text-sm">
                📝 Step 1 — Describe
              </a>
              {projektek.filter(p => p.statusz === 'draft').slice(0, 5).map(p => (
                <div key={p.id} className="flex gap-1 items-center">
                  <a href={`/submit?draft=${p.id}`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-violet-900/30 border border-violet-800 text-violet-300 hover:text-white hover:border-violet-500 transition text-sm max-w-[160px] truncate"
                    title={`Step 2 — ${p.nev}`}>
                    🤖 Step 2
                  </a>
                  <a href={`/submit?draft=${p.id}&step=3`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-800 text-green-300 hover:text-white hover:border-green-500 transition text-sm"
                    title={`Step 3 — ${p.nev}`}>
                    💸 Step 3
                  </a>
                  <span className="text-xs text-gray-500 max-w-[120px] truncate">{p.nev || 'Unnamed'}</span>
                </div>
              ))}
              {projektek.filter(p => p.statusz === 'draft').length === 0 && (
                <span className="text-xs text-gray-600 py-1.5">No drafts in progress</span>
              )}
            </div>
          </div>
        </div>

        {/* Launch notification */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Launch Notification</p>
            <p className="text-gray-400 text-xs mt-0.5">{feliratkozokSzam} subscriber{feliratkozokSzam !== 1 ? 's' : ''} waiting — send the launch email when BidVip goes live</p>
            {launchAllapot === 'siker' && launchEredmeny && (
              <p className="text-green-400 text-xs mt-1">Sent to {launchEredmeny.sent} subscribers{launchEredmeny.failed > 0 ? `, ${launchEredmeny.failed} failed` : ''}</p>
            )}
            {launchAllapot === 'hiba' && <p className="text-red-400 text-xs mt-1">Failed to send. Try again.</p>}
          </div>
          <button
            onClick={launchKuldes}
            disabled={launchAllapot === 'loading' || feliratkozokSzam === 0}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-40 transition"
          >
            {launchAllapot === 'loading' ? 'Sending...' : launchAllapot === 'siker' ? 'Sent ✓' : 'Send Launch Email'}
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          <button onClick={() => setTab('projektek')} className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${tab === 'projektek' ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            Projects ({projektek.length})
          </button>
          <button onClick={() => setTab('reportok')} className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${tab === 'reportok' ? 'bg-red-700 border-red-700 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            Reports {reportok.filter(r => r.statusz === 'pending').length > 0 && <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{reportok.filter(r => r.statusz === 'pending').length}</span>}
          </button>
          <button onClick={() => setTab('tranzakciok')} className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${tab === 'tranzakciok' ? 'bg-amber-700 border-amber-700 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            Transactions ({projektek.filter(p => p.statusz === 'sold').length})
            {projektek.filter(p => p.statusz === 'sold' && p.kikialtasi_ar > (GYANUS_AR[p.badge] ?? 5000)).length > 0 && (
              <span className="ml-1 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                ⚠️ {projektek.filter(p => p.statusz === 'sold' && p.kikialtasi_ar > (GYANUS_AR[p.badge] ?? 5000)).length}
              </span>
            )}
          </button>
        </div>

        {tab === 'reportok' && (
          <div className="flex flex-col gap-6">
            {reportok.length === 0 ? (
              <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-16 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-gray-400">No reports yet.</p>
              </div>
            ) : reportok.map(r => (
              <div key={r.id} className={`bg-gray-900 border rounded-2xl p-6 ${r.statusz === 'pending' ? 'border-red-800' : 'border-gray-800 opacity-70'}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.statusz === 'pending' ? 'bg-red-900/40 text-red-400' : r.statusz === 'feloldva' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {r.statusz === 'pending' ? '⚠️ Pending review' : r.statusz === 'feloldva' ? '✓ Lifted' : '🚫 Permanently banned'}
                    </span>
                    <h2 className="text-lg font-bold mt-2">{r.nev || '(no name)'}</h2>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-xs text-gray-500">👤 {r.user_email} · {new Date(r.created_at).toLocaleString()}</p>
                      <p className="text-xs text-gray-600 font-mono">🆔 Report ID: {r.id}</p>
                      {r.ip_cim && <p className="text-xs text-gray-600 font-mono">🌐 IP: {r.ip_cim}</p>}
                      {r.user_agent && <p className="text-xs text-gray-600 font-mono truncate">💻 {r.user_agent}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/10 border border-red-900/40 rounded-xl px-4 py-2 mb-3 text-sm text-red-300">
                  <strong>Block reason:</strong> {r.block_reason}
                </div>

                {r.rovid_leiras && <p className="text-gray-300 text-sm mb-1"><span className="text-gray-500">Short:</span> {r.rovid_leiras}</p>}
                {r.reszletes_leiras && (
                  <p className="text-gray-400 text-sm leading-relaxed mb-3 border-l-2 border-gray-700 pl-4 whitespace-pre-line">
                    {r.reszletes_leiras}
                  </p>
                )}

                {r.fajlok?.length > 0 && (
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Evidence files</p>
                    {r.fajlok.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition">
                        <span>{f.tipus?.startsWith('image/') ? '🖼️' : f.tipus === 'application/pdf' ? '📄' : '📊'}</span>
                        <span className="underline">{f.nev}</span>
                      </a>
                    ))}
                  </div>
                )}

                {r.statusz === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => feloldasReport(r)} disabled={aktiv === r.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm font-semibold">
                      {aktiv === r.id ? '...' : '✓ Lift suspension'}
                    </button>
                    <button onClick={() => vegelegesTiltas(r)} disabled={aktiv === r.id}
                      className="bg-red-700 hover:bg-red-800 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm font-semibold">
                      🚫 Permanent ban
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'tranzakciok' && (() => {
          const eladt = projektek.filter(p => p.statusz === 'sold')
          // Detect repeat buyer↔seller pairs
          const parok: Record<string, number> = {}
          eladt.forEach(p => {
            const sellerEmail = userEmailek[p.user_id]
            if (p.vevo_email && sellerEmail) {
              const par = [sellerEmail, p.vevo_email].sort().join('|')
              parok[par] = (parok[par] || 0) + 1
            }
          })
          return (
            <div className="flex flex-col gap-4">
              {eladt.length === 0 ? (
                <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-16 text-center">
                  <p className="text-gray-400">No completed transactions yet.</p>
                </div>
              ) : eladt.map(p => {
                const sellerEmail = userEmailek[p.user_id]
                const max_ar = p.ai_ertekeles ? Math.round(p.ai_ertekeles * 1.5) : (GYANUS_AR[p.badge] ?? 5000)
                const magas_ar = p.kikialtasi_ar > max_ar
                const par = sellerEmail && p.vevo_email ? [sellerEmail, p.vevo_email].sort().join('|') : null
                const ismetlo_par = par && parok[par] > 1
                const gyanus = magas_ar || ismetlo_par
                return (
                  <div key={p.id} className={`bg-gray-900 border rounded-2xl p-5 ${gyanus ? 'border-amber-700' : 'border-gray-800'}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {gyanus && <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-semibold">⚠️ Suspicious</span>}
                          <span className="text-xs text-gray-500">{p.badge}</span>
                        </div>
                        <h2 className="font-bold text-lg">{p.nev}</h2>
                        <p className="text-gray-400 text-sm mt-0.5">{p.kategoria}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-bold ${magas_ar ? 'text-amber-400' : 'text-green-400'}`}>€{p.kikialtasi_ar.toLocaleString()}</p>
                        {p.ai_ertekeles && <p className="text-xs text-gray-500 mt-0.5">AI value: €{p.ai_ertekeles.toLocaleString()} · max: €{max_ar.toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-800 rounded-xl px-4 py-3">
                        <p className="text-gray-500 text-xs mb-1">Seller</p>
                        <p className="text-white truncate">{sellerEmail || '—'}</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl px-4 py-3">
                        <p className="text-gray-500 text-xs mb-1">Buyer</p>
                        <p className="text-white truncate">{p.vevo_email || '—'}</p>
                      </div>
                    </div>
                    {ismetlo_par && (
                      <p className="text-amber-400 text-xs mt-3">⚠️ This buyer↔seller pair appears {parok[par!]}x — possible self-dealing</p>
                    )}
                    {magas_ar && (
                      <p className="text-amber-400 text-xs mt-1">⚠️ Price is unusually high for a {p.badge}-stage project</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {tab === 'projektek' && projektek.length === 0 && (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-400">All caught up — no projects pending review.</p>
          </div>
        )}

        {tab === 'projektek' && projektek.length > 0 && (
          <div className="flex flex-col gap-6">
            {projektek.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{badge_info[p.badge]}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{p.kategoria}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.statusz === 'aktiv' ? 'bg-green-900/40 text-green-400' : p.statusz === 'felulvizsgalat' ? 'bg-amber-900/40 text-amber-400' : 'bg-red-900/40 text-red-400'}`}>
                        {p.statusz}
                      </span>
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
                  {p.statusz !== 'elutasitva' && (
                    <button
                      onClick={() => jovahagyas(p.id)}
                      disabled={aktiv === p.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm font-semibold"
                    >
                      {aktiv === p.id ? 'Saving...' : '✓ Approve & Publish'}
                    </button>
                  )}
                  {p.statusz !== 'elutasitva' && (
                    <button
                      onClick={() => elutasitas(p.id)}
                      disabled={aktiv === p.id}
                      className="border border-red-800 text-red-400 hover:bg-red-900/20 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm font-semibold"
                    >
                      ✕ Reject
                    </button>
                  )}
                  {p.statusz === 'elutasitva' && (
                    <span className="border border-red-900 text-red-500 px-5 py-2 rounded-full text-sm font-semibold opacity-60">
                      ✕ Rejected
                    </span>
                  )}
                  <a
                    href={`/project/${p.id}`}
                    className="border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition px-5 py-2 rounded-full text-sm"
                    target="_blank"
                  >
                    Preview →
                  </a>
                  <button
                    onClick={() => torles(p.id)}
                    disabled={aktiv === p.id}
                    className="border border-gray-800 text-gray-600 hover:text-red-400 hover:border-red-900 disabled:opacity-60 transition px-5 py-2 rounded-full text-sm"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}
