export type KategoriaCsoport = {
  nev: string
  szin: string
  temak: string[]
}

export const KATEGORIA_FA: KategoriaCsoport[] = [
  { nev: 'Energia', szin: '#F59E0B', temak: [
    'Napenergia', 'Szélenergia', 'Vízenergia', 'Geotermikus energia', 'Hidrogén és üzemanyagcella',
    'Nukleáris fisszió', 'Fúziós energia', 'Bioüzemanyag', 'Akkumulátor és energiatárolás',
    'Okos hálózat (Smart Grid)', 'Energiapiac és kereskedés', 'Energiahatékonyság',
  ]},
  { nev: 'Környezet és klíma', szin: '#22C55E', temak: [
    'Környezetvédelem', 'Szén-megkötés (CCS)', 'Karbonpiac és kvóták', 'Hulladékgazdálkodás',
    'Újrahasznosítás', 'Levegőminőség', 'Zajszennyezés', 'Biodiverzitás', 'Erdővédelem',
    'Talajvédelem', 'Körforgásos gazdaság', 'Klímamodellezés',
  ]},
  { nev: 'Víz és óceán', szin: '#06B6D4', temak: [
    'Vízgazdálkodás', 'Ivóvíztisztítás', 'Szennyvízkezelés', 'Sótalanítás', 'Öntözéstechnika',
    'Vízhálózat és szivárgás', 'Óceánkutatás', 'Árapály és hullámenergia', 'Vízi közlekedés', 'Árvízvédelem',
  ]},
  { nev: 'Űr és csillagászat', szin: '#818CF8', temak: [
    'Csillagászat', 'Asztrofizika és kozmológia', 'Műholdtechnika', 'Rakétahajtás',
    'Hold- és Marskutatás', 'Aszteroidabányászat', 'Űrturizmus', 'Űrszemét-kezelés',
    'Távérzékelés és földmegfigyelés', 'Űrbiológia',
  ]},
  { nev: 'Mesterséges intelligencia', szin: '#A78BFA', temak: [
    'Gépi tanulás', 'Nagy nyelvi modellek (LLM)', 'Számítógépes látás', 'Beszédfelismerés',
    'AI ügynökök', 'Generatív AI', 'MLOps és AI infrastruktúra', 'AI biztonság és etika',
    'AI szabályozás és megfelelőség', 'Prediktív analitika',
  ]},
  { nev: 'Szoftver és IT', szin: '#8B5CF6', temak: [
    'SaaS / Vállalati szoftver', 'Fejlesztői eszközök', 'Felhő és infrastruktúra', 'Kiberbiztonság',
    'Adatbázis és Big Data', 'Blockchain / Web3', 'Kripto infrastruktúra', 'AR / VR / XR',
    'Kvantumszámítástechnika', 'Alacsony kód / No-code', 'API és integráció', 'Nyílt forráskód',
    'Mobilalkalmazások', 'Webfejlesztés',
  ]},
  { nev: 'Hardver és elektronika', szin: '#C084FC', temak: [
    'Félvezetők és chipek', 'Szenzorok', 'IoT eszközök', 'Viselhető eszközök',
    'Fogyasztói elektronika', 'Nyomtatott áramkörök', 'Optika és fotonika', 'Akusztika és hangtechnika', 'Elektronikai hulladék',
  ]},
  { nev: 'Robotika és automatizálás', szin: '#7C3AED', temak: [
    'Ipari robotika', 'Szolgáltatórobotok', 'Autonóm rendszerek', 'Drónok és UAV',
    'Exoszkeletonok', 'Folyamatautomatizálás (RPA)', 'Gépi látás gyártásban', 'Mezőgazdasági robotika',
  ]},
  { nev: 'Egészségügy', szin: '#EC4899', temak: [
    'Digitális egészségügy', 'Telemedicina', 'Orvosi eszközök (MedTech)', 'Diagnosztika',
    'Képalkotó technológia', 'Mentális egészség', 'Idősgondozás', 'Fogyatékkal élők támogatása',
    'Nőgyógyászat és FemTech', 'Gyermekegészség', 'Sürgősségi ellátás', 'Kórházi menedzsment',
    'Egészségbiztosítás', 'Fogászat',
  ]},
  { nev: 'Biotech és élettudomány', szin: '#F43F5E', temak: [
    'Biotechnológia', 'Genetika és genomika', 'Szintetikus biológia', 'Gyógyszerfejlesztés',
    'Klinikai kutatás', 'Immunterápia', 'Őssejtkutatás', 'Mikrobiom', 'Bioinformatika',
    'Longevity / Élethossz', 'Neurotudomány', 'Agy-gép interfész',
  ]},
  { nev: 'Oktatás', szin: '#3B82F6', temak: [
    'Óvodai és alsó tagozat', 'Középiskolai oktatás', 'Felsőoktatás', 'Szakképzés',
    'Vállalati képzés', 'Nyelvtanulás', 'E-learning platformok', 'AI tutorok',
    'Speciális igényű oktatás', 'Élethosszig tartó tanulás', 'Oktatásmenedzsment', 'Diákhitel és finanszírozás',
  ]},
  { nev: 'Pénzügy', szin: '#22D3EE', temak: [
    'Fintech', 'Digitális bank', 'Fizetési rendszerek', 'Hitelezés és mikrohitel',
    'Biztosítás (InsurTech)', 'Befektetési platformok', 'Vagyonkezelés', 'Kripto és DeFi',
    'Stablecoin és CBDC', 'Számvitel és könyvelés', 'Adótechnológia', 'Csalásfelderítés', 'Pénzügyi tudatosság',
  ]},
  { nev: 'Mezőgazdaság és élelmiszer', szin: '#84CC16', temak: [
    'Precíziós mezőgazdaság', 'Vertikális gazdálkodás', 'Hidropónia és akvapónia', 'Növénynemesítés',
    'Növényvédelem', 'Állattenyésztés', 'Halászat és akvakultúra', 'Erdészet',
    'Élelmiszeripar (FoodTech)', 'Alternatív fehérje', 'Élelmiszerbiztonság', 'Élelmiszer-pazarlás',
    'Vendéglátóipari beszerzés', 'Mezőgazdasági finanszírozás',
  ]},
  { nev: 'Közlekedés és mobilitás', szin: '#F97316', temak: [
    'Elektromos járművek', 'Autonóm vezetés', 'Töltőinfrastruktúra', 'Légi taxi / eVTOL',
    'Repülés és légiközlekedés', 'Vasút', 'Hajózás és tengerészet', 'Mikromobilitás',
    'Közösségi közlekedés', 'Parkolás és forgalomirányítás', 'Flottakezelés', 'Logisztika és szállítmányozás',
    'Utolsó kilométer kézbesítés', 'Raktározás',
  ]},
  { nev: 'Ipar és gyártás', szin: '#EA580C', temak: [
    'Ipar 4.0', 'Additív gyártás (3D nyomtatás)', 'CNC és precíziós megmunkálás', 'Minőségellenőrzés',
    'Prediktív karbantartás', 'Bányászat és nyersanyag', 'Kohászat', 'Vegyipar',
    'Petrolkémia', 'Csomagolástechnika', 'Textilipar', 'Ellátási lánc menedzsment',
  ]},
  { nev: 'Építőipar és ingatlan', szin: '#14B8A6', temak: [
    'PropTech / Ingatlan', 'Ingatlanbefektetés', 'Építőipari technológia', 'Fenntartható építészet',
    'Moduláris építés', 'Smart Home', 'Smart City', 'Épületgépészet',
    'Városrendezés', 'Katasztrófavédelem', 'Ingatlankezelés', 'Bérleti platformok',
  ]},
  { nev: 'Kereskedelem és retail', szin: '#E11D48', temak: [
    'E-commerce', 'Marketplace', 'D2C értékesítés', 'Kiskereskedelmi technológia',
    'Nagykereskedelem', 'Készletgazdálkodás', 'POS rendszerek', 'Ár-összehasonlítás',
    'Használt és újrahasználat', 'Előfizetéses kereskedelem', 'Social commerce', 'Élelmiszerkereskedelem',
  ]},
  { nev: 'Divat, design és életstílus', szin: '#9F1239', temak: [
    'Divattervezés', 'Fenntartható divat', 'Textilinnováció', 'Lábbeli és kiegészítők',
    'Luxusipar', 'Ékszer', 'Kozmetika és szépségipar', 'Ipari formatervezés',
    'Bútor és lakberendezés', 'Grafikai tervezés', 'Építészeti design',
  ]},
  { nev: 'Média és szórakoztatás', szin: '#64748B', temak: [
    'Streaming és videó', 'Zene és audio', 'Podcast', 'Kiadás és könyvipar',
    'Újságírás és hírek', 'Filmgyártás', 'Animáció és VFX', 'Gaming / Videojátékok',
    'E-sport', 'Alkotói gazdaság', 'Közösségi média', 'Reklám és marketing', 'Élő események', 'Szerzői jog és licencelés',
  ]},
  { nev: 'Sport és szabadidő', szin: '#65A30D', temak: [
    'Sporttechnológia', 'Fitness és edzés', 'Táplálkozás és kiegészítők', 'Szabadtéri sportok',
    'Csapatsportok', 'Sportfogadás', 'Sportegészségügy', 'Rekreáció és hobbi', 'Kézművesség',
  ]},
  { nev: 'Turizmus és vendéglátás', szin: '#10B981', temak: [
    'Utazásszervezés', 'Szálláshely-szolgáltatás', 'Élményturizmus', 'Fenntartható turizmus',
    'Éttermek és gasztronómia', 'Rendezvényszervezés', 'Repülőjegy és foglalás', 'Helyi idegenvezetés',
  ]},
  { nev: 'Jog, kormányzat és biztonság', szin: '#94A3B8', temak: [
    'LegalTech', 'Szerződéskezelés', 'Szellemi tulajdon', 'Megfelelőség (Compliance)',
    'GovTech / Közszolgálat', 'Szavazás és demokrácia', 'Honvédelem', 'Rendvédelem',
    'Vészhelyzeti reagálás', 'Határvédelem', 'Adatvédelem és GDPR', 'Igazságszolgáltatás',
  ]},
  { nev: 'Munka és emberi erőforrás', szin: '#7B8EA4', temak: [
    'HR technológia', 'Toborzás és állásközvetítés', 'Távmunka eszközök', 'Csapatmenedzsment',
    'Bérszámfejtés', 'Készségfejlesztés', 'Gig economy', 'Munkahelyi biztonság', 'Munkavállalói jóllét',
  ]},
  { nev: 'Társadalom és közösség', szin: '#475569', temak: [
    'Szociális innováció', 'Nonprofit és jótékonyság', 'Adománygyűjtés', 'Közösségépítés',
    'Integráció és befogadás', 'Menekültügy', 'Szegénységcsökkentés', 'Élelmiszerbank',
    'Önkéntesség', 'Vallás és spiritualitás', 'Családsegítés', 'Állatjólét',
  ]},
  { nev: 'Alaptudományok és anyagok', szin: '#4F46E5', temak: [
    'Anyagtudomány', 'Nanotechnológia', 'Kémia', 'Fizika', 'Matematika és statisztika',
    'Geológia', 'Meteorológia', 'Régészet és történelem', 'Nyelvészet', 'Tudományos műszerek',
  ]},
]

