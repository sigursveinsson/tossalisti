# Tossalisti — staða og samantekt

_Uppfært: 10. júní 2026. Þetta skjal er til að opna nýja Cowork-lotu með fullt samhengi — límdu efstu hlutana inn eða vísaðu í skrána._

## Verkefnið
- **Tossalisti** — íslenskt innkaupa- og heimilisapp. Í loftinu á **tossalisti.is**.
- Mappa: `C:\Users\sigur\Documents\korfan` (Vite + React + Supabase + Netlify).
- **Deploy:** `npm run build` + `git add -A` + `git commit` + `git push` (Netlify byggir sjálft).
- **Supabase project id:** `butgofssgsmlfxtwylgf`. Admin-netfang: sigursveinsson@gmail.com.
- Annað verkefni: **Vaktin** (veður/ferða-app) í `C:\Users\sigur\Documents\vaktin` — halda aðskildu.

## Komið og virkt (fyrir þessa lotu)
Listar (innkaup/verk/skema), uppskriftir, rauntíma-deiling. Strikamerkjaskanni + vörumyndir (Open Food Facts). Sjálfbyggjandi vörubanki + deildaflokkun. Vöruhilla, Verslunarhamur, magn +/-. Kvittanaskönnun gegnum sjónlíkan (Edge Function `parse-receipt`, Gemini). Útgjöld (áður „Eyðsla"). Flokka-kostun (Ölgerðin á drykki) + auglýsingabanner. Stigatafla/afrek á verk- og skemalistum. Stjórnborð (admin). Onboarding.

## Gert í þessari lotu (KÓÐI ER Í SKRÁNUM, BÍÐUR DEPLOY-S)
1. **Krakka-prófílar** — foreldri „stofnar krakka" án netfangs/innskráningar (nafn, litur, mynd). Verk má úthluta á krakka og þeir fá stig + birtast með andlitsmynd í stigatöflu. Umsjón í nýjum `KidsManager.jsx`.
2. **Mynd/tákn á verk** fyrir þá sem ekki lesa — tákn-veljari + „taka mynd", sjálfvirk táknatillaga úr heiti (t.d. „hundur" → 🐕).
3. **Útgjöld eftir verslun** — sundurliðun mánaðarins í Útgjöld-flipanum (`SpendingView`).
4. **Kvittun úr listavalmynd** — „🧾 Skrá kvittun" í `ListsPanel` (fyrir kaup án lista / gamlar kvittanir).
5. **„Eyðsla" → „Útgjöld"** alls staðar í viðmótinu.
6. **Mynda-toggle** á innkaupalista (fela/sýna vörumyndir, vistast í localStorage).
7. **Lagaði „Búa til"-takkann** í nýr-listi glugga (fór út úr rammanum).

Breyttar skrár: `src/lib/store.js`, `src/App.jsx`, `src/components/ListView.jsx`, `ScheduleForm.jsx`, `SpendingView.jsx`, `ListsPanel.jsx`, `Onboarding.jsx`, `AdminView.jsx`, `src/data/chores.js`, `src/index.css`, `supabase/schema.sql`. Nýjar: `src/lib/img.js`, `src/components/KidsManager.jsx`.

**Supabase-migration `add_managed_kids_profiles` ER ÞEGAR KOMIN Í LOFTIÐ** (örugg, additíf — ný `kids`-tafla + nullable dálkar). **Ekki keyra hana aftur.**

Markaðsefni búið til (í möppunni): `tossalisti-kvittun.mp4` (9:16 kynningarmyndband), `tossalisti-kvittun-demo.html`, `tossalisti-instagram-profil.png` (prófílmynd).

## Gert í lotu 2 (10. júní 2026) — GAME-VÆÐING, BÍÐUR DEPLOY-S
Bætti heilu spilunarlagi ofan á krakka-prófílana:
1. **Level/borð** — stig → þrep með nöfnum (Byrjandi → Hjálparhella → Dugnaðarforkur → Heimilishetja → Súperstjarna → Goðsögn) + framvindustika. `src/lib/gamify.js`.
2. **Raðir 🔥** — samfelldir dagar með afreki (núverandi + lengsta sögunnar fyrir merki).
3. **Merki/afrek 🏅** — 9 merki (fyrsta verk, 10/50 verk, 100/500 stig, 3-/7-daga röð, morgunhani, kvöldhetja). Birtast í prófíl, læst grá þar til unnin.
4. **Konfetti + hljóð** þegar verk klárast (`src/lib/celebrate.js`, WebAudio + canvas, hljóð má slökkva á). Auka-fögnuður við level-up.
5. **Verðlaunabúð 🎁** — foreldri býr til umbun sem kostar stig; krakki leysir út úr „buddu" (aflað − eytt). Aflað stig á stigatöflu haldast óbreytt. Ný Supabase-tafla.
6. **Fjölskyldu-áskorun** — vikulegt sameiginlegt stigamarkmið með framvindustiku (markmið vistast í localStorage per lista).
7. **Ný stigatafla (`GamePanel`)** — smellanlegar raðir með level, röð og buddu; opnar prófíl-sheet (`KidProfile`) með öllu ofantöldu.

