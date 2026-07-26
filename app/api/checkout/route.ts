import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { projekt_id, projekt_nev, osszeg, vevo_email } = await req.json()

    const platformJutalek = Math.round(osszeg * 0.12) // 12% jutalék

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: vevo_email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: projekt_nev,
              description: `BidVip projekt vásárlás — ID: ${projekt_id}`,
            },
            unit_amount: osszeg * 100, // EUR centben
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformJutalek * 100,
        metadata: {
          projekt_id,
          platform: 'bidvip',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'}/projekt/${projekt_id}?fizetes=siker`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'}/projekt/${projekt_id}?fizetes=megszakitva`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout hiba:', error)
    return NextResponse.json({ error: 'Fizetési hiba' }, { status: 500 })
  }
}
