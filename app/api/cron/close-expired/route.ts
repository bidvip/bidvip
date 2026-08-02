import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendEmail, auctionWinnerEmail, auctionSellerEmail } from '@/lib/email'
import { elindult } from '@/lib/indulas'
import { biztonsagosan, naploFigyelem } from '@/lib/naplo'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'

const SAVOK = [
  { sav: 'fast',     perc: 3,  label: 'Fast'     },
  { sav: 'standard', perc: 5,  label: 'Standard' },
  { sav: 'premium',  perc: 20, label: 'Premium'  },
]

/** Ennyi ideje van a nyertesnek fizetni, mielőtt a tétel visszakerül a sorba. */
const FIZETESI_HATARIDO_ORA = 48

/**
 * Visszateszi a sorba azokat a lezárt tételeket, amiknél a nyertes nem
 * fizetett határidőre.
 *
 * A `fizetesi_hatarido` oszlop csak a migráció után létezik. Amíg nincs,
 * a függvény csendben kihagyja magát, hogy a cron többi része fusson —
 * enélkül egyetlen hiányzó oszlop az egész aukciózárást megállítaná.
 */
async function fizetetlenekKezelese(
  supabase: ReturnType<typeof createClient>,
  most: Date
): Promise<string> {
  const { data, error } = await supabase
    .from('projektek')
    .select('id, nev, fizetesi_hatarido, fizetve_ekkor')
    .eq('statusz', 'lezart')
    .lt('fizetesi_hatarido', most.toISOString())
    .is('fizetve_ekkor', null)
    .limit(50)

  if (error) return 'kihagyva (migráció még nem futott)'
  if (!data?.length) return 'nincs lejárt fizetés'

  for (const p of data) {
    // Vissza a sorba: kaphat új esélyt egy másik aukción
    await supabase
      .from('projektek')
      .update({
        statusz: 'varakozas',
        varakozas_kezd: most.toISOString(),
        lejarat: null,
        vevo_email: null,
        fizetesi_hatarido: null,
      })
      .eq('id', p.id)

    naploFigyelem('cron/fizetetlen', 'A nyertes nem fizetett, a tétel visszakerült a sorba', {
      projekt_id: p.id, projekt: p.nev,
    })
  }

  return `visszasorolva:${data.length}`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const now = new Date()
  const eredmeny: Record<string, string> = {}

  // Indulás előtt egyetlen ötlet sem kerülhet aukcióra. A lejárt aukciók
  // lezárása viszont ilyenkor is fut — ha valami mégis élő maradt, azt
  // rendesen le kell zárni és kifizetni.
  const elindultE = await elindult()

  // ── Nem fizetett nyertesek kezelése ──
  // Enélkül a lezárt tétel örökre ott ragad: a nyertes nem fizetett, a
  // tétel mégsem kerül vissza forgalomba, és az eladó sem tud mit kezdeni vele.
  eredmeny.fizetetlen = await fizetetlenekKezelese(supabase, now)

  for (const { sav, perc } of SAVOK) {
    // 1. Close expired active auction in this lane
    const { data: lejart } = await supabase
      .from('projektek')
      .update({ statusz: 'lezart' })
      .eq('statusz', 'aktiv')
      .eq('sav', sav)
      .lt('lejarat', now.toISOString())
      .select('id, nev, user_id, lejarat')

    // Process winners
    for (const projekt of lejart || []) {
      const { data: topLicit } = await supabase
        .from('licitek')
        .select('osszeg, user_id')
        .eq('projekt_id', projekt.id)
        .order('osszeg', { ascending: false })
        .limit(1)
        .single()

      if (!topLicit) continue

const { data: { user: winner } } = await supabase.auth.admin.getUserById(topLicit.user_id)
      const winnerEmail = winner?.email
      if (!winnerEmail) continue

      const { data: { user: seller } } = await supabase.auth.admin.getUserById(projekt.user_id)
      const sellerEmail = seller?.email

      // A határidőt megpróbáljuk beállítani; ha az oszlop még nincs meg,
      // legalább a vevő e-mailje rögzüljön.
      const hataridovel = await supabase
        .from('projektek')
        .update({
          vevo_email: winnerEmail,
          fizetesi_hatarido: new Date(now.getTime() + FIZETESI_HATARIDO_ORA * 3600_000).toISOString(),
        })
        .eq('id', projekt.id)

      if (hataridovel.error) {
        await supabase.from('projektek').update({ vevo_email: winnerEmail }).eq('id', projekt.id)
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: winnerEmail,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `BidVip — ${projekt.nev}`, description: 'Startup project auction purchase' },
            unit_amount: Math.round(topLicit.osszeg * 100),
          },
          quantity: 1,
        }],
        metadata: { projekt_id: projekt.id, vevo_email: winnerEmail, elado_email: sellerEmail || '' },
        success_url: `${BASE_URL}/project/${projekt.id}?fizetes=siker`,
        cancel_url: `${BASE_URL}/project/${projekt.id}?fizetes=megszakitva`,
      })

      const eladoKap = Math.round(topLicit.osszeg * 0.9)

      // A nyertes levele tartalmazza az EGYETLEN fizetési linket. Ha ez
      // nem megy ki, az ügylet meghiúsul — ezért nem nyelhetjük el csendben.
      if (session.url) {
        const { subject, html } = auctionWinnerEmail(projekt.nev, topLicit.osszeg, session.url)
        const kimentE = await biztonsagosan(
          'cron/nyertes-ertesites',
          () => sendEmail(winnerEmail, subject, html),
          { projekt_id: projekt.id, projekt: projekt.nev, cimzett: winnerEmail }
        )
        if (kimentE === null) {
          naploFigyelem('cron/nyertes-ertesites', 'A nyertes NEM kapta meg a fizetési linket', {
            projekt_id: projekt.id, fizetesi_link: session.url,
          })
        }
      } else {
        naploFigyelem('cron/fizetesi-link', 'A Stripe nem adott vissza fizetési URL-t', {
          projekt_id: projekt.id,
        })
      }

      if (sellerEmail) {
        const { subject, html } = auctionSellerEmail(projekt.nev, topLicit.osszeg, eladoKap)
        await biztonsagosan(
          'cron/elado-ertesites',
          () => sendEmail(sellerEmail, subject, html),
          { projekt_id: projekt.id, cimzett: sellerEmail }
        )
      }
    }

    if (!elindultE) { eredmeny[sav] = 'prelaunch'; continue }

    // 2. Check how many slots are active (max 3 per lane)
    const { data: aktivLista } = await supabase
      .from('projektek')
      .select('id')
      .eq('statusz', 'aktiv')
      .eq('sav', sav)

    const aktivDb = aktivLista?.length ?? 0
    const szabadSlot = 3 - aktivDb

    if (szabadSlot <= 0) { eredmeny[sav] = `active:${aktivDb}`; continue }

    // 3. Fill free slots from queue (no break when multiple slots available)
    const { data: varakozok } = await supabase
      .from('projektek')
      .select('id, nev')
      .eq('statusz', 'varakozas')
      .eq('sav', sav)
      .order('priority_tokens', { ascending: false })
      .order('varakozas_kezd', { ascending: true })
      .limit(szabadSlot)

    if (!varakozok || varakozok.length === 0) { eredmeny[sav] = 'empty'; continue }

    const lejarat = new Date(now.getTime() + perc * 60 * 1000).toISOString()
    for (const p of varakozok) {
      await supabase.from('projektek').update({ statusz: 'aktiv', lejarat }).eq('id', p.id)
    }
    eredmeny[sav] = `started:${varakozok.length} (${varakozok.map(p => p.nev).join(', ')})`
  }

  return NextResponse.json({ ok: true, ...eredmeny })
}
