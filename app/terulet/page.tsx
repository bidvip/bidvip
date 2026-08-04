import type { Metadata } from 'next'
import Link from 'next/link'
import { KATEGORIA_FA, OSSZES_TEMA, azonosito } from '@/lib/kategoriak'
import { ALAP_URL } from '@/lib/beallitasok'
import StrukturaltAdat from '@/app/components/StrukturaltAdat'

export const metadata: Metadata = {
  title: 'Szakterületek',
  description:
    `Huszonöt szakterület, ${OSSZES_TEMA.length} kategória — a napenergiától a ` +
    'vízgazdálkodáson át a csillagászatig. Bármilyen ötleted van, itt a helye.',
  alternates: { canonical: '/terulet' },
  openGraph: {
    title: 'Szakterületek — BidVip',
    description: `Huszonöt szakterület, ${OSSZES_TEMA.length} kategória.`,
    url: `${ALAP_URL}/terulet`,
    locale: 'hu_HU',
  },
}

/** A 25 szakterületi aloldal gyűjtője — belső hivatkozás-csomópont. */
export default function TeruletekOldal() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <StrukturaltAdat
        morzsak={[
          { nev: 'Főoldal', ut: '/' },
          { nev: 'Szakterületek', ut: '/terulet' },
        ]}
      />

      <header style={{ borderBottom: '1px solid var(--v-vonal)' }}>
        <div className="mx-auto max-w-5xl px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--v-rozsa)' }} />
            <span className="text-lg font-bold">BidVip</span>
          </Link>
          <Link href="/aukciosHaz" className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>
            Aukciós Ház →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14">
        <nav aria-label="Morzsamenü" className="mb-7">
          <ol className="flex items-center gap-2 text-xs" style={{ color: 'var(--v-szoveg-3)' }}>
            <li><Link href="/" className="hover:underline">Főoldal</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: 'var(--v-szoveg-2)' }}>Szakterületek</li>
          </ol>
        </nav>

        <h1 className="font-black tracking-tight mb-5"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em' }}>
          Bármilyen ötleted van,<br />itt a helye
        </h1>

        <p className="text-base leading-relaxed mb-12" style={{ color: 'var(--v-szoveg-2)', maxWidth: '62ch' }}>
          Huszonöt szakterület, összesen <strong style={{ color: 'var(--v-szoveg)' }}>{OSSZES_TEMA.length} kategória</strong> —
          a napenergiától a vízgazdálkodáson át a csillagászatig. Nem kell technológiai
          ötletnek lennie, és nem kell kész terméknek: ha valós problémát old meg
          és van aki megvenné, itt a helye.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KATEGORIA_FA.map(cs => (
            <li key={cs.nev}>
              <Link href={`/terulet/${azonosito(cs.nev)}`}
                className="block rounded-xl overflow-hidden h-full transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)' }}>
                <div style={{ height: 2, background: cs.szin }} aria-hidden="true" />
                <div className="px-4 py-3.5">
                  <h2 className="text-sm font-bold mb-1" style={{ color: cs.szin }}>{cs.nev}</h2>
                  <p className="text-xs mb-2" style={{ color: 'var(--v-szoveg-3)' }}>
                    {cs.temak.length} kategória
                  </p>
                  <p className="text-xs leading-snug line-clamp-2" style={{ color: 'var(--v-szoveg-2)' }}>
                    {cs.temak.slice(0, 4).join(' · ')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
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
      </div>
    </main>
  )
}
