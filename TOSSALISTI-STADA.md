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

26. **Retention + opt-in áminningar (lota 7).** Markmið: fá fólk aftur inn án þess að drekkja því. Áminningar **sjálfgefið slökktar** — enginn fær neitt nema hann kveiki sjálfur.
    - **Gagnagrunnur (KOMINN Í LOFTIÐ):** migration `add_push_and_notification_settings` → töflur `push_subscriptions` (endpoint unique, jsonb áskrift) og `notification_settings` (push_enabled default false, daily_tasks, daily_tasks_hour, weekly_summary default true, quiet_start/end), báðar með RLS (user = auth.uid()). Nýtir `reminder_enabled/at/last_reminded_at` á list_items sem voru þegar til.
    - **Web push (ókeypis, VAPID):** `src/lib/push.js` (opt-in: Notification.requestPermission + PushManager.subscribe). VAPID public key í push.js. **VAPID private key er EKKI í kóða — verður að setja sem edge-function secret (sjá neðar).**
    - **Service worker** `public/sw.js` (cache v2): push + notificationclick event handlers.
    - **store.js:** savePushSubscription/removePushSubscription, getNotifSettings/setNotifSettings, setItemReminder (cloud + local).
    - **NotifSettings.jsx** (🔔 í haus): altæk rofi (kveikja/slökkva → biður um leyfi, vistar áskrift), vikuyfirlit, „verk dagsins" + tími, hljóðlátur tími. **ListView:** 🔔-bjalla á hvert verk (per-verk áminning á tíma verksins).
    - **Í-appi retention (truflar engan):** HomeView fær PWA install-ábending (beforeinstallprompt → „settu á heimaskjá"). „Verk dagsins" + vikuframvinda voru þegar til.
    - **Edge function `send-reminders` (DREIFT, verify_jwt=false):** keyrt af **pg_cron á 15 mín fresti** (KOMIÐ). Sendir per-verk áminningar (verk með bjöllu á tíma sínum í dag), „verk dagsins" (valkvætt, á völdum tíma) og vikulegt uppgjör (sunnud. kl. 19). Virðir quiet hours + push_enabled. npm:web-push. Cron sendir `x-cron-secret: tsl_7Qp2x9Kf4mZ3nA8r`.
    - **⚠️ ÓGERT (notandi þarf að gera í Supabase Dashboard → Edge Functions → Manage secrets):** setja `VAPID_PRIVATE` = `ooRdxoVI04dg4aHhi5Vn3Q7OcoItC407G0rGOXy63UA`, `VAPID_PUBLIC` = `BEeSrgHNkbxxlNKY_gGEEMe9ij8Dbo_DHoN1X5vXBROHqIhM9dyDW66Myr6WRfo1XML3uHr3aN6rCr89V1IuJIM`, `VAPID_SUBJECT` = `mailto:sigursveinsson@gmail.com`, og valkvætt `CRON_SECRET` = `tsl_7Qp2x9Kf4mZ3nA8r`. Áður en VAPID secrets eru sett skilar fallið `{ok:false, error:"VAPID secrets not set"}` og sendir ekkert. **Frontend óútgefinn.**

25. **Tvískráning stiga löguð (lota 6h).** Krakki/notandi gat fengið tvöföld stig ef tvísmellt var hratt á verk — `toggleItem`/`completeItem` skráðu tvö `completions` því `item.checked` var enn `false` í bæði skiptin (stöðu-tvíhleðsla). Lagað á þrjá vegu: (1) **store**: einnota verk skrá aðeins eitt afrek (athuga hvort til staðar fyrst); endurtekin verk sleppa skráningu ef nákvæmlega eins færsla er < 3 sek gömul. (2) **App.toggleItem**: `togglingRef` hunsar endurtekinn smell á sama verk á meðan sá fyrri er í vinnslu. (3) Hreinsaði tvítöldu Gylfa-færsluna úr gagnagrunni. ATH: fleiri tvítekningar frá prófunum 8.–11. júní eru enn til (item `cbc51e3a`/`2a9c3292` o.fl.) — ekki hreinsaðar (gætu verið prufugögn). **Vikumörk óbreytt: mánudag–sunnudag** (notandi staðfesti; helgin telst til þeirrar viku sem var að klárast). Frontend-hluti óútgefinn.

24. **Uppruna-rakning nýrra notenda (lota 6g).** Sést nú hvaðan notendur koma inn. `src/lib/attribution.js` les `utm_source`/`utm_medium`/`utm_campaign`, `?ref=`, `?invite=`, `fbclid` og `document.referrer` við fyrstu heimsókn → geymir „fyrsta-snertingu" í localStorage (`korfan.attr`; bein heimsókn geymd „mjúkt" svo síðari FB/IG-heimsókn uppfærir). Við innskráningu skráir App uppruna á notanda (`store.recordAttribution` → tafla `signup_attribution`, RLS, upsert ignoreDuplicates → fyrsta vinnur). **Migration `add_signup_attribution` KOMIN Í LOFTIÐ** (tafla + `admin_user_activity` uppfært til að skila `source` + `utm_campaign`). AdminView: lítið hringlaga bókstafsmerki við hvern notanda — **T**=Tossalisti (boð frá notanda), **F**=Facebook, **I**=Instagram, **G**=Google, **↗**=annað, **B**=beint (hover sýnir herferð/utm_campaign). Til að mæla herferðir: pósta hlekki eins og `tossalisti.is/?utm_source=facebook&utm_campaign=mottuhopur`. **Óprófað í Cowork.**

