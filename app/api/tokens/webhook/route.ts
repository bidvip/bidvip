import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const user_id = session.metadata?.user_id
    const tokens = parseInt(session.metadata?.tokens || '0')

    if (user_id && tokens > 0) {
      const { data: existing } = await supabase
        .from('tokenek')
        .select('id, egyenleg')
        .eq('user_id', user_id)
        .single()

      if (existing) {
        await supabase
          .from('tokenek')
          .update({ egyenleg: existing.egyenleg + tokens })
          .eq('user_id', user_id)
      } else {
        await supabase
          .from('tokenek')
          .insert({ user_id, egyenleg: tokens })
      }
    }
  }

  return NextResponse.json({ received: true })
}
