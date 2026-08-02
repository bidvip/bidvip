import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendEmail, purchaseSellerEmail, purchaseBuyerDetailedEmail } from '@/lib/email'
import { biztonsagosan, naploFigyelem } from '@/lib/naplo'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const { projekt_id, vevo_email, elado_email } = session.metadata || {}
  if (!projekt_id || !vevo_email) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Mark project as sold
  const { data: projekt } = await supabase
    .from('projektek')
    .update({ statusz: 'sold', vevo_email })
    .eq('id', projekt_id)
    .select('nev, reszletes_leiras, fajlok, kikialtasi_ar')
    .single()

  if (!projekt) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const osszeg = Math.round((session.amount_total || 0) / 100)
  const eladoKap = Math.round(osszeg * 0.9)

  // Email buyer: full project details unlocked
  const fajlok = (projekt.fajlok as Array<{nev: string; url: string; tipus: string}>) || []
  const { subject: buyerSubj, html: buyerHtml } = purchaseBuyerDetailedEmail(
    projekt.nev,
    projekt.reszletes_leiras || '',
    fajlok
  )
  // Ez a levél tartalmazza a megvásárolt anyagot. Ha nem megy ki, a vevő
  // fizetett és nem kapott semmit — ezt azonnal tudni kell.
  const vevoKapta = await biztonsagosan(
    'stripe-webhook/vevo-atadas',
    () => sendEmail(vevo_email, buyerSubj, buyerHtml),
    { projekt_id, cimzett: vevo_email }
  )
  if (vevoKapta === null) {
    naploFigyelem('stripe-webhook/vevo-atadas', 'FIZETETT VEVŐ NEM KAPTA MEG AZ ANYAGOT', {
      projekt_id, vevo_email,
    })
  }

  // Email seller: buyer contact + payout amount
  if (elado_email) {
    const { subject: sellerSubj, html: sellerHtml } = purchaseSellerEmail(
      projekt.nev,
      eladoKap,
      vevo_email
    )
    await biztonsagosan(
      'stripe-webhook/elado-ertesites',
      () => sendEmail(elado_email, sellerSubj, sellerHtml),
      { projekt_id, cimzett: elado_email }
    )
  }

  return NextResponse.json({ ok: true })
}
