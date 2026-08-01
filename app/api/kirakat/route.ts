import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { kirakatba } from '@/lib/kirakat'

export const dynamic = 'force-dynamic'

/**
 * Publikus kirakat — bejelentkezés nélkül is hívható.
 *
 * A `projektek` táblát RLS védi, így a böngésző anon kulccsal semmit nem lát.
 * Ez a végpont service kulccsal olvas, de a várólistáról KIZÁRÓLAG az
 * anonimizált mezőket adja vissza: a név és a leírás el sem hagyja a szervert.
 * Így az anonimitás szerveroldali garancia, nem kliensoldali megállapodás.
 *
 * Élő aukciónál a teljes tartalom mehet — az már amúgy is nyilvános.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const kulcs = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !kulcs) {
    return NextResponse.json({ elo: [], sorban: [] }, { status: 200 })
  }

  const supabase = createClient(url, kulcs)

  const [eloRes, sorRes] = await Promise.all([
    supabase
      .from('projektek')
      .select('id, nev, rovid_leiras, kategoria, badge, kikialtasi_ar, lejarat')
      .eq('statusz', 'aktiv')
      .order('letrehozva', { ascending: false })
      .limit(50),
    supabase
      .from('projektek')
      .select('id, nev, rovid_leiras, kategoria, badge, kikialtasi_ar')
      .eq('statusz', 'varakozas')
      .order('priority_tokens', { ascending: false })
      .order('varakozas_kezd', { ascending: true })
      .limit(60),
  ])

  const sorban = (sorRes.data ?? []).map((p, i) => kirakatba(p, i + 1))

  return NextResponse.json(
    { elo: eloRes.data ?? [], sorban },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
  )
}
