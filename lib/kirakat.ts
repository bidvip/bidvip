import { csoportjaTemanak } from './kategoriak'

/**
 * Kirakat — mit szabad megmutatni egy még aukcióra nem került ötletből.
 *
 * Ötletpiacon a legnagyobb kockázat nem a jutalék megkerülése, hanem hogy
 * valaki elolvassa a leírást és vétel nélkül megcsinálja maga. Ezért a
 * várólistán álló ötletekből soha nem látszik sem a név, sem a leírás —
 * csak annyi, amiből érdeklődés születik, de másolat nem.
 *
 * A teljes tartalom kizárólag az élő aukcióban látszik.
 */

export type KirakatElem = {
  id: string
  cimke: string          // pl. "Energia · Napenergia"
  szin: string
  erettseg: string       // Ötlet / Prototípus / Bizonyított
  arsav: string          // pl. "1 000 – 2 500 €"
  sorszam: number
}

const ERETTSEG: Record<string, string> = {
  idea: 'Ötlet',
  prototype: 'Prototípus',
  proven: 'Bizonyított',
}

/**
 * Az árat sávra kerekíti. Pontos ár nem látszik — abból az ötlet mérete
 * és jellege visszafejthető lenne.
 */
export function arsav(ar: number): string {
  if (!ar || ar <= 0) return 'Nincs megadva'
  const also = ar < 1000 ? 100 : ar < 10000 ? 500 : 2500
  const alsoHatar = Math.floor(ar / also) * also
  const felsoHatar = alsoHatar + also
  return `${alsoHatar.toLocaleString('hu-HU')} – ${felsoHatar.toLocaleString('hu-HU')} €`
}

type NyersProjekt = {
  id: string
  kategoria: string | null
  badge: string | null
  kikialtasi_ar: number | null
}

/**
 * Egyetlen belépési pont a várólista publikus megjelenítéséhez.
 * Szándékosan nem fogad `nev` és `rovid_leiras` mezőt — így fordítási
 * hiba lesz belőle, ha valaki később mégis át akarná adni őket.
 */
export function kirakatba(p: NyersProjekt, sorszam: number): KirakatElem {
  const csoport = p.kategoria ? csoportjaTemanak(p.kategoria) : null

  return {
    id: p.id,
    cimke: csoport && p.kategoria ? `${csoport.nev} · ${p.kategoria}` : (p.kategoria || 'Egyéb'),
    szin: csoport?.szin ?? '#94A3B8',
    erettseg: ERETTSEG[p.badge ?? ''] ?? 'Ötlet',
    arsav: arsav(p.kikialtasi_ar ?? 0),
    sorszam,
  }
}

/** A Supabase select-hez: pontosan ennyi mezőt szabad lekérni a kirakathoz. */
export const KIRAKAT_MEZOK = 'id, kategoria, badge, kikialtasi_ar, priority_tokens, varakozas_kezd'
