import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { megkovetelBejelentkezes } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PACKAGES: Record<string, { tokens: number; amount: number; name: string }> = {
  small:  { tokens: 100, amount: 5,  name: '100 Tokens' },
  medium: { tokens: 300, amount: 13, name: '300 Tokens' },
  large:  { tokens: 700, amount: 27, name: '700 Tokens' },
}

export async function POST(req: NextRequest) {
  try {
    const { package: pkg, user_id, user_email, redirect = '' } = await req.json()

    const selected = PACKAGES[pkg]
    if (!selected) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user_email,
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'}/tokens?status=success&session_id={CHECKOUT_SESSION_ID}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bidvip.vercel.app'}/tokens?status=cancelled${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Token checkout error:', error)
    return NextResponse.json({ error: 'Payment error' }, { status: 500 })
  }
}
