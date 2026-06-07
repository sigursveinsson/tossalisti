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
