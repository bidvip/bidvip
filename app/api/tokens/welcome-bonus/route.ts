import { NextRequest, NextResponse } from 'next/server'
import { megkovetelBejelentkezes } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const WELCOME_TOKENS = 50
const MAX_BONUS_USERS = 2000

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v

  // A bónusz mindig a bejelentkezett felhasználóé
  const user_id = user.id

  // Check if user already got the bonus
  const { data: profil } = await supabase
    .from('profiles')
    .select('welcome_bonus')
    .eq('id', user_id)
    .single()

  if (!profil) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profil.welcome_bonus) return NextResponse.json({ ok: false, reason: 'already_claimed' })

  // Count how many users already claimed the bonus
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('welcome_bonus', true)

  if ((count ?? 0) >= MAX_BONUS_USERS) {
    return NextResponse.json({ ok: false, reason: 'quota_full' })
  }

  // Mark the profile as bonus claimed
  await supabase
    .from('profiles')
    .update({ welcome_bonus: true })
    .eq('id', user_id)

  // Add tokens — create row if not exists yet
  const { data: existing } = await supabase
    .from('tokenek')
    .select('id, egyenleg')
    .eq('user_id', user_id)
    .single()

  if (existing) {
    await supabase
      .from('tokenek')
      .update({ egyenleg: existing.egyenleg + WELCOME_TOKENS })
      .eq('user_id', user_id)
  } else {
    await supabase
      .from('tokenek')
      .insert({ user_id, egyenleg: WELCOME_TOKENS })
  }

  return NextResponse.json({ ok: true, tokens: WELCOME_TOKENS })
}
