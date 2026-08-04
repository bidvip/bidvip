import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  KATEGORIA_FA, csoportAzonositobol, osszesCsoportAzonosito, azonosito,
} from '@/lib/kategoriak'
import { ALAP_URL } from '@/lib/beallitasok'
import StrukturaltAdat from '@/app/components/StrukturaltAdat'

/**
 * Szakterületi aloldalak.
 *
 * Ez a lap legnagyobb keresőoptimalizálási nyeresége: huszonöt statikus,
 * indexelhető oldal, mindegyik a saját szakterületére szabott címmel és
 * leírással. Enélkül a Google-nek egyetlen tartalmi oldala sincs a
 * főoldalon kívül, amit hosszú farkú keresésre találatként adhatna.
 *
 * Statikusan generálódnak, tehát nincs futásidejű költségük.
 */

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return osszesCsoportAzonosito().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const cs = csoportAzonositobol(slug)
  if (!cs) return { title: 'Ismeretlen szakterület' }

  const cim = `${cs.nev} ötletek eladása és vásárlása`
  const leiras =
    `${cs.nev} területén ${cs.temak.length} kategóriában küldhetsz be ötletet: ` +
    `${cs.temak.slice(0, 5).join(', ')} és további területek. ` +
    `Nem kell kész termék — az AI segít kidolgozni, felbecsüljük mennyit ér, és aukcióra bocsátjuk.`

  return {
    title: cim,
    description: leiras,
    alternates: { canonical: `/terulet/${slug}` },
    openGraph: {
      title: `${cim} — BidVip`,
      description: leiras,
      url: `${ALAP_URL}/terulet/${slug}`,
      type: 'website',
      locale: 'hu_HU',
    },
  }
}

export default async function TeruletOldal({ params }: Params) {
  const { slug } = await params
  const cs = csoportAzonositobol(slug)
  if (!cs) notFound()

  // Néhány szomszédos terület a belső hivatkozásokhoz — a keresők így
  // jobban bejárják a lapot, az olvasó pedig továbbtud lépni.
  const tovabbiak = KATEGORIA_FA.filter(c => c.nev !== cs.nev).slice(0, 6)

  return (
    <main className="min-h-screen" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <StrukturaltAdat
        morzsak={[
          { nev: 'Főoldal', ut: '/' },
          { nev: 'Szakterületek', ut: '/terulet' },
          { nev: cs.nev, ut: `/terulet/${slug}` },
        ]}
      />

      <header style={{ borderBottom: '1px solid var(--v-vonal)' }}>
        <div className="mx-auto max-w-4xl px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--v-rozsa)' }} />
            <span className="text-lg font-bold">BidVip</span>
          </Link>
          <Link href="/aukciosHaz" className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>
            Aukciós Ház →
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-14">
        {/* Morzsamenü — a keresőnek és az olvasónak is */}
        <nav aria-label="Morzsamenü" className="mb-7">
          <ol className="flex items-center gap-2 text-xs" style={{ color: 'var(--v-szoveg-3)' }}>
            <li><Link href="/" className="hover:underline">Főoldal</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/terulet" className="hover:underline">Szakterületek</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: cs.szin }}>{cs.nev}</li>
          </ol>
        </nav>

        <div className="h-1 w-16 rounded-full mb-6" style={{ background: cs.szin }} aria-hidden="true" />

        <h1 className="font-black tracking-tight mb-5"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em' }}>
          {cs.nev} ötletek<br />eladása és vásárlása
        </h1>

        <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--v-szoveg-2)', maxWidth: '62ch' }}>
          A BidVip aukciós házában <strong style={{ color: 'var(--v-szoveg)' }}>{cs.temak.length} kategóriában</strong>{' '}
          küldhetsz be ötletet a(z) {cs.nev.toLowerCase()} területén. Nem kell kész terméked legyen:
          az AI az adott szakterület szakértőjeként kérdez vissza, segít piacképessé formálni,
          megbecsüli a valós piaci értéket, majd élő aukcióra bocsátjuk komoly vevők előtt.
        </p>

        <p className="text-sm leading-relaxed mb-9" style={{ color: 'var(--v-szoveg-3)', maxWidth: '62ch' }}>
          A böngészés ingyenes, a beküldés is. Sikeres eladás után a végösszeg 10%-át
          számítjuk fel — ha nem kel el a tétel, nem fizetsz semmit.
        </p>

        <div className="flex flex-wrap gap-3 mb-14">
          <Link href="/submit"
            className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, var(--v-lila), var(--v-rozsa))', color: '#fff' }}>
            Beküldöm az ötletem →
          </Link>
          <Link href="/aukciosHaz"
            className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{ border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg)' }}>
            Megnézem a tételeket
          </Link>
        </div>

        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2">Mely kategóriákban küldhetsz be ötletet?</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--v-szoveg-3)' }}>
            Ha az ötleted ezek bármelyikéhez kapcsolódik, itt a helye.
          </p>
          <ul className="flex flex-wrap gap-2">
            {cs.temak.map(t => (
              <li key={t} className="text-sm px-3 py-2 rounded-lg"
                style={{ background: `${cs.szin}12`, border: `1px solid ${cs.szin}2E`, color: 'var(--v-szoveg-2)' }}>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-bold mb-5">Hogyan zajlik?</h2>
          <ol className="flex flex-col gap-4">
            {[
              ['Beküldöd', `Kiválasztod a pontos kategóriát a(z) ${cs.nev.toLowerCase()} területén belül, és leírod az ötleted.`],
              ['Kidolgozzuk', 'Az AI az adott szakterület mércéjével értékel: kik a valódi versenytársak, milyen szabályozás vonatkozik rá, mi buktatja el a legtöbb projektet ezen a téren.'],
              ['Felbecsüljük', 'Megbecsüljük a piaci értéket a szakterület tényleges alkuméretei alapján — nem generikus startup-logikával.'],
              ['Kalapács alá kerül', 'Időkorlátos, anonim aukció. A licit nyilvános, a licitálók álnéven szerepelnek.'],
            ].map(([cim, leiras], i) => (
              <li key={cim} className="flex gap-4">
                <span className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `${cs.szin}1E`, color: cs.szin }}>{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{cim}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>{leiras}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section style={{ borderTop: '1px solid var(--v-vonal)' }} className="pt-10">
          <h2 className="text-base font-bold mb-4">További szakterületek</h2>
          <ul className="flex flex-wrap gap-2">
            {tovabbiak.map(t => (
              <li key={t.nev}>
                <Link href={`/terulet/${azonosito(t.nev)}`}
                  className="inline-block text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{ border: '1px solid var(--v-vonal)', color: t.szin }}>
                  {t.nev}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/terulet"
                className="inline-block text-sm px-3 py-2 rounded-lg"
                style={{ border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg-2)' }}>
                Mind a {KATEGORIA_FA.length} →
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  )
}