23. **Verslunarkeðjur sameinaðar í „Eftir verslun" (lota 6f).** Útibú sömu keðju (t.d. „Krónan Skeifunni" + „Krónan Granda") birtust sem aðskildar línur. Nýtt `storeChain(name)` í `categories.js` skilar keðjuheiti fyrir ~20 þekktar keðjur (Krónan, Bónus, Nettó, Hagkaup, Costco, Iceland, Fjarðarkaup, Kjörbúðin, Krambúð, 10-11, Vínbúðin, Lyfja, Apótekið, N1, Olís, Orkan, ÓB, IKEA, ELKO, Extra), annars upprunalega heitið. `BudgetView` grúppar `storeTotals` + síu eftir keðju; einstakar færslur í lista halda fulla söluaðila-heitinu. **Óprófað í Cowork.**

22. **Fleiri útgjaldaflokkar + eigin flokkar notanda (lota 6e).** Notandi vildi fleiri flokka OG geta búið til sína eigin (bíll, kaffihús, bíó, barir o.fl.).
    - **Migration `add_custom_expense_categories` ER KOMIN Í LOFTIÐ:** tafla `expense_categories (id, user_id→auth.users, name, icon, color, created_at)`, index + RLS (`user_id = auth.uid()`).
    - `categories.js`: innbyggðum flokkum fjölgað úr 14 → **21** (bætt við: veitingar & kaffihús 🍔, skemmtun & barir 🍸, föt 👕, gjafir 🎁, tómstundir & sport ⚽, áskriftir 📺, gæludýr 🐾).
    - store: `getCustomCategories` / `addCustomCategory` / `deleteCustomCategory` (cloud + local). Eigin flokkur: lykill = `id` (uuid); `purchases.category` / `purchase_items.category` geyma lykilinn.
    - App: hleður `customCats`, `addCategory` + `deleteCategory` handler, sendir í BudgetView.
    - `BudgetView`: byggir `allCats` (innbyggðir + eigin) + `catMap`/`catOf`. Allir flokkaveljarar (TxForm-vörulína, línuliða-flokkun) nota nýjan `CatGrid` íhlut með **„＋ Nýr flokkur"** hnappi → `NewCatForm` (heiti + 24 emoji-val + 12 lita-val) sem býr til flokk og velur hann strax. Nýtt **„⚙️ Flokkar"** sheet til að skoða/eyða eigin flokkum. CSS: `.bnewcat*`, `.bemoji`, `.bcolor`, `.bcat-new`, `.bmanage-cats`, `.bcat-list/-line/-del`.
    - **Óprófað í Cowork — prófa eftir deploy.**

21. **Handvirk útgjaldaskráning með vörulínum (lota 6d).** Skrá útgjöld án kvittunar „eftir minni". Tvær leiðir í bókhaldinu: **🧾 Skanna** (OCR) og **+ Ný færsla** (handvirkt). Handvirka formið (`TxForm` í BudgetView) endurskrifað sem vagluggi: söluaðili, dagsetning, **margar vörulínur** (nafn + verð, sjálfvirk flokkun með táknhnappi sem má smella á til að breyta), og **sjálfvirk heildarupphæð** (summa lína, eða handvirk yfirskrift). Dæmi: „Ísbúð Vesturbæjar / stór ís / 1290". store: `addPurchase`/`updatePurchase` geyma nú `category` á `purchase_items` (3 staðir). Virkar líka til að breyta skönnuðum kvittunum (sýnir liðina). **Óprófað í Cowork.**

