'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { type KirakatElem } from '@/lib/kirakat'
import { KATEGORIA_FA } from '@/lib/kategoriak'

const INDULAS_KUSZOB = 2000

type EloProjekt = {
  id: string; nev: string; rovid_leiras: string; kategoria: string
  badge: string; kikialtasi_ar: number; lejarat: string | null
}

/* ═══════════════════════  mozgás-segédek  ═══════════════════════ */

function useLathato<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [lathato, setLathato] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setLathato(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return { ref, lathato }
}

function Feltunik({ children, keses = 0, className = '' }: {
  children: React.ReactNode; keses?: number; className?: string
}) {
  const { ref, lathato } = useLathato<HTMLDivElement>()
  return (
    <div ref={ref} className={className} style={{
      opacity: lathato ? 1 : 0,
      transform: lathato ? 'none' : 'translateY(26px)',
      transition: `opacity .75s cubic-bezier(.22,.61,.36,1) ${keses}ms, transform .75s cubic-bezier(.22,.61,.36,1) ${keses}ms`,
    }}>{children}</div>
  )
}

/** Nullától a célértékig számol, amikor képernyőre ér. */
function Szamlalo({ ig, utotag = '', ido = 1400 }: { ig: number; utotag?: string; ido?: number }) {
  const { ref, lathato } = useLathato<HTMLSpanElement>()
  const [ertek, setErtek] = useState(0)

  useEffect(() => {
    if (!lathato) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setErtek(ig); return }
    let kere = 0
    const kezd = performance.now()
    const lep = (most: number) => {
      const t = Math.min(1, (most - kezd) / ido)
      const lassul = 1 - Math.pow(1 - t, 3)
      setErtek(Math.round(ig * lassul))
      if (t < 1) kere = requestAnimationFrame(lep)
    }
    kere = requestAnimationFrame(lep)
    return () => cancelAnimationFrame(kere)
  }, [lathato, ig, ido])

  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{ertek.toLocaleString('hu-HU')}{utotag}</span>
}

/* ═══════════════════════  aurora háttér  ═══════════════════════ */

function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="v-aurora-elem absolute rounded-full"
        style={{
          width: '58vw', height: '58vw', maxWidth: 900, maxHeight: 900,
          top: '-22%', left: '50%', marginLeft: '-29vw',
          background: 'radial-gradient(circle, rgba(124,58,237,.5) 0%, rgba(124,58,237,.16) 38%, transparent 68%)',
          filter: 'blur(60px)',
          animation: 'v-aurora 19s ease-in-out infinite',
        }} />
      <div className="v-aurora-elem absolute rounded-full"
        style={{
          width: '42vw', height: '42vw', maxWidth: 680, maxHeight: 680,
          top: '-8%', left: '18%',
          background: 'radial-gradient(circle, rgba(244,63,94,.34) 0%, rgba(244,63,94,.1) 42%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'v-aurora-2 24s ease-in-out infinite',
        }} />
      <div className="v-aurora-elem absolute rounded-full"
        style={{
          width: '40vw', height: '40vw', maxWidth: 620, maxHeight: 620,
          top: '2%', right: '10%',
          background: 'radial-gradient(circle, rgba(56,189,248,.24) 0%, transparent 66%)',
          filter: 'blur(80px)',
          animation: 'v-aurora 27s ease-in-out infinite reverse',
        }} />
      {/* finom rács a mélységért */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 78%)',
      }} />
    </div>
  )
}

/* ═══════════════════════  fejléc  ═══════════════════════ */

