import { describe, it, expect } from 'vitest'
import {
  licitLepcso, kovetkezoMinimum, licitErtekeles,
  automataEllenlicit, elertReserve, hosszabbitasSzukseges,
} from './licit-logika'

describe('licitLepcso', () => {
  it('a sávhatárok alatt a kisebb lépcsőt adja', () => {
    expect(licitLepcso(0)).toBe(25)
    expect(licitLepcso(499)).toBe(25)
    expect(licitLepcso(1999)).toBe(50)
    expect(licitLepcso(9999)).toBe(100)
  })

  it('a sávhatáron már a nagyobb lépcső érvényes', () => {
    expect(licitLepcso(500)).toBe(50)
    expect(licitLepcso(2000)).toBe(100)
    expect(licitLepcso(10000)).toBe(250)
  })

  it('nagy összegnél is véges és pozitív', () => {
    expect(licitLepcso(5_000_000)).toBe(250)
  })
})

describe('kovetkezoMinimum', () => {
  it('a legmagasabb ajánlat fölé lép egy lépcsővel', () => {
    expect(kovetkezoMinimum(100)).toBe(125)
    expect(kovetkezoMinimum(500)).toBe(550)
    expect(kovetkezoMinimum(10000)).toBe(10250)
  })
})

describe('licitErtekeles', () => {
  it('elfogadja a pontosan minimumot elérő licitet', () => {
    const e = licitErtekeles({ osszeg: 125, legmagasabb: 100 })
    expect(e).toEqual({ ok: true, osszeg: 125 })
  })

  it('elutasítja az eggyel a minimum alattit', () => {
    const e = licitErtekeles({ osszeg: 124, legmagasabb: 100 })
    expect(e).toEqual({ ok: false, hiba: 'tul_alacsony', minimum: 125 })
  })

  it('elutasítja a nullát és a negatívat', () => {
    expect(licitErtekeles({ osszeg: 0, legmagasabb: 100 }).ok).toBe(false)
    expect(licitErtekeles({ osszeg: -500, legmagasabb: 100 }).ok).toBe(false)
  })

  it('elutasítja a törtszámot', () => {
    const e = licitErtekeles({ osszeg: 125.5, legmagasabb: 100 })
    expect(e).toEqual({ ok: false, hiba: 'ervenytelen_osszeg' })
  })

  it('elutasítja a NaN-t és a végtelent', () => {
    expect(licitErtekeles({ osszeg: NaN, legmagasabb: 100 }).ok).toBe(false)
    expect(licitErtekeles({ osszeg: Infinity, legmagasabb: 100 }).ok).toBe(false)
  })

  it('nem engedi a licitnél kisebb proxy maximumot', () => {
    const e = licitErtekeles({ osszeg: 500, legmagasabb: 100, proxyMax: 300 })
    expect(e).toEqual({ ok: false, hiba: 'proxy_kisebb_mint_licit' })
  })

  it('a proxy maximum nem emeli meg a leadott összeget', () => {
    const e = licitErtekeles({ osszeg: 125, legmagasabb: 100, proxyMax: 10_000 })
    expect(e).toEqual({ ok: true, osszeg: 125 })
  })
})

describe('automataEllenlicit', () => {
  it('csak egy lépcsővel lép feljebb', () => {
    expect(automataEllenlicit(100, 10_000)).toBe(125)
  })

  it('sosem lépi túl a megadott maximumot', () => {
    expect(automataEllenlicit(100, 110)).toBe(110)
  })

  it('a maximumon megáll, nem megy fölé', () => {
    expect(automataEllenlicit(1000, 1000)).toBe(1000)
  })
})

describe('elertReserve', () => {
  it('minimálár nélkül minden licit elfogadott', () => {
    expect(elertReserve(1, null)).toBe(true)
    expect(elertReserve(1, undefined)).toBe(true)
  })

  it('a minimálár alatti licit nem éri el', () => {
    expect(elertReserve(999, 1000)).toBe(false)
  })

  it('a pontosan minimálárat elérő licit megfelel', () => {
    expect(elertReserve(1000, 1000)).toBe(true)
  })
})

describe('hosszabbitasSzukseges', () => {
  const most = new Date('2026-01-01T12:00:00Z')

  it('nem hosszabbít, ha még bőven van idő', () => {
    const lejarat = new Date(most.getTime() + 5 * 60_000)
    expect(hosszabbitasSzukseges(lejarat, most)).toBeNull()
  })

  it('hosszabbít, ha az utolsó percben érkezik a licit', () => {
    const lejarat = new Date(most.getTime() + 10_000)
    const uj = hosszabbitasSzukseges(lejarat, most)
    expect(uj).not.toBeNull()
    expect(uj!.getTime()).toBe(most.getTime() + 60_000)
  })

  it('a hosszabbítás mindig későbbre tolja a lejáratot', () => {
    const lejarat = new Date(most.getTime() + 59_000)
    const uj = hosszabbitasSzukseges(lejarat, most)!
    expect(uj.getTime()).toBeGreaterThan(lejarat.getTime())
  })

  it('nem hosszabbít már lejárt aukciót', () => {
    const lejarat = new Date(most.getTime() - 1000)
    expect(hosszabbitasSzukseges(lejarat, most)).toBeNull()
  })

  it('lejárat nélkül nem csinál semmit', () => {
    expect(hosszabbitasSzukseges(null, most)).toBeNull()
  })
})