20. **Bókhald: flokkun á undirliðum + yfirlit eftir verslun (lota 6c).** Notandi vildi flokka *línuliði* hverrar kvittunar (ein Krónu-kvittun → matur/drykkir/áfengi/hreinlæti) og sjá líka eftir verslun.
    - **Migration `add_purchase_item_category` ER KOMIN Í LOFTIÐ** (`category` á `purchase_items`).
    - `categories.js` endurskrifað: 14 sameinaðir flokkar; **`itemCategory(name)` nýtir `departmentFor` úr vörubankanum** (produce/beverages/alcohol/cleaning… → matur/drykkir/áfengi/hreinlæti). `effectiveItemCat` = handvirk yfirskrift annars sjálfvirk. `suggestCategory` nú verslunar-byggt fyrir heilar færslur.
    - store: `setItemCategory`. App: `setItemCat` handler.
    - `BudgetView` endurskrifað: rofi **„Eftir flokki" / „Eftir verslun"**; flokka-samtölur reiknaðar úr línuliðum (verslunar-samtölur úr heildum); kvittanir **útvíkkanlegar** → hver línuliður með flokka-chip sem má smella á til að breyta. Sía á yfirlit eftir flokki eða verslun.
    - **ATH óprófað:** `purchase_items.price` er notað sem línuupphæð í flokka-samtölum — ef parserinn geymir einingaverð gæti þurft að margfalda með qty. Skoða eftir deploy með alvöru kvittun.

19. **Bókhald endurhugsað → heildar-sýn (lota 6b).** Notandi vildi EKKI lista-tegund heldur eina greiningar-sýn ofan á ALLAR kvittanir. Breytt:
    - `BudgetView` sýnir nú allar færslur notandans (ekki bundinn lista). Ný efsta-sýn `view='budget'` (fléttuð í hash/back/forward, `#view=budget`).
    - Opnast af **„📒 Bókhald & útgjöld"** takka í listavalmynd (`onOpenBudget`) OG af „Útgjöld"-spjaldinu á heimaskjá (`goBudget`). Nýjar færslur úr bókhaldssýn eru persónulegar (`addExpense`, list_id null).
    - **Lista-tegundin 'budget' tekin út úr ListsPanel** (aftur í seg3). `category`-dálkurinn, RLS (sameiginleg sýnileiki) og ledger-viðmótið standa öll.
    - **`BudgetIntro.jsx`** — animeruð fyrsta-skiptis kynning (kvittun með skann-línu → flokka-súlur vaxa) sem útskýrir flæðið og býður „📷 Skanna fyrstu kvittun". Vistað í `korfan.budgetintro`.
    - **Deildir hópar + „hver borgaði hvað" bíða V2** — þá fá listar/hópar tilgang aftur (grúppun + meðlimir). **ÓPRÓFAÐ í Cowork.**

