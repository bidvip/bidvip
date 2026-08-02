/**
 * Tiszta licitlogika — se adatbázis, se hálózat, így tesztelhető.
 *
 * Azért külön modul, mert ezek a szabályok döntik el ki mennyiért nyer.
 * Ha itt elcsúszik valami, az közvetlenül pénzben mérhető.
 */

/** A licitlépcső a mindenkori legmagasabb ajánlathoz igazodik. */
export function licitLepcso(ar: number): number {
  if (ar < 500) return 25
  if (ar < 2000) return 50
  if (ar < 10000) return 100
  return 250
}

/** A legkisebb elfogadható következő licit. */
export function kovetkezoMinimum(legmagasabb: number): number {
  return legmagasabb + licitLepcso(legmagasabb)
}

export type LicitBeadas = {
  osszeg: number
  legmagasabb: number
  proxyMax?: number | null
}

export type LicitEredmeny =
  | { ok: true; osszeg: number }
  | { ok: false; hiba: 'tul_alacsony'; minimum: number }
  | { ok: false; hiba: 'ervenytelen_osszeg' }
  | { ok: false; hiba: 'proxy_kisebb_mint_licit' }

/** Eldönti, hogy egy licit elfogadható-e, és mennyi lesz a tényleges összeg. */
export function licitErtekeles({ osszeg, legmagasabb, proxyMax }: LicitBeadas): LicitEredmeny {
  if (!Number.isFinite(osszeg) || osszeg <= 0 || !Number.isInteger(osszeg)) {
    return { ok: false, hiba: 'ervenytelen_osszeg' }
  }
  if (proxyMax != null && proxyMax < osszeg) {
    return { ok: false, hiba: 'proxy_kisebb_mint_licit' }
  }

  const minimum = kovetkezoMinimum(legmagasabb)
  if (osszeg < minimum) {
    return { ok: false, hiba: 'tul_alacsony', minimum }
  }

  return { ok: true, osszeg: proxyMax ? Math.min(proxyMax, osszeg) : osszeg }
}

/**
 * Az automata ellenlicit összege: épp csak annyival lép feljebb amennyi
 * kell, de a felhasználó által megadott maximumot sosem lépi túl.
 */
export function automataEllenlicit(jelenlegi: number, proxyMax: number): number {
  return Math.min(proxyMax, jelenlegi + licitLepcso(jelenlegi))
}

/** Eléri-e a licit az eladó minimálárát. */
export function elertReserve(osszeg: number, reserve: number | null | undefined): boolean {
  return reserve == null || osszeg >= reserve
}

export const HOSSZABBITAS_ABLAK_MP = 60
export const HOSSZABBITAS_MP = 60

/**
 * Sniping elleni hosszabbítás: ha a licit az utolsó pillanatokban érkezik,
 * a többieknek is legyen idejük reagálni.
 * @returns az új lejárat, vagy null ha nem kell hosszabbítani
 */
export function hosszabbitasSzukseges(lejarat: Date | null, most: Date = new Date()): Date | null {
  if (!lejarat) return null
  const hatraMp = (lejarat.getTime() - most.getTime()) / 1000
  if (hatraMp <= 0 || hatraMp >= HOSSZABBITAS_ABLAK_MP) return null
  return new Date(most.getTime() + HOSSZABBITAS_MP * 1000)
}
