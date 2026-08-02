import { NextRequest, NextResponse } from 'next/server'
import { getNapiAnonNev } from '@/lib/anon-nev'
import { megkovetelBejelentkezes } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v

  const { tipus } = await req.json()
  if (tipus !== 'elado' && tipus !== 'vevo') {
    return NextResponse.json({ error: 'Érvénytelen típus' }, { status: 400 })
  }

  // Az álnév mindig a bejelentkezett felhasználóé — más nevében nem kérhető
  const nev = await getNapiAnonNev(supabase, user.id, tipus)
  return NextResponse.json({ nev })
}
