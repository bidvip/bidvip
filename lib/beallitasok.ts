/**
 * Központi beállítások.
 *
 * A domain és a feladó cím korábban tizenegy helyen volt beégetve.
 * Innentől egyetlen környezeti változó átállítása elég — a kódhoz
 * nem kell hozzányúlni, amikor saját domainre váltunk.
 */

function tisztitottUrl(nyers: string | undefined, tartalek: string): string {
  const ertek = (nyers ?? '').trim().replace(/\/+$/, '')
  if (!ertek) return tartalek
  try {
    // Ha valaki protokoll nélkül adja meg, kiegészítjük
    const teljes = /^https?:\/\//i.test(ertek) ? ertek : `https://${ertek}`
    new URL(teljes)
    return teljes.replace(/\/+$/, '')
  } catch {
    // Hibás érték esetén inkább a tartalék, mint hogy induláskor elszálljon
    return tartalek
  }
}

/** A webhely nyilvános címe. Linkek, sitemap, e-mailek és Stripe használja. */
export const ALAP_URL = tisztitottUrl(
  process.env.NEXT_PUBLIC_BASE_URL,
  'https://bidvip.vercel.app'
)

/** Csak a gépnév, séma nélkül — pl. metaadatokhoz. */
export const DOMAIN = (() => {
  try { return new URL(ALAP_URL).host } catch { return 'bidvip.vercel.app' }
})()

/**
 * Az e-mailek feladója.
 *
 * Amíg ez a Resend homokozó-doménjén (`resend.dev`) áll, a levelek
 * levélszemétbe eshetnek — azon a doménen nincs a mi SPF/DKIM
 * bejegyzésünk. A fizetési linkek e-mailben mennek, tehát ez közvetlenül
 * a bevételt érinti. Saját, hitelesített domainre kell állítani.
 */
export const EMAIL_FELADO =
  process.env.EMAIL_FELADO?.trim() || 'BidVip <onboarding@resend.dev>'

/** Igaz, ha még a homokozó-feladó van érvényben. */
export const EMAIL_HOMOKOZO = EMAIL_FELADO.includes('resend.dev')

/** Kapcsolati cím — impresszumban és jogi oldalakon jelenik meg. */
export const KAPCSOLAT_EMAIL =
  process.env.NEXT_PUBLIC_KAPCSOLAT_EMAIL?.trim() || 'info.webbloki@gmail.com'
