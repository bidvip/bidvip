'use client'

import { useEffect } from 'react'

/**
 * Végső hibafogó: akkor lép be, ha maga a gyökér elrendezés száll el.
 * Ilyenkor nincs se globals.css, se elrendezés — ezért saját <html> és
 * <body> kell, és minden stílus közvetlenül itt, változók nélkül.
 */
export default function GlobalisHiba({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Gyökérszintű hiba:', error)
  }, [error])

  return (
    <html lang="hu">
      <body style={{ margin: 0, background: '#07050D', color: '#F3F0FA', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Az oldal nem tölthető be</h1>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#A79FC4', margin: '0 0 28px' }}>
              Váratlan hiba történt. Kérlek frissítsd az oldalt.
            </p>
            <button onClick={reset}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7C3AED, #F43F5E)', color: '#fff',
                fontSize: 14, fontWeight: 700,
              }}>
              Újratöltés
            </button>
            {error.digest && (
              <p style={{ marginTop: 28, fontSize: 12, color: '#6B6288' }}>Hibaazonosító: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  )
}
