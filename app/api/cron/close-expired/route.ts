import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendEmail, auctionWinnerEmail, auctionSellerEmail } from '@/lib/email'
import { elindult } from '@/lib/indulas'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'

const SAVOK = [
  { sav: 'fast',     perc: 3,  label: 'Fast'     },
  { sav: 'standard', perc: 5,  label: 'Standard' },
  { sav: 'premium',  perc: 20, label: 'Premium'  },
]

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

      await supabase.from('projektek').update({ vevo_email: winnerEmail }).eq('id', projekt.id)

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
      if (session.url) {
        const { subject, html } = auctionWinnerEmail(projekt.nev, topLicit.osszeg, session.url)
        await sendEmail(winnerEmail, subject, html).catch(() => {})
      }
      if (sellerEmail) {
        const { subject, html } = auctionSellerEmail(projekt.nev, topLicit.osszeg, eladoKap)
        await sendEmail(sellerEmail, subject, html).catch(() => {})
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
