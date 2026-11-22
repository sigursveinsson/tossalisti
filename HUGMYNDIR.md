# Tossalisti (áður Körfan) — framtíðarhugmyndir (roadmap)

Stefna: víkka úr innkaupalista í almennt lista-/to-do-app — „Tossalisti".
Matarinnkaup = tekjukjarni (heildsalar/auglýsingar). Verkefnalistar = vaxtarvél.
Lén: tossalisti.is.

Hugmyndir fyrir seinni tíma þróun, með mati á gerlegleika.
Flokkun: 🟢 einfalt · 🟡 gerlegt, krefst vinnu · 🟠 háð gögnum/samningum

---

## Tekjur / auglýsingar

### 🟢 Styrktar auglýsingar frá heildsölum
Samhengisdrifið: notandi leitar/bætir við vöru → kostuð vara birtist efst, skýrt merkt.
- Þarf: gagnalíkan fyrir auglýsingar (leitarorð/flokkur → auglýsandi → vara/tilboð).
- Lagalegt: samhengisauglýsingar (engin persónurakning) eru einfaldar undir GDPR.
- Regla: kostuð vara alltaf merkt; raunverulegir valkostir áfram sýnilegir (hlutleysi + traust).

### 🟢 Styrktar auglýsingar frá búðum
Sama vélin og að ofan. Verslun borgar fyrir leitarorð/flokk eða tilboðspláss.

### 🟢 Auglýsingabanner efst á síðu
Tæknilega smátt. Varúð: má ekki yfirgnæfa notagildið — best að nota sparlega
og helst sem raunveruleg tilboð frekar en almennar auglýsingar.

---

## Gervigreind

### 🟡 Sækja uppskrift af vefsíðu → AI les → býr til lista
Notandi límir slóð á uppskrift → bakendi sækir síðuna → LLM dregur út hráefni
→ hráefnin flokkast sjálfkrafa í deildir og fara á lista.
- Þarf: lítið bakendafall (t.d. Supabase Edge Function) sem kallar á LLM (Claude/OpenAI).
- Kostnaður: lítill per uppflettingu.
- Fyrirvarar: sumar síður loka á sjálfvirkan lestur eða eru með áskriftarvegg;
  þarf að höndla mælieiningar og magn snyrtilega.

---

## Gögn frá birgjum

### 🟠 Sækja vörulista frá heildsölum
Kemur í stað/útvíkkar `src/data/products.js` með raunverulegu vöruúrvali
(nöfn, vörumerki, myndir, strikamerki, flokkun).
- Tæknin auðveld; ræðst af formi gagna (CSV / Excel / API).
- Raunverulega vinnan: samningar og gæði/viðhald gagna.
- Ávinningur: appið verður margfalt ríkara og raunverulega íslenskt (samkeppnisvörn).

### 🟠 Sækja vörulista OG verð frá búðum
Sterkasti eiginleikinn — gerir verðsamanburð mögulegan.
- Tæknilega hægt en erfiðast í framkvæmd.
- Þarf reglulega samstillingu (verð breytast oft) — helst API/gagnastraum frá búð,
  eða leyfi til að lesa verð.
- Mjög háð samstarfi við verslanir. „Heilagur gral" — geyma þar til grunnurinn stendur.

---

## Tossalisti-útvíkkun (almennir verkefnalistar)

### 🟢 Lista-tegundir
'Innkaup' (sjálfvirk deildaflokkun) vs 'verkefni' (einfaldur gátlisti, engin búðarflokkun).
Bæta `type` dálki á lists. Lætur báðar upplifanir lifa saman án þess að þynna matarhlutann.

### 🟢 Ábyrgðarmaður á liði
Bæta assignee (user_id) á list_items, sýna hver ber ábyrgð, sía „mín verkefni". Byggir á list_members.

### 🟢 Haka við þegar lokið
Er þegar til (nýtist beint í verkefnalistum).

---

## Samvinna

### 🟢 Boðshlekkur í SMS
Deila lista með hlekk án þess að hinn þurfi fyrst að stofna reikning. Minnkar núning verulega
(núverandi deiling krefst þess að hinn sé skráður inn). Hár forgangur — deiling er kjarnavirðið.

