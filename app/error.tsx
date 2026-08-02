'use client'

import { useEffect } from 'react'

/**
 * Hibaoldal. Enélkül a látogató üres fehér lapot lát, ha bármi elszáll.
 * A hibát a konzolra írjuk, hogy a hibakövető (ha be van kötve) elkapja.
 */
export default function Hiba({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Oldalhiba:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.35)' }}>
          <span style={{ color: 'var(--v-rozsa)', fontSize: 22, lineHeight: 1 }}>!</span>
        </div>

        <h1 className="text-2xl font-black mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Valami félrement
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--v-szoveg-2)' }}>
          Nem a te hibád — nálunk akadt el valami. Próbáld újra, és ha újra előjön,
          szólj nekünk.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, var(--v-lila), var(--v-rozsa))', color: '#fff' }}>
            Újrapróbálom
          </button>
          <a href="/" className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg-2)' }}>
            Vissza a főoldalra
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs" style={{ color: 'var(--v-szoveg-3)' }}>
            Hibaazonosító: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{error.digest}</span>
          </p>
        )}
      </div>
    </main>
  )
}
