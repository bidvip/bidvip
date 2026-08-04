import { NextRequest, NextResponse } from 'next/server'
import { megkovetelAdmin } from '@/lib/auth'
import { EMAIL_FELADO, EMAIL_HOMOKOZO, ALAP_URL } from '@/lib/beallitasok'
import { INDULAS_KUSZOB } from '@/lib/indulas'

export const dynamic = 'force-dynamic'

type Allapot = {
  kulcs: string
  cim: string
  rendben: boolean
  ertek: string
  magyarazat: string
  blokkolo: boolean
}

/**
 * Üzemi állapot — mi hiányzik még az éles működéshez.
 *
 * Ezek a beállítások szétszórtan élnek (Vercel, Resend, Supabase, Stripe),
 * és egyikről sem derül ki magától, hogy hiányzik. A `blokkolo` mező jelzi,
 * hogy az adott hiányosság megakadályozza-e a pénzmozgást.
 */
export async function GET(req: NextRequest) {
  const v = await megkovetelAdmin(req)
  if (v instanceof NextResponse) return v
  const { supabase } = v

  const ellenorzesek: Allapot[] = []

  // ── E-mail feladó ──
  ellenorzesek.push({
    kulcs: 'email',
    cim: 'E-mail feladó',
    rendben: !EMAIL_HOMOKOZO,
    ertek: EMAIL_FELADO,
    magyarazat: EMAIL_HOMOKOZO
      ? 'A Resend homokozó-doménje. Nincs rajta a te SPF/DKIM bejegyzésed, ezért a levelek — köztük a nyertes fizetési linkje — levélszemétbe eshetnek.'
      : 'Saját domain. A levelek hitelesítve mennek ki.',
    blokkolo: EMAIL_HOMOKOZO,
  })

  // ── Cron titok ──
  const cronVan = !!process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 16
  ellenorzesek.push({
    kulcs: 'cron',
    cim: 'Cron titok',
    rendben: cronVan,
    ertek: cronVan ? 'beállítva' : 'hiányzik vagy túl rövid',
    magyarazat: cronVan
      ? 'Az ütemezett feladat hitelesítve fut.'
      : 'Enélkül a cron 401-et kap a saját hívásától: az aukciók sosem zárulnak le, a nyertes nem kap fizetési linket.',
    blokkolo: !cronVan,
  })

  // ── Adatbázis-migráció ──
  // A migráció után létező oszlopokra kérdezünk. Ha hibát ad, még nem futott.
  const migracio = await supabase
    .from('projektek')
    .select('reserve_ar, fizetesi_hatarido')
    .limit(1)

  const migracioKesz = !migracio.error
  ellenorzesek.push({
    kulcs: 'migracio',
    cim: 'Adatbázis-migráció',
    rendben: migracioKesz,
    ertek: migracioKesz ? 'lefutott' : 'nem futott le',
    magyarazat: migracioKesz
      ? 'A minimálár, a fizetési határidő és az atomi licit elérhető.'
      : 'A minimálár nem tárolódik, a nem fizető nyertes örökre blokkolja a tételt, és a licit versenyhelyzete csak részlegesen kezelt. Futtasd a migraciok/001 fájlt a Supabase SQL szerkesztőjében.',
    blokkolo: false,
  })

  // ── Stripe ──
  const stripeVan = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET
  ellenorzesek.push({
    kulcs: 'stripe',
    cim: 'Stripe',
    rendben: stripeVan,
    ertek: stripeVan ? 'kulcs és webhook beállítva' : 'hiányos',
    magyarazat: stripeVan
      ? 'A fizetés feldolgozható.'
      : 'Fizetés nem indítható vagy a visszajelzés nem érkezik meg.',
    blokkolo: !stripeVan,
  })

  // ── Eladói kifizetés ──
  // Stripe Connect nincs bekötve; ez tudatos, de tudni kell róla.
  ellenorzesek.push({
    kulcs: 'kifizetes',
    cim: 'Eladói kifizetés',
    rendben: false,
    ertek: 'kézi',
    magyarazat: 'Nincs Stripe Connect. A vevő pénze a platform egyenlegén marad, és minden eladót kézzel kell kifizetni.',
    blokkolo: false,
  })

  // ── Alapcím ──
  const sajatDomain = !ALAP_URL.includes('vercel.app')
  ellenorzesek.push({
    kulcs: 'domain',
    cim: 'Alapcím',
    rendben: sajatDomain,
    ertek: ALAP_URL,
    magyarazat: sajatDomain
      ? 'Saját domainen fut.'
      : 'Még a Vercel alapdoménjén fut. Működik, de saját domain nélkül az e-mail hitelesítés sem oldható meg.',
    blokkolo: false,
  })

  // ── Indulás ──
  const { count: feliratkozok } = await supabase
    .from('feliratkozok')
    .select('*', { count: 'exact', head: true })

  const fel = feliratkozok ?? 0
  ellenorzesek.push({
    kulcs: 'indulas',
    cim: 'Indulási küszöb',
    rendben: fel >= INDULAS_KUSZOB,
    ertek: `${fel} / ${INDULAS_KUSZOB}`,
    magyarazat: fel >= INDULAS_KUSZOB
      ? 'Elérted a küszöböt, az aukciók indulhatnak.'
      : 'Amíg nincs meg a küszöb, egyetlen tétel sem kerül aukcióra.',
    blokkolo: false,
  })

  return NextResponse.json({
    ellenorzesek,
    blokkolok: ellenorzesek.filter(e => e.blokkolo && !e.rendben).length,
    hianyok: ellenorzesek.filter(e => !e.rendben).length,
  })
}
