import { csoportjaTemanak } from './kategoriak'

/**
 * Kirakat — mit szabad megmutatni egy még aukcióra nem került ötletből.
 *
 * A határ: a pitch nyilvános, a lényeg eladó.
 *
 * Látszik  — a tétel neve és az egymondatos leírás. Ebből a vevő eldönti,
 *            hogy érdekli-e, és tud rá készülni az aukcióra.
 * Nem látszik — a részletes kifejtés, a feltöltött fájlok, a dokumentumok,
 *            az AI-elemzés és a pontos kikiáltási ár. Ezek adják az ötlet
 *            tényleges megvalósíthatóságát, és kizárólag a nyertes vevő
 *            kapja meg őket az átadás részeként.
 */

export type KirakatElem = {
  id: string
  nev: string
  leiras: string
  cimke: string          // pl. "Energia · Napenergia"
  csoport: string
  tema: string
  szin: string
  erettseg: string       // Ötlet / Prototípus / Bizonyított
  arsav: string          // pl. "6 500 – 7 000 €"
  sorszam: number
}

const ERETTSEG: Record<string, string> = {
  idea: 'Ötlet',
  prototype: 'Prototípus',
  proven: 'Bizonyított',
}

/**
 * Az árat sávra kerekíti. A pontos kikiáltási ár nem publikus — abból a
 * licitálók egymás mozgásterét tudnák kiszámolni az aukció előtt.
 */
export function arsav(ar: number): string {
  if (!ar || ar <= 0) return 'Nincs megadva'
  const lepcso = ar < 1000 ? 100 : ar < 10000 ? 500 : 2500
  const also = Math.floor(ar / lepcso) * lepcso
  return `${also.toLocaleString('hu-HU')} – ${(also + lepcso).toLocaleString('hu-HU')} €`
}

type NyersProjekt = {
  id: string
  nev: string | null
  rovid_leiras: string | null
  kategoria: string | null
  badge: string | null
  kikialtasi_ar: number | null
}

/**
 * Egyetlen belépési pont a várólista publikus megjelenítéséhez.
 *
 * Szándékosan nem fogad `reszletes_leiras`, `fajlok` és `ai_elemzes`
 * mezőt — ha valaki később mégis átadná őket, fordítási hiba lesz belőle,
 * nem csendes adatszivárgás.
 */
export function kirakatba(p: NyersProjekt, sorszam: number): KirakatElem {
  const csoport = p.kategoria ? csoportjaTemanak(p.kategoria) : null
  const tema = p.kategoria || 'Egyéb'

  return {
    id: p.id,
    nev: p.nev || 'Névtelen tétel',
    leiras: p.rovid_leiras || '',
    cimke: csoport ? `${csoport.nev} · ${tema}` : tema,
    csoport: csoport?.nev ?? 'Egyéb',
    tema,
    szin: csoport?.szin ?? '#94A3B8',
    erettseg: ERETTSEG[p.badge ?? ''] ?? 'Ötlet',
    arsav: arsav(p.kikialtasi_ar ?? 0),
    sorszam,
  }
}

/** A Supabase select-hez: pontosan ennyi mezőt szabad lekérni a kirakathoz. */
export const KIRAKAT_MEZOK = 'id, nev, rovid_leiras, kategoria, badge, kikialtasi_ar, priority_tokens, varakozas_kezd'