### 🟡 Gjalddagi + áminningar / ýtitilkynningar
Tilkynning þegar liður nálgast gjalddaga eða þegar notanda er úthlutað verki. Nauðsynlegt um leið
og ábyrgð/gjalddagar koma. Þarf push-uppsetningu.

### 🟢 Athugasemdir / nótur við lið
Stutt spjall eða nóta per lið.

### 🟢 Virknisaga
„Anna bætti við og hakaði við mjólk" — gott á sameiginlegum listum.

---

## Hraður innsláttur

### 🟡 Raddinnsláttur
„Bættu við mjólk, brauði og eggjum" — frábært í búð.

### 🟠 Strikamerkjaskönnun
Skanna vöru til að bæta við. Tengist vörugögnum frá heildsölum.

### 🟢 Líma inn heilan lista
Margar línur í einu → margir liðir.

### 🟢 Endurteknir listar
T.d. „vikuinnkaup" sem býr sig til sjálft á mánudögum (byggir á afritun sem er til).

---

## Sniðmát (templates) — sterkt fyrir vöxt

### 🟢 Tilbúin sniðmát
Brúðkaupsgátlisti, flutningar, ferðataska, veislugátlisti. Kynnir ný notkunartilvik,
hjálpar nýjum notendum að byrja, dregur fólk inn fyrir annað en matarinnkaup.

---

## Innkaupasértækt

