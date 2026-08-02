import type { Metadata } from 'next'
import JogiOldal, { Szakasz } from '@/app/components/JogiOldal'

export const metadata: Metadata = {
  title: 'ÁSZF — BidVip',
  description: 'A BidVip aukciós piactér általános szerződési feltételei.',
}

export default function Aszf() {
  return (
    <JogiOldal cim="Általános Szerződési Feltételek" frissitve="2026. augusztus 2.">

      <Szakasz cim="1. A szolgáltatás">
        <p>
          A BidVip online piactér, ahol a felhasználók üzleti ötleteket, koncepciókat,
          prototípusokat és kész digitális termékeket bocsáthatnak árverésre, illetve
          licitálhatnak ezekre. A BidVip a felek közötti ügylet közvetítője; nem tulajdonosa
          és nem eladója a meghirdetett tételeknek.
        </p>
        <p>
          A szolgáltatás használatához regisztráció szükséges. Regisztrálni 18. életévét
          betöltött, cselekvőképes természetes személy vagy jogi személy képviselője jogosult.
        </p>
      </Szakasz>

      <Szakasz cim="2. Tételek beküldése">
        <p>
          A beküldő szavatolja, hogy a beküldött tétel a saját szellemi alkotása, vagy
          jogosult annak értékesítésére, és az nem sérti harmadik fél jogait.
        </p>
        <p>
          Minden beküldött tétel automatikus tartalom-ellenőrzésen esik át. Elutasításra kerül
          a fegyverrel, kábítószerrel, csalással, illegális szolgáltatással, gyűlöletkeltéssel
          vagy más jogsértő tevékenységgel kapcsolatos tartalom. A BidVip fenntartja a jogot,
          hogy indoklás mellett bármely tételt elutasítson vagy eltávolítson.
        </p>
        <p>
          A beküldött tétel a jóváhagyást követően várólistára kerül, majd onnan kerül
          árverésre. A várólistán álló tételekből nyilvánosan csak a megnevezés, a rövid
          leírás, a szakterület, az érettségi szint és egy ársáv látszik. A részletes
          kifejtést, a feltöltött dokumentumokat és fájlokat kizárólag a nyertes vevő kapja meg.
        </p>
      </Szakasz>

      <Szakasz cim="3. Az árverés menete">
        <p>
          Az árverés időkorlátos. A licitek nyilvánosak, de a licitálók álnéven jelennek meg.
          A licit visszavonhatatlan kötelezettségvállalás.
        </p>
        <p>
          A licitlépcső a mindenkori legmagasabb ajánlathoz igazodik. Ha a licit az árverés
          utolsó percében érkezik, a lejárat automatikusan meghosszabbodik, hogy a többi
          résztvevőnek is legyen ideje reagálni.
        </p>
        <p>
          Ha az eladó minimálárat határozott meg, és a záró licit nem éri el azt, a tétel
          nem kel el.
        </p>
      </Szakasz>

      <Szakasz cim="4. Fizetés és átadás">
        <p>
          Az árverés lezárultával a nyertes e-mailben fizetési linket kap. A fizetés a Stripe
          fizetési szolgáltatón keresztül történik; a BidVip bankkártyaadatot nem lát és nem tárol.
        </p>
        <p>
          A fizetés beérkezését követően a vevő megkapja a tétel részletes leírását és a
          hozzá tartozó fájlokat. Az eladó a végösszeg 90%-ára jogosult; a fennmaradó 10% a
          BidVip közvetítői díja. A kifizetés a fizetés beérkezését követően történik.
        </p>
        <p>
          Ha a nyertes a megadott határidőn belül nem fizet, a BidVip jogosult az ügyletet
          érvénytelennek tekinteni, és a tételt ismét árverésre bocsátani.
        </p>
      </Szakasz>

      <Szakasz cim="5. Díjak">
        <p>
          A regisztráció, a böngészés és a licitálás díjmentes. Sikeres eladás esetén a
          BidVip a végösszeg 10%-át számítja fel az eladónak. Ha a tétel nem kel el, díj
          nem merül fel.
        </p>
        <p>
          Egyes kiegészítő szolgáltatások (AI-elemzés, várólistán előrébb sorolás) tokennel
          fizetendők. A tokenek nem válthatók vissza készpénzre.
        </p>
      </Szakasz>

      <Szakasz cim="6. Tiltott magatartás">
        <p>
          Tilos: más nevében licitálni, az árat mesterségesen felhajtani, a platformot
          megkerülve a másik féllel közvetlenül üzletet kötni a közvetítői díj elkerülése
          végett, más felhasználó adatait gyűjteni, valamint a szolgáltatás működését
          automatizált eszközökkel zavarni.
        </p>
        <p>
          A szabályok megsértése a fiók felfüggesztését vagy végleges letiltását vonhatja
          maga után.
        </p>
      </Szakasz>

      <Szakasz cim="7. Bejelentés és jogorvoslat">
        <p>
          Bármely felhasználó bejelentheti a jogsértő vagy megtévesztő tartalmat a
          tétel oldalán található bejelentő funkcióval. A bejelentéseket a BidVip
          megvizsgálja, és indokolt esetben eltávolítja a tartalmat.
        </p>
        <p>
          Ha a felhasználó úgy véli, hogy tételét indokolatlanul távolították el vagy fiókját
          jogtalanul függesztették fel, panasszal élhet a lenti elérhetőségen. A BidVip a
          panaszt megvizsgálja és indokolt választ ad.
        </p>
      </Szakasz>

      <Szakasz cim="8. Felelősség">
        <p>
          A BidVip nem szavatolja a meghirdetett ötletek üzleti sikerét, megvalósíthatóságát
          vagy jövedelmezőségét. Az AI által készített elemzés és értékbecslés tájékoztató
          jellegű, nem minősül befektetési tanácsadásnak.
        </p>
        <p>
          A BidVip nem felel a felhasználók egymással szemben vállalt kötelezettségeinek
          teljesítéséért, azon túl, amit jelen feltételek kifejezetten rögzítenek.
        </p>
      </Szakasz>

      <Szakasz cim="9. A feltételek módosítása">
        <p>
          A BidVip jogosult jelen feltételeket módosítani. A módosításról a felhasználókat
          e-mailben vagy a felületen tájékoztatja, a hatálybalépés előtt legalább 15 nappal.
          A szolgáltatás további használata a módosítás elfogadását jelenti.
        </p>
      </Szakasz>

      <Szakasz cim="10. Kapcsolat">
        <p>
          Kérdés, panasz vagy jogi megkeresés: <span style={{ color: 'var(--v-lila-2)' }}>info.webbloki@gmail.com</span>
        </p>
      </Szakasz>

    </JogiOldal>
  )
}
