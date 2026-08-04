import { ALAP_URL } from '@/lib/beallitasok'

const ALAP = ALAP_URL

/**
 * Strukturált adat a keresőknek.
 *
 * Enélkül a Google csak egy szövegoldalt lát. Ezzel tudja, hogy szervezet,
 * hogy webhely, milyen a lap hierarchiája, és milyen kérdésekre válaszol —
 * utóbbi kiemelt találatként is megjelenhet.
 *
 * A `SearchAction` (Sitelinks Search Box) szándékosan nincs benne:
 * a Google 2026 januárjában kivezette, a megtartása csak zajt okozna.
 */

export type Morzsa = { nev: string; ut: string }

type Props = {
  gyik?: [string, string][]
  morzsak?: Morzsa[]
  /** Egyedi séma-blokkok, pl. egy tétel Product/Offer leírása. */
  extra?: Record<string, unknown>[]
}

export default function StrukturaltAdat({ gyik, morzsak, extra }: Props) {
  const adat: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${ALAP}/#szervezet`,
      name: 'BidVip',
      url: ALAP,
      logo: `${ALAP}/opengraph-image`,
      description: 'Ötletek aukciós háza — üzleti ötletek, prototípusok és kész termékek árverése.',
      email: 'info.webbloki@gmail.com',
      areaServed: 'HU',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${ALAP}/#webhely`,
      name: 'BidVip',
      url: ALAP,
      inLanguage: 'hu-HU',
      publisher: { '@id': `${ALAP}/#szervezet` },
    },
  ]

  if (morzsak?.length) {
    adat.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: morzsak.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: m.nev,
        item: `${ALAP}${m.ut}`,
      })),
    })
  }

  if (gyik?.length) {
    adat.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: gyik.map(([kerdes, valasz]) => ({
        '@type': 'Question',
        name: kerdes,
        acceptedAnswer: { '@type': 'Answer', text: valasz },
      })),
    })
  }

  if (extra?.length) adat.push(...extra)

  return (
    <script
      type="application/ld+json"
      // A tartalom saját forrásból jön, nem felhasználói bemenetből
      dangerouslySetInnerHTML={{ __html: JSON.stringify(adat) }}
    />
  )
}

/**
 * Egy aukciós tétel séma-leírása.
 *
 * A Google elvárásai szerint az ár mindig sima szám szövegként — se
 * pénznemjel, se ezres elválasztó —, az elérhetőség pedig teljes
 * schema.org URL, nem szabad szöveg.
 */
export function tetelSema(t: {
  id: string
  nev: string
  leiras: string
  kategoria: string
  ar: number
  lejarat?: string | null
  elerheto: boolean
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t.nev,
    description: t.leiras,
    category: t.kategoria,
    image: `${ALAP}/opengraph-image`,
    url: `${ALAP}/project/${t.id}`,
    offers: {
      '@type': 'Offer',
      url: `${ALAP}/project/${t.id}`,
      price: String(Math.round(t.ar)),
      priceCurrency: 'EUR',
      availability: t.elerheto
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      ...(t.lejarat ? { priceValidUntil: t.lejarat.slice(0, 10) } : {}),
      seller: { '@id': `${ALAP}/#szervezet` },
    },
  }
}
