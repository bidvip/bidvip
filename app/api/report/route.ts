import { NextRequest, NextResponse } from 'next/server'
import { megkovetelBejelentkezes } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v
  const user_id = user.id


  const { user_email, nev, rovid_leiras, reszletes_leiras, kategoria, block_reason, fajlok = [] } = await req.json()

  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const ip_cim = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  const user_agent = req.headers.get('user-agent') || 'unknown'

  await supabase.from('reports').insert([{
    user_email,
    nev,
    rovid_leiras,
    reszletes_leiras,
    kategoria,
    block_reason,
    fajlok,
    ip_cim,
    user_agent,
    statusz: 'pending',
  }])

  await supabase.from('felfuggesztesek').insert([{
    user_email,
    ok: block_reason,
  }])

  return NextResponse.json({ ok: true })
}
