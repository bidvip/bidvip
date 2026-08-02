# Saját domain beállítása

A kód **teljesen elő van készítve**. Nincs benne egyetlen beégetett cím sem —
minden a `lib/beallitasok.ts` modulból jön, ami két környezeti változót olvas.
Ha ezeket beállítod, az egész oldal magától átáll: linkek, e-mailek, sitemap,
Stripe visszatérési címek, megosztási kép, strukturált adat.

Egyetlen sort sem kell a kódban módosítani.

---

## 1. Domain vásárlása

Bármelyik regisztrátornál. Magyar ügyfélnek egyszerűbb, ha ugyanott intézed,
ahol a DNS-t is kezelni fogod.

Ajánlott: `bidvip.hu` vagy `bidvip.com`.

---

## 2. Domain hozzáadása a Vercelhez

1. Vercel → a projekt → **Settings** → **Domains**
2. Írd be a domaint, **Add**
3. A Vercel megmutatja a szükséges DNS-bejegyzéseket
4. Ezeket vidd fel a regisztrátor DNS-kezelőjében

Jellemzően egy `A` rekord a gyökérhez és egy `CNAME` a `www`-hez.
A terjedés pár perctől néhány óráig tart.

---

## 3. Resend — a levelek feladója

**Ez a legfontosabb lépés.** Amíg a feladó a Resend homokozó-doménje
(`onboarding@resend.dev`), a levelek levélszemétbe eshetnek — azon a
doménen nincs a te SPF/DKIM bejegyzésed.

A nyertes **e-mailben kapja a fizetési linket**. Ha az spambe kerül,
nem fizet, és erről nem is szerzel tudomást.

1. Resend → **Domains** → **Add Domain** → írd be a domainedet
2. A Resend ad három DNS-bejegyzést:
   - **SPF** (TXT) — melyik szerver küldhet a nevedben
   - **DKIM** (TXT vagy CNAME) — aláírás, ami igazolja hogy tőled jön
   - **DMARC** (TXT) — mit tegyen a fogadó, ha az előző kettő nem stimmel
3. Vidd fel mindhármat a DNS-kezelőben
4. Resend → **Verify** — amíg nem zöld, ne állítsd át a feladót

> A DMARC-nál kezdj `p=none` beállítással, hogy lásd a jelentéseket
> mielőtt szigorítanál.

---

## 4. Környezeti változók a Vercelen

Vercel → **Settings** → **Environment Variables**. Mindhárom környezetbe
(Production, Preview, Development):

| Név | Érték | Mire kell |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | `https://bidvip.hu` | Minden link, sitemap, Stripe visszatérés |
| `EMAIL_FELADO` | `BidVip <noreply@bidvip.hu>` | A levelek feladója |
| `CRON_SECRET` | legalább 16 karakter véletlen szöveg | Enélkül a cron 401-et kap |

A `NEXT_PUBLIC_BASE_URL` **záró perjel nélkül** legyen. (A kód amúgy is
levágja, de tisztább így.)

Beállítás után **Redeploy** kell — a `NEXT_PUBLIC_` változók a fordításba
épülnek be.

---

## 5. Stripe

Stripe → **Developers** → **Webhooks** → a meglévő végpont URL-jét át kell
írni az új domainre:

```
https://bidvip.hu/api/webhooks/stripe
https://bidvip.hu/api/tokens/webhook
```

A `STRIPE_WEBHOOK_SECRET` változatlan marad, ha a végpontot szerkeszted
(nem újat hozol létre).

---

## 6. Supabase

Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `https://bidvip.hu`
- **Redirect URLs**: `https://bidvip.hu/**`

Enélkül a jelszó-visszaállító és megerősítő levelek a régi címre mutatnának.

---

## 7. Ellenőrzés

Miután minden megvan:

1. Nyisd meg: `https://bidvip.hu/sitemap.xml` — az új domainnek kell benne
   szerepelnie, nem a `vercel.app`-nak
2. Iratkozz fel a hírlevélre a saját Gmail-címeddel
3. A megérkezett levélben: **⋮ → Eredeti megjelenítése**
4. Keresd a `SPF`, `DKIM` és `DMARC` sorokat — mindháromnál `PASS` kell

Ha mindhárom PASS, a fizetési linkek is meg fognak érkezni.

---

## Amit a kód magától megcsinál

- Amíg a homokozó-feladó van érvényben, az első e-mail küldésekor
  **figyelmeztetést ír a naplóba** — így nem felejtődik el
- Hibás vagy hiányzó `NEXT_PUBLIC_BASE_URL` esetén visszaesik a jelenlegi
  címre ahelyett hogy induláskor elszállna
- Protokoll nélkül megadott címet (`bidvip.hu`) kiegészít `https://`-re
