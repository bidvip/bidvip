import type { Metadata } from 'next'

// A page.tsx kliens-komponens, az pedig nem exportálhat metadata-t.
// Ezért a cím és a leírás ide, a szerveroldali elrendezésbe kerül.
export const metadata: Metadata = {
  title: 'Kezdés',
  description: 'Néhány kérdés, hogy a megfelelő felületet mutassuk.',
}

export default function Elrendezes({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}