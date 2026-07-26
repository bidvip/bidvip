import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { projekt_id, projekt_nev, osszeg, vevo_email } = await req.json()

    const platformFee = Math.round(osszeg * 0.12) // 12% platform fee

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
              description: `BidVip project purchase — ID: ${projekt_id}`,
            },
            unit_amount: osszeg * 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee * 100,
        metadata: {
          projekt_id,
          platform: 'bidvip',
        },
      },
      metadata: { projekt_id, vevo_email },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'}/project/${projekt_id}?fizetes=siker`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'}/project/${projekt_id}?fizetes=megszakitva`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Payment error' }, { status: 500 })
  }
}
