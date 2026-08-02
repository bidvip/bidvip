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
    .from('reports')
    .update({ statusz: 'vegleges_tiltás' })
    .eq('id', report_id)

  // Keep suspension permanent (feloldva stays null)
  // Optionally disable auth user
  await supabase.auth.admin.updateUserById(user_id, { ban_duration: '876600h' }) // 100 years

  return NextResponse.json({ ok: true })
}
