import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getNapiAnonNev } from '@/lib/anon-nev'

export const dynamic = 'force-dynamic'

export function minIncrement(ar: number): number {
  if (ar < 500) return 25
  if (ar < 2000) return 50
  if (ar < 10000) return 100
  return 250
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { projekt_id, user_id, osszeg, proxy_max } = await req.json()
  if (!projekt_id || !user_id || !osszeg) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Load project + highest bid + reserve
  const { data: projekt, error: projektHiba } = await supabase
    .from('projektek')
    .select('kikialtasi_ar, reserve_ar, lejarat, statusz, user_id, nev')
    .eq('id', projekt_id)
    .single()

  if (!projekt) return NextResponse.json({ error: 'Project not found', debug: projektHiba?.message, id: projekt_id }, { status: 404 })
  if (projekt.statusz !== 'aktiv') return NextResponse.json({ error: 'Auction is not active' }, { status: 400 })
  if (projekt.user_id === user_id) return NextResponse.json({ error: 'Cannot bid on your own project' }, { status: 400 })
  if (projekt.lejarat && new Date(projekt.lejarat) < new Date()) {
    return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
  }

  const { data: topLicit } = await supabase
    .from('licitek')
    .select('osszeg, user_id, proxy_max')
    .eq('projekt_id', projekt_id)
    .order('osszeg', { ascending: false })
    .limit(1)
    .single()

  const legmagasabb = topLicit?.osszeg || projekt.kikialtasi_ar
  const minEmel = minIncrement(legmagasabb)
  const minimum = legmagasabb + minEmel

  if (osszeg < minimum) {
    return NextResponse.json({ error: `Minimum bid is €${minimum} (increment: €${minEmel})`, minimum }, { status: 400 })
  }

  // Get daily anon name for bidder
  const anonNev = await getNapiAnonNev(supabase, user_id, 'vevo')

  // Place the bid
  const valodiBid = proxy_max ? Math.min(proxy_max, osszeg) : osszeg
  await supabase.from('licitek').insert([{
    projekt_id,
    user_id,
    osszeg: valodiBid,
    proxy_max: proxy_max || null,
    anon_nev: anonNev,
  }])

  // Notify previous highest bidder if outbid
  if (topLicit && topLicit.user_id !== user_id) {
    const { data: { user: prevUser } } = await supabase.auth.admin.getUserById(topLicit.user_id)
    if (prevUser?.email) {
      // Check if their proxy can counter
      const prevProxy = topLicit.proxy_max
      if (prevProxy && prevProxy > valodiBid) {
        const counterBid = Math.min(prevProxy, valodiBid + minIncrement(valodiBid))
        const prevAnonNev = await getNapiAnonNev(supabase, topLicit.user_id, 'vevo')
        await supabase.from('licitek').insert([{
          projekt_id,
          user_id: topLicit.user_id,
          osszeg: counterBid,
          proxy_max: prevProxy,
          auto_bid: true,
          anon_nev: prevAnonNev,
        }])
      } else {
        // Notify they were outbid
        await sendEmail(prevUser.email,
          `You've been outbid on: ${projekt.nev}`,
          `<p>Hi,</p><p>Someone placed a higher bid of <strong>€${valodiBid.toLocaleString()}</strong> on <strong>${projekt.nev}</strong>.</p><p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/project/${projekt_id}">Place a new bid →</a></p><p>— BidVip Team</p>`
        ).catch(() => {})
      }
    }
  }

  // Notify seller
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bid-notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projekt_id, osszeg: valodiBid }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, osszeg: valodiBid })
}
