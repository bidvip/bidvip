import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendEmail, auctionWinnerEmail, auctionSellerEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'
const AUCTION_DURATION_MS = 60 * 60 * 1000        // 1 hour
const BREAK_DURATION_MS = 5 * 60 * 1000           // 5 min break between auctions

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

  // 1. Close expired active auctions
  const { data: lejartProjektek } = await supabase
    .from('projektek')
    .update({ statusz: 'lezart' })
    .eq('statusz', 'aktiv')
    .lt('lejarat', now.toISOString())
    .select('id, nev, user_email, kikialtasi_ar, reserve_ar, lejarat')

  // Process winners for closed auctions
  for (const projekt of lejartProjektek || []) {
    const { data: topLicit } = await supabase
      .from('licitek')
      .select('osszeg, user_id')
      .eq('projekt_id', projekt.id)
      .order('osszeg', { ascending: false })
      .limit(1)
      .single()

    if (!topLicit) continue

    if (projekt.reserve_ar && topLicit.osszeg < projekt.reserve_ar) {
      await supabase.from('projektek').update({ statusz: 'reserve_nem_teljesult' }).eq('id', projekt.id)
      continue
    }

    const { data: { user: winner } } = await supabase.auth.admin.getUserById(topLicit.user_id)
    const winnerEmail = winner?.email
    if (!winnerEmail) continue

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
      metadata: { projekt_id: projekt.id, vevo_email: winnerEmail, elado_email: projekt.user_email },
      success_url: `${BASE_URL}/project/${projekt.id}?fizetes=siker`,
      cancel_url: `${BASE_URL}/project/${projekt.id}?fizetes=megszakitva`,
    })

    const eladoKap = Math.round(topLicit.osszeg * 0.9)
    if (session.url) {
      await sendEmail(winnerEmail, ...Object.values(auctionWinnerEmail(projekt.nev, topLicit.osszeg, session.url)) as [string, string])
    }
    if (projekt.user_email) {
      const { subject, html } = auctionSellerEmail(projekt.nev, topLicit.osszeg, eladoKap)
      await sendEmail(projekt.user_email, subject, html).catch(() => {})
    }
  }

  // 2. Check if we should start the next auction
  const { data: aktiv } = await supabase
    .from('projektek')
    .select('id')
    .eq('statusz', 'aktiv')
    .limit(1)
    .single()

  if (aktiv) {
    return NextResponse.json({ lezarva: lejartProjektek?.length || 0, aktiv: true })
  }

  // Check break time — find the most recently closed auction
  const { data: utolsoLezart } = await supabase
    .from('projektek')
    .select('lejarat')
    .eq('statusz', 'lezart')
    .order('lejarat', { ascending: false })
    .limit(1)
    .single()

  if (utolsoLezart?.lejarat) {
    const lezartIdeje = new Date(utolsoLezart.lejarat).getTime()
    const szunetVege = lezartIdeje + BREAK_DURATION_MS
    if (now.getTime() < szunetVege) {
      const maradek = Math.ceil((szunetVege - now.getTime()) / 1000)
      return NextResponse.json({ szunet: true, masodperc: maradek })
    }
  }

  // 3. Start next project from queue (highest priority_tokens, then earliest varakozas_kezd)
  const { data: kovetkezo } = await supabase
    .from('projektek')
    .select('id, nev')
    .eq('statusz', 'varakozas')
    .order('priority_tokens', { ascending: false })
    .order('varakozas_kezd', { ascending: true })
    .limit(1)
    .single()

  if (!kovetkezo) {
    return NextResponse.json({ lezarva: lejartProjektek?.length || 0, sor_ures: true })
  }

  const lejarat = new Date(now.getTime() + AUCTION_DURATION_MS).toISOString()
  await supabase
    .from('projektek')
    .update({ statusz: 'aktiv', lejarat })
    .eq('id', kovetkezo.id)

  return NextResponse.json({
    lezarva: lejartProjektek?.length || 0,
    elindult: kovetkezo.nev,
    lejarat,
  })
}