18. **Hópa-bókhald V1 (lota 6)** — ný lista-tegund `budget` („📒 Bókhald") sem endurnýtir deilingu/meðlimi/rauntíma. Færslur = `purchases` tengdar bókhalds-lista. Nýtt:
    - Gagnagrunnur: `category` á `purchases`. **RLS endurskrifað:** meðlimir sjá nú kvittanir á deildum listum (persónulegar — enginn/ódeildur listi — haldast einkamál); eigandi einn breytir/eyðir. `purchase_items` fylgja. **Migration `add_budget_categories_shared` ER KOMIN Í LOFTIÐ.**
    - `src/data/categories.js`: 10 útgjaldaflokkar + sjálfvirk flokkatillaga úr verslunarnafni.
    - `BudgetView.jsx`: færsluyfirlit (ledger), samtölur per flokk (súlur), sía eftir flokki, mánuður/allt, bæta/breyta færslu (handvirkt form + flokka-veljari), skanna kvittun beint í hópinn, snögg-flokkun á færslu.
    - store: `category` í `addPurchase`/`updatePurchase`, nýtt `setPurchaseCategory`. ListsPanel: 4. tegundin (seg4 2x2). App: `budget`-listar fara í BudgetView, `receiptListId` tengir skannaða kvittun við hóp.
    - **V2 (á minnislista): „hver borgaði hvað" + skuldajöfnun** (greiðandi + jöfn skipting + staða per meðlim + „gera upp"). **Á minnislista síðar: ójöfn/sérsniðin skipting** (t.d. „Anna 60%"). **ÓPRÓFAÐ í Cowork — prófa eftir deploy:** stofna „📒 Bókhald"-lista, bæta færslu með flokki, sjá súlu-yfirlit + síun, deila með öðrum og staðfesta að þeir sjái sameiginlegar færslur.

17. **Heimaskjá-fínpússun (lota 5b):**
    - **⚠️ ÓLEYST: Listavalmynd (ListsPanel) opnast ofan á heimaskjá við innskráningu.** Staðfest með skjáskoti. Skrýtið: `showLists` er false sjálfgefið, `setShowLists(true)` er HVERGI nema í þremur takka-smellum (engin sjálfvirk opnun), og ég bætti við deterministískum `setShowLists(false)` í `[view]`-effect þegar `view==='home'` (App.jsx ~lína 112) — en notandi segir það **opnist samt** eftir deploy. Service worker er network-first (ekki gamalt skyndiminni). 
      → **Næsta lota, debug-plan:** (1) staðfesta að deployaða útgáfan innihaldi `setShowLists(false)`-effectinn (view-source/console). (2) Setja `console.trace()` tímabundið þar sem `setShowLists` er kallað til að finna hvað opnar hana. (3) Athuga hvort `ListsPanel` endurmyndist (remount) eða hvort eitthvað í history/popstate-kerfinu (nýtt í lotu 4) hafi óvænt áhrif. (4) Prófa í devtools hvort showLists verði true eftir mount. Þarf líklega beina skoðun (Chrome-viðbót eða console hjá notanda) því kóðinn einn útskýrir þetta ekki.
    - **(virkar) Aðskilið listaheiti frá fellivalmynd** í lista-haus.
    - **Aðskilið listaheiti frá fellivalmynd** í lista-haus: var allt á einum takka (`☰ {nafn} ▾`). Nú er nafnið sér (`.curtitle`) og skipta-takkinn (`☰▾`, `.switch-btn`) aðskilinn til hægri, með „X eftir" á milli.

16. **Heimaskjár V1 (lota 5)** — ný `HomeView.jsx` sem er sjálfgefin sýn við innskráningu (`view='home'` í hash, `#view=home`). Inniheldur: persónulega kveðju + afrek vikunnar (stig/klárað úr `home_summary`), „Bíður þín" (listar með ókláruðum atriðum, úr listunum), útgjöld mánaðarins (úr `purchases`), **fjölskylduvirkni-feed** (klárun + nýjar vörur frá ÖÐRUM á deildum listum, þjappað), og AdBanner. 🏠-takki í lista-haus með **ping-merki** þegar ný óséð virkni er til (`korfan.home.seen` í localStorage). Eitt tap fer á lista; heimaskjár truflar ekki flýti.
    - Gagnagrunnur: `created_by` bætt á `list_items` (additíft, svo hægt sé að segja „X bætti við"), og `home_summary()` RPC (security definer, eigin notandi). **Migration `add_home_summary` ER KOMIN Í LOFTIÐ.**
    - store: `created_by` sett í `addItem`/`addManyItems`/`addScheduleTasks` (cloud), nýtt `store.homeSummary()`.
    - App: `view`-state ('home'|'list') fléttað í hash/back/forward kerfið (`#view=home`), `goHome`, `openSpendingFromHome`, og graceful ef RPC bregst.
    - **V2 seinna:** stjórnenda-skilaboð (messages-tafla) + ólesnar-tilkynningar. **ÓPRÓFAÐ í Cowork — prófa eftir deploy:** heimaskjár birtist við innskráningu, „bíður þín" og útgjöld rétt, fjölskyldu-feed sýnir virkni annarra, ping birtist/hverfur, 🏠 og listaskipti virka með back/forward.

15. **Lota 3 – litlar lagfæringar:**
    - **Skema-haki virkaði ekki** (confetti kom en ekkert hak). Orsök: gömlu skema-verkin voru enn `recurrence='daily'/'weekly'` (gamla líkanið) en framendinn les `it.checked` fyrir skema → hak vistaðist aldrei. **Migration `fix_schedule_items_concrete` ER KOMIN Í LOFTIÐ:** öll skema-verk → `recurrence='none'`, og „daily"-verk brotin upp í 7 sjálfstæða daga (mán–sun). Hakið virkar nú strax (enginn nýr deploy þurfti fyrir þetta — bara refresh). Ný verk voru þegar rétt.
    - **„vörur" → „verk" í listavalmynd** (`ListsPanel.jsx`): teljari undir hverjum lista sagði „vörur" fyrir skema/verk-lista. Lagað: `l.type === 'shopping' ? 'vörur' : 'verk'`.
    - **Tvöfaldur sjálfgefinn listi** (var #4 í ÓGERT): `reload()` gat búið til tvo „Vikuinnkaup" ef það keyrði tvisvar samtímis við innskráningu. Lagað með sameiginlegu create-loforði (`defaultListPromise`, App.jsx).

13. **Refresh + back/forward milli lista (endurbyggt, lota 4):** áður hoppaði refresh á efsta lista og back/forward virkaði ekki. Ný útfærsla í App.jsx gerir slóðina (`#list=&tab=`) að einu sannleiksuppsprettu:
    - `reload()` notar nú `keepId ?? prev ?? HASH0.list` (upphafsslóðin) svo refresh haldi réttum lista, plús örugg endurheimt-effect (`restoredRef`) sem leiðréttir úr `HASH0` þegar listar hlaðast (varnar race).
    - Hash-effect skrifar `pushState` við notenda-listaskipti (svo back/forward virki) en `replaceState` við fyrstu hleðslu og þegar breyting kom frá back/forward (`navRef.first/fromPop`).
    - `popstate`-hlustari les lista/flipa úr slóðinni. Lykilatriði: **gluggar breyta aldrei hash-inu** svo þetta truflar ekki glugga-bakkstaflann (`backstack.js`).
    - **Listavalmyndin var tekin úr `useBackClose`** (var `useBackClose(showLists)`) því hún lokaðist OG breytti lista samtímis → kapphlaup við `pushState`. Hún lokast nú með X eða smelli utan á hana (vélræni back-takkinn lokar henni ekki lengur — minniháttar). **ÓPRÓFAÐ í Cowork (mount-stytting + GitHub lokað) — prófa eftir deploy:** (a) skema-listi → refresh heldur sér; (b) back fer á fyrri lista, forward til baka; (c) gluggar (kvittun, deila, skema-form) lokast rétt með back án þess að detta út úr appinu.

12. **Lagað eftir fyrsta deploy (lota 2):** (a) Vikusýn var sett í 7 dálka grid á breiðum skjá en `.app` er capp-að við 460px → dálkar krömdust og verkaheiti brotnuðu í einn staf á línu. **Fjarlægði grid-media-query — vikan er nú alltaf hrein lóðrétt agenda.** Alvöru breitt stundatöflu-grid á tölvu bíður (þarf að lyfta 460px-cappi + `overflow-x:hidden`). (b) **Stigataflan fellur nú saman sjálfgefið** (`GamePanel.jsx`) — sýnir bara haus + efsta mann (peek), smellur opnar hana (vistað í `korfan.lb.open`). Minnkar ringulreið fyrir ofan vikuna.

Staðfest: GameGuide þýðist hreint (esbuild); öll breytt svæði í store/App/ListView/ScheduleForm yfirfarin host-megin (heil og jöfnuð). Heildarbygging enn ekki möguleg í Cowork (sama umhverfisbilun: Windows-`node_modules` + GitHub lokað af proxy + skemmdur git-index). **Deploy verður að koma frá þinni vél.**

22. **Íkonakerfi (úr handoff frá öðrum þræði, lota 7).** Stílhreint íkonakerfi: blár fleti + hvít lína. `src/data/icons.jsx` — `CatIcon`. **Uppfært lota 8: notar nú `@tabler/icons-react`** (MIT, þunn lína) í stað ~9 handteiknaðra: `pickIcon(name, dept)` mappar **hundruð íslenskra vöruheita → ákveðin Tabler-íkon** (mjólk→milk, banani→apple, kjúklingur→meat, klósettpappír→toilet-paper o.s.frv.), fellur á deild-íkon, svo `IconShoppingBag`. **ATH: þarf `npm install @tabler/icons-react` (komið í package.json) áður en byggt er.** Ef eitthvert íkona-nafn finnst ekki í Tabler-útgáfunni gefur byggingin skýra villu — einnar-línu lagfæring. `ListView` sýnir nú **flokkaíkon þegar innkaupavara hefur enga alvöru ljósmynd** (í stað þess að sýna ekkert / gömlu `generic_images` sem voru hvort eð er ónotuð í framenda). CSS `.cat-icon`. **Pallettu-tiltekt (gert):** `--accent`/`--info` færð í navy `#15315e` (sameinar bláa tóninn — ein breyta, auðvelt að afturkalla). Nýr `--done: #2ed3a4` (grænn = AÐEINS „búið") á öll hök (itemRow, wk-check, shopmode, ing-check, shelf-check). Stig (`.lb-points`, `.home-ach b`) í gull. Íkon líka í innkaupa-tillögum, **Vöruhillu** (CatIcon `fill` í stað `productEmoji`) og **Verslunarham** (ShoppingMode). `CatIcon` styður nú `fill`-stillingu (`.cat-icon-fill`). Óprófað í Cowork.
    - **Úr sama handoff, EKKI gert (vantar skrár):** áminningar-fídus (push) — gagnamódel + öryggisherðing eru komin í loftið, en `send-reminders.ts` (Edge Function), `reminders-client.ts` og `reminders-migration.sql` fylgdu ekki með. Deploya Edge Function + VAPID-lyklar + client-push þarf að koma þaðan. Líka: kveikja á „Leaked password protection" í Supabase-dashboard (handvirkt).

## Hugmyndir / síðar (minnislisti)
- **Hóp-/vinnustofu-eining (workspace) fyrir vinnustaði/húsfélög/félög.** Í dag er „hópur" = deildur listi (list_members). Vantar: ein hóp-eining með föstum meðlimalista + hlutverk (admin/meðlimur) sem á MARGA lista (svo húsfélag deili ekki hverjum lista fyrir sig). Breiðari B2B-ish markaður — en fókus-spenna við neytenda-heimili.
- **Vöruafbrigði / einingar (Pepsi 0,5L / 2L / 300ml).** Í dag: frjáls magn+eining reitur á lista, og hver strikamerkt stærð er sín eigin vara. Vantar skipulagt afbrigða-líkan (ein vara → margar stærðir) — verðmætt fyrir (a) verðsamanburð per einingu í bókhaldi og (b) tilteknar SKU-ur í retail-media/kostuðum vörum.
- **Tekjumódel (Tally frítt fyrir notendur).** Skoða: (1) freemium/premium eða borga-per-skann, (2) **retail media / kostaðar innkaupa-tillögur** — sterkasta náttúrulega leiðin, þegar sáð (Ölgerðin/„kostað"), samhengis-ríkt af því þetta er innkaupa-app, (3) **cashback/afsláttarsamstarf** (Fetch-módel — kvittun staðfestir kaup → vörumerki borga, notandi fær cashback), (4) samansafnað nafnlaust kaupgagn (verðmætt EN persónuvernd/GDPR-jarðsprengja, aðeins opt-in), (5) fjármála-tilvísanir síðar, (6) B2B/leyfa OCR-vélina. **Kjarna-spenna: privacy-first vs gagna-monetization — velja lane.** Ráðlegging: leiða með #2 + #3 + létt #1. Næsta skref: tekjumódel-skissa (fríir vs premium fídusar) + privacy-pósitionering sem leyfir retail media + cashback án trausts-brots.
- **Bókhalds-fleygur fyrir útlönd + samkeppni.** Sjá `samkeppni-bokhald.md`. Lykilatriði: risarnir (YNAB/Monarch/Rocket Money) gera EKKI línuliði → glufa raunveruleg, EN **Yomio** er sterkur (línuliðir + fjölskyldu-deiling + AI + 50 lönd + 85k umsagnir). Raunverulegur varnarmúr Tally = **heildar-heimilis-OS** (listar + verk + krakka-gamification + bókhald), sem ekkert hreint kvittana-app hefur. Fleygur: leiða með bókhaldi sem krók, aðgreina á samþættingu (verk→verðlaun→útgjöld) + barnafjölskyldum / einum vel-staðfærðum markaði.
- **Alþjóðleg útrás — skoða SÍÐAR.** Ákvörðun: einbeita okkur að Íslandi fyrst (lítill, hraður prófunarvöllur; sanna retention + orðspor). Þegar/ef við skoðum útrás: gera alvöru samkeppnis- og markaðsgreiningu (keppinautar: Cozi, Bring!, AnyList, Splitwise, Greenlight, OurHome; verðlagning; glufur), velja EINN skarpan fleyg (t.d. krakka-verk+verðlaun eða „kvittun→flokkað bókhald" galdurinn) og einn enskumælandi brúarhaus, og staðfæra kvittana-/vörugögn per markað.
- **Bókhald V2:** „hver borgaði hvað" + skuldajöfnun (deildir hópar/ferðalög/veislur). Síðar: ójöfn/sérsniðin skipting.
- **Stjórnenda-skilaboð** (messages-tafla) svo hægt sé að senda skilaboð á notendur úr stjórnborði.

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
