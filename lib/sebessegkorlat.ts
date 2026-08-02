import { NextResponse } from 'next/server'

/**
 * Egyszerű csúszóablakos sebességkorlát.
 *
 * Miért: az AI-végpontok a te Anthropic-kulcsodat használják, tehát minden
 * hívásnak valós pénzköltsége van. Hitelesítés nélkül egy futó szkript
 * órák alatt elégetné a keretet („költségkimerítéses támadás").
 *
 * Korlát: a számláló a futó példány memóriájában él. Szerver nélküli
 * környezetben több példány is futhat egyszerre, így a tényleges határ
 * a példányok számával szorzódik. Ez nem pontos kvóta, hanem vészfék —
 * a futószalag-szerű visszaélést megfogja. Pontos, elosztott kvótához
 * külső tároló kell (pl. Upstash Redis), az a következő lépés.
 */

type Bejegyzes = { idok: number[] }
const tarolo = new Map<string, Bejegyzes>()

// Nehogy a memória korlátlanul nőjön
const MAX_KULCS = 5000

export type KorlatBeallitas = {
  /** Hány hívás engedélyezett az ablakban */
  hivas: number
  /** Az ablak hossza másodpercben */
  ablakMp: number
}

export const AI_KORLAT: KorlatBeallitas = { hivas: 20, ablakMp: 60 }
export const AI_NAPI_KORLAT: KorlatBeallitas = { hivas: 200, ablakMp: 86_400 }

/**
 * Megvizsgálja, belefér-e még egy hívás. Ha igen, beszámolja.
 * @returns null ha átmehet, különben kész 429-es válasz
 */
export function korlatEllenoriz(kulcs: string, b: KorlatBeallitas): NextResponse | null {
  const most = Date.now()
  const ablak = b.ablakMp * 1000

  if (tarolo.size > MAX_KULCS) tarolo.clear()

  const be = tarolo.get(kulcs) ?? { idok: [] }
  // Az ablakon kívül esett hívások elhagyása
  be.idok = be.idok.filter(t => most - t < ablak)

  if (be.idok.length >= b.hivas) {
    const legregebbi = be.idok[0]
    const varakozas = Math.ceil((ablak - (most - legregebbi)) / 1000)
    tarolo.set(kulcs, be)
    return NextResponse.json(
      { error: 'Túl sok kérés. Próbáld újra kicsit később.', ujraMp: varakozas },
      { status: 429, headers: { 'Retry-After': String(varakozas) } }
    )
  }

  be.idok.push(most)
  tarolo.set(kulcs, be)
  return null
}

/** Az AI-végpontok közös korlátja: perces és napi kereten is átmegy. */
export function aiKorlat(userId: string): NextResponse | null {
  return korlatEllenoriz(`ai:perc:${userId}`, AI_KORLAT)
      ?? korlatEllenoriz(`ai:nap:${userId}`, AI_NAPI_KORLAT)
}