export const OSSZES_TEMA: { nev: string; csoport: string; szin: string }[] =
  KATEGORIA_FA.flatMap(c => c.temak.map(t => ({ nev: t, csoport: c.nev, szin: c.szin })))

export function keressTemat(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return OSSZES_TEMA
  return OSSZES_TEMA.filter(t => t.nev.toLowerCase().includes(q) || t.csoport.toLowerCase().includes(q))
}

export function csoportjaTemanak(tema: string): KategoriaCsoport | null {
  return KATEGORIA_FA.find(c => c.temak.includes(tema)) ?? null
}

/**
 * A kiválasztott témából szakértői kontextust épít az AI promptokhoz.
 * Enélkül a kategória csak egy címke — ezzel az AI az adott terület
 * szakértőjeként értékel: releváns szabályozás, versenytársak, buktatók.
 */
export function szakertoiKontextus(tema: string): string {
  const csoport = csoportjaTemanak(tema)
  if (!csoport) {
    return tema ? `\nDOMAIN: ${tema}\nEvaluate within the norms of this field.` : ''
  }

  const testverek = csoport.temak.filter(t => t !== tema).slice(0, 8)

  return `
DOMAIN EXPERTISE — the seller selected this field, so evaluate as a specialist in it:
- Field: ${csoport.nev}
- Specific area: ${tema}
- Adjacent areas in this field: ${testverek.join(', ')}

Judge this idea by the standards of ${csoport.nev}, not generic startup standards:
- Who are the real buyers, incumbents and competitors in ${tema}?
- What regulation, certification, licensing or safety requirements apply in this field?
- What capital intensity, development timeline and technical risk are typical here?
- What counts as meaningful proof of traction in ${tema} specifically?
- Which pitfalls kill most projects in this exact area?

An idea that is strong in software may be weak in ${csoport.nev} and vice versa — calibrate to the field.`
}