Nýjar skrár: `src/lib/gamify.js`, `src/lib/celebrate.js`, `src/components/GamePanel.jsx`, `src/components/KidProfile.jsx`, `src/components/RewardsManager.jsx`.
Breyttar: `src/lib/store.js` (rewards+redemptions aðferðir, local+cloud), `src/App.jsx` (hleðsla, handlers, celebrate/level-up), `src/components/ListView.jsx` (GamePanel + prófíl + verðlauna-takki), `src/index.css` (allir stílar), `supabase/schema.sql`.

**Supabase-migration `add_rewards_store` ER ÞEGAR KOMIN Í LOFTIÐ** (örugg/additíf — `rewards` + `reward_redemptions` töflur með RLS gegnum `is_member`). **Ekki keyra aftur.**

Staðfest: allar 5 nýju skrár + lib þýðast hreint (esbuild/node --check). Heildarbygging tókst ekki í Cowork (sama og síðast: `node_modules` er Windows-byggt og hluta-samstilling styttir skrár VM-megin) — host-skrárnar eru samt heilar og réttar. Laga þurfti `package.json` sem var stytt frá síðustu lotu.

## Líka gert í lotu 2 — FORELDRA-LEIÐBEININGAR + SKEMA-ENDURHÖNNUN (BÍÐUR DEPLOY-S)
8. **Foreldra-leiðbeiningar** (`GameGuide.jsx`) — útskýringaspjald um spilun (krakkar, stig, borð, raðir, merki, verðlaun, áskorun). Birtist sjálfkrafa í fyrsta sinn á verk-/skemalista (man í `localStorage` `korfan.gameguide.seen`) + lítill „?"-takki við hlið „🧒 Krakkar" til að opna aftur.
9. **Skema = áþreifanleg vika** (lagaði seríu-galla). Áður var dagl./vikul. verk EIN sameiginleg lína → að breyta ábyrgð eða haka smitaði alla seríuna. Nú er hvert skema-verk **sjálfstæð lína** (recurrence 'none', eigin ábyrgð + eigin haki). „Daglega" býr til 7 línur (mán–sun). Nýr **„🔄 Byrja nýja viku"**-takki af-hakar allt en **heldur stigasögu** (afrekum). `isDone` í skema notar nú `it.checked` (per lína).

Nýjar skrár (lota 2 framhald): `src/components/GameGuide.jsx`.
Breyttar: `src/lib/store.js` (`addScheduleTasks`, `resetWeek` — local+cloud), `src/App.jsx` (`addSchedule`, `newWeek`), `src/components/ListView.jsx` (guide-modal, ?-takki, ný-vika takki, per-línu haka), `src/components/ScheduleForm.jsx` (daglega → 7 dagar), `src/index.css`.

Engin ný Supabase-tafla þurfti (notar `list_items` eins og er; `dept` hefur sjálfgefið 'other'). Athugið: gömul skema-verk sem til eru í loftinu (recurrence 'daily'/'weekly') haldast sem ein lína þar til þau eru endurgerð — ný verk fá rétta hegðun strax. Best að nota „Byrja nýja viku" / endurstofna skema eftir deploy.

