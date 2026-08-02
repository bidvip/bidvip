import type { Metadata } from 'next'

// A page.tsx kliens-komponens, az pedig nem exportálhat metadata-t.
// Ezért a cím és a leírás ide, a szerveroldali elrendezésbe kerül.
export const metadata: Metadata = {
  title: 'Ötlet beküldése',
  description: 'Küldd be az ötleted. Nem kell kész termék — az AI segít kidolgozni és felbecsülni mennyit ér.',
}

export default function Elrendezes({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}