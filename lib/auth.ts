import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

/**
 * Jogosultság-ellenőrzés a végpontokhoz.
 *
 * Miért kell: minden végpont a service role kulcsot használja, ami megkerüli
 * az adatbázis sorszintű védelmét (RLS). Ilyenkor az egyetlen védelem az,
 * hogy a végpont maga ellenőrzi ki hívja. A `user_id`-t soha nem szabad a
 * kérés törzséből elfogadni — azt a hívó szabadon írja át.
 */

export const ADMIN_EMAIL = 'info.webbloki@gmail.com'

/** Service role kliens — csak azután használd, hogy a hívót azonosítottad. */
export function szolgaltatasKliens(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Kiolvassa a bejelentkezett felhasználót.
 *
 * Két utat fogad el:
 *  1. `Authorization: Bearer <access_token>` — böngészőből indított fetch
 *  2. munkamenet-süti — azonos eredetű szerveroldali hívás
 *
 * Mindkettőt a Supabase ellenőrzi, tehát nem hamisítható.
 */
export async function bejelentkezettFelhasznalo(req: NextRequest): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // 1. Bearer token
  const fejlec = req.headers.get('authorization')
  if (fejlec?.startsWith('Bearer ')) {
    const token = fejlec.slice(7).trim()
    if (token) {
      const kliens = createClient(url, anon)
      const { data, error } = await kliens.auth.getUser(token)
      if (!error && data.user) return data.user
    }
  }

  // 2. Süti alapú munkamenet
  try {
    const sutik = await cookies()
    const kliens = createServerClient(url, anon, {
      cookies: {
        getAll: () => sutik.getAll(),
        setAll: () => { /* végpontban nem írunk sütit */ },
      },
    })
    const { data, error } = await kliens.auth.getUser()
    if (!error && data.user) return data.user
  } catch {
    // a cookies() bizonyos futtatókörnyezetben nem elérhető — ilyenkor
    // csak a Bearer út marad, ez nem hiba
  }

  return null
}

export type Orzott = { user: User; supabase: SupabaseClient }

/**
 * Beléptet egy végpontot. Ha nincs érvényes munkamenet, 401-et ad vissza.
 *
 * Használat:
 *   const v = await megkovetelBejelentkezes(req)
 *   if (v instanceof NextResponse) return v
 *   const { user, supabase } = v
 */
export async function megkovetelBejelentkezes(req: NextRequest): Promise<Orzott | NextResponse> {
  const user = await bejelentkezettFelhasznalo(req)
  if (!user) {
    return NextResponse.json({ error: 'Bejelentkezés szükséges' }, { status: 401 })
  }
  return { user, supabase: szolgaltatasKliens() }
}

/** Ugyanaz, de csak az adminnak engedi át. */
export async function megkovetelAdmin(req: NextRequest): Promise<Orzott | NextResponse> {
  const user = await bejelentkezettFelhasznalo(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })
  }
  return { user, supabase: szolgaltatasKliens() }
}
