import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendEmail, auctionWinnerEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'

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

  // Find active projects that have expired
  const { data: lejartProjektek, error } = await supabase
    .from('projektek')
    .update({ statusz: 'lezart' })
    .eq('statusz', 'aktiv')
    .lt('lejarat', new Date().toISOString())
    .select('id, nev, user_email, kikialtasi_ar, reserve_ar')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!lejartProjektek || lejartProjektek.length === 0) {
    return NextResponse.json({ lezarva: 0 })
  }

  for (const projekt of lejartProjektek) {
    // Find highest bid
    const { data: topLicit } = await supabase
      .from('licitek')
      .select('osszeg, user_id')
      .eq('projekt_id', projekt.id)
      .order('osszeg', { ascending: false })
      .limit(1)
      .single()

    if (!topLicit) continue // No bids, stays closed

    // Check reserve price
    if (projekt.reserve_ar && topLicit.osszeg < projekt.reserve_ar) {
      await supabase.from('projektek').update({ statusz: 'reserve_nem_teljesult' }).eq('id', projekt.id)
      continue
    }

    // Get winner email
    const { data: { user: winner } } = await supabase.auth.admin.getUserById(topLicit.user_id)
    const winnerEmail = winner?.email
    if (!winnerEmail) continue

    // Save winner email to project
    await supabase
      .from('projektek')
      .update({ vevo_email: winnerEmail })
      .eq('id', projekt.id)

    // Create Stripe checkout link
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: winnerEmail,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `BidVip — ${projekt.nev}`,
            description: 'Startup project auction purchase',
          },
          unit_amount: Math.round(topLicit.osszeg * 100),
        },
        quantity: 1,
      }],
      metadata: { projekt_id: projekt.id, vevo_email: winnerEmail },
      success_url: `${BASE_URL}/project/${projekt.id}?fizetes=siker`,
      cancel_url: `${BASE_URL}/project/${projekt.id}?fizetes=megszakitva`,
    })

    // Email winner with payment link
    if (session.url) {
      const { subject, html } = auctionWinnerEmail(projekt.nev, topLicit.osszeg, session.url)
      await sendEmail(winnerEmail, subject, html)
    }
  }

  return NextResponse.json({ lezarva: lejartProjektek.length, projektek: lejartProjektek.map(p => p.nev) })
}
