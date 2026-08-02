import { NextRequest, NextResponse } from 'next/server'
import { megkovetelBejelentkezes } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v

  const { amount } = await req.json()
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Érvénytelen összeg' }, { status: 400 })
  }

  // A saját egyenlegét vonja le mindenki — a felhasználót a munkamenet adja.
  const user_id = user.id

  const { data: tokenData } = await supabase
    .from('tokenek')
    .select('egyenleg')
    .eq('user_id', user_id)
    .single()

  if (!tokenData) return NextResponse.json({ error: 'Nincs token-számla' }, { status: 404 })
  if (tokenData.egyenleg < amount) {
    return NextResponse.json({ error: 'insufficient_tokens', egyenleg: tokenData.egyenleg }, { status: 400 })
  }

  // Feltételes frissítés: csak akkor ír, ha az egyenleg időközben nem változott.
  // Így két egyidejű levonásból a második nem talál sort és újrapróbálható —
  // enélkül mindkettő ugyanazt olvasná, és duplán lehetne költeni.
  const { data: frissitett, error } = await supabase
    .from('tokenek')
    .update({ egyenleg: tokenData.egyenleg - amount })
    .eq('user_id', user_id)
    .eq('egyenleg', tokenData.egyenleg)
    .select('egyenleg')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!frissitett || frissitett.length === 0) {
    return NextResponse.json({ error: 'Az egyenleg időközben változott, próbáld újra', utkozes: true }, { status: 409 })
  }

  return NextResponse.json({ ok: true, uj_egyenleg: frissitett[0].egyenleg })
}