### 🟢 Magn og einingar
Við handvirkt innslátt (#11) og úr uppskriftum (komið). 250/500/1000 g fljótval.
### 🟢 Eigin röðun búðardeilda
Notandi raðar deildum eftir „sinni búð".
### 🟢 Staðalvörur
Vörur sem þú átt oftast, endurbæta með einum smelli.
### 🟠 Áætlað verð / heildarsumma
Tengist verðgögnum frá búðum.

---

## Verkefnasértækt

### 🟢 Undirverkefni
Gátlisti inni í lið.
### 🟢 Forgangur / fáni
### 🟡 Myndir / viðhengi
T.d. innblástur fyrir brúðkaup eða mynd af kvittun.

---

## Yfirsýn og skipulag

### 🟢 Leit þvert á alla lista
### 🟢 Geymsla (archive) á kláruðum listum
### 🟢 Sía „mín verkefni" þvert á lista

---

## Forgangsröðun (tillaga)

Eftir vinaprófun:
1. Boðshlekkur í SMS (minnkar núning við deilingu — kjarnavirðið).
2. Áminningar / tilkynningar (nauðsynlegt með gjalddögum og ábyrgð).
3. Sniðmát (ódýr leið að fleiri notendum með ný notkunartilvik).
4. Tossalisti-útvíkkun: lista-tegundir + ábyrgðarmenn.

Lengra fram:
5. Vörulisti frá heildsölum (gæði + grunnur að auglýsingum).
6. Styrktar auglýsingar (þegar notendur eru komnir).
7. AI-uppskriftalestur.
8. Strikamerki + verð frá búðum (langtímamarkmið, háð samstarfi).

## Bankafærslur + kvittanir — „betra en Meniga“ (16. nóv 2026)
Kjarninn (orð Óla í Ölgerðinni): Meniga segir „þú eyddir 12.400 kr. í Hagkaup“ — Tossalisti segir HVAÐ var keypt.
Staðsetning: ekki keppa við Meniga um bankaflokkun; vinna á samspilinu vörur (kvittanir) + heimili (sameiginlegir listar) + bankafærslur.
- Leið A (fyrst): CSV/Excel úr netbanka → para kortafærslur við kvittanir → „Vantar kvittun? 8.783 kr. í Bónus 7. nóv.“ Ekkert leyfi.
- Leið B (seinna): PSD2 í gegnum milliliða (Enable Banking / GoCardless ná til Landsbankans, Arion, Íslandsbanka; ekki indó). Þarf leyfi (eigið eða milliliðar) og endurnýjun samþykkis.
- Notkun: heildarbókhald, áskriftaleit, spá/launadagur, svikavörn og kortatengd endurgreiðsla fyrir Gríptu.
- Varúð: viðkvæmustu gögnin → skýrt samþykki, uppfærð persónuverndarstefna, engin auglýsingarakning.
- Söluefni: „Meniga segir hvar. Tossalisti segir hvað.“

## Vikumatseðill → innkaupalisti, með minni matarsóun (16. nóv 2026)
Kveikja: Bring! „Weekly meal planning“ (getbring.com/blog-posts/meal-planning-for-the-week-with-bring). Vikulegi vaninn sem vantar:
sunnudagur: plan → listi vikunnar → búð → kvittun → „vikan kostaði X“ (Bring! getur ekki síðasta skrefið).
Grunnur (lítið): „Á þetta til“ — afvelja hráefni áður en þau fara á listann. Sækja uppskrift af vef (hlekkur → AI les hráefni, vísar á uppruna).
Matarsóun — það sem Bring! gerir ekki:
- Plan sem nýtir hráefni milli daga: „Þú kaupir 1 kg hakk / heilan kjúkling / poka af spínati → mánudagur bolognese, miðvikudagur tacos, föstudagur afgangasúpa.“
- Pakkastærðir: listinn gerir ráð fyrir því sem fæst í búðinni (rjómi 250 ml) og stingur upp á rétti sem klárar afganginn.
- Afgangar: „Þú átt hálfan rjóma og papriku síðan á mánudag — hér eru 3 réttir.“ (út frá innkaupum síðustu daga úr kvittunum).
- Mæling: „Þessi vika: 2 hráefni nýtt í 3 réttum, áætlaður sparnaður ~1.800 kr.“
- Tenging við kvittanir: vitum hvað var keypt (ekki bara hvað var planað) → raunhæfari tillögur.
Tekjur seinna: uppskriftasamstarf (íslenskir matarbloggarar, vörumerki), eins og Bring! „recipe partners“.

## Krónan Public API (17. nóv 2026) — FORGANGUR
https://kronan.is/kronan-public-api · Swagger: https://api.kronan.is/api/v1/schema/swagger-ui/
Auðkenning: AccessToken sem notandinn býr til sjálfur á kronan.is (Auðkenni). REST/JSON, verð í heilum ISK.
Tækifæri: (1) kaupsaga → sjálfvirkt bókhald + „Oft keypt“ án skönnunar, (2) „Senda í Krónuna“: listi → karfa / Skannað og skundað,
(3) vöruupplýsingar: myndir, verð, vörumerki, næring → vörumyndir og útgáfur, (4) uppskriftir tengdar vörum og verði.
Athuga: skilmálar fyrir þriðja aðila app, öryggi lykla (dulkóðað á netþjóni, aldrei í vafra, aftenging), eignarhald á myndum/gögnum.
Næst: póstur til Krónunnar (kynning + skilmálar + samstarf); Sverrir býr til lykil og vistar sjálfur sem Supabase-leyndarmál til könnunar.

## Krónan — næstu hugmyndir (18. nóv nótt)
1. Vikumatseðill Krónunnar (meal-plans: autofill → ingredients → listi/karfa) + matarsóunarvinkill okkar.
2. Gönguröð búðar: shopping-notes/store-product-order raðar lista eftir Skannað og skundað-verslun.
3. Strikamerki → Krónuvara (products/barcode) í skannanum: rétt heiti, mynd og verð fyrir íslenskar vörur.
4. „Oft keypt“ + tilboð: tilkynning „Góðosturinn sem þú kaupir alltaf er −20% í Krónunni“.
5. Rödd → uppskrift: „taco fyrir sex“ leitar fyrst í uppskriftum Krónunnar (raunverulegar vörur) áður en AI býr til lista.
6. Uppáhaldsuppskriftir samstilltar (recipes/{slug}/favorite) — „Mínar Krónuuppskriftir“.
7. Kynning fyrir Krónuna: Tossalisti sem „rödd og heimilislisti“ ofan á Snjallverslun; samstarf um OAuth og kaupsögu úr búðum.

## Heimilisverkefni / „Home improvement“-listi (19. nóv 2026) — samstarf við JYSK, Húsasmiðjuna, Byko, Rúmfó, Elko
Sverrir: „Home improvement listi sem JYSK og Húsasmiðjan gætu tengst.“
- Ný listategund „Verkefni heimilisins“: t.d. „Mála barnaherbergið“, „Nýtt svefnherbergi“, „Pallurinn í vor“.
- Sniðmát með efnislista (málning, rúllur, límband / dýna, sængurver, gardínur) — rödd: „ég ætla að mála 12 fermetra herbergi“ → efnislisti með magni.
- Verslun tengist vörum á listanum (eins og Krónan): vörunúmer, verð, tilboð, „frátekið/sótt“ (Smellt og sótt hjá JYSK).
- Kvittanir tengjast verkefninu → kostnaður verkefnisins + ábyrgð/skilafrestur sjálfkrafa (dýna, sófi, verkfæri).
- Fyrirmynd: Jula + Kivra í Svíþjóð (heimilis-/verkfæraverslun sendir kvittanir í sameiginlegt app).
- Gildi fyrir verslunina: kemst á listann ÁÐUR en fólk velur búð; fyrir okkur: dýrari vörur, ábyrgðir, sterkari ástæða til að koma aftur.
- Fyrsta skref (ódýrt): sniðmát fyrir 3–5 verkefni + kvittun tengd verkefni. Svo kynning fyrir JYSK/Húsasmiðjunni með notkunartölum.

## Rekstraraðili / félag (19. nóv 2026) — ÓÁKVEÐIÐ
- Wonder ehf. (Sverrir 49%, meðeigandi í Kína 51%) stendur í persónuverndarstefnu og á forsíðu, en félagið er tómt: hefur ekkert greitt, enga samninga gert, ekkert skriflegt um Tossalista. Allir aðgangar (lén, Netlify, Supabase, GitHub, Resend, Meta) eru á nafni Sverris.
- Ákvörðun núna: Wonder stendur áfram í textunum.
- Áður en app-umsóknir (Apple/Google, D-U-N-S) og fyrsti samningur fara inn: ákveða félag (nýtt ehf. í 100% eigu / kaupa meðeiganda út / kaupréttur), fá skriflega yfirlýsingu frá meðeiganda, stuttur fundur með lögmanni.
- Þegar nýtt félag er komið: skipta um nafn+kt. í personuvernd.html, Auth.jsx (landing-legal), tölvupóstum; tilkynna notendum.

## Staðsetning: „Kvittanir beint í heimilisbókhaldið“ (20. nóv 2026)
Sverrir: markaðssetja eins og Landsbankinn gerir fyrir fyrirtæki („Kvittanir beint í bókhaldið“, viðhengi við kortafærslur), nema fyrir einstaklinga/heimili.
- Landsbankinn (fyrirtæki): mynd af kvittun hengd við kortafærslu, skýring, færslulykill, tenging við Business Central; „hnipp“ við greiðslu; gögn geymd í 3 ár. Les EKKI vörurnar af kvittuninni.
- Tossalisti: les hverja línu, flokkar sjálft, ábyrgð/skilafrestur, virkar með öllum kortum og bönkum, fyrir heimili.
- Gögn 19.–20. nóv styðja þetta: nýir notendur skanna margar kvittanir á dag úr alls konar búðum (hljóðfæri, bókabúð, kaffihús), nota listana lítið.
- Hugmyndir: auglýsing „Kvittanir beint í heimilisbókhaldið“; „hnipp“ = áminning að kvöldi/eftir búðarferð; síðar tenging við bankafærslur (developers.landsbankinn.is / PSD2) til að para kvittun við færslu; hópar: heimili, einyrkjar/verktakar (útgjöld), húsfélög.

## Bankasamstarf (20. nóv 2026) — SAMÞYKKT STEFNA, EKKI BYRJAÐ
- Banki sem markaðs-/dreifingaraðili fyrir „kvittanir beint í heimilisbókhaldið“. Enginn einkaréttur (virkar með öllum kortum), engin persónugögn til bankans (aðeins samanteknar tölur).
- Röð: (1) kvittanaáhersla í 3–4 vikur, safna tölum (fjöldi sem skannar, tíðni, fjöldi verslana); (2) einnar síðu kynning; (3) tala við 2–3 samtímis (Landsbankinn, minni áskorendur/greiðsluöpp, kortafyrirtæki/færsluhirðar).
- Tengja við „Árið þitt í tölum“ (des/jan). Endurmeta um miðjan desember.

## Keppinautur: Memor (memor.my) — skoðað 20. nóv 2026
Íslenskt fjölskylduapp (PWA, ekki í App Store), „heimilið á einum rólegum stað“. Greidd áskrift: 14 dagar frítt, svo 1.790 kr/mán, 8.900 kr/6 mán, 14.900 kr/12 mán (endurnýjast ekki sjálfkrafa, greitt um Teya). Gjafakort.
Hefur: sameiginlegt dagatal (Google/Apple/Outlook + mynd af mánaðarplani leikskóla), matseðil vikunnar → innkaupalisti, uppskriftir (skjáskot/mynd/hlekkur), heimilisverk, sjónrænt skipulag fyrir börn (stjörnur/verðlaun), veggskjá fyrir spjaldtölvu, fjármál (fastir reikningar, tekjur, sparnaðarmarkmið, handskráð, ekki tengt banka), áminningar.
Hefur EKKI (skv. síðunni): kvittanaskönnun, sjálfvirka flokkun vörulína, ábyrgðir/skilafrest, rödd, vöruleit/verð, tengingu við verslanir.
Lærdómur: (1) fólk borgar fyrir heimilisapp á Íslandi (verðpunktur 1.242–1.790 kr/mán); (2) okkar sérstaða = kvittanir → bókhald án innsláttar, frítt; (3) hugmyndir þaðan: matseðill vikunnar (þegar á lista), mynd af plani → dagatal, gjafakort, „endurnýjast ekki sjálfkrafa“, veggskjár.

## Markaðsdagatal (20. nóv 2026)
Skjal: https://claude.ai/artifact/P6pGkEXF7oHzT85oQB9Xwd — allir dagar nóv 2026–nóv 2027 með hugmynd, eiginleika og vægi.
- [ ] NÆST: Black Friday-færsla (fös. 27. nóv), tilbúin fim. 26. nóv. „Keyptirðu eitthvað á Black Friday? Taktu mynd af kvittuninni.“ Ábyrgð + skilafrestur. „Ókeypis. Alla daga, ekki bara á föstudaginn.“ Mynd í sama stíl og Sigga og Jón (markadsefni/bokhald_myndir.py).
- Svo: 1. des (mánaðamót, Sigga og Jón), jólainnkaup með rödd, skil á jólagjöfum + gjafakort í Veskið (27. des–6. jan), „Árið þitt í tölum“.

## Samkaup / Drangar (20. nóv 2026) — hugmynd, ekki byrjað
- Samkaup er hluti af Dröngum (með Orkunni, Lyfjavali; Heimkaup runnið inn); samið um kaup á rekstri Fjarðarkaupa (nóv 2026, bíður SE); stefnt á Kauphöll fyrir lok 2027.
- Sverrir: Nettó-appið sýnir bara tilboð og tengir Nettó-kortið við veski símans. Enginn listi, engin rödd, ekkert bókhald.
- EKKI hrein white label (hlutleysi milli verslana er kjarninn; lokar á Krónuna, banka, vörumerki). Frekar: (a) tenging eins og við Krónuna (tilboð/verð Nettó í Tossalista), (b) leyfi á vélinni (kvittanalestur, flokkun, rödd, listi) inn í þeirra app undir þeirra merki, (c) sjálfvirkar kvittanir úr kassakerfi.
- Áður: félagamálið (Wonder) á hreint; bíða svars Harðar hjá Krónunni; hafa tölur.

## „Mætt í búð“ — hraðlisti úr neysluhegðun (21. nóv 2026) — SEINNA
Sverrir: margir skipuleggja ekki innkaupin, fara bara í búðina. Hnappur „Mætt í búð“ → appið býr til hraðlista á staðnum, byggðan á kvittunum heimilisins.
- Grunnurinn er til: my_staples() / „Oft keypt“ (tíðni, „vantar líklega“).
- Viðbætur: velja búð (eða giska út frá staðsetningu/síðustu kvittun) → listi raðaður eftir deildum; „síðast X kr. í <búð>“ úr eigin kvittunum (ekkert API); haka af/bæta við með einum smelli; kvittun eftir á lokar hringnum (hakar við og uppfærir neysluna).
- Seinna: verðsamanburður milli búða úr kvittunum allra notenda (þarf fjölda, k≥5).
- Tengist: lok innkaupaferðar (pakki 2), kvittanaáhersla, „listinn kemur til notandans“.

## Dreifimiðar með QR → beint í kvittanaskannann (21. nóv 2026) — HUGMYND
Sverrir: flyerar sem hvetja fólk til að skanna kvittun. Styrkur: hittir fólk með kvittun í hendi (ólíkt Instagram).
- EKKI dreifa í Krónunni/Bónus/Nettó án leyfis (skemmir fyrir samstarfi). Í keðjum aðeins sem hluti af samstarfi (Samkaup/Drangar: standur við kassa; Nathan/Ölgerðin: hilla/vara).
- Staðir án keðjuleyfis: sjálfstæðar búðir og sérverslanir (Melabúðin, fiskbúðir, kjötbúðir), bakarí og kaffihús, vinnustaðir (kaffistofur), stúdentagarðar/HÍ/HR, húsfélög (anddyri), sundlaugar og líkamsrækt (auglýsingatöflur), bókasöfn, markaðir (Kolaportið, jólamarkaðir), bókarar/endurskoðendur til viðskiptavina.
- Samtök sem dreifa fyrir okkur: stéttarfélög (fréttabréf, félagsmenn og fjármál), Neytendasamtökin, foreldrafélög.
- Stafrænt jafngildi (ókeypis): Facebook-hópar um sparnað og mat (færsla frá Sverri sem einstaklingi, með Siggu og Jóni).
- Heima: ísskápssegull/límmiði „Kvittun? Taktu mynd“ — kvittanir enda heima.
- Þarf: hönnun (A6/A7, stíll Siggu og Jóns, QR), slóð t.d. tossalisti.is/k?m=<staður> sem hleypir gestum beint inn og opnar skannann (í dag aðeins fyrir FB/IG), mæling eftir stað.
- Prufa: 200–300 miðar á 2–3 stöðum í 1–2 vikur; mæla hlutfall sem skannar.
- Forgangsröð (21. nóv): (1) færsla í 1–2 Facebook-hópum um sparnað/mat (athuga reglur hópsins um kynningar), (2) miðar í 2–3 sjálfstæðum búðum/bakaríum þar sem Sverrir þekkir til, (3) jólamarkaður í desember (standa sjálfur með símann). Líka: blómabúðir, markaðir, stéttarfélög/Neytendasamtökin (fréttabréf).

## Kvittanalestur — næstu umbætur (21. nóv 2026)
- [ ] Afsláttur dreginn af réttri vöru: breyta prompti í parse-receipt svo afsláttarlína BEINT undir vöru (t.d. „Eldgrill+Coke -449“ undir Coca Cola) lækki verð þeirrar vöru; aðeins heildarafslættir fari í discount_total. Í dag: sér lína „Afsláttur −X“ (heild rétt, flokkar skekkjast). PRÓFA á mörgum kvittunum áður en sett í loftið (ekki á annadegi).
- [ ] Afrit af kvittunum sem lesast illa, til yfirferðar (Sverrir + Claude): 
      (a) stjórnandi: sjálfvirkt afrit þegar lestur mistekst eða línur stemma ekki við samtölu;
      (b) aðrir notendur: AÐEINS með samþykki — hnappur „Senda okkur myndina svo við getum lagað lesturinn“ á villuskjá; bæta við persónuverndarstefnu; einkageymsla, eytt eftir t.d. 30 daga; aðeins stjórnandi sér.
      Yfirferð: listi í stjórnborði (mynd + það sem gervigreindin las + check).
- Sverrir ætlar að skanna meira sjálfur (prófunargögn).

## Óskalisti úr vefverslunum („Vista á Tossalista“) — 21. nóv. 2026
Hugmynd Sverris: fólk safnar vörum í körfur á mörgum vefverslunum án þess að kaupa. Taka þær saman á einn lista.
- Skref 1 (lítið verk): líma slóð í listann → netþjónn sækir titil, mynd og verð (og:-merki / JSON-LD) → vara með mynd, verði og hlekk.
- Skref 2: „Deila“ í síma. Android: Web Share Target í PWA (Tossalisti birtist í deilivalmyndinni). iPhone: styður það ekki fyrir vefforrit; þar þarf líma-slóð eða Shortcut.
- Skref 3: vafraviðbót (Chrome/Edge, tölva) með hnappinum „Vista á Tossalista“. Bookmarklet sem millileið.
- Síðar: verðvakt („lækkaði um 20%“), tengist Black Friday og ábyrgðum/kvittunum. Affiliate-tekjur mögulegar.
- Óvissa: sumar verslanir loka á sjálfvirka sókn; verð ekki alltaf í lýsigögnum.

## Innhólf í appinu — 21. nóv. 2026
Skilaboð frá Tossalista inni í appinu (bjalla með rauðum punkti) í stað tölvupósts. Tafla announcements + lesið-merki á notanda.
Nýjungar, ráð („vissirðu að…“), og persónuleg skilaboð síðar (ábyrgð að renna út, X gekk í listann). Ekki sprettigluggi — grunnreglan gildir.

## Verðvakt — prófun á verðlestri 21. nóv. 2026
Heiti eiginleikans: **Verðvakt** („Límdu slóð á vöru. Við látum þig vita ef verðið lækkar.“). Ein vara prófuð í hverri verslun, sótt án JavaScript.
- Virkar með lýsigögnum einum (9 af 16): IKEA, JYSK/Rúmfatalagerinn, ILVA, Boozt, A4, Kubbabúðin, Nexus, Epal, Dimm.
- Verð í síðutexta en ekki lýsigögnum (6 af 16): ELKO, Icewear, Hagkaup, Lyfja, Heimkaup, Vistvera. Þarf JSON-LD eða gervigreindarlestur.
- Verð hlaðið með JavaScript: BYKO (og líklega Húsasmiðjan, ekki náðist á vörusíðu).
- Óprófað (prófunartólið komst ekki að): Lindex, H&M, 66°Norður, ASOS, Amazon.
- Gildrur: JYSK/ILVA hafa upphaflegt verð í og:price og tilboðsverð í product:sale_price; Epal skrifar „4.600“; röð tilboðs- og fulls verðs í texta er misjöfn.
- Ekki staðfest: JSON-LD (sást ekki í prófunartólinu); hegðun tilboðsverðs hjá A4, Kubbabúðinni, Nexus og Dimm.

## Óskalisti (sbr. oskar.gift) — 21. nóv. 2026
Næsta skref ofan á Verðvakt: listategundin „Óskalisti“, skoðunarhlekkur (amma opnar án þess að verða meðeigandi), frátekt sem eigandinn sér ekki. Forskot okkar: verðvakt á óskunum, kvittun/skilafrestur fylgir gjöfinni. Óskar (Aranja, 2022) er rótgróinn með verslunarsamstarf; ekki stilla okkur upp sem keppinaut heldur sem listategund.

## Takk (Hagar) tengir greiðslukort — 19. nóv. 2026
Hagkaup/Bónus: kort tengt Takk-appinu, Takk krónur safnast sjálfkrafa á Takk-vörur. Sama hugmynd og Gríptu (umbun fyrir tilteknar vörur) en án kvittunar og bundið við Haga. Rök fyrir Gríptu: virkar í öllum verslunum. Kortatenging er leið sem við ættum að skoða með banka (sjá bankahugmynd).

## „Árið þitt í tölum“ — FRESTAÐ til desember 2027 (ákveðið 22. nóv. 2026)
Flestir byrjuðu að skanna í nóvember 2026, svo yfirlit ársins segir of lítið. Smíða fyrir jólin 2027, þegar notendur eiga heilt ár af kvittunum. Fært í markaðsdagatalinu á 28.12.2027.
