import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { report_id, user_id } = await req.json()

  await supabase
    .from('reports')
    .update({ statusz: 'vegleges_tiltás' })
    .eq('id', report_id)

  // Keep suspension permanent (feloldva stays null)
  // Optionally disable auth user
  await supabase.auth.admin.updateUser(user_id, { ban_duration: '876600h' }) // 100 years

  return NextResponse.json({ ok: true })
}
