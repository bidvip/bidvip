import { NextRequest, NextResponse } from 'next/server'
import { ALAP_URL } from '@/lib/beallitasok'
import Stripe from 'stripe'
import { megkovetelBejelentkezes } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PACKAGES: Record<string, { tokens: number; amount: number; name: string }> = {
  small:  { tokens: 100, amount: 5,  name: '100 Tokens' },
  medium: { tokens: 300, amount: 13, name: '300 Tokens' },
  large:  { tokens: 700, amount: 27, name: '700 Tokens' },
}

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user } = v

  try {
    const { package: pkg, redirect = '' } = await req.json()

    const selected = PACKAGES[pkg]
    if (!selected) return NextResponse.json({ error: 'Ismeretlen csomag' }, { status: 400 })

    // A jóváírás célja és az e-mail a munkamenetből jön — így nem lehet
    // más számlájára vásárolni, sem idegen címre szóló számlát kiállítani.
    const user_id = user.id

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `BidVip — ${selected.name}`,
            description: `${selected.tokens} AI development tokens`,
          },
          unit_amount: selected.amount * 100,
        },
        quantity: 1,
      }],
      metadata: { user_id, tokens: selected.tokens.toString(), pkg },
      success_url: `${ALAP_URL}/tokens?status=success&session_id={CHECKOUT_SESSION_ID}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`,
      cancel_url: `${ALAP_URL}/tokens?status=cancelled${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Token checkout error:', error)
    return NextResponse.json({ error: 'Payment error' }, { status: 500 })
  }
}
