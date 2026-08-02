import type { Metadata } from 'next'

// A page.tsx kliens-komponens, az pedig nem exportálhat metadata-t.
// Ezért a cím és a leírás ide, a szerveroldali elrendezésbe kerül.
export const metadata: Metadata = {
  title: 'Aukciós Ház',
  description: 'Élő aukciók és a sorban álló tételek. A böngészés ingyenes, licitálni regisztráció után lehet.',
}

export default function Elrendezes({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}