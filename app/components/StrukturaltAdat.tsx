const ALAP = 'https://bidvip.vercel.app'

/**
 * Strukturált adat a keresőknek.
 *
 * Enélkül a Google csak egy szövegoldalt lát. Ezzel tudja, hogy szervezet,
 * hogy webhely keresővel, és hogy milyen kérdésekre válaszol — utóbbi
 * kiemelt találatként is megjelenhet.
 */
export default function StrukturaltAdat({ gyik }: { gyik?: [string, string][] }) {
  const adat: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
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
      name: 'BidVip',
      url: ALAP,
      inLanguage: 'hu-HU',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${ALAP}/aukciosHaz?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ]

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

  return (
    <script
      type="application/ld+json"
      // A tartalom saját forrásból jön, nem felhasználói bemenetből
      dangerouslySetInnerHTML={{ __html: JSON.stringify(adat) }}
    />
  )
}
