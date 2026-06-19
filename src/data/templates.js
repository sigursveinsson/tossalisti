// Tilbúin lista-sniðmát. type: 'task' eða 'shopping'.
// items eru einföld heiti; fyrir innkaupasniðmát flokkast þau sjálfkrafa í deildir.
export const TEMPLATES = [
  {
    id: 'brudkaup', name: 'Brúðkaup', emoji: '💍', type: 'task',
    items: ['Bóka veislusal', 'Velja dagsetningu', 'Senda boðskort', 'Panta blóm', 'Bóka ljósmyndara',
      'Velja veitingar', 'Panta köku', 'Velja tónlist/DJ', 'Kaupa hringa', 'Skipuleggja brúðkaupsferð'],
  },
  {
    id: 'utilega', name: 'Útilega', emoji: '⛺', type: 'task',
    items: [
      // Tjald og svefn
      'Tjald', 'Tjaldhælar og sleggja', 'Undirbreiðsla undir tjald', 'Svefnpokar', 'Svefndýnur',
      'Koddar', 'Höfuðljós', 'Vasaljós', 'Aukarafhlöður', 'Útilegustólar', 'Ferðaborð', 'Lukt', 'Motta eða teppi',
      // Verkfæri
      'Fjölnota verkfæri', 'Límband', 'Snæri', 'Viðgerðarsett fyrir tjald', 'Öxi eða sög',
      // Eldhús
      'Prímus og gas', 'Eldspýtur eða kveikjari', 'Pottar', 'Panna', 'Hnífapör', 'Eldhúsáhöld',
      'Upptakari og dósahnífur', 'Beittur hnífur', 'Diskar og skálar', 'Bollar og glös', 'Skurðarbretti',
      'Kælibox', 'Klaki', 'Vatnsbrúsi', 'Uppþvottabali', 'Uppþvottalögur', 'Svampur', 'Viskustykki',
      'Ruslapokar', 'Grill og kol', 'Álpappír', 'Kaffikanna',
      // Föt
      'Nærföt', 'Bolir', 'Buxur og stuttbuxur', 'Langermabolur', 'Flíspeysa', 'Hlý úlpa', 'Regngalli',
      'Ullarnærföt', 'Gönguskór', 'Ullarsokkar', 'Náttföt', 'Vettlingar', 'Húfa', 'Sundföt', 'Inniskór eða sandalar',
      // Heilsa og hreinlæti
      'Klósettpappír', 'Handspritt', 'Tannbursti og tannkrem', 'Snyrtitaska', 'Handklæði', 'Dömubindi',
      'Lyf', 'Sjúkrakassi', 'Sólarvörn', 'Sólgleraugu', 'Derhúfa', 'Varasalvi', 'Skordýravörn', 'Blautþurrkur',
      // Persónulegt
      'Greiðslukort og reiðufé', 'Skilríki', 'Sími og hleðslutæki', 'Hleðslubanki', 'Bókunarstaðfesting tjaldsvæðis',
      // Afþreying
      'Sjónauki', 'Kort og áttaviti', 'Bók', 'Spil', 'Leikföng',
    ],
  },
  {
    id: 'solarfri', name: 'Sólarfrí', emoji: '🏖️', type: 'task',
    items: ['Vegabréf', 'Flugmiðar', 'Hótelbókun', 'Ferðatrygging', 'Sólarvörn', 'Sundföt', 'Sólgleraugu',
      'Hleðslutæki og millistykki', 'Lyf', 'Reiðufé/gjaldeyrir'],
  },
  {
    id: 'flutningar', name: 'Flutningar', emoji: '📦', type: 'task',
    items: ['Panta flutningabíl', 'Kaupa kassa', 'Tilkynna nýtt heimilisfang', 'Flytja rafmagn og net',
      'Segja upp/flytja tryggingar', 'Þrífa gamla íbúð', 'Pakka eldhúsi', 'Pakka svefnherbergi'],
  },
  {
    id: 'veisla', name: 'Veisla', emoji: '🎉', type: 'shopping',
    items: ['gos', 'snakk', 'kex', 'ostar', 'kæfa', 'brauð', 'kaka', 'kaffi', 'servíettur', 'einnota glös'],
  },
  {
    id: 'skolabyrjun', name: 'Skólabyrjun', emoji: '🎒', type: 'task',
    items: ['Skólataska', 'Stílabækur', 'Pennaveski', 'Pennar og blýantar', 'Yddari og strokleður',
      'Reiknivél', 'Nesti box', 'Íþróttaföt', 'Inniskór'],
  },
  {
    id: 'jol', name: 'Jól', emoji: '🎄', type: 'task',
    items: ['Jólatré', 'Jólaljós', 'Jólaskraut', 'Jólagjafir', 'Gjafapappír', 'Jólakort', 'Jólamatur',
      'Smákökur', 'Konfekt', 'Kerti', 'Servíettur', 'Skreyta heimilið', 'Jólaboð', 'Þrífa fyrir jól'],
  },
  {
    id: 'afmaeli', name: 'Afmæli', emoji: '🎂', type: 'task',
    items: ['Bjóða gestum', 'Panta eða baka köku', 'Kerti', 'Blöðrur', 'Partýskraut', 'Gjöf', 'Veitingar',
      'Drykkir', 'Tónlist', 'Partýpokar', 'Myndavél', 'Þrífa eftir'],
  },
  {
    id: 'ferming', name: 'Ferming', emoji: '⛪', type: 'task',
    items: ['Bóka sal', 'Senda boðskort', 'Panta veitingar', 'Kaka', 'Fatnaður', 'Gjafalisti', 'Ljósmyndari',
      'Skreytingar', 'Blóm', 'Tónlist', 'Borðplan', 'Þakkarkort'],
  },
  {
    id: 'nytt-barn', name: 'Nýtt barn', emoji: '👶', type: 'shopping',
    items: ['bleiur', 'blautþurrkur', 'ungbarnaföt', 'vagga', 'kerra', 'bílstóll', 'snuð', 'pelar',
      'barnaþvottaefni', 'barnakrem', 'hitamælir', 'ungbarnabaðkar', 'smekkir', 'teppi'],
  },
  {
    id: 'bustadur', name: 'Sumarbústaður', emoji: '🏡', type: 'shopping',
    items: ['grillkjöt', 'pylsur', 'kol', 'drykkir', 'snakk', 'kaffi', 'morgunmatur', 'klósettpappír',
      'eldhúsrúlla', 'sólarvörn', 'skordýravörn', 'spil', 'vatnsbrúsi', 'ruslapokar'],
  },
  {
    id: 'gardvinna', name: 'Garðvinna', emoji: '🌱', type: 'task',
    items: ['Slá grasið', 'Reyta arfa', 'Klippa runna', 'Gróðursetja', 'Bera á áburð', 'Vökva',
      'Raka lauf', 'Þrífa pallinn', 'Mála girðingu', 'Hreinsa beð'],
  },
  {
    id: 'vorhreingerning', name: 'Vorhreingerning', emoji: '🧹', type: 'task',
    items: ['Þrífa glugga', 'Ryksuga', 'Skúra gólf', 'Þrífa baðherbergi', 'Þrífa eldhús', 'Þvo gardínur',
      'Taka til í skápum', 'Þrífa ísskáp', 'Þurrka ryk', 'Skipta um rúmföt', 'Þrífa ofn'],
  },
  {
    id: 'bilavidhald', name: 'Bílaviðhald', emoji: '🚗', type: 'task',
    items: ['Skipta um dekk', 'Olíuskipti', 'Rúðuvökvi', 'Þvo bílinn', 'Athuga ljós', 'Athuga bremsur',
      'Bóna', 'Ryksuga bílinn', 'Skoðun'],
  },
  {
    id: 'grillveisla', name: 'Grillveisla', emoji: '🍖', type: 'shopping',
    items: ['grillkjöt', 'pylsur', 'hamborgarar', 'hamborgarabrauð', 'grænmeti', 'salat', 'sósur',
      'drykkir', 'kol', 'álpappír', 'einnota diskar', 'servíettur', 'snakk'],
  },
  {
    id: 'skidaferd', name: 'Skíðaferð', emoji: '🎿', type: 'task',
    items: ['Skíði', 'Skíðaskór', 'Hjálmur', 'Skíðagleraugu', 'Vettlingar', 'Húfa', 'Ullarföt',
      'Sólarvörn', 'Varasalvi', 'Brúsi', 'Nesti'],
  },
  {
    id: 'borgarferd', name: 'Borgarferð', emoji: '✈️', type: 'task',
    items: ['Vegabréf', 'Flugmiðar', 'Hótelbókun', 'Ferðatrygging', 'Hleðslutæki', 'Millistykki',
      'Kort/leiðsögn', 'Gjaldeyrir', 'Þægilegir skór', 'Regnjakki', 'Snyrtivörur'],
  },
  {
    id: 'vikuleg-heimilisverk', name: 'Vikuleg heimilisverk', emoji: '🧽', type: 'task',
    items: ['Fara út með rusl', 'Setja í þvottavél', 'Brjóta saman þvott', 'Ryksuga', 'Skúra',
      'Þrífa baðherbergi', 'Kaupa í matinn', 'Vökva blóm', 'Taka til', 'Skipta um rúmföt'],
  },
]
