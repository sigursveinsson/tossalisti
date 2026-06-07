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
  {
    id: 'kjuklingasupa', name: 'Kjúklingasúpa', emoji: '🍲', time: '40 mín', serves: 4,
    ingredients: [
      { name: 'kjúklingabringur', qty: 400, unit: 'g' }, { name: 'gulrætur', qty: 2, unit: 'stk' },
      { name: 'sellerí', qty: 2, unit: 'stk' }, { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'núðlur', qty: 150, unit: 'g' }, { name: 'kjúklingakraftur', qty: 1, unit: 'stk' },
    ],
    steps: [
      'Steiktu lauk, gulrætur og sellerí mjúk í potti.',
      'Bættu við bituðum kjúklingi, vatni og kjúklingakrafti.',
      'Sjóddu í 15 mín, settu núðlur út í og sjóddu þar til meyrar.',
    ],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'tikkamasala', name: 'Kjúklinga tikka masala', emoji: '🍛', time: '40 mín', serves: 4,
    ingredients: [
      { name: 'kjúklingabringur', qty: 600, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'hvítlaukur', qty: 2, unit: 'rif' }, { name: 'niðursoðnir tómatar', qty: 400, unit: 'g' },
      { name: 'matreiðslurjómi', qty: 200, unit: 'ml' }, { name: 'karrímauk', qty: 2, unit: 'msk' },
      { name: 'hrísgrjón', qty: 300, unit: 'g' },
    ],
    steps: [
      'Brúnaðu kjúkling og taktu frá. Steiktu lauk og hvítlauk.',
      'Hrærðu karrímauki saman við, helltu tómötum og rjóma yfir.',
      'Settu kjúkling aftur út í og láttu malla í 15 mín. Berðu fram með hrísgrjónum.',
    ],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'padthai', name: 'Pad Thai', emoji: '🍜', time: '30 mín', serves: 4,
    ingredients: [
      { name: 'núðlur', qty: 300, unit: 'g' }, { name: 'kjúklingabringur', qty: 400, unit: 'g' },
      { name: 'egg', qty: 2, unit: 'stk' }, { name: 'gulrætur', qty: 2, unit: 'stk' },
      { name: 'vorlaukur', qty: 3, unit: 'stk' }, { name: 'jarðhnetur', qty: 50, unit: 'g' },
      { name: 'sojasósa', qty: 3, unit: 'msk' },
    ],
    steps: [
      'Leggðu núðlur í bleyti eða sjóddu eftir leiðbeiningum.',
      'Steiktu kjúkling, ýttu til hliðar og hrærðu eggjum á pönnunni.',
      'Bættu núðlum, grænmeti og sojasósu við, toppaðu með söxuðum jarðhnetum.',
    ],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'saltkjot', name: 'Saltkjöt og baunir', emoji: '🥘', time: '90 mín', serves: 6,
    ingredients: [
      { name: 'saltkjöt', qty: 1200, unit: 'g' }, { name: 'gular baunir', qty: 500, unit: 'g' },
      { name: 'gulrófa', qty: 1, unit: 'stk' }, { name: 'kartöflur', qty: 800, unit: 'g' },
    ],
    steps: [
      'Leggðu baunir í bleyti yfir nótt og sjóddu þær meyrar með bitaðri rófu.',
      'Sjóddu saltkjötið í potti í um 1 klst.',
      'Berðu fram saltkjöt með baunastöppu og soðnum kartöflum.',
    ],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'hamborgarahryggur', name: 'Hamborgarahryggur', emoji: '🍖', time: '120 mín', serves: 8,
    ingredients: [
      { name: 'hamborgarahryggur', qty: 2000, unit: 'g' }, { name: 'ananas í dós', qty: 1, unit: 'dós' },
      { name: 'kartöflur', qty: 1200, unit: 'g' }, { name: 'rauðkál', qty: 1, unit: 'krukka' },
      { name: 'matreiðslurjómi', qty: 250, unit: 'ml' },
    ],
    steps: [
      'Sjóddu hrygginn varlega í um 1 klst, taktu úr og settu í ofn.',
      'Penslaðu með gljáa og raðaðu ananas yfir; bakaðu við 180°C í 20–30 mín.',
      'Berðu fram með brúnuðum kartöflum, rauðkáli og sósu.',
    ],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'graenmetislasagne', name: 'Grænmetislasagne', emoji: '🧀', time: '60 mín', serves: 6,
    ingredients: [
      { name: 'lasagnaplötur', qty: 250, unit: 'g' }, { name: 'kúrbítur', qty: 1, unit: 'stk' },
      { name: 'eggaldin', qty: 1, unit: 'stk' }, { name: 'paprika', qty: 1, unit: 'stk' },
      { name: 'niðursoðnir tómatar', qty: 800, unit: 'g' }, { name: 'rifinn ostur', qty: 200, unit: 'g' },
    ],
    steps: [
      'Steiktu niðurskorið grænmeti og helltu tómötum yfir; kryddaðu.',
      'Raðaðu til skiptis grænmetissósu, lasagnaplötum og osti í mót.',
      'Bakaðu við 180°C í um 40 mín.',
    ],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'pylsurettur', name: 'Pylsuréttur', emoji: '🌭', time: '25 mín', serves: 4,
    ingredients: [
      { name: 'pasta', qty: 400, unit: 'g' }, { name: 'vínarpylsur', qty: 8, unit: 'stk' },
      { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'niðursoðnir tómatar', qty: 400, unit: 'g' },
      { name: 'rifinn ostur', qty: 150, unit: 'g' },
    ],
    steps: [
      'Sjóddu pasta. Steiktu lauk og bitaðar pylsur.',
      'Helltu tómötum yfir og láttu malla stutt.',
      'Blandaðu pasta saman við, settu í mót, stráðu osti yfir og bakaðu þar til bráðið.',
    ],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'nautasteik', name: 'Nautasteik með bökuðum kartöflum', emoji: '🥩', time: '40 mín', serves: 4,
    ingredients: [
      { name: 'nautalund', qty: 600, unit: 'g' }, { name: 'kartöflur', qty: 800, unit: 'g' },
      { name: 'smjör', qty: 40, unit: 'g' }, { name: 'hvítlaukur', qty: 2, unit: 'rif' },
      { name: 'sveppir', qty: 200, unit: 'g' },
    ],
    steps: [
      'Bakaðu kartöflur í ofni. Steiktu sveppi í smjöri með hvítlauk.',
      'Steiktu nautalundina á heitri pönnu eftir smekk og láttu hvíla.',
      'Berðu fram með kartöflum, sveppum og sósu.',
    ],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'tacosupa', name: 'Tacósúpa', emoji: '🌮', time: '30 mín', serves: 6,
    ingredients: [
      { name: 'nautahakk', qty: 500, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' },
      { name: 'niðursoðnir tómatar', qty: 400, unit: 'g' }, { name: 'nýrnabaunir', qty: 400, unit: 'g' },
      { name: 'maís', qty: 1, unit: 'dós' }, { name: 'taco krydd', qty: 1, unit: 'pk' },
      { name: 'rifinn ostur', qty: 150, unit: 'g' },
    ],
    steps: [
      'Brúnaðu hakk með lauk og taco-kryddi.',
      'Bættu við tómötum, baunum, maís og vatni; láttu malla í 15 mín.',
      'Berðu fram með rifnum osti og sýrðum rjóma.',
    ],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'skuffukaka', name: 'Skúffukaka', emoji: '🍫', time: '40 mín', serves: 12,
    ingredients: [
      { name: 'hveiti', qty: 300, unit: 'g' }, { name: 'sykur', qty: 300, unit: 'g' },
      { name: 'kakó', qty: 4, unit: 'msk' }, { name: 'egg', qty: 2, unit: 'stk' },
      { name: 'smjör', qty: 150, unit: 'g' }, { name: 'mjólk', qty: 250, unit: 'ml' },
    ],
    steps: [
      'Hrærðu saman þurrefni, bættu við eggjum, bræddu smjöri og mjólk.',
      'Helltu í skúffu og bakaðu við 180°C í um 20 mín.',
      'Settu súkkulaðikrem yfir kalda kökuna og stráðu kókos yfir.',
    ],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'eplakaka', name: 'Eplakaka', emoji: '🍎', time: '50 mín', serves: 8,
    ingredients: [
      { name: 'epli', qty: 4, unit: 'stk' }, { name: 'hveiti', qty: 200, unit: 'g' },
      { name: 'sykur', qty: 150, unit: 'g' }, { name: 'smjör', qty: 100, unit: 'g' },
      { name: 'egg', qty: 2, unit: 'stk' }, { name: 'kanill', qty: 1, unit: 'tsk' },
    ],
    steps: [
      'Skerðu epli í báta og raðaðu í smurt form, stráðu kanil yfir.',
      'Hrærðu deig úr smjöri, sykri, eggjum og hveiti og helltu yfir eplin.',
      'Bakaðu við 180°C í um 35 mín. Berðu fram með rjóma.',
    ],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'boost', name: 'Berjaboost', emoji: '🥤', time: '5 mín', serves: 2,
    ingredients: [
      { name: 'frosin ber', qty: 200, unit: 'g' }, { name: 'banani', qty: 1, unit: 'stk' },
      { name: 'jógúrt', qty: 200, unit: 'ml' }, { name: 'mjólk', qty: 200, unit: 'ml' },
    ],
    steps: [
      'Settu öll hráefni í blandara.',
      'Blandaðu þar til silkimjúkt.',
      'Helltu í glös og berðu fram strax.',
    ],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'fiskibollur', name: 'Fiskibollur', emoji: '🐟', time: '35 mín', serves: 4,
    ingredients: [{ name: 'ýsa', qty: 700, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'egg', qty: 1, unit: 'stk' }, { name: 'hveiti', qty: 3, unit: 'msk' }, { name: 'mjólk', qty: 100, unit: 'ml' }, { name: 'kartöflur', qty: 800, unit: 'g' }],
    steps: ['Hakkaðu fiskinn með lauk.', 'Hrærðu hveiti, eggi og mjólk saman við og mótaðu bollur.', 'Steiktu gylltar og berðu fram með soðnum kartöflum.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'ysa-ofni', name: 'Ýsa í ofni', emoji: '🐟', time: '30 mín', serves: 4,
    ingredients: [{ name: 'ýsa', qty: 700, unit: 'g' }, { name: 'rifinn ostur', qty: 100, unit: 'g' }, { name: 'tómatar', qty: 2, unit: 'stk' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'matreiðslurjómi', qty: 200, unit: 'ml' }],
    steps: ['Raðaðu fiski í eldfast mót.', 'Dreifðu lauk og tómötum yfir, helltu rjóma og stráðu osti.', 'Bakaðu við 200°C í um 25 mín.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'lambalaeri', name: 'Lambalæri', emoji: '🍖', time: '150 mín', serves: 6,
    ingredients: [{ name: 'lambalæri', qty: 2000, unit: 'g' }, { name: 'hvítlaukur', qty: 4, unit: 'rif' }, { name: 'rósmarín', qty: 1, unit: 'búnt' }, { name: 'kartöflur', qty: 1200, unit: 'g' }, { name: 'gulrætur', qty: 4, unit: 'stk' }],
    steps: ['Kryddaðu lærið með hvítlauk, rósmaríni, salti og pipar.', 'Bakaðu við 160°C í um 2 klst.', 'Berðu fram með bökuðu grænmeti og sósu.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'lambakotilettur', name: 'Lambakótilettur', emoji: '🍖', time: '30 mín', serves: 4,
    ingredients: [{ name: 'lambakótilettur', qty: 800, unit: 'g' }, { name: 'hvítlaukur', qty: 2, unit: 'rif' }, { name: 'kartöflur', qty: 800, unit: 'g' }, { name: 'brokkólí', qty: 1, unit: 'stk' }, { name: 'smjör', qty: 30, unit: 'g' }],
    steps: ['Kryddaðu kótiletturnar og steiktu á heitri pönnu.', 'Sjóddu kartöflur og brokkólí.', 'Berðu fram með smjöri.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'grisakotilettur', name: 'Grísakótilettur í rjómasósu', emoji: '🥘', time: '35 mín', serves: 4,
    ingredients: [{ name: 'svínakótilettur', qty: 800, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'sveppir', qty: 200, unit: 'g' }, { name: 'matreiðslurjómi', qty: 250, unit: 'ml' }, { name: 'hrísgrjón', qty: 300, unit: 'g' }],
    steps: ['Brúnaðu kótiletturnar og taktu frá.', 'Steiktu lauk og sveppi, helltu rjóma og settu kjötið aftur út í.', 'Láttu malla og berðu fram með hrísgrjónum.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'kjuklingasalat', name: 'Kjúklingasalat', emoji: '🥗', time: '20 mín', serves: 4,
    ingredients: [{ name: 'kjúklingabringur', qty: 400, unit: 'g' }, { name: 'jöklasalat', qty: 1, unit: 'stk' }, { name: 'tómatar', qty: 2, unit: 'stk' }, { name: 'gúrka', qty: 1, unit: 'stk' }, { name: 'fetaostur', qty: 100, unit: 'g' }, { name: 'ólífuolía', qty: 2, unit: 'msk' }],
    steps: ['Steiktu kjúkling og skerðu í bita.', 'Saxaðu salat, tómata og gúrku.', 'Blandaðu öllu með fetaosti og ólífuolíu.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'caesar', name: 'Caesar salat', emoji: '🥗', time: '20 mín', serves: 4,
    ingredients: [{ name: 'jöklasalat', qty: 1, unit: 'stk' }, { name: 'kjúklingabringur', qty: 400, unit: 'g' }, { name: 'parmesanostur', qty: 50, unit: 'g' }, { name: 'brauð', qty: 2, unit: 'sneiðar' }, { name: 'salatsósa', qty: 4, unit: 'msk' }],
    steps: ['Ristaðu brauðteninga á pönnu.', 'Steiktu kjúkling og skerðu niður.', 'Blandaðu salat með sósu, parmesan og teningum.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'pesto-pasta', name: 'Pasta með pestói', emoji: '🍝', time: '20 mín', serves: 4,
    ingredients: [{ name: 'pasta', qty: 400, unit: 'g' }, { name: 'pestó', qty: 4, unit: 'msk' }, { name: 'kirsuberjatómatar', qty: 200, unit: 'g' }, { name: 'parmesanostur', qty: 50, unit: 'g' }],
    steps: ['Sjóddu pasta.', 'Blandaðu pestói og tómötum saman við.', 'Toppaðu með rifnum parmesan.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'macandcheese', name: 'Mac and cheese', emoji: '🧀', time: '30 mín', serves: 4,
    ingredients: [{ name: 'makkarónur', qty: 400, unit: 'g' }, { name: 'rifinn ostur', qty: 250, unit: 'g' }, { name: 'mjólk', qty: 400, unit: 'ml' }, { name: 'smjör', qty: 40, unit: 'g' }, { name: 'hveiti', qty: 3, unit: 'msk' }],
    steps: ['Gerðu ostasósu úr smjöri, hveiti, mjólk og osti.', 'Sjóddu makkarónur og blandaðu saman við.', 'Settu í mót og bakaðu stutt þar til gyllt.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'risotto', name: 'Sveppa-risotto', emoji: '🍚', time: '40 mín', serves: 4,
    ingredients: [{ name: 'hrísgrjón', qty: 300, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'sveppir', qty: 200, unit: 'g' }, { name: 'parmesanostur', qty: 50, unit: 'g' }, { name: 'grænmetiskraftur', qty: 1, unit: 'stk' }, { name: 'smjör', qty: 30, unit: 'g' }],
    steps: ['Steiktu lauk og sveppi í smjöri.', 'Bættu hrísgrjónum og soði smám saman, hrærðu vel.', 'Hrærðu parmesan saman við í lokin.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'graenmetiscurry', name: 'Grænmetiscurry', emoji: '🍛', time: '35 mín', serves: 4,
    ingredients: [{ name: 'blómkál', qty: 1, unit: 'stk' }, { name: 'kartöflur', qty: 400, unit: 'g' }, { name: 'kjúklingabaunir', qty: 400, unit: 'g' }, { name: 'kókosmjólk', qty: 400, unit: 'ml' }, { name: 'karrímauk', qty: 2, unit: 'msk' }, { name: 'hrísgrjón', qty: 300, unit: 'g' }],
    steps: ['Steiktu grænmeti með karrímauki.', 'Helltu kókosmjólk yfir og láttu malla.', 'Berðu fram með hrísgrjónum.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'dahl', name: 'Linsubaunadahl', emoji: '🍲', time: '35 mín', serves: 4,
    ingredients: [{ name: 'linsubaunir', qty: 250, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'hvítlaukur', qty: 2, unit: 'rif' }, { name: 'kókosmjólk', qty: 400, unit: 'ml' }, { name: 'karrímauk', qty: 2, unit: 'msk' }],
    steps: ['Steiktu lauk, hvítlauk og karrí.', 'Bættu linsubaunum og kókosmjólk við.', 'Sjóddu þar til meyrt og berðu fram með brauði eða hrísgrjónum.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'falafel', name: 'Falafel', emoji: '🧆', time: '30 mín', serves: 4,
    ingredients: [{ name: 'kjúklingabaunir', qty: 400, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'hvítlaukur', qty: 2, unit: 'rif' }, { name: 'steinselja', qty: 1, unit: 'búnt' }, { name: 'hveiti', qty: 2, unit: 'msk' }],
    steps: ['Maukaðu kjúklingabaunir með lauk, hvítlauk og steinselju.', 'Hrærðu hveiti saman við og mótaðu litlar bollur.', 'Steiktu gylltar og berðu fram í pítubrauði.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'quesadilla', name: 'Quesadilla', emoji: '🫓', time: '20 mín', serves: 4,
    ingredients: [{ name: 'tortillur', qty: 4, unit: 'stk' }, { name: 'rifinn ostur', qty: 200, unit: 'g' }, { name: 'kjúklingabringur', qty: 300, unit: 'g' }, { name: 'paprika', qty: 1, unit: 'stk' }],
    steps: ['Steiktu kjúkling og papriku.', 'Settu á tortillu með osti og leggðu aðra yfir.', 'Brúnaðu á pönnu báðum megin og skerðu í báta.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'hafragrautur', name: 'Hafragrautur', emoji: '🥣', time: '10 mín', serves: 2,
    ingredients: [{ name: 'haframjöl', qty: 100, unit: 'g' }, { name: 'mjólk', qty: 400, unit: 'ml' }, { name: 'banani', qty: 1, unit: 'stk' }, { name: 'kanill', qty: 1, unit: 'tsk' }],
    steps: ['Sjóddu hafra í mjólk (eða vatni) með klípu af salti.', 'Hrærðu þar til þykkt.', 'Berðu fram með banönum og kanil.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'eggjakaka', name: 'Eggjakaka (ommeletta)', emoji: '🍳', time: '15 mín', serves: 2,
    ingredients: [{ name: 'egg', qty: 6, unit: 'stk' }, { name: 'mjólk', qty: 50, unit: 'ml' }, { name: 'rifinn ostur', qty: 100, unit: 'g' }, { name: 'skinka', qty: 100, unit: 'g' }, { name: 'paprika', qty: 1, unit: 'stk' }],
    steps: ['Þeyttu egg og mjólk saman.', 'Helltu á heita pönnu og bættu fyllingu yfir.', 'Brjóttu saman þegar eggin eru sett.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'cookies', name: 'Súkkulaðibitakökur', emoji: '🍪', time: '25 mín', serves: 20,
    ingredients: [{ name: 'hveiti', qty: 250, unit: 'g' }, { name: 'sykur', qty: 150, unit: 'g' }, { name: 'smjör', qty: 150, unit: 'g' }, { name: 'egg', qty: 1, unit: 'stk' }, { name: 'súkkulaðibitar', qty: 150, unit: 'g' }],
    steps: ['Hrærðu smjör og sykur, bættu eggi og hveiti saman við.', 'Hrærðu súkkulaðibitum út í.', 'Mótaðu kökur og bakaðu við 180°C í 10–12 mín.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'kanilsnudar', name: 'Kanilsnúðar', emoji: '🥐', time: '90 mín', serves: 12,
    ingredients: [{ name: 'hveiti', qty: 500, unit: 'g' }, { name: 'ger', qty: 1, unit: 'pk' }, { name: 'mjólk', qty: 250, unit: 'ml' }, { name: 'smjör', qty: 100, unit: 'g' }, { name: 'sykur', qty: 100, unit: 'g' }, { name: 'kanill', qty: 2, unit: 'msk' }],
    steps: ['Hnoðaðu deig og láttu hefast.', 'Fletjaðu út, smyrðu með smjöri og kanilsykri, rúllaðu og skerðu.', 'Bakaðu við 200°C í um 15 mín.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },
  {
    id: 'pavlova', name: 'Pavlova', emoji: '🍰', time: '90 mín', serves: 8,
    ingredients: [{ name: 'egg', qty: 4, unit: 'stk' }, { name: 'sykur', qty: 250, unit: 'g' }, { name: 'rjómi', qty: 250, unit: 'ml' }, { name: 'jarðarber', qty: 250, unit: 'g' }],
    steps: ['Þeyttu eggjahvítur með sykri í stífan marengs.', 'Bakaðu við lágan hita (120°C) í um 1 klst.', 'Toppaðu með þeyttum rjóma og berjum.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'tomatsupa', name: 'Tómatsúpa', emoji: '🍅', time: '25 mín', serves: 4,
    ingredients: [{ name: 'niðursoðnir tómatar', qty: 800, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'hvítlaukur', qty: 2, unit: 'rif' }, { name: 'matreiðslurjómi', qty: 100, unit: 'ml' }, { name: 'grænmetiskraftur', qty: 1, unit: 'stk' }],
    steps: ['Steiktu lauk og hvítlauk.', 'Bættu tómötum og soði við og maukaðu.', 'Hrærðu rjóma saman við og berðu fram með brauði.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/',
  },
  {
    id: 'sveppasupa', name: 'Sveppasúpa', emoji: '🍄', time: '25 mín', serves: 4,
    ingredients: [{ name: 'sveppir', qty: 400, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'matreiðslurjómi', qty: 200, unit: 'ml' }, { name: 'grænmetiskraftur', qty: 1, unit: 'stk' }, { name: 'smjör', qty: 30, unit: 'g' }],
    steps: ['Steiktu sveppi og lauk í smjöri.', 'Bættu soði við og maukaðu.', 'Hrærðu rjóma saman við.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/',
  },
  {
    id: 'fiskisupa', name: 'Fiskisúpa', emoji: '🍲', time: '35 mín', serves: 4,
    ingredients: [{ name: 'ýsa', qty: 400, unit: 'g' }, { name: 'lax', qty: 200, unit: 'g' }, { name: 'kartöflur', qty: 300, unit: 'g' }, { name: 'gulrætur', qty: 2, unit: 'stk' }, { name: 'matreiðslurjómi', qty: 200, unit: 'ml' }, { name: 'grænmetiskraftur', qty: 1, unit: 'stk' }],
    steps: ['Sjóddu grænmeti í soði þar til meyrt.', 'Bættu bituðum fiski við og láttu malla varlega.', 'Hrærðu rjóma saman við í lokin.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/',
  },
  {
    id: 'griskur-salat', name: 'Grískur salat', emoji: '🥗', time: '15 mín', serves: 4,
    ingredients: [{ name: 'tómatar', qty: 3, unit: 'stk' }, { name: 'gúrka', qty: 1, unit: 'stk' }, { name: 'rauðlaukur', qty: 1, unit: 'stk' }, { name: 'fetaostur', qty: 150, unit: 'g' }, { name: 'ólífuolía', qty: 3, unit: 'msk' }],
    steps: ['Skerðu tómata, gúrku og rauðlauk gróft.', 'Bættu fetaosti yfir.', 'Dreyptu ólífuolíu og kryddaðu með óreganó.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/',
  },
  {
    id: 'kjuklingapasta', name: 'Rjómapasta með kjúklingi', emoji: '🍝', time: '30 mín', serves: 4,
    ingredients: [{ name: 'kjúklingabringur', qty: 500, unit: 'g' }, { name: 'pasta', qty: 400, unit: 'g' }, { name: 'matreiðslurjómi', qty: 250, unit: 'ml' }, { name: 'hvítlaukur', qty: 2, unit: 'rif' }, { name: 'parmesanostur', qty: 50, unit: 'g' }],
    steps: ['Steiktu kjúkling og hvítlauk.', 'Helltu rjóma yfir og láttu malla.', 'Sjóddu pasta, blandaðu saman við og toppaðu með parmesan.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/',
  },

  { id: 'arrabbiata', name: 'Pasta arrabbiata', emoji: '🍝', time: '25 mín', serves: 4, tags: ['Ítalskt', 'Vegan'],
    ingredients: [{ name: 'pasta', qty: 400, unit: 'g' }, { name: 'niðursoðnir tómatar', qty: 800, unit: 'g' }, { name: 'hvítlaukur', qty: 3, unit: 'rif' }, { name: 'chili', qty: 1, unit: 'stk' }, { name: 'ólífuolía', qty: 3, unit: 'msk' }],
    steps: ['Steiktu hvítlauk og chili í olíu.', 'Helltu tómötum yfir og láttu malla.', 'Sjóddu pasta og blandaðu saman við.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/' },

  { id: 'caprese', name: 'Caprese salat', emoji: '🥗', time: '10 mín', serves: 4, tags: ['Ítalskt', 'Grænmeti', 'Salöt'],
    ingredients: [{ name: 'tómatar', qty: 4, unit: 'stk' }, { name: 'mozzarella', qty: 250, unit: 'g' }, { name: 'basilíka', qty: 1, unit: 'búnt' }, { name: 'ólífuolía', qty: 3, unit: 'msk' }],
    steps: ['Skerðu tómata og mozzarella í sneiðar.', 'Raðaðu til skiptis með basilíkublöðum.', 'Dreyptu ólífuolíu yfir og kryddaðu.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/' },

  { id: 'minestrone', name: 'Minestrone súpa', emoji: '🍲', time: '40 mín', serves: 6, tags: ['Ítalskt', 'Súpur', 'Vegan'],
    ingredients: [{ name: 'gulrætur', qty: 2, unit: 'stk' }, { name: 'sellerí', qty: 2, unit: 'stk' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'niðursoðnir tómatar', qty: 400, unit: 'g' }, { name: 'pasta', qty: 150, unit: 'g' }, { name: 'kjúklingabaunir', qty: 400, unit: 'g' }],
    steps: ['Steiktu saxað grænmeti.', 'Bættu tómötum, baunum og vatni við og sjóddu.', 'Settu pasta út í og sjóddu þar til meyrt.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/' },

  { id: 'tiramisu', name: 'Tiramisu', emoji: '🍰', time: '30 mín', serves: 8, tags: ['Ítalskt', 'Bakstur'],
    ingredients: [{ name: 'mascarpone', qty: 500, unit: 'g' }, { name: 'egg', qty: 3, unit: 'stk' }, { name: 'sykur', qty: 100, unit: 'g' }, { name: 'kaffi', qty: 200, unit: 'ml' }, { name: 'kex', qty: 200, unit: 'g' }],
    steps: ['Hrærðu mascarpone með eggjarauðum og sykri.', 'Dýfðu kexi í kaffi og raðaðu í form.', 'Settu krem yfir, endurtaktu lög og kæl í 4 klst.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/' },

  { id: 'burrito', name: 'Burrito', emoji: '🌯', time: '30 mín', serves: 4, tags: ['Mexíkóskt'],
    ingredients: [{ name: 'tortillur', qty: 4, unit: 'stk' }, { name: 'nautahakk', qty: 500, unit: 'g' }, { name: 'hrísgrjón', qty: 200, unit: 'g' }, { name: 'nýrnabaunir', qty: 400, unit: 'g' }, { name: 'rifinn ostur', qty: 150, unit: 'g' }, { name: 'salat', qty: 1, unit: 'stk' }],
    steps: ['Brúnaðu hakk með taco-kryddi og sjóddu hrísgrjón.', 'Settu hakk, hrísgrjón, baunir, ost og salat á tortillu.', 'Rúllaðu þétt saman og brúnaðu á pönnu.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/' },

  { id: 'nachos', name: 'Nachos', emoji: '🧀', time: '20 mín', serves: 4, tags: ['Mexíkóskt', 'Grænmeti'],
    ingredients: [{ name: 'maísflögur', qty: 200, unit: 'g' }, { name: 'rifinn ostur', qty: 200, unit: 'g' }, { name: 'jalapeno', qty: 1, unit: 'stk' }, { name: 'nýrnabaunir', qty: 400, unit: 'g' }, { name: 'sýrður rjómi', qty: 1, unit: 'dós' }],
    steps: ['Raðaðu maísflögum í eldfast mót.', 'Dreifðu osti, baunum og jalapeno yfir og bakaðu þar til bráðið.', 'Berðu fram með sýrðum rjóma og salsa.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/' },

  { id: 'guacamole', name: 'Guacamole', emoji: '🥑', time: '10 mín', serves: 4, tags: ['Mexíkóskt', 'Vegan'],
    ingredients: [{ name: 'avókadó', qty: 3, unit: 'stk' }, { name: 'tómatar', qty: 1, unit: 'stk' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'lime', qty: 1, unit: 'stk' }, { name: 'kóríander', qty: 1, unit: 'búnt' }],
    steps: ['Stappaðu avókadó í skál.', 'Bættu söxuðum tómötum, lauk og kóríander við.', 'Kreistu lime yfir og kryddaðu með salti.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/' },

  { id: 'fajitas', name: 'Kjúklingafajitas', emoji: '🌮', time: '30 mín', serves: 4, tags: ['Mexíkóskt'],
    ingredients: [{ name: 'kjúklingabringur', qty: 600, unit: 'g' }, { name: 'paprika', qty: 2, unit: 'stk' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'tortillur', qty: 6, unit: 'stk' }, { name: 'taco krydd', qty: 1, unit: 'pk' }],
    steps: ['Skerðu kjúkling, papriku og lauk í strimla.', 'Steiktu með taco-kryddi á heitri pönnu.', 'Berðu fram í tortillum með áleggi.'],
    authorType: 'web', authorName: 'Eldhússögur', sourceUrl: 'https://eldhussogur.com/' },

  { id: 'fried-rice', name: 'Steiktur hrísgrjónaréttur', emoji: '🍚', time: '25 mín', serves: 4, tags: ['Asískt'],
    ingredients: [{ name: 'hrísgrjón', qty: 300, unit: 'g' }, { name: 'egg', qty: 2, unit: 'stk' }, { name: 'gulrætur', qty: 2, unit: 'stk' }, { name: 'frosnar baunir', qty: 150, unit: 'g' }, { name: 'vorlaukur', qty: 3, unit: 'stk' }, { name: 'sojasósa', qty: 3, unit: 'msk' }],
    steps: ['Sjóddu hrísgrjón (best daginn áður).', 'Steiktu grænmeti og hrærðu eggjum saman við.', 'Bættu hrísgrjónum og sojasósu við og hitaðu í gegn.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/' },

  { id: 'teriyaki', name: 'Teriyaki kjúklingur', emoji: '🍗', time: '30 mín', serves: 4, tags: ['Asískt'],
    ingredients: [{ name: 'kjúklingabringur', qty: 600, unit: 'g' }, { name: 'teriyaki sósa', qty: 100, unit: 'ml' }, { name: 'hrísgrjón', qty: 300, unit: 'g' }, { name: 'brokkólí', qty: 1, unit: 'stk' }, { name: 'sesamfræ', qty: 1, unit: 'msk' }],
    steps: ['Steiktu bitaðan kjúkling.', 'Helltu teriyaki sósu yfir og láttu malla.', 'Berðu fram með hrísgrjónum, gufusoðnu brokkólí og sesamfræjum.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/' },

  { id: 'ramen', name: 'Ramen núðlusúpa', emoji: '🍜', time: '30 mín', serves: 4, tags: ['Asískt', 'Súpur'],
    ingredients: [{ name: 'núðlur', qty: 300, unit: 'g' }, { name: 'egg', qty: 4, unit: 'stk' }, { name: 'kjúklingakraftur', qty: 2, unit: 'stk' }, { name: 'vorlaukur', qty: 3, unit: 'stk' }, { name: 'sveppir', qty: 150, unit: 'g' }, { name: 'sojasósa', qty: 3, unit: 'msk' }],
    steps: ['Sjóddu kraft með sojasósu og sveppum.', 'Sjóddu núðlur og egg sér.', 'Settu núðlur í skál, helltu soði yfir og toppaðu með eggi og vorlauk.'],
    authorType: 'web', authorName: 'Gestgjafinn', sourceUrl: 'https://gestgjafinn.is/' },

  { id: 'sweet-sour', name: 'Sætsúr kjúklingur', emoji: '🍍', time: '30 mín', serves: 4, tags: ['Asískt'],
    ingredients: [{ name: 'kjúklingabringur', qty: 600, unit: 'g' }, { name: 'paprika', qty: 1, unit: 'stk' }, { name: 'ananas í dós', qty: 1, unit: 'dós' }, { name: 'hrísgrjón', qty: 300, unit: 'g' }, { name: 'sweet chili sósa', qty: 4, unit: 'msk' }],
    steps: ['Steiktu bitaðan kjúkling.', 'Bættu papriku, ananas og sósu við og láttu malla.', 'Berðu fram með hrísgrjónum.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/' },

  { id: 'hummus', name: 'Hummus', emoji: '🧆', time: '10 mín', serves: 4, tags: ['Vegan'],
    ingredients: [{ name: 'kjúklingabaunir', qty: 400, unit: 'g' }, { name: 'tahini', qty: 2, unit: 'msk' }, { name: 'hvítlaukur', qty: 1, unit: 'rif' }, { name: 'sítróna', qty: 1, unit: 'stk' }, { name: 'ólífuolía', qty: 3, unit: 'msk' }],
    steps: ['Settu kjúklingabaunir, tahini, hvítlauk og sítrónusafa í blandara.', 'Blandaðu með ólífuolíu þar til mjúkt.', 'Berðu fram með brauði eða grænmeti.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/' },

  { id: 'buddha-bowl', name: 'Buddha bowl', emoji: '🥗', time: '35 mín', serves: 2, tags: ['Vegan', 'Salöt'],
    ingredients: [{ name: 'kjúklingabaunir', qty: 400, unit: 'g' }, { name: 'sætar kartöflur', qty: 2, unit: 'stk' }, { name: 'hrísgrjón', qty: 200, unit: 'g' }, { name: 'avókadó', qty: 1, unit: 'stk' }, { name: 'spínat', qty: 100, unit: 'g' }],
    steps: ['Bakaðu sætar kartöflur og kjúklingabaunir í ofni.', 'Sjóddu hrísgrjón.', 'Raðaðu öllu í skál með spínati og avókadó.'],
    authorType: 'web', authorName: 'GulurRauðurGrænn&Salt', sourceUrl: 'https://grgs.is/' },

  { id: 'graenmetis-wok', name: 'Grænmetis-wok', emoji: '🥦', time: '25 mín', serves: 4, tags: ['Vegan', 'Asískt'],
    ingredients: [{ name: 'brokkólí', qty: 1, unit: 'stk' }, { name: 'paprika', qty: 1, unit: 'stk' }, { name: 'gulrætur', qty: 2, unit: 'stk' }, { name: 'núðlur', qty: 300, unit: 'g' }, { name: 'sojasósa', qty: 3, unit: 'msk' }, { name: 'engifer', qty: 1, unit: 'stk' }],
    steps: ['Sjóddu núðlur.', 'Steiktu grænmeti með engifer í wok.', 'Bættu núðlum og sojasósu við og hitaðu í gegn.'],
    authorType: 'web', authorName: 'Læknirinn í eldhúsinu', sourceUrl: 'https://www.laeknirinnieldhusinu.com/' },

  { id: 'linsu-bolognese', name: 'Linsubauna-bolognese', emoji: '🍝', time: '35 mín', serves: 4, tags: ['Vegan', 'Ítalskt'],
    ingredients: [{ name: 'linsubaunir', qty: 250, unit: 'g' }, { name: 'niðursoðnir tómatar', qty: 800, unit: 'g' }, { name: 'laukur', qty: 1, unit: 'stk' }, { name: 'gulrætur', qty: 2, unit: 'stk' }, { name: 'spaghetti', qty: 400, unit: 'g' }],
    steps: ['Steiktu saxaðan lauk og gulrætur.', 'Bættu linsubaunum og tómötum við og láttu malla þar til meyrt.', 'Berðu fram með soðnu spaghetti.'],
    authorType: 'web', authorName: 'Eldhúsperlur', sourceUrl: 'https://eldhusperlur.com/' },
]

// Flokkar fyrir eldri uppskriftir (nýrri eru með innbyggð tags).
const RECIPE_TAGS = {
  bolognese: ['Ítalskt'], 'kjuklingur-ofn': ['Íslenskt'], plokkfiskur: ['Íslenskt'], ponnukokur: ['Bakstur'],
  kjotsupa: ['Íslenskt', 'Súpur'], taco: ['Mexíkóskt'], lasagne: ['Ítalskt'], heimapitsa: ['Ítalskt'],
  kjuklingacurry: ['Asískt'], carbonara: ['Ítalskt'], hamborgarar: [], chili: ['Mexíkóskt'], pannulax: ['Íslenskt'],
  kjotbollur: [], graenmetissupa: ['Súpur', 'Grænmeti', 'Vegan'], vofflur: ['Bakstur'], bananabraud: ['Bakstur'],
  kjuklinganudlur: ['Asískt'], fiskurraspi: ['Íslenskt'], grjonagrautur: ['Íslenskt'], kjuklingasupa: ['Súpur'],
  tikkamasala: ['Asískt'], padthai: ['Asískt'], saltkjot: ['Íslenskt'], hamborgarahryggur: ['Íslenskt'],
  graenmetislasagne: ['Ítalskt', 'Grænmeti'], pylsurettur: [], nautasteik: ['Íslenskt'], tacosupa: ['Mexíkóskt', 'Súpur'],
  skuffukaka: ['Bakstur'], eplakaka: ['Bakstur'], boost: [], fiskibollur: ['Íslenskt'], 'ysa-ofni': ['Íslenskt'],
  lambalaeri: ['Íslenskt'], lambakotilettur: ['Íslenskt'], grisakotilettur: ['Íslenskt'], kjuklingasalat: ['Salöt'],
  caesar: ['Salöt'], 'pesto-pasta': ['Ítalskt', 'Grænmeti'], macandcheese: ['Grænmeti'], risotto: ['Ítalskt', 'Grænmeti'],
  graenmetiscurry: ['Asískt', 'Vegan', 'Grænmeti'], dahl: ['Asískt', 'Vegan'], falafel: ['Vegan'],
  quesadilla: ['Mexíkóskt', 'Grænmeti'], hafragrautur: ['Bakstur'], eggjakaka: ['Grænmeti'], cookies: ['Bakstur'],
  kanilsnudar: ['Bakstur'], pavlova: ['Bakstur'], tomatsupa: ['Súpur', 'Grænmeti'], sveppasupa: ['Súpur', 'Grænmeti'],
  fiskisupa: ['Súpur', 'Íslenskt'], 'griskur-salat': ['Salöt', 'Grænmeti'], kjuklingapasta: ['Ítalskt'],
}
RECIPES.forEach(r => { if (!r.tags) r.tags = RECIPE_TAGS[r.id] || [] })

export const RECIPE_CATEGORIES = ['Íslenskt', 'Ítalskt', 'Mexíkóskt', 'Asískt', 'Grænmeti', 'Vegan', 'Súpur', 'Salöt', 'Bakstur']

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