10. **Bakk-hnappa villa löguð** (`src/lib/backstack.js`, `src/App.jsx`). Kvittana-skannarinn var tvískráður í bakk-staflann (bæði App og `ReceiptScanner`), og `ignoreNext` var bóóleani sem réð ekki við tvær samtímis-lokanir → notandi datt út úr appinu á tóma síðu þegar kvittana-glugga var lokað úr listavalmynd. Lagað: fjarlægði tvískráningu í App (lína 207) og breytti `ignoreNext` í teljara `ignoreCount`.
11. **Vikusýn + Vika/Dagur toggle á skema** (`ListView.jsx`, `index.css`). Skema er nú almennt vikuplan — tímasettur tékklisti yfir vikuna, nýtist bæði fyrir krakka og fullorðna (stigatafla birtist bara þegar meðlimir/krakkar eru til). Toggle: **📅 Vika** = öll vikan í einu (lóðrétt agenda, hvert verk hakanlegt beint, smellur á dagshaus „zoom-ar" í daginn); **📋 Dagur** = ítarsýn með tímalínu. Valið vistast í `localStorage` (`korfan.schedview`).
14. **Notenda-virknilogg á Stjórnborði** (`AdminView.jsx`, `store.js`, ný Supabase-fall `admin_user_activity`). Nýtt fall (security definer, aðeins admin-netfang) skilar fylki af notendum — nýjastir efst — með nafni, netfangi, skráningardags, hvað þeir eiga/gerðu (listar, vörur/verk, ✓ kláruð, kvittanir, krakkar, deildir sem þeir gengu í) og hvenær síðast virkir. Birtist neðst á 📊 Stjórnborði með „NÝR" merki á þeim sem skráðu sig í dag. **Migration `add_admin_user_activity` ER KOMIN Í LOFTIÐ.** Til að bæta við fleiri admin-netföngum: breyta `in (...)` listanum í fallinu.

13. **Refresh-villa (að hluta lagað):** við refresh hoppaði notandi yfir á efsta lista (Vikuinnkaup) í stað þess að halda völdum lista. Orsök: `reload()` féll á `all[0]` þegar `currentId` var óþekkt í hleðslu-race. Lagað með varaleið: `keepId ?? prev ?? readHash().list` í `reload()` (App.jsx) svo slóðin (`#list=`) endurheimti réttan lista. **ÓLOKIÐ fyrir næstu lotu:** back/forward milli lista virkar ekki (slóðin notar `replaceState`, ekki `pushState`). Til að gera refresh + back + forward 100% samræmt þarf að nota `pushState` við listaskipti og samræma við glugga-bakkstaflann (`backstack.js`).

12. **Lagað eftir fyrsta deploy (lota 2):** (a) Vikusýn var sett í 7 dálka grid á breiðum skjá en `.app` er capp-að við 460px → dálkar krömdust og verkaheiti brotnuðu í einn staf á línu. **Fjarlægði grid-media-query — vikan er nú alltaf hrein lóðrétt agenda.** Alvöru breitt stundatöflu-grid á tölvu bíður (þarf að lyfta 460px-cappi + `overflow-x:hidden`). (b) **Stigataflan fellur nú saman sjálfgefið** (`GamePanel.jsx`) — sýnir bara haus + efsta mann (peek), smellur opnar hana (vistað í `korfan.lb.open`). Minnkar ringulreið fyrir ofan vikuna.

Staðfest: GameGuide þýðist hreint (esbuild); öll breytt svæði í store/App/ListView/ScheduleForm yfirfarin host-megin (heil og jöfnuð). Heildarbygging enn ekki möguleg í Cowork (sama umhverfisbilun: Windows-`node_modules` + GitHub lokað af proxy + skemmdur git-index). **Deploy verður að koma frá þinni vél.**

## ÓGERT — næstu skref
1. **DEPLOY** óútkeyrða kóðann (allt að ofan — lota 1 + 2). `git add -A` + commit + push. Netlify byggir. Athugið: `node_modules` á þinni Windows-vél er rétt, svo `npm run build` virkar þar.
2. **SEO + lén** — tengja `innkaupalisti.is` í Netlify sem 301-tilvísun á tossalisti.is; bæta meta/Open Graph-merkjum + sitemap/robots í `index.html`; Google Search Console.
3. **Daglegt virkni-yfirlit** — skedúlera sjálfvirkt yfirlit úr Supabase (innskráningar, verk kláruð, útgjöld o.fl.). Ekki enn virkt.
4. **Smávilla að skoða:** tvöfaldur sjálfgefinn „Vikuinnkaup"-listi getur orðið til við fyrstu innskráningu (race í `reload()` auto-create).

## Umhverfis-athugasemd
Í þessari lotu varð Linux-vinnuumhverfi Cowork óstöðugt (skemmt git-index, hluta-samstilling, npm lokað, rangt `node_modules`), svo ekki tókst að byggja/deploya úr Cowork. Allar **skráabreytingar eru samt réttar og vistaðar** á vélinni. Öruggast að keyra deploy á eigin vél, eða prófa ferskt Cowork-umhverfi (Netlify byggir við push svo `git push` einn dugar ef git virkar).

## Deploy-skipanir
```
cd C:\Users\sigur\Documents\korfan
npm run build
git add -A
git commit -m "Krakka-profilar, mynd/takn a verk, utgjold eftir verslun, kvittun ur valmynd, Utgjold-nafn, mynda-toggle, laga Bua til takka"
git push
```

## Eftir deploy — prófa (game-væðing)
- Klára verk → konfetti + hljóð + „+X stig". Safna nógu til að krossa borð → stærri fögnuður + „Nýtt borð".
- Smella á krakka í stigatöflu → prófíl með level-stiku, röð 🔥, merkjum (læst/unnin), buddu.
- 🎁 Verðlaun (foreldri) → búa til umbun → leysa út í prófíl → budda lækkar, stigatafla óbreytt.
- Áskorun vikunnar: stigamarkmið fyllist eftir því sem verk klárast; ✏️ til að breyta markmiði.

## Eftir deploy — prófa (lota 1)
- Stofna krakka með mynd → úthluta skema-verki á hann → klára → sjá hann efst í stigatöflu með andlit.
- Tákn/mynd á verk birtist stórt á verkröð.
- Útgjöld-flipi: sundurliðun eftir verslun.
- Listavalmynd: „🧾 Skrá kvittun" virkar.
- Innkaupalisti: „🖼️ Fela/Sýna" felur/sýnir myndir.
- Nýr listi: „Búa til" takkinn situr rétt í rammanum.
