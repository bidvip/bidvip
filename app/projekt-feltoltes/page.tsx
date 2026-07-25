'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const kategoriak = [
  'SaaS / Szoftver',
  'E-kereskedelem',
  'Mobil app',
  'Tartalomoldal / Blog',
  'Marketplace',
  'Fintech',
  'Edtech',
  'Healthtech',
  'Egyéb',
]

const badge_szintek = [
  { ertek: 'papir', label: '🌱 Papír / Koncepció', leiras: 'Csak az ötlet létezik, nincs kód vagy bevétel' },
  { ertek: 'prototipus', label: '🛠️ Prototípus', leiras: 'Van valami kézzel fogható: kód, mockup, domain, feliratkozók' },
  { ertek: 'bizonyitott', label: '✅ Bizonyított', leiras: 'Valós bevétel, aktív felhasználók vagy mérhető traction' },
]

export default function ProjektFeltoltes() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    nev: '',
    rovid_leiras: '',
    reszletes_leiras: '',
    kategoria: '',
    badge: 'papir',
    kikialtasi_ar: '',
    van_domain: false,
    van_kod: false,
    van_feliratkozok: false,
    van_bevetel: false,
  })
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')

  function frissit(mezo: string, ertek: string | boolean) {
    setForm(prev => ({ ...prev, [mezo]: ertek }))
  }

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('loading')
    setHiba('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { error } = await supabase.from('projektek').insert([{
      user_id: user.id,
      nev: form.nev,
      rovid_leiras: form.rovid_leiras,
      reszletes_leiras: form.reszletes_leiras,
      kategoria: form.kategoria,
      badge: form.badge,
      kikialtasi_ar: parseInt(form.kikialtasi_ar),
      van_domain: form.van_domain,
      van_kod: form.van_kod,
      van_feliratkozok: form.van_feliratkozok,
      van_bevetel: form.van_bevetel,
      statusz: 'felulvizsgalat',
    }])

    if (error) {
      setHiba('Hiba történt, próbáld újra.')
      setAllapot('hiba')
    } else {
      setAllapot('siker')
    }
  }

  if (allapot === 'siker') {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Projekt beküldve!</h2>
        <p className="text-gray-400 mb-6 text-center">Felülvizsgáljuk és hamarosan megjelenik a piactéren.</p>
        <button onClick={() => router.push('/dashboard')} className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
          Vissza a dashboardra
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
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">← Vissza</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Projekt feltöltése</h1>
        <p className="text-gray-400 mb-8">Töltsd ki az alábbi mezőket — minél több infót adsz meg, annál magasabb árat érhetsz el.</p>

        <form onSubmit={beküldes} className="flex flex-col gap-6">
          {/* Alapadatok */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-lg">Alapadatok</h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Projekt neve *</label>
              <input
                required
                value={form.nev}
                onChange={e => frissit('nev', e.target.value)}
                placeholder="pl. AI alapú ügyfélszolgálat SaaS"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Rövid leírás * (max 150 karakter)</label>
              <input
                required
                maxLength={150}
                value={form.rovid_leiras}
                onChange={e => frissit('rovid_leiras', e.target.value)}
                placeholder="Egy mondatban miről szól a projekt?"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Részletes leírás *</label>
              <textarea
                required
                rows={5}
                value={form.reszletes_leiras}
                onChange={e => frissit('reszletes_leiras', e.target.value)}
                placeholder="Mi a probléma amit megold? Ki a célcsoport? Mi a versenyelőny?"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Kategória *</label>
              <select
                required
                value={form.kategoria}
                onChange={e => frissit('kategoria', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Válassz kategóriát...</option>
                {kategoriak.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Badge szint */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Érettségi szint</h2>
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

          {/* Mit tartalmaz */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Mit tartalmaz a csomag?</h2>
            <p className="text-gray-400 text-sm">Jelöld be ami megvan — ez látható lesz a vevőknek.</p>
            {[
              { mezo: 'van_domain', label: 'Van domain / URL' },
              { mezo: 'van_kod', label: 'Van forráskód / kódrepó' },
              { mezo: 'van_feliratkozok', label: 'Van email lista / feliratkozók' },
              { mezo: 'van_bevetel', label: 'Van valós bevétel' },
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

          {/* Kikiáltási ár */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Kikiáltási ár</h2>
            <p className="text-gray-400 text-sm">Ez az a minimális összeg amitől az aukció indul (EUR).</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              <input
                required
                type="number"
                min={1}
                value={form.kikialtasi_ar}
                onChange={e => frissit('kikialtasi_ar', e.target.value)}
                placeholder="pl. 500"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {hiba && <p className="text-red-400 text-sm text-center">{hiba}</p>}

          <button
            type="submit"
            disabled={allapot === 'loading'}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-4 rounded-full font-semibold text-lg"
          >
            {allapot === 'loading' ? 'Beküldés...' : 'Projekt beküldése →'}
          </button>
        </form>
      </div>
    </main>
  )
}
