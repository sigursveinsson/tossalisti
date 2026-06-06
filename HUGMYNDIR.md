# Körfan — framtíðarhugmyndir (roadmap)

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

## Forgangsröðun (tillaga)

1. Klára kjarnann + Supabase (innskráning, deiling, rauntími) — í vinnslu.
2. Vörulisti frá heildsölum (gæði appsins + grunnur að auglýsingum).
3. Styrktar auglýsingar (þegar notendur eru komnir).
4. AI-uppskriftalestur (sterkt aðdráttarafl fyrir nýja notendur).
5. Verð frá búðum (langtímamarkmið, mest háð samstarfi).
