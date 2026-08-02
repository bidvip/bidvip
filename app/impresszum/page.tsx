import type { Metadata } from 'next'
import JogiOldal, { Szakasz } from '@/app/components/JogiOldal'

export const metadata: Metadata = {
  title: 'Impresszum',
  description: 'A BidVip üzemeltetőjének adatai és elérhetőségei.',
}

/**
 * Az impresszum kötelező tartalmát az elektronikus kereskedelmi törvény
 * írja elő. A KITÖLTENDŐ helyekre a tényleges cégadatok kerülnek —
 * hiányosan közzétenni kockázatosabb, mint egyáltalán nem.
 */
export default function Impresszum() {
  return (
    <JogiOldal cim="Impresszum" frissitve="2026. augusztus 2.">

      <Szakasz cim="A szolgáltató adatai">
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Név / Cégnév:</strong> [KITÖLTENDŐ]</p>
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Székhely:</strong> [KITÖLTENDŐ]</p>
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Adószám:</strong> [KITÖLTENDŐ]</p>
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Nyilvántartási / cégjegyzékszám:</strong> [KITÖLTENDŐ]</p>
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Nyilvántartó hatóság:</strong> [KITÖLTENDŐ]</p>
      </Szakasz>

      <Szakasz cim="Kapcsolat">
        <p><strong style={{ color: 'var(--v-szoveg)' }}>E-mail:</strong> info.webbloki@gmail.com</p>
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Telefon:</strong> [KITÖLTENDŐ]</p>
        <p>
          Panaszt vagy jogi megkeresést az e-mail címen fogadunk. A beérkezéstől
          számított 30 napon belül érdemi választ adunk.
        </p>
      </Szakasz>

      <Szakasz cim="Tárhelyszolgáltató">
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, USA · vercel.com</p>
        <p><strong style={{ color: 'var(--v-szoveg)' }}>Supabase Inc.</strong> (adatbázis) — supabase.com</p>
      </Szakasz>

      <Szakasz cim="Vitarendezés">
        <p>
          Fogyasztói jogvita esetén a lakóhely szerint illetékes békéltető testülethez
          fordulhatsz. Az Európai Bizottság online vitarendezési platformja:
          ec.europa.eu/odr
        </p>
      </Szakasz>

      <Szakasz cim="Kapcsolódó dokumentumok">
        <p>
          <a href="/aszf" style={{ color: 'var(--v-lila-2)' }}>Általános Szerződési Feltételek</a>
          {' · '}
          <a href="/adatvedelem" style={{ color: 'var(--v-lila-2)' }}>Adatvédelmi tájékoztató</a>
        </p>
      </Szakasz>

    </JogiOldal>
  )
}
