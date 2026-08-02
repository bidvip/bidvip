import Link from 'next/link'

/** Közös keret a jogi oldalakhoz, hogy egységes maradjon a megjelenés. */
export default function JogiOldal({
  cim, frissitve, children,
}: { cim: string; frissitve: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <header style={{ borderBottom: '1px solid var(--v-vonal)' }}>
        <div className="mx-auto max-w-3xl px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--v-rozsa)' }} />
            <span className="text-lg font-bold" style={{ color: 'var(--v-szoveg)' }}>BidVip</span>
          </Link>
          <Link href="/" className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>← Vissza</Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-black tracking-tight mb-2"
          style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.03em' }}>
          {cim}
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--v-szoveg-3)' }}>
          Utolsó frissítés: {frissitve}
        </p>

        <div className="jogi-tartalom flex flex-col gap-6">{children}</div>

        <div className="mt-14 rounded-2xl p-5" style={{ background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>
            <strong style={{ color: 'var(--v-arany)' }}>Figyelem:</strong> ez a dokumentum tervezet.
            Éles működés előtt jogásszal át kell nézetni, és ki kell egészíteni a
            szolgáltató tényleges cégadataival.
          </p>
        </div>
      </article>
    </main>
  )
}

export function Szakasz({ cim, children }: { cim: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--v-szoveg)' }}>{cim}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>
        {children}
      </div>
    </section>
  )
}
