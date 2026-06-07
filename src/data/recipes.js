// Byrjunarsafn af íslenskum hversdagsréttum.
// Hvert hráefni er { name, qty, unit } þar sem qty miðast við "serves" hér að neðan.
// qty: null þýðir "eftir smekk" (skalast ekki). name vísar í vöru sem flokkast sjálfkrafa.
export const RECIPES = [
  {
    id: 'bolognese',
    name: 'Spaghetti Bolognese',
    emoji: '🍝',
    time: '30 mín',
    serves: 4,
    ingredients: [
      { name: 'spaghetti', qty: 400, unit: 'g' },
      { name: 'nautahakk', qty: 500, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'hvítlaukur', qty: 2, unit: 'rif' },
      { name: 'niðursoðnir tómatar', qty: 400, unit: 'g' },
      { name: 'tómatpúrra', qty: 2, unit: 'msk' },
      { name: 'parmesanostur', qty: 50, unit: 'g' },
    ],
    steps: [
      'Saxaðu lauk og hvítlauk og steiktu í olíu á meðalhita þar til mjúkt.',
      'Bættu nautahakkinu við og brúnaðu það vel.',
      'Hrærðu tómatpúrru saman við og helltu niðursoðnum tómötum yfir.',
      'Láttu malla í 20 mínútur og kryddaðu með salti og pipar.',
      'Sjóddu spaghetti eftir leiðbeiningum og berðu fram með rifnum parmesan.',
    ],
  },
  {
    id: 'kjuklingur-ofn',
    name: 'Kjúklingur í ofni',
    emoji: '🍗',
    time: '45 mín',
    serves: 4,
    ingredients: [
      { name: 'kjúklingabringur', qty: 4, unit: 'stk' },
      { name: 'kartöflur', qty: 800, unit: 'g' },
      { name: 'paprika', qty: 2, unit: 'stk' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'ólífuolía', qty: 2, unit: 'msk' },
      { name: 'salt', qty: null, unit: 'eftir smekk' },
      { name: 'pipar', qty: null, unit: 'eftir smekk' },
    ],
    steps: [
      'Hitaðu ofninn í 200°C.',
      'Skerðu kartöflur, papriku og lauk í bita.',
      'Raðaðu kjúklingi og grænmeti í eldfast mót, dreyptu ólífuolíu yfir og kryddaðu með salti og pipar.',
      'Bakaðu í 40–45 mínútur þar til kjúklingurinn er gegnumsteiktur.',
    ],
  },
  {
    id: 'plokkfiskur',
    name: 'Plokkfiskur',
    emoji: '🐟',
    time: '35 mín',
    serves: 4,
    ingredients: [
      { name: 'ýsa', qty: 600, unit: 'g' },
      { name: 'kartöflur', qty: 600, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'mjólk', qty: 300, unit: 'ml' },
      { name: 'smjör', qty: 30, unit: 'g' },
      { name: 'hveiti', qty: 2, unit: 'msk' },
      { name: 'rúgbrauð', qty: null, unit: 'með' },
    ],
    steps: [
      'Sjóddu ýsu og kartöflur þar til meyrt. Saxaðu laukinn.',
      'Bræddu smjör í potti og steiktu laukinn mjúkan.',
      'Hrærðu hveiti saman við og helltu mjólk smám saman út í til að gera jafning.',
      'Settu fisk og kartöflur saman við, hitaðu í gegn og kryddaðu með salti og pipar.',
      'Berðu fram með rúgbrauði og smjöri.',
    ],
  },
  {
    id: 'ponnukokur',
    name: 'Pönnukökur',
    emoji: '🥞',
    time: '20 mín',
    serves: 6,
    ingredients: [
      { name: 'hveiti', qty: 250, unit: 'g' },
      { name: 'mjólk', qty: 500, unit: 'ml' },
      { name: 'egg', qty: 2, unit: 'stk' },
      { name: 'sykur', qty: 2, unit: 'msk' },
      { name: 'smjör', qty: 25, unit: 'g' },
    ],
    steps: [
      'Hrærðu saman hveiti, sykur og hluta af mjólkinni þar til kekklaust.',
      'Bættu eggjum og bræddu smjöri út í og þynntu með afganginum af mjólkinni.',
      'Steiktu þunnar pönnukökur á vel heitri pönnu, gylltar báðum megin.',
      'Berðu fram með sykri eða sultu og þeyttum rjóma.',
    ],
  },
  {
    id: 'kjotsupa',
    name: 'Kjötsúpa',
    emoji: '🍲',
    time: '90 mín',
    serves: 6,
    ingredients: [
      { name: 'lambakjöt', qty: 800, unit: 'g' },
      { name: 'kartöflur', qty: 500, unit: 'g' },
      { name: 'gulrætur', qty: 300, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'hrísgrjón', qty: 100, unit: 'g' },
      { name: 'salt', qty: null, unit: 'eftir smekk' },
    ],
    steps: [
      'Skerðu lambakjötið í bita, settu í pott með köldu vatni og fleyttu froðu ofan af þegar sýður.',
      'Bættu við söxuðum kartöflum, gulrótum og lauk.',
      'Settu hrísgrjón og salt út í og láttu malla í um 1 klukkustund.',
      'Smakkaðu til með salti áður en borið er fram.',
    ],
  },
  {
    id: 'taco',
    name: 'Tacó-kvöld',
    emoji: '🌮',
    time: '25 mín',
    serves: 4,
    ingredients: [
      { name: 'nautahakk', qty: 500, unit: 'g' },
      { name: 'paprika', qty: 1, unit: 'stk' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'tómatar', qty: 2, unit: 'stk' },
      { name: 'salat', qty: 1, unit: 'stk' },
      { name: 'rifinn ostur', qty: 150, unit: 'g' },
      { name: 'sýrður rjómi', qty: 1, unit: 'dós' },
    ],
    steps: [
      'Brúnaðu nautahakkið á pönnu og kryddaðu með tacó-kryddi.',
      'Saxaðu papriku, lauk, tómata og salat í skálar.',
      'Hitaðu tortillur og raðaðu öllu á borðið.',
      'Hver og einn setur saman sína tacó með osti og sýrðum rjóma.',
    ],
  },
  {
    id: 'lasagne', name: 'Lasagne', emoji: '🧀', time: '60 mín', serves: 6,
    ingredients: [
      { name: 'lasagnaplötur', qty: 250, unit: 'g' },
      { name: 'nautahakk', qty: 600, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'hvítlaukur', qty: 2, unit: 'rif' },
      { name: 'niðursoðnir tómatar', qty: 800, unit: 'g' },
      { name: 'rjómi', qty: 250, unit: 'ml' },
      { name: 'rifinn ostur', qty: 200, unit: 'g' },
    ],
    steps: [
      'Brúnaðu hakk með lauk og hvítlauk og helltu tómötum yfir; láttu malla í 15 mínútur.',
      'Raðaðu til skiptis kjötsósu, lasagnaplötum og rjóma í eldfast mót.',
      'Stráðu rifnum osti yfir og bakaðu við 180°C í um 40 mínútur.',
    ],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'heimapitsa', name: 'Heimagerð pítsa', emoji: '🍕', time: '40 mín', serves: 4,
    ingredients: [
      { name: 'pítsadeig', qty: 1, unit: 'stk' },
      { name: 'pítsasósa', qty: 150, unit: 'ml' },
      { name: 'rifinn ostur', qty: 250, unit: 'g' },
      { name: 'pepperóní', qty: 100, unit: 'g' },
      { name: 'paprika', qty: 1, unit: 'stk' },
      { name: 'sveppir', qty: 100, unit: 'g' },
    ],
    steps: [
      'Fletjaðu deigið út á bökunarpappír.',
      'Smyrðu pítsasósu yfir, dreifðu osti og áleggi.',
      'Bakaðu við 230°C í 10–12 mínútur þar til osturinn er gylltur.',
    ],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'kjuklingacurry', name: 'Kjúklingacurry', emoji: '🍛', time: '35 mín', serves: 4,
    ingredients: [
      { name: 'kjúklingabringur', qty: 600, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'hvítlaukur', qty: 2, unit: 'rif' },
      { name: 'karrímauk', qty: 2, unit: 'msk' },
      { name: 'kókosmjólk', qty: 400, unit: 'ml' },
      { name: 'hrísgrjón', qty: 300, unit: 'g' },
    ],
    steps: [
      'Steiktu lauk og hvítlauk, bættu við bituðum kjúklingi og brúnaðu.',
      'Hrærðu karrímauki saman við og helltu kókosmjólk yfir.',
      'Láttu malla í 15 mínútur og berðu fram með soðnum hrísgrjónum.',
    ],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'carbonara', name: 'Pasta Carbonara', emoji: '🍝', time: '25 mín', serves: 4,
    ingredients: [
      { name: 'spaghetti', qty: 400, unit: 'g' },
      { name: 'beikon', qty: 200, unit: 'g' },
      { name: 'egg', qty: 3, unit: 'stk' },
      { name: 'parmesanostur', qty: 80, unit: 'g' },
      { name: 'hvítlaukur', qty: 1, unit: 'rif' },
    ],
    steps: [
      'Sjóddu spaghetti. Steiktu beikon stökkt á pönnu.',
      'Hrærðu saman egg og rifinn parmesan í skál.',
      'Blandaðu heitu pasta við beikon, taktu af hita og hrærðu eggjablöndu saman við svo verði rjómakennt.',
    ],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'hamborgarar', name: 'Heimagerðir hamborgarar', emoji: '🍔', time: '30 mín', serves: 4,
    ingredients: [
      { name: 'nautahakk', qty: 600, unit: 'g' },
      { name: 'hamborgarabrauð', qty: 4, unit: 'stk' },
      { name: 'ostur', qty: 4, unit: 'sneiðar' },
      { name: 'tómatar', qty: 2, unit: 'stk' },
      { name: 'salat', qty: 1, unit: 'stk' },
      { name: 'laukur', qty: 1, unit: 'stk' },
    ],
    steps: [
      'Mótaðu hakkið í buff og kryddaðu með salti og pipar.',
      'Steiktu buffin á heitri pönnu, um 3–4 mínútur á hvorri hlið.',
      'Settu saman í brauð með osti, salati, tómötum og lauk.',
    ],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'chili', name: 'Chili con carne', emoji: '🌶️', time: '40 mín', serves: 6,
    ingredients: [
      { name: 'nautahakk', qty: 600, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'niðursoðnir tómatar', qty: 800, unit: 'g' },
      { name: 'baunir', qty: 400, unit: 'g' },
      { name: 'paprika', qty: 1, unit: 'stk' },
      { name: 'hrísgrjón', qty: 300, unit: 'g' },
    ],
    steps: [
      'Brúnaðu hakk með lauk og papriku.',
      'Bættu við tómötum og baunum og kryddaðu með chili og kúmeni.',
      'Láttu malla í 20–30 mínútur og berðu fram með hrísgrjónum.',
    ],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'pannulax', name: 'Pönnusteiktur lax', emoji: '🐟', time: '20 mín', serves: 4,
    ingredients: [
      { name: 'lax', qty: 600, unit: 'g' },
      { name: 'sítróna', qty: 1, unit: 'stk' },
      { name: 'smjör', qty: 30, unit: 'g' },
      { name: 'kartöflur', qty: 800, unit: 'g' },
      { name: 'brokkólí', qty: 1, unit: 'stk' },
    ],
    steps: [
      'Saltaðu laxinn og steiktu í smjöri, um 3–4 mínútur á hvorri hlið.',
      'Kreistu sítrónu yfir í lokin.',
      'Berðu fram með soðnum kartöflum og gufusoðnu brokkólí.',
    ],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'kjotbollur', name: 'Sænskar kjötbollur', emoji: '🍝', time: '40 mín', serves: 4,
    ingredients: [
      { name: 'nautahakk', qty: 500, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'raspur', qty: 50, unit: 'g' },
      { name: 'egg', qty: 1, unit: 'stk' },
      { name: 'rjómi', qty: 250, unit: 'ml' },
      { name: 'kartöflur', qty: 800, unit: 'g' },
    ],
    steps: [
      'Hrærðu saman hakk, saxaðan lauk, rasp og egg og mótaðu litlar bollur.',
      'Steiktu bollurnar gylltar á pönnu.',
      'Helltu rjóma út í og láttu malla í sósu; berðu fram með kartöflum.',
    ],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'graenmetissupa', name: 'Grænmetissúpa', emoji: '🥕', time: '35 mín', serves: 6,
    ingredients: [
      { name: 'gulrætur', qty: 400, unit: 'g' },
      { name: 'kartöflur', qty: 400, unit: 'g' },
      { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'sellerí', qty: 2, unit: 'stk' },
      { name: 'niðursoðnir tómatar', qty: 400, unit: 'g' },
    ],
    steps: [
      'Saxaðu allt grænmetið og steiktu lauk mjúkan í potti.',
      'Bættu við grænmeti, tómötum og vatni svo fljóti yfir.',
      'Sjóddu í 20–25 mínútur og kryddaðu með salti og pipar.',
    ],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'vofflur', name: 'Vöfflur', emoji: '🧇', time: '25 mín', serves: 4,
    ingredients: [
      { name: 'hveiti', qty: 300, unit: 'g' },
      { name: 'mjólk', qty: 400, unit: 'ml' },
      { name: 'egg', qty: 2, unit: 'stk' },
      { name: 'smjör', qty: 75, unit: 'g' },
      { name: 'lyftiduft', qty: 2, unit: 'tsk' },
    ],
    steps: [
      'Hrærðu saman þurrefni, bættu við mjólk, eggjum og bræddu smjöri.',
      'Bakaðu í vöfflujárni þar til gyllt.',
      'Berðu fram með sultu og rjóma.',
    ],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'bananabraud', name: 'Bananabrauð', emoji: '🍌', time: '60 mín', serves: 8,
    ingredients: [
      { name: 'banani', qty: 3, unit: 'stk' },
      { name: 'hveiti', qty: 300, unit: 'g' },
      { name: 'sykur', qty: 150, unit: 'g' },
      { name: 'egg', qty: 2, unit: 'stk' },
      { name: 'smjör', qty: 100, unit: 'g' },
      { name: 'lyftiduft', qty: 1, unit: 'tsk' },
    ],
    steps: [
      'Stappaðu banana og hrærðu saman við sykur, egg og bráðið smjör.',
      'Blandaðu hveiti og lyftidufti saman við.',
      'Helltu í form og bakaðu við 175°C í um 50 mínútur.',
    ],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'kjuklinganudlur', name: 'Kjúklinganúðlur (wok)', emoji: '🍜', time: '25 mín', serves: 4,
    ingredients: [
      { name: 'núðlur', qty: 300, unit: 'g' },
      { name: 'kjúklingabringur', qty: 500, unit: 'g' },
      { name: 'paprika', qty: 1, unit: 'stk' },
      { name: 'gulrætur', qty: 2, unit: 'stk' },
      { name: 'vorlaukur', qty: 3, unit: 'stk' },
      { name: 'sojasósa', qty: 3, unit: 'msk' },
    ],
    steps: [
      'Sjóddu núðlur eftir leiðbeiningum.',
      'Steiktu kjúkling í wok og bættu við niðurskornu grænmeti.',
      'Blandaðu núðlum og sojasósu saman við og hitaðu í gegn.',
    ],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'fiskurraspi', name: 'Fiskur í raspi', emoji: '🐟', time: '30 mín', serves: 4,
    ingredients: [
      { name: 'ýsa', qty: 600, unit: 'g' },
      { name: 'raspur', qty: 100, unit: 'g' },
      { name: 'egg', qty: 1, unit: 'stk' },
      { name: 'hveiti', qty: 50, unit: 'g' },
      { name: 'kartöflur', qty: 800, unit: 'g' },
    ],
    steps: [
      'Veltu fiskinum upp úr hveiti, svo eggi og loks raspi.',
      'Steiktu á pönnu þar til gyllt og stökkt báðum megin.',
      'Berðu fram með soðnum kartöflum og remúlaði.',
    ],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'grjonagrautur', name: 'Grjónagrautur', emoji: '🍚', time: '40 mín', serves: 4,
    ingredients: [
      { name: 'hrísgrjón', qty: 200, unit: 'g' },
      { name: 'mjólk', qty: 1000, unit: 'ml' },
      { name: 'kanill', qty: 1, unit: 'tsk' },
      { name: 'sykur', qty: 2, unit: 'msk' },
    ],
    steps: [
      'Sjóddu grjón í vatni í nokkrar mínútur.',
      'Bættu mjólk út í og sjóddu við vægan hita þar til þykkur, hrærðu reglulega.',
      'Berðu fram með kanilsykri.',
    ],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
]

// Skalar og formaterar magn miðað við stuðul (t.d. 6/4 = 1.5).
export function fmtQty(qty, unit, factor = 1) {
  if (qty == null) return unit // "eftir smekk", "með"
  let v = qty * factor
  if (unit === 'g' || unit === 'ml') v = v >= 100 ? Math.round(v / 10) * 10 : Math.round(v)
  else v = Math.round(v * 2) / 2
  const num = Number.isInteger(v) ? v : v.toFixed(1)
  return `${num} ${unit}`
}

// Texti fyrir innkaupalista, t.d. "nautahakk 750 g" eða bara "salt".
export function ingredientLine(ing, factor = 1) {
  if (ing.qty == null) return ing.name
  return `${ing.name} ${fmtQty(ing.qty, ing.unit, factor)}`
}
