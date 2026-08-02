import { NextRequest, NextResponse } from 'next/server'
import { megkovetelBejelentkezes } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PROTECTED_POSITIONS = 5

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v
  const user_id = user.id

  const { projekt_id, token_amount } = await req.json()
  if (!projekt_id || typeof token_amount !== 'number' || token_amount < 1) {
    return NextResponse.json({ error: 'Hiányzó vagy érvénytelen mezők' }, { status: 400 })
  }

  // Verify project belongs to user and is waiting
  const { data: projekt } = await supabase
    .from('projektek')
    .select('id, user_id, statusz, priority_tokens')
    .eq('id', projekt_id)
    .single()

  if (!projekt) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (projekt.user_id !== user_id) return NextResponse.json({ error: 'Not your project' }, { status: 403 })
  if (projekt.statusz !== 'varakozas') return NextResponse.json({ error: 'Project is not in queue' }, { status: 400 })

  // Check user has enough tokens
  const { data: tokenAdat } = await supabase
    .from('tokenek')
    .select('egyenleg')
    .eq('user_id', user_id)
    .single()

  if (!tokenAdat || tokenAdat.egyenleg < token_amount) {
    return NextResponse.json({ error: 'Not enough tokens' }, { status: 400 })
  }

  // Get current queue to check top 5 protection
  const { data: sor } = await supabase
    .from('projektek')
    .select('id, priority_tokens, varakozas_kezd')
    .eq('statusz', 'varakozas')
    .order('priority_tokens', { ascending: false })
    .order('varakozas_kezd', { ascending: true })

  const position = (sor || []).findIndex(p => p.id === projekt_id)

  if (position < PROTECTED_POSITIONS && position !== -1) {
    return NextResponse.json({ error: `You are already in the top ${PROTECTED_POSITIONS} — no boost needed` }, { status: 400 })
  }

  // Deduct tokens
  await supabase
    .from('tokenek')
    .update({ egyenleg: tokenAdat.egyenleg - token_amount })
    .eq('user_id', user_id)

  // Add priority tokens to project
  const ujPriority = (projekt.priority_tokens || 0) + token_amount
  await supabase
    .from('projektek')
    .update({ priority_tokens: ujPriority })
    .eq('id', projekt_id)

  // Calculate new position
  const ujSor = (sor || [])
    .map(p => p.id === projekt_id ? { ...p, priority_tokens: ujPriority } : p)
    .sort((a, b) => {
      if (b.priority_tokens !== a.priority_tokens) return b.priority_tokens - a.priority_tokens
      return new Date(a.varakozas_kezd).getTime() - new Date(b.varakozas_kezd).getTime()
    })

  const ujPozicio = ujSor.findIndex(p => p.id === projekt_id) + 1

  return NextResponse.json({ ok: true, position: ujPozicio, priority_tokens: ujPriority })
}
