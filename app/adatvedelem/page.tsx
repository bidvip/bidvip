import type { Metadata } from 'next'
import JogiOldal, { Szakasz } from '@/app/components/JogiOldal'

export const metadata: Metadata = {
  title: 'Adatvédelmi tájékoztató — BidVip',
  description: 'Hogyan kezeli a BidVip a felhasználók személyes adatait.',
}

export default function Adatvedelem() {
  return (
    <JogiOldal cim="Adatvédelmi tájékoztató" frissitve="2026. augusztus 2.">

      <Szakasz cim="1. Milyen adatokat kezelünk">
        <p>
          <strong style={{ color: 'var(--v-szoveg)' }}>Regisztrációkor:</strong> e-mail cím
          és jelszó. A jelszót nem mi tároljuk, hanem a Supabase hitelesítési szolgáltatás,
          titkosítva.
        </p>
        <p>
          <strong style={{ color: 'var(--v-szoveg)' }}>Használat során:</strong> a beküldött
          tételek tartalma és a feltöltött fájlok, a leadott licitek, a token-egyenleg,
          valamint az AI-mentorral folytatott beszélgetés.
        </p>
        <p>
          <strong style={{ color: 'var(--v-szoveg)' }}>Bejelentés esetén:</strong> a
          bejelentés időpontja, IP-cím és böngészőazonosító — visszaélés kivizsgálása céljából.
        </p>
        <p>
          <strong style={{ color: 'var(--v-szoveg)' }}>Hírlevélre feliratkozáskor:</strong> e-mail cím.
        </p>
      </Szakasz>

      <Szakasz cim="2. Miért kezeljük">
        <p>
          A szolgáltatás nyújtásához (szerződés teljesítése): fiókkezelés, az árverés
          lebonyolítása, fizetés, értesítések küldése.
        </p>
        <p>
          Jogos érdek alapján: visszaélések és csalás megelőzése, a platform biztonsága,
          jogsértő tartalom kiszűrése.
        </p>
        <p>
          Hozzájárulás alapján: hírlevél és indulási értesítő küldése. Ez bármikor
          visszavonható a levelek alján található leiratkozó linkkel.
        </p>
      </Szakasz>

      <Szakasz cim="3. Kikkel osztjuk meg">
        <p>
          Csak a működéshez szükséges szolgáltatókkal, adatfeldolgozói szerződés alapján:
        </p>
        <p>
          <strong style={{ color: 'var(--v-szoveg)' }}>Supabase</strong> — adatbázis és
          hitelesítés. <strong style={{ color: 'var(--v-szoveg)' }}>Vercel</strong> —
          a weboldal futtatása. <strong style={{ color: 'var(--v-szoveg)' }}>Stripe</strong> —
          fizetés feldolgozása. <strong style={{ color: 'var(--v-szoveg)' }}>Resend</strong> —
          e-mailek kézbesítése. <strong style={{ color: 'var(--v-szoveg)' }}>Anthropic</strong> —
          a beküldött tétel szövegének AI-elemzése.
        </p>
        <p>
          Sikeres eladás esetén a vevő e-mail címét megosztjuk az eladóval, és fordítva —
          az átadás lebonyolítása érdekében. Ezt megelőzően mindkét fél álnéven szerepel.
        </p>
      </Szakasz>

      <Szakasz cim="4. Meddig őrizzük">
        <p>
          A fiókadatokat a fiók fennállásáig, majd törlési kérelem esetén 30 napon belül
          töröljük. A lezárult ügyletek számviteli bizonylatait a jogszabályi kötelezettség
          szerinti ideig megőrizzük. A bejelentésekhez tartozó naplóadatokat legfeljebb
          12 hónapig tároljuk.
        </p>
      </Szakasz>

      <Szakasz cim="5. Milyen jogaid vannak">
        <p>
          Kérheted a rólad tárolt adatok másolatát, helyesbítését vagy törlését, tiltakozhatsz
          a kezelés ellen, és kérheted az adatok hordozható formátumban való kiadását.
          A hozzájárulás bármikor visszavonható.
        </p>
        <p>
          Kérésedet az alábbi címre küldheted; 30 napon belül válaszolunk. Ha nem vagy
          elégedett, panasszal élhetsz a Nemzeti Adatvédelmi és Információszabadság
          Hatóságnál (naih.hu).
        </p>
      </Szakasz>

      <Szakasz cim="6. Sütik">
        <p>
          Csak a működéshez elengedhetetlen sütiket használunk: ezek tartják fenn a
          bejelentkezett munkamenetet. Követő- vagy hirdetési sütit nem helyezünk el,
          és harmadik fél analitikáját nem futtatjuk.
        </p>
      </Szakasz>

      <Szakasz cim="7. Kapcsolat">
        <p>
          Adatvédelmi kérdések: <span style={{ color: 'var(--v-lila-2)' }}>info.webbloki@gmail.com</span>
        </p>
      </Szakasz>

    </JogiOldal>
  )
}
