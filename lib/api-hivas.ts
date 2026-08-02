import { createClient } from './supabase-browser'

/**
 * Hitelesített hívás a saját végpontjainkhoz.
 *
 * A végpontok a munkamenetből azonosítják a hívót, nem a kérés törzséből.
 * Ez a segéd mellékeli az aktuális hozzáférési tokent, így a böngészőből
 * indított hívások átmennek a jogosultság-ellenőrzésen.
 *
 * A `user_id` mezőt szándékosan nem küldjük többé sehol — a szerver a
 * munkamenetből veszi. Ha mégis elküldenénk, a szerver figyelmen kívül hagyja.
 */
export async function apiHivas(ut: string, opciok: RequestInit = {}): Promise<Response> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const fejlecek = new Headers(opciok.headers)
  if (token) fejlecek.set('Authorization', `Bearer ${token}`)
  if (!(opciok.body instanceof FormData) && !fejlecek.has('Content-Type')) {
    fejlecek.set('Content-Type', 'application/json')
  }

  return fetch(ut, { ...opciok, headers: fejlecek })
}

/** Kényelmi változat JSON törzzsel. */
export async function apiPost(ut: string, torzs?: unknown): Promise<Response> {
  return apiHivas(ut, {
    method: 'POST',
    body: torzs === undefined ? undefined : JSON.stringify(torzs),
  })
}
