import { describe, it, expect } from 'vitest'
import {
  KATEGORIA_FA, OSSZES_TEMA, keressTemat,
  csoportjaTemanak, szakertoiKontextus,
} from './kategoriak'

describe('kategóriafa épsége', () => {
  it('minden csoportnak van neve, színe és legalább egy témája', () => {
    for (const cs of KATEGORIA_FA) {
      expect(cs.nev.length).toBeGreaterThan(0)
      expect(cs.szin).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(cs.temak.length).toBeGreaterThan(0)
    }
  })

  it('nincs két azonos nevű csoport', () => {
    const nevek = KATEGORIA_FA.map(c => c.nev)
    expect(new Set(nevek).size).toBe(nevek.length)
  })

  it('egy téma sem szerepel két csoportban', () => {
    const mind = OSSZES_TEMA.map(t => t.nev)
    const duplak = mind.filter((t, i) => mind.indexOf(t) !== i)
    expect(duplak).toEqual([])
  })

  it('nincs üres vagy szóközzel kezdődő témanév', () => {
    for (const t of OSSZES_TEMA) {
      expect(t.nev).toBe(t.nev.trim())
      expect(t.nev.length).toBeGreaterThan(1)
    }
  })
})

describe('keressTemat', () => {
  it('üres keresésre mindent visszaad', () => {
    expect(keressTemat('').length).toBe(OSSZES_TEMA.length)
  })

  it('kis- és nagybetűre egyaránt talál', () => {
    expect(keressTemat('napenergia').length).toBeGreaterThan(0)
    expect(keressTemat('NAPENERGIA').length).toBeGreaterThan(0)
  })

  it('csoportnévre is keres, nemcsak témanévre', () => {
    const t = keressTemat('Energia')
    expect(t.some(x => x.csoport === 'Energia')).toBe(true)
  })

  it('értelmetlen keresésre üres listát ad, nem hibázik', () => {
    expect(keressTemat('qqqzzzxxx')).toEqual([])
  })
})

describe('csoportjaTemanak', () => {
  it('megtalálja a téma csoportját', () => {
    expect(csoportjaTemanak('Napenergia')?.nev).toBe('Energia')
  })

  it('ismeretlen témára null-t ad, nem dob hibát', () => {
    expect(csoportjaTemanak('Nincs ilyen')).toBeNull()
  })
})

describe('szakertoiKontextus', () => {
  it('ismert témánál megnevezi a szakterületet', () => {
    const k = szakertoiKontextus('Napenergia')
    expect(k).toContain('Energia')
    expect(k).toContain('Napenergia')
  })

  it('felsorolja a szomszédos területeket is', () => {
    const k = szakertoiKontextus('Napenergia')
    expect(k).toContain('Szélenergia')
  })

  it('ismeretlen témánál sem üres, de rövidebb', () => {
    const ismeretlen = szakertoiKontextus('Valami furcsa')
    expect(ismeretlen).toContain('Valami furcsa')
    expect(ismeretlen.length).toBeLessThan(szakertoiKontextus('Napenergia').length)
  })

  it('üres bemenetre üres szöveget ad', () => {
    expect(szakertoiKontextus('')).toBe('')
  })
})
