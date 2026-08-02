import { NextRequest, NextResponse } from 'next/server'
import { megkovetelAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, rejectionEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  
  const v = await megkovetelAdmin(req)
  if (v instanceof NextResponse) return v
  const { supabase } = v


  const { projekt_id } = await req.json()

  const { data: projekt, error } = await supabase
    .from('projektek')
    .update({ statusz: 'elutasitva' })
    .eq('id', projekt_id)
    .select('nev, user_id')
    .single()

  if (error || !projekt) return NextResponse.json({ ok: false }, { status: 500 })

  const { data: { user: seller } } = await supabase.auth.admin.getUserById(projekt.user_id)
  if (seller?.email) {
    const { subject, html } = rejectionEmail(projekt.nev)
    await sendEmail(seller.email, subject, html)
  }

  return NextResponse.json({ ok: true })
}
