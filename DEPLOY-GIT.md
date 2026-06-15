# Deploy & Git — flýtileiðir fyrir Tossalisti

Allar kóðabreytingar eru í þessari möppu þar til þú **byggir og ýtir**. Netlify
uppfærir tossalisti.is sjálfkrafa um leið og þú gerir `git push`.

## Venjulegur deploy (gera þetta í hvert sinn)

```bash
cd C:\Users\sigur\Documents\korfan
npm run build
git add -A
git commit -m "Lýsing á breytingu"
git push
```

Bíddu svo ~30–60 sek og endurhlaððu tossalisti.is (Ctrl+Shift+R fyrir harða endurhleðslu).

## Þegar nýjar pakkar (dependencies) bætast við

Ef ég segi „þetta þarf `npm install`" (ný dependency í `package.json`), bættu því
fremst — annars bregst byggingin:

```bash
cd C:\Users\sigur\Documents\korfan
npm install
npm run build
git add -A
git commit -m "Lýsing á breytingu"
git push
```

## Gagnlegar skipanir

| Skipun | Hvað hún gerir |
|---|---|
| `git status` | Sýnir hvaða skrár breyttust (óvistaðar) |
| `git diff` | Sýnir nákvæmlega hvað breyttist í kóðanum |
| `git log --oneline -10` | Síðustu 10 commit (saga) |
| `git pull` | Sækir breytingar (t.d. ef unnið á öðru tæki) |
| `npm run dev` | Keyrir appið staðbundið á `localhost` til að prófa fyrir deploy |

## Ef eitthvað klikkar

- **Byggingin bregst (`npm run build` villa):** lestu efstu villuna — oftast vantar
  `npm install`, eða innsláttarvilla í kóða.
- **„nothing to commit":** engar breytingar til að ýta — þú ert þegar uppfærður.
- **Ýting hafnað (`rejected`):** keyrðu `git pull` fyrst, svo `git push` aftur.
- **Sé ekki breytingu í appinu eftir deploy:** harð-endurhlaða (Ctrl+Shift+R) eða
  athuga á Netlify hvort byggingin hafi klárast.

## Gagnagrunnur (Supabase)

Töflur og gagnagrunnsföll (migrations) eru aðskilin frá þessum kóða og eru
yfirleitt **þegar komin í loftið** þegar ég læt þig vita. `git push` snýst bara um
frontend-kóðann — þú þarft ekki að gera neitt sérstakt fyrir gagnagrunninn.
