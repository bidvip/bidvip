import { NextRequest, NextResponse } from 'next/server'
import { megkovetelAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  
  const v = await megkovetelAdmin(req)
  if (v instanceof NextResponse) return v
  const { supabase } = v


  const { report_id, user_id } = await req.json()

  await supabase
    .from('felfuggesztesek')
    .update({ feloldva: new Date().toISOString() })
    .eq('user_id', user_id)
    .is('feloldva', null)

  await supabase
    .from('reports')
    .update({ statusz: 'feloldva' })
    .eq('id', report_id)

  return NextResponse.json({ ok: true })
}
