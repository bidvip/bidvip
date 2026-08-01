import { createClient } from '@supabase/supabase-js'

/**
 * Indulás előtti mód.
 *
 * A platform addig nem indítja el az első aukciót, amíg össze nem gyűlik
 * egy kritikus tömegű érdeklődő. Addig a beküldött ötletek a `varakozas`
 * sorban állnak, és csak anonimizálva látszanak — hogy ne lehessen őket
 * vétel nélkül lemásolni, vagy a platformot megkerülve megszerezni.
 *
 * Ez az egyetlen hely ahol a küszöb definiálva van. Ha máshol is kell,
 * innen importáld — ne írd újra.
 */
export const INDULAS_KUSZOB = 2000

let gyorsitotar: { ertek: boolean; lejar: number } | null = null
const GYORSITOTAR_MS = 60_000

/**
 * Szerveroldali ellenőrzés: elindult-e már a platform.
 * Service role kulcsot használ, ezért kizárólag szerveren hívható.
 */
export async function elindult(): Promise<boolean> {
  if (gyorsitotar && Date.now() < gyorsitotar.lejar) return gyorsitotar.ertek

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const kulcs = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !kulcs) return false

  const supabase = createClient(url, kulcs)
  const { count, error } = await supabase
    .from('feliratkozok')
    .select('*', { count: 'exact', head: true })

  // Hiba esetén az óvatos válasz a "még nem indult el" — így nem élesedik
  // véletlenül aukció egy átmeneti adatbázishiba miatt.
  if (error) return false

  const ertek = (count ?? 0) >= INDULAS_KUSZOB
  gyorsitotar = { ertek, lejar: Date.now() + GYORSITOTAR_MS }
  return ertek
}

/** Csak teszthez / admin művelet utánra: eldobja a gyorsítótárat. */
export function indulasGyorsitotarUrit() {
  gyorsitotar = null
}
