# Körfan 🧺

Íslenskur innkaupalisti með sjálfvirkri deildaflokkun og uppskriftum.
Vefur (React + Vite) með Supabase bakenda, tilbúinn til útgáfu á Netlify.

## Hvað er í boði

- Innkaupalisti með vörum sem þú hakar við / eyðir
- **Sjálfvirk flokkun** í búðardeildir, raðað í verslunarröð
- Tillögur við innslátt úr íslensku vöruorðasafni
- **Uppskriftir → listi** með einum smelli (rétt flokkuð hráefni)
- Virkar staðbundið strax, eða með Supabase fyrir marga notendur + deilingu

## Keyra á eigin tölvu

```bash
npm install
npm run dev
```

Opnaðu http://localhost:5173 — appið virkar strax (gögn vistast í vafranum).

## Setja upp Supabase (fyrir notendur, deilingu og rauntíma)

1. Búðu til verkefni á https://supabase.com (ókeypis þrep dugar til að byrja).
2. Farðu í **SQL Editor**, límdu inn `supabase/schema.sql` og keyrðu (Run).
3. Farðu í **Project Settings → API** og afritaðu `Project URL` og `anon public` lykilinn.
4. Afritaðu `.env.example` í `.env` og settu gildin inn:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Endurræstu `npm run dev`. Nú þarf innskráningu (tölvupóst-hlekkur) og gögn fara í gagnagrunninn.

## Gefa út á Netlify

1. Settu kóðann á GitHub (`git init`, commit, push í nýtt repo).
2. Á https://netlify.com → **Add new site → Import from GitHub**, veldu repo-ið.
3. Build-stillingar lesast sjálfkrafa úr `netlify.toml` (build: `npm run build`, publish: `dist`).
4. Bættu við umhverfisbreytum í **Site settings → Environment variables**:
   `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY`.
5. Deploy. (Mundu að bæta Netlify-slóðinni við **Supabase → Authentication → URL Configuration**.)

## Næstu skref

- Deiling lista milli notenda (skemað styður það — vantar viðmót)
- Raunverulegt vöruúrval með myndum frá heildsölum (kemur í stað `src/data/products.js`)
- Kostaðar/merktar vörur í leit (tekjumódel)
- Native öpp (iOS/Android) með React Native + sama Supabase bakenda

## Skipulag

```
src/
  data/        departments.js · products.js (orðasafn) · recipes.js
  lib/         supabaseClient.js · store.js (staðbundið + ský)
  components/  ListView · RecipesView · Auth
  App.jsx
supabase/
  schema.sql   töflur + RLS öryggi
netlify.toml
```
