import { NextRequest, NextResponse } from 'next/server'
import { createClient as createBrowserClient } from '@/lib/supabase-browser'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v

  // Mindenki csak a saját felfüggesztését kérdezheti le — a felfüggesztés
  // oka személyes adat, más felhasználóé nem szivároghat ki.
  const userId = user.id

  const { data } = await supabase
    .from('felfuggesztesek')
    .select('id, ok, letrehozva')
    .eq('user_id', userId)
    .is('feloldva', null)
    .single()

  return NextResponse.json({ suspended: !!data, ok: data?.ok || null })
}
