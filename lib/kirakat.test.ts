import { describe, it, expect } from 'vitest'
import { kirakatba, arsav, KIRAKAT_MEZOK } from './kirakat'

/**
 * A kirakat szerződése: a pitch nyilvános, a lényeg eladó.
 * Ezek a tesztek azt őrzik, hogy egy későbbi módosítás ne szivárogtasson
 * ki olyat, ami csak a nyertes vevőé.
 */

const nyers = {
  id: 'abc-123',
  nev: 'SolarPeak',
  rovid_leiras: 'Balkonos napelemek hozamoptimalizálása.',
  kategoria: 'Napenergia',
  badge: 'prototype',
  kikialtasi_ar: 6500,
}

describe('kirakatba — mit ad ki', () => {
  it('a nevet és a rövid leírást megmutatja', () => {
    const k = kirakatba(nyers, 1)
    expect(k.nev).toBe('SolarPeak')
    expect(k.leiras).toBe('Balkonos napelemek hozamoptimalizálása.')
  })

  it('a szakterületet a kategóriafából oldja fel', () => {
    const k = kirakatba(nyers, 1)
    expect(k.csoport).toBe('Energia')
    expect(k.tema).toBe('Napenergia')
    expect(k.cimke).toBe('Energia · Napenergia')
    expect(k.szin).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('az érettséget magyarra fordítja', () => {
    expect(kirakatba({ ...nyers, badge: 'idea' }, 1).erettseg).toBe('Ötlet')
    expect(kirakatba({ ...nyers, badge: 'prototype' }, 1).erettseg).toBe('Prototípus')
    expect(kirakatba({ ...nyers, badge: 'proven' }, 1).erettseg).toBe('Bizonyított')
  })

  it('ismeretlen kategóriánál sem dől el', () => {
    const k = kirakatba({ ...nyers, kategoria: 'Nincs ilyen téma' }, 1)
    expect(k.csoport).toBe('Egyéb')
    expect(k.szin).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('hiányzó mezőkkel sem omlik össze', () => {
    const k = kirakatba({ id: 'x', nev: null, rovid_leiras: null, kategoria: null, badge: null, kikialtasi_ar: null }, 3)
    expect(k.nev).toBe('Névtelen tétel')
    expect(k.leiras).toBe('')
    expect(k.sorszam).toBe(3)
  })
})

describe('kirakatba — mit NEM ad ki', () => {
  it('a pontos árat sosem adja vissza, csak sávot', () => {
    const k = kirakatba(nyers, 1)
    const ertekek = Object.values(k)
    expect(ertekek).not.toContain(6500)
    expect(k.arsav).toContain('–')
  })

  it('a visszaadott objektum csak az engedélyezett mezőket tartalmazza', () => {
    const k = kirakatba(nyers, 1)
    expect(Object.keys(k).sort()).toEqual(
      ['arsav', 'cimke', 'csoport', 'erettseg', 'id', 'leiras', 'nev', 'sorszam', 'szin', 'tema']
    )
  })

  it('a lekérdezendő mezők között nincs részletes leírás, fájl vagy AI-elemzés', () => {
    expect(KIRAKAT_MEZOK).not.toContain('reszletes_leiras')
    expect(KIRAKAT_MEZOK).not.toContain('fajlok')
    expect(KIRAKAT_MEZOK).not.toContain('ai_elemzes')
    expect(KIRAKAT_MEZOK).not.toContain('chat_elozmenyek')
    expect(KIRAKAT_MEZOK).not.toContain('vevo_email')
    expect(KIRAKAT_MEZOK).not.toContain('user_id')
  })
})

describe('arsav', () => {
  // Az ezres elválasztó a futtatókörnyezet területi beállításától függ,
  // ezért a pontos formátumra nem támaszkodunk — csak a jelentésre.
  it('sávot ad vissza, nem egyetlen pontos árat', () => {
    const s = arsav(6500)
    expect(s).toMatch(/–/)
    expect(s.trimEnd()).toMatch(/€$/)
  })

  it('a sáv mindig tartalmazza a valódi árat', () => {
    for (const ar of [1, 99, 100, 501, 1999, 2500, 9999, 12_345, 87_654]) {
      const s = arsav(ar)
      const szamok = s.replace(/[^\d–]/g, '').split('–').map(Number)
      expect(ar).toBeGreaterThanOrEqual(szamok[0])
      expect(ar).toBeLessThanOrEqual(szamok[1])
    }
  })

  it('nulla vagy hiányzó árnál nem talál ki számot', () => {
    expect(arsav(0)).toBe('Nincs megadva')
  })
})
