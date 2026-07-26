'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const categories = [
  'SaaS / Software',
  'E-commerce',
  'Mobile App',
  'Content / Blog',
  'Marketplace',
  'Fintech',
  'Edtech',
  'Healthtech',
  'Other',
]

const badge_szintek = [
  { ertek: 'papir', label: '🌱 Concept', leiras: 'Idea only — no code, no revenue yet' },
  { ertek: 'prototipus', label: '🛠️ Prototype', leiras: 'Something tangible exists: code, mockup, domain, or early users' },
  { ertek: 'bizonyitott', label: '✅ Proven', leiras: 'Real revenue, active users, or measurable traction' },
]

export default function Submit() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    nev: '',
    rovid_leiras: '',
    reszletes_leiras: '',
    kategoria: '',
    badge: 'papir',
    kikialtasi_ar: '',
    idotartam_nap: '14',
    van_domain: false,
    van_kod: false,
    van_feliratkozok: false,
    van_bevetel: false,
  })
  const [allapot, setAllapot] = useState<'idle' | 'feltoltes' | 'szures' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const [kivalasztottFajlok, setKivalasztottFajlok] = useState<File[]>([])
  const [feltoltottFajlok, setFeltoltottFajlok] = useState<{nev: string; url: string; tipus: string}[]>([])

  function frissit(mezo: string, ertek: string | boolean) {
    setForm(prev => ({ ...prev, [mezo]: ertek }))
  }

  function fajlValasztas(e: React.ChangeEvent<HTMLInputElement>) {
    const fajlok = Array.from(e.target.files || [])
    setKivalasztottFajlok(prev => [...prev, ...fajlok].slice(0, 5))
    e.target.value = ''
  }

  function fajlTorles(index: number) {
    setKivalasztottFajlok(prev => prev.filter((_, i) => i !== index))
  }

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('feltoltes')
    setHiba('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const ujFajlok: {nev: string; url: string; tipus: string}[] = []
    for (const fajl of kivalasztottFajlok) {
      const fd = new FormData()
      fd.append('fajl', fajl)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        ujFajlok.push(data)
      }
    }
    setFeltoltottFajlok(ujFajlok)

    setAllapot('szures')

    const kepUrlok = ujFajlok.filter(f => f.tipus.startsWith('image/')).map(f => f.url)

    const screenRes = await fetch('/api/ai/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nev: form.nev,
        rovid_leiras: form.rovid_leiras,
        reszletes_leiras: form.reszletes_leiras,
        kategoria: form.kategoria,
        kepUrlok,
      }),
    })
    const screen = await screenRes.json()
    if (!screen.ok) {
      setHiba(screen.reason || 'Your submission did not pass our quality check. Please add more detail and try again.')
      setAllapot('hiba')
      return
    }

    setAllapot('loading')

    const { error } = await supabase.from('projektek').insert([{
      user_id: user.id,
      nev: form.nev,
      rovid_leiras: form.rovid_leiras,
      reszletes_leiras: form.reszletes_leiras,
      kategoria: form.kategoria,
      badge: form.badge,
      kikialtasi_ar: parseInt(form.kikialtasi_ar),
      lejarat: new Date(Date.now() + parseInt(form.idotartam_nap) * 24 * 60 * 60 * 1000).toISOString(),
      van_domain: form.van_domain,
      van_kod: form.van_kod,
      van_feliratkozok: form.van_feliratkozok,
      van_bevetel: form.van_bevetel,
      statusz: 'felulvizsgalat',
      user_email: user.email,
      fajlok: ujFajlok,
    }])

    if (error) {
      setHiba('Something went wrong. Please try again.')
      setAllapot('hiba')
    } else {
      setAllapot('siker')
    }
  }

  if (allapot === 'siker') {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Project submitted!</h2>
        <p className="text-gray-400 mb-6 text-center">We&apos;ll review it and publish it to the marketplace shortly.</p>
        <button onClick={() => router.push('/dashboard')} className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
          Back to Dashboard
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">← Back</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">List a Project</h1>
        <p className="text-gray-400 mb-8">The more detail you provide, the higher price you can command.</p>

        <form onSubmit={beküldes} className="flex flex-col gap-6">
          {/* Basic info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-lg">Basic Information</h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Project name *</label>
              <input
                required
                value={form.nev}
                onChange={e => frissit('nev', e.target.value)}
                placeholder="e.g. AI-powered customer support SaaS"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Short description * (max 150 characters)</label>
              <input
                required
                maxLength={150}
                value={form.rovid_leiras}
                onChange={e => frissit('rovid_leiras', e.target.value)}
                placeholder="What does it do in one sentence?"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Detailed description *</label>
              <textarea
                required
                rows={5}
                value={form.reszletes_leiras}
                onChange={e => frissit('reszletes_leiras', e.target.value)}
                placeholder="What problem does it solve? Who is the target customer? What's the competitive advantage?"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Category *</label>
              <select
                required
                value={form.kategoria}
                onChange={e => frissit('kategoria', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Select a category...</option>
                {categories.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Maturity level */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Maturity Level</h2>
            {badge_szintek.map(b => (
              <label key={b.ertek} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${form.badge === b.ertek ? 'border-violet-500 bg-violet-900/20' : 'border-gray-700 hover:border-gray-600'}`}>
                <input
                  type="radio"
                  name="badge"
                  value={b.ertek}
                  checked={form.badge === b.ertek}
                  onChange={() => frissit('badge', b.ertek)}
                  className="mt-1 accent-violet-500"
                />
                <div>
                  <p className="font-semibold">{b.label}</p>
                  <p className="text-gray-400 text-sm">{b.leiras}</p>
                </div>
              </label>
            ))}
          </div>

          {/* What's included */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">What&apos;s Included?</h2>
            <p className="text-gray-400 text-sm">Check everything that comes with the purchase — buyers will see this.</p>
            {[
              { mezo: 'van_domain', label: 'Domain / URL' },
              { mezo: 'van_kod', label: 'Source code / repository' },
              { mezo: 'van_feliratkozok', label: 'Email list / subscribers' },
              { mezo: 'van_bevetel', label: 'Proven revenue' },
            ].map(item => (
              <label key={item.mezo} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[item.mezo as keyof typeof form] as boolean}
                  onChange={e => frissit(item.mezo, e.target.checked)}
                  className="w-5 h-5 accent-violet-500"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          {/* File uploads */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-lg">Files & Media</h2>
            <p className="text-gray-400 text-sm">Upload screenshots, pitch deck, business plan, logo — anything that helps buyers evaluate your project. (Max 5 files, 10MB each)</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-xl py-8 cursor-pointer transition">
              <span className="text-3xl mb-2">📎</span>
              <span className="text-gray-400 text-sm">Click to select files</span>
              <span className="text-gray-600 text-xs mt-1">Images, PDF, Word, Excel</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.docx,.xlsx"
                onChange={fajlValasztas}
                className="hidden"
              />
            </label>
            {kivalasztottFajlok.length > 0 && (
              <div className="flex flex-col gap-2">
                {kivalasztottFajlok.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-xl text-sm">
                    <span className="text-gray-300 truncate">{f.type.startsWith('image/') ? '🖼️' : f.type === 'application/pdf' ? '📄' : '📊'} {f.name}</span>
                    <button type="button" onClick={() => fajlTorles(i)} className="text-gray-500 hover:text-red-400 ml-3 transition">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Starting price */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Starting Price</h2>
            <p className="text-gray-400 text-sm">The minimum bid the auction starts from (EUR).</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              <input
                required
                type="number"
                min={1}
                value={form.kikialtasi_ar}
                onChange={e => frissit('kikialtasi_ar', e.target.value)}
                placeholder="e.g. 500"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Auction duration */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Auction Duration</h2>
            <p className="text-gray-400 text-sm">How long should the auction run after it goes live?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { nap: '7', label: '7 days', sub: 'Fast sale' },
                { nap: '14', label: '14 days', sub: 'Recommended' },
                { nap: '30', label: '30 days', sub: 'More exposure' },
              ].map(d => (
                <button
                  key={d.nap}
                  type="button"
                  onClick={() => frissit('idotartam_nap', d.nap)}
                  className={`flex flex-col items-center p-4 rounded-xl border transition ${form.idotartam_nap === d.nap ? 'border-violet-500 bg-violet-900/20' : 'border-gray-700 hover:border-gray-600'}`}
                >
                  <span className="font-bold">{d.label}</span>
                  <span className="text-xs text-gray-400 mt-1">{d.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {hiba && <p className="text-red-400 text-sm text-center">{hiba}</p>}

          <button
            type="submit"
            disabled={allapot === 'szures' || allapot === 'loading'}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-4 rounded-full font-semibold text-lg"
          >
            {allapot === 'feltoltes' ? 'Uploading files...' : allapot === 'szures' ? '🤖 Checking your idea...' : allapot === 'loading' ? 'Submitting...' : 'Submit Project →'}
          </button>
        </form>
      </div>
    </main>
  )
}
