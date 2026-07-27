import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { user_id, user_email, nev, rovid_leiras, reszletes_leiras, kategoria, block_reason, fajlok = [] } = await req.json()

  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  await supabase.from('reports').insert([{
    user_id,
    user_email,
    nev,
    rovid_leiras,
    reszletes_leiras,
    kategoria,
    block_reason,
    fajlok,
    statusz: 'pending',
  }])

  await supabase.from('felfuggesztesek').insert([{
    user_id,
    user_email,
    ok: block_reason,
  }])

  return NextResponse.json({ ok: true })
}