function Fejlec() {
  const [gorgetve, setGorgetve] = useState(false)
  useEffect(() => {
    const f = () => setGorgetve(window.scrollY > 12)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <header className="fixed top-0 inset-x-0 z-50" style={{
      background: gorgetve ? 'rgba(7,5,13,.72)' : 'transparent',
      backdropFilter: gorgetve ? 'blur(16px)' : 'none',
      borderBottom: `1px solid ${gorgetve ? 'var(--v-vonal)' : 'transparent'}`,
      transition: 'all .4s ease',
    }}>
      <div className="mx-auto max-w-6xl px-6 h-[72px] flex items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-70"
              style={{ background: 'var(--v-rozsa)', animation: 'v-lüktet 2s ease-in-out infinite' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--v-rozsa)' }} />
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--v-szoveg)' }}>BidVip</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {[['Tételek', '#tetelek'], ['Területek', '#teruletek'], ['Menete', '#menete'], ['Kérdések', '#kerdesek']].map(([c, h]) => (
            <a key={h} href={h} className="text-sm px-3.5 py-2 rounded-lg transition-all"
              style={{ color: 'var(--v-szoveg-2)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--v-szoveg)'; e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--v-szoveg-2)'; e.currentTarget.style.background = 'transparent' }}>
              {c}
            </a>
          ))}
        </nav>

        <a href="/auth" className="text-sm font-semibold px-5 py-2.5 rounded-xl shrink-0 transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--v-lila), var(--v-rozsa))',
            color: '#fff', boxShadow: '0 6px 22px rgba(124,58,237,.34)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(124,58,237,.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(124,58,237,.34)' }}>
          Belépés
        </a>
      </div>
    </header>
  )
}

/* ═══════════════════════  élő licit kártya  ═══════════════════════ */

