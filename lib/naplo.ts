/**
 * Központi hibanaplózás.
 *
 * Miért kell: a kódban több helyen `.catch(() => {})` állt, ami csendben
 * lenyelte a hibát. A legrosszabb helyeken — az e-mail küldésnél — ez azt
 * jelentette, hogy ha a nyertes nem kapta meg a fizetési linket, arról
 * senki nem szerzett tudomást.
 *
 * Egyetlen belépési pont, hogy a hibakövető (Sentry) bekötésekor elég
 * legyen itt egy sort hozzáadni.
 */

type Mezok = Record<string, unknown>

function idobelyeg() {
  return new Date().toISOString()
}

/** Hiba, amiről tudni kell, de nem állítja meg a folyamatot. */
export function naploHiba(hol: string, hiba: unknown, mezok: Mezok = {}) {
  const uzenet = hiba instanceof Error ? hiba.message : String(hiba)
  console.error(`[${idobelyeg()}] HIBA ${hol}: ${uzenet}`, mezok)

  // Ide kerül majd a Sentry:
  // Sentry.captureException(hiba, { tags: { hol }, extra: mezok })
}

/** Figyelmeztetés: nem hiba, de gyanús vagy elmaradt művelet. */
export function naploFigyelem(hol: string, uzenet: string, mezok: Mezok = {}) {
  console.warn(`[${idobelyeg()}] FIGYELEM ${hol}: ${uzenet}`, mezok)
}

/**
 * Elvégez egy műveletet, és ha elhasal, naplóz — de nem dobja tovább.
 *
 * Ott használjuk, ahol a hiba nem indokolja a folyamat megszakítását
 * (pl. egy értesítő levél), de tudni akarunk róla.
 */
export async function biztonsagosan<T>(
  hol: string,
  muvelet: () => Promise<T>,
  mezok: Mezok = {}
): Promise<T | null> {
  try {
    return await muvelet()
  } catch (hiba) {
    naploHiba(hol, hiba, mezok)
    return null
  }
}
