import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { user_id, amount } = await req.json()
  if (!user_id || !amount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: tokenData } = await supabase
    .from('tokenek')
    .select('egyenleg')
    .eq('user_id', user_id)
    .single()

  if (!tokenData) return NextResponse.json({ error: 'Token account not found' }, { status: 404 })
  if (tokenData.egyenleg < amount) return NextResponse.json({ error: 'insufficient_tokens', egyenleg: tokenData.egyenleg }, { status: 400 })

  const { error } = await supabase
    .from('tokenek')
    .update({ egyenleg: tokenData.egyenleg - amount })
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, uj_egyenleg: tokenData.egyenleg - amount })
}
