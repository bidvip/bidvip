'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { type KirakatElem } from '@/lib/kirakat'

const INDULAS_KUSZOB = 2000

type EloProjekt = {
  id: string; nev: string; rovid_leiras: string; kategoria: string
  badge: string; kikialtasi_ar: number; lejarat: string | null
}

/* ─────────────────────────  segédek  ───────────────────────── */

function Feltunik({ children, keses = 0 }: { children: React.ReactNode; keses?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [lathato, setLathato] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setLathato(true); return }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLathato(true); obs.disconnect() } }, { threshold: 0.05 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      transitionDelay: `${keses}ms`,
      transition: 'opacity .6s ease, transform .6s ease',
      opacity: lathato ? 1 : 0,
      transform: lathato ? 'none' : 'translateY(14px)',
    }}>{children}</div>
  )
}

function Vonal({ eros = false }: { eros?: boolean }) {
  return <div style={{ height: 1, background: eros ? 'var(--kat-vonal-2)' : 'var(--kat-vonal)' }} />
}

function Rovat({ children, szin }: { children: React.ReactNode; szin?: string }) {
  return <p className="kat-rovat" style={{ color: szin ?? 'var(--kat-tinta-3)' }}>{children}</p>
}

/* ─────────────────────────  fejléc  ───────────────────────── */

