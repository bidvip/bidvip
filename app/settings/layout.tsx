import type { Metadata } from 'next'

// A page.tsx kliens-komponens, az pedig nem exportálhat metadata-t.
// Ezért a cím és a leírás ide, a szerveroldali elrendezésbe kerül.
export const metadata: Metadata = {
  title: 'Beállítások',
  description: 'Fiókbeállítások és adatkezelés.',
}

export default function Elrendezes({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}