import { NextRequest, NextResponse } from 'next/server'
import { megkovetelBejelentkezes } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v
  const user_id = user.id


  const { projekt_id } = await req.json()
  if (!projekt_id || !user_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: projekt } = await supabase
    .from('projektek')
    .select('user_id, statusz')
    .eq('id', projekt_id)
    .single()

  if (!projekt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (projekt.user_id !== user_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (projekt.statusz !== 'elutasitva') return NextResponse.json({ error: 'Only rejected projects can be resubmitted' }, { status: 400 })

  const { error } = await supabase
    .from('projektek')
    .update({ statusz: 'felulvizsgalat' })
    .eq('id', projekt_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