function Fejlec() {
  const [gorgetve, setGorgetve] = useState(false)
  useEffect(() => {
    const f = () => setGorgetve(window.scrollY > 8)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <header className="sticky top-0 z-50" style={{
      background: gorgetve ? 'color-mix(in srgb, var(--kat-papir) 92%, transparent)' : 'var(--kat-papir)',
      backdropFilter: gorgetve ? 'blur(8px)' : 'none',
      borderBottom: `1px solid ${gorgetve ? 'var(--kat-vonal)' : 'transparent'}`,
      transition: 'border-color .3s, background .3s',
    }}>
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-6">
        <a href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="kat-cim" style={{ fontSize: '1.5rem', color: 'var(--kat-tinta)' }}>BidVip</span>
          <span className="kat-rovat hidden sm:block" style={{ color: 'var(--kat-tinta-3)' }}>Aukciósház</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {[['Tételek', '#tetelek'], ['Menete', '#menete'], ['Kérdések', '#kerdesek']].map(([cim, hova]) => (
            <a key={hova} href={hova} className="text-sm transition-colors"
              style={{ color: 'var(--kat-tinta-2)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--kat-tinta)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--kat-tinta-2)')}>{cim}</a>
          ))}
        </nav>

        <a href="/auth" className="text-sm px-4 py-2 shrink-0 transition-colors"
          style={{ border: '1px solid var(--kat-vonal-2)', color: 'var(--kat-tinta)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--kat-tinta)'; e.currentTarget.style.color = 'var(--kat-papir)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--kat-tinta)' }}>
          Belépés
        </a>
      </div>
    </header>
  )
}

/* ─────────────────────────  hero  ───────────────────────── */

function Hero({ varolista, elo }: { varolista: number; elo: number }) {
  return (
    <section className="mx-auto max-w-6xl px-6">
      <div className="pt-10 pb-5 flex items-baseline justify-between gap-4 flex-wrap">
        <Rovat>Árverési katalógus · {new Date().getFullYear()}</Rovat>
        <Rovat szin={elo > 0 ? 'var(--kat-bibor)' : undefined}>
          {elo > 0 ? `${elo} tétel élőben` : `${varolista} tétel vár az első aukcióra`}
        </Rovat>
      </div>
      <Vonal eros />

      <div className="grid lg:grid-cols-12 gap-x-10 gap-y-8 pt-14 pb-16">
        <div className="lg:col-span-7">
          <h1 className="kat-cim" style={{ fontSize: 'clamp(2.9rem, 7.5vw, 5.5rem)', color: 'var(--kat-tinta)' }}>
            Minden ötletben<br />van potenciál.<br />
            <span style={{ fontStyle: 'italic', color: 'var(--kat-bibor)' }}>Megmutatjuk mekkora.</span>
          </h1>

          <p className="mt-7 text-base leading-relaxed" style={{ color: 'var(--kat-tinta-2)', maxWidth: '46ch' }}>
            Nem kell kész terméked legyen. Hozd az ötletet — segítünk kidolgozni,
            felmérjük mennyit ér, és árverésre bocsátjuk komoly vevők előtt.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/submit" className="px-6 py-3 text-sm font-medium transition-opacity"
              style={{ background: 'var(--kat-bibor)', color: '#FBF8F2' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Eladom az ötletem
            </a>
            <a href="#tetelek" className="px-6 py-3 text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--kat-vonal-2)', color: 'var(--kat-tinta)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--kat-papir-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Ötletet keresek
            </a>
          </div>
        </div>

        {/* Katalógus-mutató */}
        <div className="lg:col-span-5 lg:pl-10" style={{ borderLeft: '1px solid var(--kat-vonal)' }}>
          <Rovat>A katalógusról</Rovat>
          <dl className="mt-5 flex flex-col">
            {[
              ['Tételek a sorban', String(varolista)],
              ['Szakterületek', '25'],
              ['Jutalék sikeres eladásnál', '10%'],
              ['Belépés eladóként', 'Ingyenes'],
            ].map(([cim, ertek], i) => (
              <div key={cim}>
                {i > 0 && <Vonal />}
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-sm" style={{ color: 'var(--kat-tinta-2)' }}>{cim}</dt>
                  <dd className="kat-szam text-sm" style={{ color: 'var(--kat-tinta)' }}>{ertek}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  tételek  ───────────────────────── */

function EloSor({ p }: { p: EloProjekt }) {
  const [hatra, setHatra] = useState('')
  useEffect(() => {
    if (!p.lejarat) return
    const t = () => {
      const d = Math.max(0, new Date(p.lejarat!).getTime() - Date.now())
      const o = Math.floor(d / 3600000), pc = Math.floor((d % 3600000) / 60000), m = Math.floor((d % 60000) / 1000)
      setHatra(o > 0 ? `${o}ó ${pc}p` : `${String(pc).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
    t(); const i = setInterval(t, 1000); return () => clearInterval(i)
  }, [p.lejarat])

  return (
    <a href={`/project/${p.id}`} className="block transition-colors"
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--kat-papir-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div className="grid grid-cols-12 gap-4 items-baseline py-5 px-3">
        <span className="kat-szam col-span-2 sm:col-span-1 text-xs" style={{ color: 'var(--kat-bibor)' }}>ÉLŐ</span>
        <div className="col-span-10 sm:col-span-7">
          <p className="text-base" style={{ color: 'var(--kat-tinta)' }}>{p.nev}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--kat-tinta-2)' }}>{p.rovid_leiras}</p>
          <p className="kat-rovat mt-2" style={{ color: 'var(--kat-tinta-3)' }}>{p.kategoria}</p>
        </div>
        <div className="col-span-6 sm:col-span-2 text-left sm:text-right">
          <p className="kat-szam text-base" style={{ color: 'var(--kat-tinta)' }}>{p.kikialtasi_ar.toLocaleString('hu-HU')} €</p>
        </div>
        <div className="col-span-6 sm:col-span-2 text-right">
          <p className="kat-szam text-sm" style={{ color: 'var(--kat-bibor)' }}>{hatra}</p>
        </div>
      </div>
    </a>
  )
}

function SorbanSor({ k }: { k: KirakatElem }) {
  const [csoport, tema] = k.cimke.includes(' · ') ? k.cimke.split(' · ') : [k.cimke, '']
  return (
    <div className="grid grid-cols-12 gap-4 items-baseline py-5 px-3 transition-colors"
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--kat-papir-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <span className="kat-szam col-span-2 sm:col-span-1 text-sm" style={{ color: 'var(--kat-tinta-3)' }}>
        {String(k.sorszam).padStart(2, '0')}
      </span>

      <div className="col-span-10 sm:col-span-7 flex items-baseline gap-3 min-w-0">
        <span className="shrink-0 translate-y-px" style={{ width: 7, height: 7, background: k.szin, borderRadius: 1 }} />
        <div className="min-w-0">
          <p className="text-base truncate" style={{ color: 'var(--kat-tinta)' }}>{tema || csoport}</p>
          <p className="kat-rovat mt-1.5" style={{ color: 'var(--kat-tinta-3)' }}>{csoport}</p>
        </div>
      </div>

      <div className="col-span-6 sm:col-span-2 text-left sm:text-right">
        <p className="text-sm" style={{ color: 'var(--kat-tinta-2)' }}>{k.erettseg}</p>
      </div>
      <div className="col-span-6 sm:col-span-2 text-right">
        <p className="kat-szam text-sm" style={{ color: 'var(--kat-tinta)' }}>{k.arsav}</p>
      </div>
    </div>
  )
}

function Tetelek({ elo, sorban }: { elo: EloProjekt[]; sorban: KirakatElem[] }) {
  const [kereses, setKereses] = useState('')
  const [mutatMind, setMutatMind] = useState(false)

  const q = kereses.trim().toLowerCase()
  const szurtElo = elo.filter(p => !q || p.nev.toLowerCase().includes(q) || p.kategoria.toLowerCase().includes(q))
  const szurtSor = sorban.filter(k => !q || k.cimke.toLowerCase().includes(q))
  const lathatoSor = mutatMind ? szurtSor : szurtSor.slice(0, 12)
  const ures = szurtElo.length === 0 && szurtSor.length === 0

  return (
    <section id="tetelek" className="mx-auto max-w-6xl px-6 pt-20 pb-24">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
        <div>
          <Rovat>Tételek</Rovat>
          <h2 className="kat-cim mt-3" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'var(--kat-tinta)' }}>
            Mi kerül kalapács alá
          </h2>
        </div>
        <input
          value={kereses} onChange={e => setKereses(e.target.value)}
          placeholder="Keresés szakterületre…"
          className="text-sm px-3 py-2 w-full sm:w-64 focus:outline-none"
          style={{ background: 'transparent', borderBottom: '1px solid var(--kat-vonal-2)', color: 'var(--kat-tinta)' }}
        />
      </div>

      <p className="text-sm mb-7" style={{ color: 'var(--kat-tinta-2)', maxWidth: '58ch' }}>
        A böngészés ingyenes. A sorban álló tételek részletei az aukció indulásakor
        derülnek ki — addig védve vannak a másolástól. Licitálni regisztráció után lehet.
      </p>

      <Vonal eros />

      {ures ? (
        <p className="py-20 text-center text-sm" style={{ color: 'var(--kat-tinta-3)' }}>
          {q ? 'Erre a keresésre nincs tétel.' : 'Hamarosan érkeznek az első tételek.'}
        </p>
      ) : (
        <>
          {szurtElo.length > 0 && (
            <div>
              {szurtElo.map((p, i) => (
                <div key={p.id}>{i > 0 && <Vonal />}<Feltunik keses={i * 25}><EloSor p={p} /></Feltunik></div>
              ))}
              <Vonal eros />
            </div>
          )}

          {lathatoSor.map((k, i) => (
            <div key={k.id}>
              {(i > 0 || szurtElo.length > 0) && <Vonal />}
              <Feltunik keses={Math.min(i, 12) * 25}><SorbanSor k={k} /></Feltunik>
            </div>
          ))}
          <Vonal eros />

          {szurtSor.length > 12 && (
            <div className="pt-7 text-center">
              <button onClick={() => setMutatMind(m => !m)} className="text-sm transition-colors"
                style={{ color: 'var(--kat-bibor)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--kat-bibor-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--kat-bibor)')}>
                {mutatMind ? 'Kevesebb' : `Mind a ${szurtSor.length} tétel megtekintése`} →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/* ─────────────────────────  menete  ───────────────────────── */

function Menete() {
  const lepesek = [
    ['Beküldöd', 'Kiválasztod a szakterületet, és leírod az ötleted. Nem kell kész termék — elég egy komoly elgondolás.'],
    ['Kidolgozzuk', 'Az adott terület szakértőjeként gondolkodó AI kérdez vissza, rámutat a gyenge pontokra, és segít piacképessé formálni.'],
    ['Felbecsüljük', 'Megbecsüljük a valós piaci értéket az adott szakterület tényleges alkuméretei alapján.'],
    ['Kalapács alá kerül', 'Időkorlátos árverés. A licit anonim, a legmagasabb ajánlat nyer.'],
    ['Letétben zárul', 'A vevő fizet, a pénzt letétben tartjuk. Az eladó átadja az anyagot — csak utána fizetünk ki.'],
  ]
  return (
    <section id="menete" className="mx-auto max-w-6xl px-6 py-20" style={{ borderTop: '1px solid var(--kat-vonal)' }}>
      <Rovat>Az árverés menete</Rovat>
      <h2 className="kat-cim mt-3 mb-12" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'var(--kat-tinta)' }}>
        Ötlettől a kalapácsig
      </h2>

      <div>
        <Vonal eros />
        {lepesek.map(([cim, leiras], i) => (
          <div key={cim}>
            {i > 0 && <Vonal />}
            <Feltunik keses={i * 50}>
              <div className="grid grid-cols-12 gap-x-6 gap-y-2 py-7">
                <span className="kat-szam col-span-12 sm:col-span-1 text-sm" style={{ color: 'var(--kat-tinta-3)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="kat-cim col-span-12 sm:col-span-4" style={{ fontSize: '1.5rem', color: 'var(--kat-tinta)' }}>{cim}</h3>
                <p className="col-span-12 sm:col-span-7 text-sm leading-relaxed" style={{ color: 'var(--kat-tinta-2)' }}>{leiras}</p>
              </div>
            </Feltunik>
          </div>
        ))}
        <Vonal eros />
      </div>
    </section>
  )
}

/* ─────────────────────────  kérdések  ───────────────────────── */

function Kerdes({ k, v }: { k: string; v: string }) {
  const [nyitva, setNyitva] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [magassag, setMagassag] = useState(0)
  useEffect(() => { if (ref.current) setMagassag(nyitva ? ref.current.scrollHeight : 0) }, [nyitva])

  return (
    <div>
      <button onClick={() => setNyitva(n => !n)} aria-expanded={nyitva}
        className="w-full flex items-baseline justify-between gap-6 py-5 text-left">
        <span className="text-base" style={{ color: 'var(--kat-tinta)' }}>{k}</span>
        <span className="kat-szam shrink-0 text-lg leading-none" style={{
          color: 'var(--kat-bibor)',
          transform: nyitva ? 'rotate(45deg)' : 'none',
          transition: 'transform .3s',
        }}>+</span>
      </button>
      <div style={{ maxHeight: magassag, overflow: 'hidden', transition: 'max-height .35s ease' }}>
        <p ref={ref} className="pb-6 text-sm leading-relaxed" style={{ color: 'var(--kat-tinta-2)', maxWidth: '62ch' }}>{v}</p>
      </div>
    </div>
  )
}

function Kerdesek() {
  const lista: [string, string][] = [
    ['Nincs kész termékem, csak egy ötletem. Beküldhetem?', 'Igen — a katalógus túlnyomó része ilyen. A tételeket három érettségi szinten jelöljük: Ötlet, Prototípus és Bizonyított. A kész termék magasabb árat ér el, de a puszta ötletnek is van piaca.'],
    ['Honnan tudom, hogy nem lopják el az ötletemet?', 'Az aukció indulásáig sem a tétel neve, sem a leírása nem jelenik meg — csak a szakterület, az érettség és egy ársáv. A részletes anyagot kizárólag a nyertes vevő kapja meg, az átadás részeként.'],
    ['Mibe kerül?', 'A beküldés és a böngészés ingyenes. Sikeres eladás után a végösszeg 10%-át számítjuk fel, amit az eladó fizet. Ha nem kel el a tétel, nem fizetsz semmit.'],
    ['Milyen témában küldhetek be ötletet?', 'Huszonöt szakterületen, a napenergiától a vízgazdálkodáson át a csillagászatig — összesen közel háromszáz kategóriában. Ha valós problémát old meg és van aki megvenné, itt a helye.'],
    ['Mikor indul az első aukció?', 'Amint összegyűlik a kellő számú érdeklődő. Addig a beküldött tételek a sorban állnak, és senki nem tud licitálni — így az első árverésen már valódi vevők lesznek jelen.'],
    ['Hogyan védett a személyazonosságom?', 'Az eladók és a vevők álnéven jelennek meg. A valódi személyazonosság kizárólag sikeres eladás után, az átadás részeként kerül megosztásra.'],
  ]
  return (
    <section id="kerdesek" className="mx-auto max-w-3xl px-6 py-20" style={{ borderTop: '1px solid var(--kat-vonal)' }}>
      <Rovat>Kérdések</Rovat>
      <h2 className="kat-cim mt-3 mb-10" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'var(--kat-tinta)' }}>
        Mielőtt belicitálsz
      </h2>
      <Vonal eros />
      {lista.map(([k, v], i) => (
        <div key={k}>{i > 0 && <Vonal />}<Kerdes k={k} v={v} /></div>
      ))}
      <Vonal eros />
    </section>
  )
}

/* ─────────────────────────  feliratkozás  ───────────────────────── */

function Feliratkozas({ szam, novel }: { szam: number; novel: () => void }) {
  const [email, setEmail] = useState('')
  const [allapot, setAllapot] = useState<'nyugalom' | 'kuld' | 'siker' | 'hiba'>('nyugalom')

  async function bekuld(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('kuld')
    const { error } = await supabase.from('feliratkozok').insert([{ email }])
    if (error) { setAllapot(error.code === '23505' ? 'siker' : 'hiba') }
    else { setAllapot('siker'); setEmail(''); novel() }
  }

  const szazalek = Math.min(100, Math.round((szam / INDULAS_KUSZOB) * 100))

  return (
    <section className="mx-auto max-w-6xl px-6 py-24" style={{ borderTop: '1px solid var(--kat-vonal)' }}>
      <div className="grid lg:grid-cols-12 gap-x-10 gap-y-10">
        <div className="lg:col-span-6">
          <Rovat>Az első árverés</Rovat>
          <h2 className="kat-cim mt-3" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', color: 'var(--kat-tinta)' }}>
            Ott leszel,<br />amikor lecsap<br />
            <span style={{ fontStyle: 'italic', color: 'var(--kat-bibor)' }}>a kalapács?</span>
          </h2>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--kat-tinta-2)', maxWidth: '48ch' }}>
            Az árverés akkor indul, amikor összegyűlik a kellő számú érdeklődő.
            Szólunk, mielőtt az első tétel kalapács alá kerül.
          </p>
        </div>

        <div className="lg:col-span-6 lg:pl-10" style={{ borderLeft: '1px solid var(--kat-vonal)' }}>
          <div className="flex items-baseline justify-between gap-4">
            <Rovat>Érdeklődők</Rovat>
            <p className="kat-szam text-sm" style={{ color: 'var(--kat-tinta-2)' }}>
              {szam.toLocaleString('hu-HU')} / {INDULAS_KUSZOB.toLocaleString('hu-HU')}
            </p>
          </div>

          <div className="mt-3 mb-8 h-px w-full" style={{ background: 'var(--kat-vonal)' }}>
            <div style={{ height: 1, width: `${szazalek}%`, background: 'var(--kat-bibor)', transition: 'width 1s ease' }} />
          </div>

          {allapot === 'siker' ? (
            <div className="py-4">
              <p className="kat-cim" style={{ fontSize: '1.6rem', color: 'var(--kat-tinta)' }}>Felírtunk a listára.</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--kat-tinta-2)' }}>Az első árverés előtt keresünk.</p>
            </div>
          ) : (
            <form onSubmit={bekuld} className="flex flex-col sm:flex-row gap-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nev@pelda.hu"
                className="flex-1 text-sm px-3 py-3 focus:outline-none"
                style={{ background: 'transparent', borderBottom: '1px solid var(--kat-vonal-2)', color: 'var(--kat-tinta)' }} />
              <button type="submit" disabled={allapot === 'kuld'}
                className="px-6 py-3 text-sm font-medium shrink-0 transition-opacity"
                style={{ background: 'var(--kat-tinta)', color: 'var(--kat-papir)', opacity: allapot === 'kuld' ? .6 : 1 }}>
                {allapot === 'kuld' ? 'Küldés…' : 'Értesítsetek'}
              </button>
            </form>
          )}
          {allapot === 'hiba' && (
            <p className="mt-3 text-sm" style={{ color: 'var(--kat-bibor)' }}>Nem sikerült. Próbáld meg újra.</p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  lábléc  ───────────────────────── */

function Lablec() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-12" style={{ borderTop: '1px solid var(--kat-vonal-2)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-6">
        <span className="kat-cim" style={{ fontSize: '1.4rem', color: 'var(--kat-tinta)' }}>BidVip</span>
        <nav className="flex flex-wrap gap-x-7 gap-y-2">
          {[['Tételek', '#tetelek'], ['Menete', '#menete'], ['Kérdések', '#kerdesek'], ['Aukciósház', '/aukciosHaz'], ['Belépés', '/auth']].map(([c, h]) => (
            <a key={h} href={h} className="text-sm transition-colors" style={{ color: 'var(--kat-tinta-2)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--kat-tinta)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--kat-tinta-2)')}>{c}</a>
          ))}
        </nav>
        <p className="kat-szam text-xs" style={{ color: 'var(--kat-tinta-3)' }}>© {new Date().getFullYear()} BidVip</p>
      </div>
    </footer>
  )
}

/* ─────────────────────────  oldal  ───────────────────────── */

export default function Fooldal() {
  const [elo, setElo] = useState<EloProjekt[]>([])
  const [sorban, setSorban] = useState<KirakatElem[]>([])
  const [feliratkozok, setFeliratkozok] = useState(0)

  useEffect(() => {
    // A projektek táblát RLS védi — a publikus kirakat szerveroldalon készül,
    // és a sorban álló tételekből csak anonimizált mezőket ad vissza.
    fetch('/api/kirakat').then(r => r.json())
      .then(d => { setElo(d.elo ?? []); setSorban(d.sorban ?? []) })
      .catch(() => {})
    fetch('/api/waitlist-count').then(r => r.json())
      .then(d => setFeliratkozok(d.count ?? 0))
      .catch(() => {})
  }, [])

  return (
    <div style={{ background: 'var(--kat-papir)', color: 'var(--kat-tinta)', minHeight: '100vh' }}>
      <Fejlec />
      <main>
        <Hero varolista={sorban.length} elo={elo.length} />
        <Tetelek elo={elo} sorban={sorban} />
        <Menete />
        <Kerdesek />
        <Feliratkozas szam={feliratkozok} novel={() => setFeliratkozok(n => n + 1)} />
      </main>
      <Lablec />
    </div>
  )
}
