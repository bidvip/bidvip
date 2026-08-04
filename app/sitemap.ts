import type { MetadataRoute } from 'next'
import { ALAP_URL } from '@/lib/beallitasok'
import { osszesCsoportAzonosito } from '@/lib/kategoriak'

const ALAP = ALAP_URL

/**
 * Csak a nyilvánosan értelmes oldalak kerülnek bele. A bejelentkezés mögötti
 * felületeknek (vezérlőpult, beállítások, admin) nincs keresési értéke, és
 * a robots.ts is kizárja őket.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const most = new Date()

  // A 25 szakterületi aloldal — ezek adják a hosszú farkú kereséseket
  const teruletek: MetadataRoute.Sitemap = osszesCsoportAzonosito().map(slug => ({
    url: `${ALAP}/terulet/${slug}`,
    lastModified: most,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    ...teruletek,
    { url: `${ALAP}/`,             lastModified: most, changeFrequency: 'daily',   priority: 1 },
    { url: `${ALAP}/aukciosHaz`,   lastModified: most, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${ALAP}/submit`,       lastModified: most, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${ALAP}/auth`,         lastModified: most, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${ALAP}/aszf`,         lastModified: most, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${ALAP}/adatvedelem`,  lastModified: most, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${ALAP}/impresszum`,   lastModified: most, changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
