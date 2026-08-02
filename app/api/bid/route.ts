import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, outbidEmail } from '@/lib/email'
import { getNapiAnonNev } from '@/lib/anon-nev'
import { megkovetelBejelentkezes } from '@/lib/auth'
import { korlatEllenoriz } from '@/lib/sebessegkorlat'

export const dynamic = 'force-dynamic'

export function minIncrement(ar: number): number {
  if (ar < 500) return 25
  if (ar < 2000) return 50
  if (ar < 10000) return 100
  return 250
}

/**
 * Sniping elleni hosszabbítás.
 *
 * Ha a licit az aukció legvégén érkezik, a többieknek nem marad idejük
 * reagálni. A bevett megoldás — az eBay is ezt vezette be — hogy az
 * utolsó percekben leadott licit meghosszabbítja a lejáratot.
 * A ti sávjaitok 3–20 percesek, ezért itt rövidebb ablak indokolt.
 */
const HOSSZABBITAS_ABLAK_MP = 60
const HOSSZABBITAS_MP = 60

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const { user, supabase } = v

  // Egyetlen felhasználó se tudja licitekkel elárasztani a rendszert
  const korlat = korlatEllenoriz(`licit:${user.id}`, { hivas: 30, ablakMp: 60 })
  if (korlat) return korlat

  const { projekt_id, osszeg, proxy_max } = await req.json()

  // A licitáló azonosítója KIZÁRÓLAG a munkamenetből jöhet. Ha a kérés
  // törzséből vennénk, bárki licitálhatna bárki más nevében.
  const user_id = user.id

  if (!projekt_id || typeof osszeg !== 'number' || !Number.isFinite(osszeg) || osszeg <= 0) {
    return NextResponse.json({ error: 'Hiányzó vagy érvénytelen mezők' }, { status: 400 })
  }
  if (proxy_max != null && (typeof proxy_max !== 'number' || proxy_max < osszeg)) {
    return NextResponse.json({ error: 'A maximum nem lehet kisebb a licitnél' }, { status: 400 })
  }

  // A reserve_ar oszlop csak a migráció lefuttatása után létezik. Amíg nincs,
  // a lekérdezés hibára futna és a licitálás megállna — ezért visszaesünk a
  // szűkebb változatra. A migráció után magától a bővebb ág fut.
  type ProjektSor = {
    kikialtasi_ar: number; lejarat: string | null; statusz: string
    user_id: string; nev: string; reserve_ar?: number | null
  }
  let projekt: ProjektSor | null = null

  const bovebb = await supabase
    .from('projektek')
    .select('kikialtasi_ar, reserve_ar, lejarat, statusz, user_id, nev')
    .eq('id', projekt_id)
    .maybeSingle()

  if (bovebb.error) {
    const szukebb = await supabase
      .from('projektek')
      .select('kikialtasi_ar, lejarat, statusz, user_id, nev')
      .eq('id', projekt_id)
      .maybeSingle()
    projekt = (szukebb.data as ProjektSor | null) ?? null
  } else {
    projekt = (bovebb.data as ProjektSor | null) ?? null
  }

  if (!projekt) return NextResponse.json({ error: 'A tétel nem található' }, { status: 404 })
  if (projekt.statusz !== 'aktiv') return NextResponse.json({ error: 'Az aukció nem aktív' }, { status: 400 })
  if (projekt.user_id === user_id) return NextResponse.json({ error: 'A saját tételedre nem licitálhatsz' }, { status: 400 })
  if (projekt.lejarat && new Date(projekt.lejarat) < new Date()) {
    return NextResponse.json({ error: 'Az aukció lezárult' }, { status: 400 })
  }

  const { data: topLicit } = await supabase
    .from('licitek')
    .select('osszeg, user_id, proxy_max')
    .eq('projekt_id', projekt_id)
    .order('osszeg', { ascending: false })
    .limit(1)
    .maybeSingle()

  const legmagasabb = topLicit?.osszeg || projekt.kikialtasi_ar
  const minEmel = minIncrement(legmagasabb)
  const minimum = legmagasabb + minEmel

  if (osszeg < minimum) {
    return NextResponse.json(
      { error: `A legkisebb leadható licit ${minimum} € (lépésköz: ${minEmel} €)`, minimum },
      { status: 400 }
    )
  }

  const anonNev = await getNapiAnonNev(supabase, user_id, 'vevo')
  const valodiBid = proxy_max ? Math.min(proxy_max, osszeg) : osszeg

  const { data: ujLicit, error: insertHiba } = await supabase.from('licitek').insert([{
    projekt_id,
    user_id,
    osszeg: valodiBid,
    proxy_max: proxy_max ?? null,
    anon_nev: anonNev,
  }]).select('id').single()

  if (insertHiba || !ujLicit) {
    return NextResponse.json({ error: 'A licit rögzítése nem sikerült' }, { status: 500 })
  }

  // ── Versenyhelyzet-ellenőrzés ──
  // Az olvasás és az írás között becsúszhatott egy másik licit. Beszúrás
  // után újraellenőrizzük: ha időközben valaki ugyanennyit vagy többet
  // adott, a miénket visszavonjuk, hogy ne keletkezzen két „nyertes".
  const { data: ellenor } = await supabase
    .from('licitek')
    .select('id, osszeg')
    .eq('projekt_id', projekt_id)
    .gte('osszeg', valodiBid)
    .order('osszeg', { ascending: false })
    .order('letrehozva', { ascending: true })

  const elso = ellenor?.[0]
  if (elso && elso.id !== ujLicit.id) {
    await supabase.from('licitek').delete().eq('id', ujLicit.id)
    return NextResponse.json(
      { error: 'Valaki megelőzött. Frissíts és próbáld újra.', utkozes: true },
      { status: 409 }
    )
  }

  // ── Sniping elleni hosszabbítás ──
  let ujLejarat: string | null = null
  if (projekt.lejarat) {
    const hatra = (new Date(projekt.lejarat).getTime() - Date.now()) / 1000
    if (hatra > 0 && hatra < HOSSZABBITAS_ABLAK_MP) {
      ujLejarat = new Date(Date.now() + HOSSZABBITAS_MP * 1000).toISOString()
      await supabase.from('projektek').update({ lejarat: ujLejarat }).eq('id', projekt_id)
    }
  }

  // ── Túllicitált értesítése, vagy az ő automata ellenlicitje ──
  if (topLicit && topLicit.user_id !== user_id) {
    const prevProxy = topLicit.proxy_max
    if (prevProxy && prevProxy > valodiBid) {
      const ellen = Math.min(prevProxy, valodiBid + minIncrement(valodiBid))
      const prevAnonNev = await getNapiAnonNev(supabase, topLicit.user_id, 'vevo')
      await supabase.from('licitek').insert([{
        projekt_id,
        user_id: topLicit.user_id,
        osszeg: ellen,
        proxy_max: prevProxy,
        auto_bid: true,
        anon_nev: prevAnonNev,
      }])
    } else {
      const { data: { user: prevUser } } = await supabase.auth.admin.getUserById(topLicit.user_id)
      if (prevUser?.email) {
        const { subject, html } = outbidEmail(
          projekt.nev, valodiBid,
          `${process.env.NEXT_PUBLIC_BASE_URL}/project/${projekt_id}`
        )
        await sendEmail(prevUser.email, subject, html).catch(() => {})
      }
    }
  }

  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bid-notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-belso-kulcs': process.env.CRON_SECRET ?? '' },
    body: JSON.stringify({ projekt_id, osszeg: valodiBid }),
  }).catch(() => {})

  const elertReserve = projekt.reserve_ar == null || valodiBid >= projekt.reserve_ar

  return NextResponse.json({ ok: true, osszeg: valodiBid, ujLejarat, elertReserve })
}
