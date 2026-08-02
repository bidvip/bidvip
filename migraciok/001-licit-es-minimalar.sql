-- ═══════════════════════════════════════════════════════════════════
-- BidVip — 001: minimálár, fizetési határidő és atomi licit
--
-- Futtatás: Supabase → SQL Editor → beilleszt → Run.
-- Egyszer kell lefuttatni. Ismételt futtatás nem okoz kárt.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Minimálár (reserve) ───────────────────────────────────────────
-- Az eladó eddig is megadhatta a beküldő űrlapon, de sehol nem tárolódott.
alter table projektek add column if not exists reserve_ar integer;

comment on column projektek.reserve_ar is
  'Minimálár. Ha a záró licit ez alatt marad, a tétel nem kel el.';

-- ── 2. Fizetési határidő ─────────────────────────────────────────────
-- Enélkül a nem fizető nyertes örökre blokkolja a tételt.
alter table projektek add column if not exists fizetesi_hatarido timestamptz;
alter table projektek add column if not exists fizetve_ekkor    timestamptz;

comment on column projektek.fizetesi_hatarido is
  'Meddig kell a nyertesnek fizetnie. Utána a tétel újralistázható.';

-- ── 3. Licit időbélyeg kikényszerítése ───────────────────────────────
-- A sorrendet mindig a szerver döntse el, ne a kliens.
alter table licitek alter column letrehozva set default now();

-- ── 4. Atomi licit ───────────────────────────────────────────────────
-- A jelenlegi kód beolvassa a legmagasabb licitet, ellenőriz, majd külön
-- beszúr. Két egyidejű licit ugyanazt olvashatja, és mindkettő átmegy.
-- Ez a függvény egyetlen tranzakcióban, sorzárolással végzi a műveletet,
-- így a versenyhelyzet megszűnik.
create or replace function licit_leadas(
  p_projekt_id uuid,
  p_user_id    uuid,
  p_osszeg     integer,
  p_proxy_max  integer default null,
  p_anon_nev   text    default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_projekt    record;
  v_top        record;
  v_legmagasab integer;
  v_lepes      integer;
  v_minimum    integer;
  v_uj_id      uuid;
  v_uj_lejarat timestamptz := null;
begin
  -- A tétel sorát zároljuk: amíg ez a tranzakció fut, másik licit vár.
  select id, kikialtasi_ar, reserve_ar, lejarat, statusz, user_id
    into v_projekt
  from projektek
  where id = p_projekt_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'hiba', 'nincs_ilyen_tetel');
  end if;
  if v_projekt.statusz <> 'aktiv' then
    return jsonb_build_object('ok', false, 'hiba', 'nem_aktiv');
  end if;
  if v_projekt.user_id = p_user_id then
    return jsonb_build_object('ok', false, 'hiba', 'sajat_tetel');
  end if;
  if v_projekt.lejarat is not null and v_projekt.lejarat < now() then
    return jsonb_build_object('ok', false, 'hiba', 'lezarult');
  end if;

  select osszeg into v_top
  from licitek
  where projekt_id = p_projekt_id
  order by osszeg desc
  limit 1;

  v_legmagasab := coalesce(v_top.osszeg, v_projekt.kikialtasi_ar);

  v_lepes := case
    when v_legmagasab <   500 then 25
    when v_legmagasab <  2000 then 50
    when v_legmagasab < 10000 then 100
    else 250
  end;
  v_minimum := v_legmagasab + v_lepes;

  if p_osszeg < v_minimum then
    return jsonb_build_object('ok', false, 'hiba', 'tul_alacsony', 'minimum', v_minimum);
  end if;

  insert into licitek (projekt_id, user_id, osszeg, proxy_max, anon_nev)
  values (p_projekt_id, p_user_id, p_osszeg, p_proxy_max, p_anon_nev)
  returning id into v_uj_id;

  -- Sniping elleni hosszabbítás: az utolsó percben leadott licit
  -- meghosszabbítja a lejáratot, hogy a többiek reagálhassanak.
  if v_projekt.lejarat is not null
     and v_projekt.lejarat > now()
     and v_projekt.lejarat < now() + interval '60 seconds' then
    v_uj_lejarat := now() + interval '60 seconds';
    update projektek set lejarat = v_uj_lejarat where id = p_projekt_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'licit_id', v_uj_id,
    'osszeg', p_osszeg,
    'uj_lejarat', v_uj_lejarat,
    'elert_reserve', v_projekt.reserve_ar is null or p_osszeg >= v_projekt.reserve_ar
  );
end;
$$;

-- Csak a szerver hívhatja (service role). A böngésző nem.
revoke all on function licit_leadas(uuid, uuid, integer, integer, text) from public, anon, authenticated;
