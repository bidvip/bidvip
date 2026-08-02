import type { MetadataRoute } from 'next'
import { ALAP_URL } from '@/lib/beallitasok'

const ALAP = ALAP_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bejelentkezés mögötti és gépi felületek — se értelme, se haszna
      // hogy a keresők bejárják őket.
      disallow: ['/api/', '/admin', '/dashboard', '/settings', '/tokens', '/onboarding'],
    },
    sitemap: `${ALAP}/sitemap.xml`,
  }
}
