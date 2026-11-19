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
