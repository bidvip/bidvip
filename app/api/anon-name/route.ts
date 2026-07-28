import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getNapiAnonNev } from '@/lib/anon-nev'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { user_id, tipus } = await req.json()
  if (!user_id || !tipus) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const nev = await getNapiAnonNev(supabase as any, user_id, tipus)
  return NextResponse.json({ nev })
}