function LicitKartya({ cimke, szin, kezdoAr, keses }: {
  cimke: string; szin: string; kezdoAr: number; keses: number
}) {
  const [ar, setAr] = useState(kezdoAr)
  const [villan, setVillan] = useState(false)
  const [ido, setIdo] = useState(180 + keses * 40)

  useEffect(() => {
    const t = setInterval(() => setIdo(s => (s > 0 ? s - 1 : 240)), 1000)
    const l = setInterval(() => {
      setAr(p => p + Math.floor(Math.random() * 120 + 40))
      setVillan(true); setTimeout(() => setVillan(false), 550)
    }, 3800 + keses * 1900)
    return () => { clearInterval(t); clearInterval(l) }
  }, [keses])

  const p = Math.floor(ido / 60), m = ido % 60
  const surgos = ido < 45

  return (
    <div className="v-uveg rounded-2xl p-4 transition-all"
      style={{
        borderColor: villan ? szin : 'var(--v-vonal)',
        boxShadow: villan ? `0 0 32px ${szin}44` : 'none',
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: szin, animation: 'v-lüktet 1.6s ease-in-out infinite' }} />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase truncate" style={{ color: szin }}>{cimke}</span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: 'var(--v-rozsa)', color: '#fff' }}>ÉLŐ</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--v-szoveg-3)' }}>Ajánlat</p>
          <p className="text-xl font-black" style={{
            color: villan ? 'var(--v-arany)' : 'var(--v-szoveg)',
            fontVariantNumeric: 'tabular-nums',
            transform: villan ? 'scale(1.09)' : 'none',
            transition: 'color .3s, transform .35s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {ar.toLocaleString('hu-HU')} €
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--v-szoveg-3)' }}>Hátra</p>
          <p className="text-xl font-black" style={{
            color: surgos ? 'var(--v-rozsa)' : 'var(--v-szoveg-2)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {String(p).padStart(2, '0')}:{String(m).padStart(2, '0')}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════  hero  ═══════════════════════ */

function Hero({ varolista }: { varolista: number }) {
  return (
    <section className="relative pt-[72px]">
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-x-12 gap-y-16 items-center">

        <div className="lg:col-span-7">
          <div className="v-be inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
            style={{ animationDelay: '0ms', background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.3)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--v-lila-2)', animation: 'v-lüktet 2s ease-in-out infinite' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--v-lila-2)' }}>
              {varolista > 0 ? `${varolista} ötlet vár az első aukcióra` : 'Hamarosan indul az első aukció'}
            </span>
          </div>

          <h1 className="v-be font-black tracking-tight" style={{
            animationDelay: '90ms',
            fontSize: 'clamp(2.6rem, 6.4vw, 4.6rem)',
            lineHeight: 1.03,
            letterSpacing: '-0.035em',
            color: 'var(--v-szoveg)',
          }}>
            Minden ötletben<br />van potenciál.<br />
            <span className="v-fenylo">Megmutatjuk mekkora.</span>
          </h1>

          <p className="v-be mt-7 text-base leading-relaxed" style={{
            animationDelay: '180ms', color: 'var(--v-szoveg-2)', maxWidth: '48ch',
          }}>
            Nem kell kész terméked legyen. Hozd az ötletet — az AI segít kidolgozni,
            felmérjük mennyit ér, és élő aukcióra bocsátjuk komoly vevők előtt.
          </p>

          <div className="v-be mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '270ms' }}>
            <a href="/submit" className="px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--v-lila), var(--v-rozsa))',
                color: '#fff', boxShadow: '0 8px 30px rgba(124,58,237,.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 42px rgba(124,58,237,.58)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,.4)' }}>
              Eladom az ötletem →
            </a>
            <a href="#tetelek" className="px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{ border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.borderColor = 'var(--v-lila)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--v-vonal-2)' }}>
              Ötletet keresek
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 v-be" style={{ animationDelay: '340ms' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--v-rozsa)', animation: 'v-lüktet 1.6s ease-in-out infinite' }} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: 'var(--v-szoveg-3)' }}>
              Így néz ki egy élő aukció
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <LicitKartya cimke="Energia · Napenergia" szin="#FBBF24" kezdoAr={6500} keses={0} />
            <LicitKartya cimke="AI · Ügynökök" szin="#A78BFA" kezdoAr={28000} keses={1} />
            <LicitKartya cimke="Víz · Szivárgás" szin="#38BDF8" kezdoAr={9500} keses={2} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════  számok  ═══════════════════════ */

function Szamok({ varolista }: { varolista: number }) {
  const adat: [number, string, string][] = [
    [varolista, '', 'ötlet a sorban'],
    [25, '', 'szakterület'],
    [290, '', 'kategória'],
    [10, '%', 'jutalék, csak sikeres eladásnál'],
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {adat.map(([szam, utotag, cimke], i) => (
          <Feltunik key={cimke} keses={i * 90}>
            <div className="v-uveg rounded-2xl px-5 py-6 h-full transition-all"
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v-vonal-2)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-vonal)'; e.currentTarget.style.transform = 'none' }}>
              <p className="text-3xl font-black mb-1.5" style={{ color: 'var(--v-szoveg)' }}>
                <Szamlalo ig={szam} utotag={utotag} />
              </p>
              <p className="text-xs leading-snug" style={{ color: 'var(--v-szoveg-3)' }}>{cimke}</p>
            </div>
          </Feltunik>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════  területek  ═══════════════════════ */

function Teruletek() {
  const [aktiv, setAktiv] = useState<string | null>(null)
  const valasztott = KATEGORIA_FA.find(c => c.nev === aktiv)

  return (
    <section id="teruletek" className="mx-auto max-w-6xl px-6 py-24">
      <Feltunik>
        <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--v-lila-2)' }}>Szakterületek</p>
        <h2 className="font-black mb-4 tracking-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', letterSpacing: '-0.03em', color: 'var(--v-szoveg)' }}>
          Bármilyen ötleted van, itt a helye
        </h2>
        <p className="text-sm mb-10" style={{ color: 'var(--v-szoveg-2)', maxWidth: '54ch' }}>
          A napenergiától a vízgazdálkodáson át a csillagászatig — huszonöt szakterület,
          közel háromszáz kategória. Kattints, hogy lásd mi tartozik bele.
        </p>
      </Feltunik>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {KATEGORIA_FA.map((cs, i) => {
          const nyitva = aktiv === cs.nev
          return (
            <Feltunik key={cs.nev} keses={Math.min(i, 12) * 45}>
              <button onClick={() => setAktiv(nyitva ? null : cs.nev)}
                className="w-full text-left rounded-xl overflow-hidden transition-all h-full"
                style={{
                  background: nyitva ? `${cs.szin}18` : 'var(--v-bg-2)',
                  border: `1px solid ${nyitva ? cs.szin : 'var(--v-vonal)'}`,
                  boxShadow: nyitva ? `0 0 26px ${cs.szin}33` : 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = cs.szin
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = `0 8px 26px ${cs.szin}2E`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = nyitva ? cs.szin : 'var(--v-vonal)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = nyitva ? `0 0 26px ${cs.szin}33` : 'none'
                }}>
                <div style={{ height: 2, background: cs.szin }} />
                <div className="px-3.5 py-3">
                  <p className="text-[11px] font-bold leading-snug mb-1" style={{ color: cs.szin }}>{cs.nev}</p>
                  <p className="text-[10px]" style={{ color: 'var(--v-szoveg-3)' }}>{cs.temak.length} kategória</p>
                </div>
              </button>
            </Feltunik>
          )
        })}
      </div>

      {/* Kinyitott terület témái */}
      <div style={{
        maxHeight: valasztott ? 420 : 0,
        opacity: valasztott ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height .45s cubic-bezier(.22,.61,.36,1), opacity .35s ease',
      }}>
        {valasztott && (
          <div className="mt-4 rounded-2xl p-5"
            style={{ background: 'var(--v-bg-2)', border: `1px solid ${valasztott.szin}44` }}>
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase mb-3.5" style={{ color: valasztott.szin }}>
              {valasztott.nev}
            </p>
            <div className="flex flex-wrap gap-2">
              {valasztott.temak.map(t => (
                <span key={t} className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ background: `${valasztott.szin}12`, border: `1px solid ${valasztott.szin}2E`, color: 'var(--v-szoveg-2)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* ═══════════════════════  tételek  ═══════════════════════ */

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
    <a href={`/project/${p.id}`} className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
      style={{ background: 'var(--v-bg-2)', border: '1px solid rgba(244,63,94,.3)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--v-rozsa)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(244,63,94,.3)' }}>
      <span className="text-[9px] font-black px-2 py-1 rounded shrink-0" style={{ background: 'var(--v-rozsa)', color: '#fff' }}>ÉLŐ</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: 'var(--v-szoveg)' }}>{p.nev}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--v-szoveg-3)' }}>{p.kategoria}</p>
      </div>
      <p className="text-sm font-black shrink-0" style={{ color: 'var(--v-szoveg)', fontVariantNumeric: 'tabular-nums' }}>
        {p.kikialtasi_ar.toLocaleString('hu-HU')} €
      </p>
      <p className="text-xs font-bold shrink-0 w-14 text-right" style={{ color: 'var(--v-rozsa)', fontVariantNumeric: 'tabular-nums' }}>{hatra}</p>
    </a>
  )
}

function SorbanSor({ k }: { k: KirakatElem }) {
  const [csoport, tema] = k.cimke.includes(' · ') ? k.cimke.split(' · ') : [k.cimke, '']
  return (
    <div className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
      style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = `${k.szin}88`; e.currentTarget.style.boxShadow = `0 6px 22px ${k.szin}22` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--v-vonal)'; e.currentTarget.style.boxShadow = 'none' }}>
      <span className="text-xs shrink-0 w-6" style={{ color: 'var(--v-szoveg-3)', fontVariantNumeric: 'tabular-nums' }}>
        {String(k.sorszam).padStart(2, '0')}
      </span>
      <span className="w-1 h-9 rounded-full shrink-0" style={{ background: k.szin }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase truncate" style={{ color: k.szin }}>{csoport}</span>
        </div>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--v-szoveg-2)' }}>
          {tema || csoport}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <span key={i} className="rounded-full" style={{ width: 4, height: 4, background: 'var(--v-vonal-2)' }} />
        ))}
      </div>
      <span className="text-[10px] font-bold px-2 py-1 rounded shrink-0" style={{ background: `${k.szin}18`, color: k.szin }}>
        {k.erettseg}
      </span>
      <p className="text-xs font-bold shrink-0 hidden sm:block" style={{ color: 'var(--v-szoveg-2)', fontVariantNumeric: 'tabular-nums' }}>{k.arsav}</p>
    </div>
  )
}

function Tetelek({ elo, sorban }: { elo: EloProjekt[]; sorban: KirakatElem[] }) {
  const [kereses, setKereses] = useState('')
  const [mind, setMind] = useState(false)

  const q = kereses.trim().toLowerCase()
  const szurtElo = elo.filter(p => !q || p.nev.toLowerCase().includes(q) || p.kategoria.toLowerCase().includes(q))
  const szurtSor = sorban.filter(k => !q || k.cimke.toLowerCase().includes(q))
  const lathatoSor = mind ? szurtSor : szurtSor.slice(0, 10)

  return (
    <section id="tetelek" className="mx-auto max-w-5xl px-6 py-24">
      <Feltunik>
        <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--v-rozsa)' }}>Tételek</p>
            <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', letterSpacing: '-0.03em', color: 'var(--v-szoveg)' }}>
              Mi kerül kalapács alá
            </h2>
          </div>
          <input value={kereses} onChange={e => setKereses(e.target.value)}
            placeholder="Keresés szakterületre…"
            className="text-sm px-4 py-2.5 rounded-xl w-full sm:w-64 focus:outline-none transition-colors"
            style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-lila)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
        </div>

        <p className="text-sm mb-8" style={{ color: 'var(--v-szoveg-3)', maxWidth: '58ch' }}>
          A böngészés ingyenes. A sorban álló tételek részletei az aukció indulásakor derülnek ki —
          addig védve vannak a másolástól.
        </p>
      </Feltunik>

      {szurtElo.length === 0 && szurtSor.length === 0 ? (
        <p className="py-20 text-center text-sm" style={{ color: 'var(--v-szoveg-3)' }}>
          {q ? 'Erre a keresésre nincs tétel.' : 'Hamarosan érkeznek az első tételek.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {szurtElo.map((p, i) => <Feltunik key={p.id} keses={i * 40}><EloSor p={p} /></Feltunik>)}
          {lathatoSor.map((k, i) => <Feltunik key={k.id} keses={Math.min(i, 10) * 40}><SorbanSor k={k} /></Feltunik>)}
        </div>
      )}

      {szurtSor.length > 10 && (
        <div className="pt-8 text-center">
          <button onClick={() => setMind(m => !m)}
            className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            style={{ border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg-2)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v-lila)'; e.currentTarget.style.color = 'var(--v-szoveg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-vonal-2)'; e.currentTarget.style.color = 'var(--v-szoveg-2)' }}>
            {mind ? 'Kevesebb' : `Mind a ${szurtSor.length} tétel`} →
          </button>
        </div>
      )}
    </section>
  )
}

/* ═══════════════════════  menete  ═══════════════════════ */

function Menete() {
  const lepesek: [string, string, string][] = [
    ['Beküldöd', 'Kiválasztod a szakterületet és leírod az ötleted. Nem kell kész termék.', '#A78BFA'],
    ['Kidolgozzuk', 'Az adott terület szakértőjeként gondolkodó AI kérdez vissza és piacképessé formálja.', '#38BDF8'],
    ['Felbecsüljük', 'Megbecsüljük a valós piaci értéket a szakterület tényleges alkuméretei alapján.', '#34D399'],
    ['Kalapács alá kerül', 'Időkorlátos, anonim élő aukció. A legmagasabb ajánlat nyer.', '#FBBF24'],
    ['Letétben zárul', 'A pénzt letétben tartjuk. Az eladó átad, csak utána fizetünk ki.', '#F43F5E'],
  ]
  return (
    <section id="menete" className="mx-auto max-w-4xl px-6 py-24">
      <Feltunik>
        <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--v-lila-2)' }}>Az aukció menete</p>
        <h2 className="font-black mb-12 tracking-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', letterSpacing: '-0.03em', color: 'var(--v-szoveg)' }}>
          Ötlettől a kalapácsig
        </h2>
      </Feltunik>

      <div className="relative">
        <div className="absolute left-[19px] top-3 bottom-3 w-px hidden sm:block"
          style={{ background: 'linear-gradient(180deg, var(--v-lila), var(--v-rozsa))', opacity: .35 }} />
        <div className="flex flex-col gap-3">
          {lepesek.map(([cim, leiras, szin], i) => (
            <Feltunik key={cim} keses={i * 90}>
              <div className="flex gap-5 items-start group">
                <span className="hidden sm:flex shrink-0 h-10 w-10 rounded-full items-center justify-center text-xs font-black relative z-10 transition-transform"
                  style={{ background: 'var(--v-bg-3)', border: `1px solid ${szin}66`, color: szin }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 rounded-2xl px-5 py-4 transition-all"
                  style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${szin}66`; e.currentTarget.style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-vonal)'; e.currentTarget.style.transform = 'none' }}>
                  <h3 className="font-bold text-base mb-1" style={{ color: 'var(--v-szoveg)' }}>{cim}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>{leiras}</p>
                </div>
              </div>
            </Feltunik>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════  kérdések  ═══════════════════════ */

function Kerdes({ k, v }: { k: string; v: string }) {
  const [nyitva, setNyitva] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)
  const [magassag, setMagassag] = useState(0)
  useEffect(() => { if (ref.current) setMagassag(nyitva ? ref.current.scrollHeight : 0) }, [nyitva])

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: nyitva ? 'var(--v-bg-3)' : 'var(--v-bg-2)', border: `1px solid ${nyitva ? 'var(--v-vonal-2)' : 'var(--v-vonal)'}` }}>
      <button onClick={() => setNyitva(n => !n)} aria-expanded={nyitva}
        className="w-full flex items-center justify-between gap-5 px-5 py-4 text-left">
        <span className="text-sm font-semibold" style={{ color: 'var(--v-szoveg)' }}>{k}</span>
        <span className="shrink-0 text-lg font-black leading-none"
          style={{ color: 'var(--v-rozsa)', transform: nyitva ? 'rotate(135deg)' : 'none', transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)' }}>+</span>
      </button>
      <div style={{ maxHeight: magassag, overflow: 'hidden', transition: 'max-height .4s cubic-bezier(.22,.61,.36,1)' }}>
        <p ref={ref} className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>{v}</p>
      </div>
    </div>
  )
}

function Kerdesek() {
  const lista: [string, string][] = [
    ['Nincs kész termékem, csak egy ötletem. Beküldhetem?', 'Igen — a katalógus túlnyomó része ilyen. Három érettségi szintet jelölünk: Ötlet, Prototípus és Bizonyított. A kész termék magasabb árat ér el, de a puszta ötletnek is van piaca.'],
    ['Honnan tudom, hogy nem lopják el az ötletemet?', 'Az aukció indulásáig sem a tétel neve, sem a leírása nem jelenik meg — csak a szakterület, az érettség és egy ársáv. A részletes anyagot kizárólag a nyertes vevő kapja meg, az átadás részeként.'],
    ['Mibe kerül?', 'A beküldés és a böngészés ingyenes. Sikeres eladás után a végösszeg 10%-át számítjuk fel, amit az eladó fizet. Ha nem kel el a tétel, nem fizetsz semmit.'],
    ['Milyen témában küldhetek be ötletet?', 'Huszonöt szakterületen, a napenergiától a vízgazdálkodáson át a csillagászatig — közel háromszáz kategóriában. Ha valós problémát old meg és van aki megvenné, itt a helye.'],
    ['Mikor indul az első aukció?', 'Amint összegyűlik a kellő számú érdeklődő. Addig a beküldött tételek sorban állnak, és senki nem tud licitálni — így az első árverésen már valódi vevők lesznek jelen.'],
    ['Hogyan védett a személyazonosságom?', 'Az eladók és a vevők álnéven jelennek meg. A valódi személyazonosság kizárólag sikeres eladás után, az átadás részeként kerül megosztásra.'],
  ]
  return (
    <section id="kerdesek" className="mx-auto max-w-3xl px-6 py-24">
      <Feltunik>
        <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--v-lila-2)' }}>Kérdések</p>
        <h2 className="font-black mb-10 tracking-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', letterSpacing: '-0.03em', color: 'var(--v-szoveg)' }}>
          Mielőtt belicitálsz
        </h2>
      </Feltunik>
      <div className="flex flex-col gap-2.5">
        {lista.map(([k, v], i) => <Feltunik key={k} keses={i * 60}><Kerdes k={k} v={v} /></Feltunik>)}
      </div>
    </section>
  )
}

/* ═══════════════════════  feliratkozás  ═══════════════════════ */

function Feliratkozas({ szam, novel }: { szam: number; novel: () => void }) {
  const [email, setEmail] = useState('')
  const [allapot, setAllapot] = useState<'nyugalom' | 'kuld' | 'siker' | 'hiba'>('nyugalom')
  const { ref, lathato } = useLathato<HTMLDivElement>()

  async function bekuld(e: React.FormEvent) {
    e.preventDefault()
    setAllapot('kuld')
    const { error } = await supabase.from('feliratkozok').insert([{ email }])
    if (error) setAllapot(error.code === '23505' ? 'siker' : 'hiba')
    else { setAllapot('siker'); setEmail(''); novel() }
  }

  const szazalek = Math.min(100, (szam / INDULAS_KUSZOB) * 100)

  return (
    <section className="mx-auto max-w-4xl px-6 pb-28">
      <Feltunik>
        <div className="relative rounded-3xl overflow-hidden px-6 sm:px-12 py-14 text-center"
          style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal-2)' }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{
            background: 'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(124,58,237,.28) 0%, transparent 65%)',
          }} />

          <div className="relative">
            <h2 className="font-black mb-4 tracking-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: 'var(--v-szoveg)' }}>
              Ott leszel, amikor<br /><span className="v-fenylo">lecsap a kalapács?</span>
            </h2>
            <p className="text-sm mb-9 mx-auto" style={{ color: 'var(--v-szoveg-2)', maxWidth: '44ch' }}>
              Az aukció akkor indul, amikor összegyűlik a kellő számú érdeklődő.
              Szólunk, mielőtt az első tétel kalapács alá kerül.
            </p>

            <div ref={ref} className="mx-auto mb-9" style={{ maxWidth: 420 }}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--v-szoveg-3)' }}>Érdeklődők</span>
                <span className="text-xs font-bold" style={{ color: 'var(--v-szoveg-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {szam.toLocaleString('hu-HU')} / {INDULAS_KUSZOB.toLocaleString('hu-HU')}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--v-bg-4)' }}>
                <div style={{
                  height: '100%',
                  width: lathato ? `${Math.max(szazalek, 1.5)}%` : '0%',
                  background: 'linear-gradient(90deg, var(--v-lila), var(--v-rozsa))',
                  borderRadius: 999,
                  transition: 'width 1.6s cubic-bezier(.22,.61,.36,1) .2s',
                }} />
              </div>
            </div>

            {allapot === 'siker' ? (
              <div className="py-3">
                <p className="text-xl font-black mb-1" style={{ color: 'var(--v-zold)' }}>Felírtunk a listára.</p>
                <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>Az első aukció előtt keresünk.</p>
              </div>
            ) : (
              <form onSubmit={bekuld} className="flex flex-col sm:flex-row gap-2.5 mx-auto" style={{ maxWidth: 420 }}>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="nev@pelda.hu"
                  className="flex-1 text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                  style={{ background: 'var(--v-bg)', border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-lila)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal-2)')} />
                <button type="submit" disabled={allapot === 'kuld'}
                  className="px-6 py-3 rounded-xl text-sm font-bold shrink-0 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--v-lila), var(--v-rozsa))',
                    color: '#fff', opacity: allapot === 'kuld' ? .6 : 1,
                    boxShadow: '0 8px 26px rgba(124,58,237,.4)',
                  }}
                  onMouseEnter={e => { if (allapot !== 'kuld') e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}>
                  {allapot === 'kuld' ? 'Küldés…' : 'Értesítsetek'}
                </button>
              </form>
            )}
            {allapot === 'hiba' && <p className="mt-3 text-sm" style={{ color: 'var(--v-rozsa)' }}>Nem sikerült. Próbáld meg újra.</p>}
          </div>
        </div>
      </Feltunik>
    </section>
  )
}

/* ═══════════════════════  lábléc  ═══════════════════════ */

function Lablec() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-10" style={{ borderTop: '1px solid var(--v-vonal)' }}>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--v-rozsa)' }} />
          <span className="font-bold" style={{ color: 'var(--v-szoveg)' }}>BidVip</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {[['Tételek', '#tetelek'], ['Területek', '#teruletek'], ['Menete', '#menete'], ['Kérdések', '#kerdesek'], ['Aukciósház', '/aukciosHaz']].map(([c, h]) => (
            <a key={h} href={h} className="text-sm transition-colors" style={{ color: 'var(--v-szoveg-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-3)')}>{c}</a>
          ))}
        </nav>
        <p className="text-xs" style={{ color: 'var(--v-szoveg-3)' }}>© {new Date().getFullYear()} BidVip</p>
      </div>
    </footer>
  )
}

/* ═══════════════════════  oldal  ═══════════════════════ */

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
    <div style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)', minHeight: '100vh', overflowX: 'hidden' }}>
      <Fejlec />
      <main>
        <Hero varolista={sorban.length} />
        <Szamok varolista={sorban.length} />
        <Teruletek />
        <Tetelek elo={elo} sorban={sorban} />
        <Menete />
        <Kerdesek />
        <Feliratkozas szam={feliratkozok} novel={() => setFeliratkozok(n => n + 1)} />
      </main>
      <Lablec />
    </div>
  )
}
