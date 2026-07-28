import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, approvalEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { projekt_id } = await req.json()

  // Approved projects go into the waiting queue, not directly active
  const { data: projekt, error } = await supabase
    .from('projektek')
    .update({ statusz: 'varakozas', varakozas_kezd: new Date().toISOString() })
    .eq('id', projekt_id)
    .select('nev, user_email')
    .single()

  if (error || !projekt) return NextResponse.json({ ok: false }, { status: 500 })

  if (projekt.user_email) {
    const { subject, html } = approvalEmail(projekt.nev)
    await sendEmail(projekt.user_email, subject, html)
  }

  return NextResponse.json({ ok: true })
}
