import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, bidEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { projekt_id, osszeg } = await req.json()

  const { data: projekt } = await supabase
    .from('projektek')
    .select('nev, user_id')
    .eq('id', projekt_id)
    .single()

  if (!projekt?.user_id) return NextResponse.json({ ok: false })

  const { data: { user: seller } } = await supabase.auth.admin.getUserById(projekt.user_id)
  if (!seller?.email) return NextResponse.json({ ok: false })

  const { subject, html } = bidEmail(projekt.nev, osszeg)
  await sendEmail(seller.email, subject, html)

  return NextResponse.json({ ok: true })
}
