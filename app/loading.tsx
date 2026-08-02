/**
 * Betöltési váz.
 *
 * Nem gyorsítja meg az oldalt, de a várakozás rövidebbnek tűnik tőle:
 * a látogató azt látja, hogy készül valami, nem üres képernyőt bámul.
 * A vázak a valódi elrendezés arányait követik, hogy ne ugráljon a
 * tartalom, amikor megérkezik.
 */
export default function Betoltes() {
  return (
    <div style={{ background: 'var(--v-bg)', minHeight: '100vh' }} aria-busy="true" aria-live="polite">
      <span className="csak-olvasonak">Az oldal betöltés alatt</span>

      <div className="mx-auto max-w-6xl px-6 pt-28">
        {/* Címsor */}
        <div className="grid lg:grid-cols-12 gap-x-12 gap-y-10">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Sav sz="40%" m={26} />
            <Sav sz="90%" m={56} />
            <Sav sz="75%" m={56} />
            <Sav sz="55%" m={56} />
            <div className="mt-4 flex flex-col gap-2.5">
              <Sav sz="80%" m={16} />
              <Sav sz="65%" m={16} />
            </div>
            <div className="mt-5 flex gap-3">
              <Sav sz={150} m={48} r={12} />
              <Sav sz={140} m={48} r={12} />
            </div>
          </div>

          {/* Oldalsó kártyák */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {[0, 1, 2].map(i => <Sav key={i} sz="100%" m={120} r={16} keses={i * 120} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Sav({ sz, m, r = 8, keses = 0 }: { sz: string | number; m: number; r?: number; keses?: number }) {
  return (
    <div
      style={{
        width: typeof sz === 'number' ? `${sz}px` : sz,
        height: m,
        borderRadius: r,
        background: 'linear-gradient(90deg, var(--v-bg-2) 25%, var(--v-bg-3) 50%, var(--v-bg-2) 75%)',
        backgroundSize: '200% 100%',
        animation: `shimmer 1.6s ease-in-out ${keses}ms infinite`,
      }}
    />
  )
}
