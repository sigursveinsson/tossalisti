// Íslenskt vöruorðasafn -> búðardeild.
// Þetta er hjartað í appinu: það flokkar vörur sjálfkrafa í rétta deild.
// Síðar kemur þetta úr Supabase (raunverulegt vöruúrval frá heildsölum).
export const PRODUCTS = {
  // Ávextir & grænmeti
  'epli': 'produce', 'banani': 'produce', 'appelsína': 'produce', 'sítróna': 'produce',
  'vínber': 'produce', 'jarðarber': 'produce', 'bláber': 'produce', 'avókadó': 'produce',
  'tómatar': 'produce', 'gúrka': 'produce', 'salat': 'produce', 'spínat': 'produce',
  'laukur': 'produce', 'rauðlaukur': 'produce', 'hvítlaukur': 'produce', 'kartöflur': 'produce',
  'sætar kartöflur': 'produce', 'gulrætur': 'produce', 'paprika': 'produce', 'sveppir': 'produce',
  'brokkólí': 'produce', 'blómkál': 'produce', 'kúrbítur': 'produce', 'engifer': 'produce',
  'sellerí': 'produce', 'steinselja': 'produce', 'kóríander': 'produce',
  // Kjöt & fiskur
  'kjúklingabringur': 'meat', 'kjúklingur': 'meat', 'kjúklingaleggir': 'meat',
  'nautahakk': 'meat', 'hakk': 'meat', 'nautasteik': 'meat', 'lambakjöt': 'meat',
  'lambalæri': 'meat', 'grísakjöt': 'meat', 'beikon': 'meat', 'pylsur': 'meat',
  'bjúgu': 'meat', 'skinka': 'meat', 'lax': 'meat', 'ýsa': 'meat', 'þorskur': 'meat',
  'rækjur': 'meat', 'saltfiskur': 'meat', 'fiskibollur': 'meat',
  // Mjólkurvörur & egg
  'mjólk': 'dairy', 'léttmjólk': 'dairy', 'nýmjólk': 'dairy', 'undanrenna': 'dairy',
  'rjómi': 'dairy', 'sýrður rjómi': 'dairy', 'skyr': 'dairy', 'jógúrt': 'dairy',
  'ostur': 'dairy', 'rifinn ostur': 'dairy', 'parmesanostur': 'dairy', 'smjör': 'dairy',
  'smjörvi': 'dairy', 'egg': 'dairy', 'kotasæla': 'dairy', 'rjómaostur': 'dairy',
  // Brauð & bakkelsi
  'brauð': 'bakery', 'samlokubrauð': 'bakery', 'heilkornabrauð': 'bakery', 'rúgbrauð': 'bakery',
  'rúnstykki': 'bakery', 'beyglur': 'bakery', 'flatkökur': 'bakery', 'kruðerí': 'bakery',
  'kleinur': 'bakery', 'snúðar': 'bakery',
  // Þurrvara
  'spaghetti': 'pantry', 'pasta': 'pantry', 'makkarónur': 'pantry', 'hrísgrjón': 'pantry',
  'núðlur': 'pantry', 'hveiti': 'pantry', 'sykur': 'pantry', 'flórsykur': 'pantry',
  'salt': 'pantry', 'pipar': 'pantry', 'matarolía': 'pantry', 'ólífuolía': 'pantry',
  'edik': 'pantry', 'niðursoðnir tómatar': 'pantry', 'tómatpúrra': 'pantry', 'tómatsósa': 'pantry',
  'sojasósa': 'pantry', 'baunir': 'pantry', 'kjúklingabaunir': 'pantry', 'kókosmjólk': 'pantry',
  'kaffi': 'pantry', 'te': 'pantry', 'kakó': 'pantry', 'múslí': 'pantry', 'hafrar': 'pantry',
  'morgunkorn': 'pantry', 'hnetusmjör': 'pantry', 'sulta': 'pantry', 'súkkulaði': 'pantry',
  'kex': 'pantry', 'snakk': 'pantry', 'ger': 'pantry', 'lyftiduft': 'pantry',
  // Frystivörur
  'frosnar baunir': 'frozen', 'frosið grænmeti': 'frozen', 'ís': 'frozen',
  'frosin pizza': 'frozen', 'franskar': 'frozen', 'frosin ber': 'frozen',
  // Heimilið
  'klósettpappír': 'household', 'eldhúsrúlla': 'household', 'uppþvottalögur': 'household',
  'þvottaefni': 'household', 'sápa': 'household', 'tannkrem': 'household', 'sjampó': 'household',
  'rusladpokar': 'household', 'álpappír': 'household', 'bleiur': 'household',
  // Viðbætur fyrir uppskriftasafnið
  'lasagnaplötur': 'pantry', 'karrí': 'pantry', 'karrímauk': 'pantry',
  'hamborgarabrauð': 'bakery', 'tortillur': 'bakery', 'pítsadeig': 'pantry',
  'pítsasósa': 'pantry', 'pepperóní': 'meat', 'haframjöl': 'pantry',
  'kanill': 'pantry', 'vorlaukur': 'produce', 'raspur': 'pantry',

  // === Stækkað vöruúrval ===
  // Ávextir & grænmeti
  'pera': 'produce', 'perur': 'produce', 'plóma': 'produce', 'plómur': 'produce', 'ferskja': 'produce',
  'nektarína': 'produce', 'mangó': 'produce', 'ananas': 'produce', 'melóna': 'produce', 'vatnsmelóna': 'produce',
  'kíví': 'produce', 'lime': 'produce', 'greip': 'produce', 'klementínur': 'produce', 'mandarínur': 'produce',
  'hindber': 'produce', 'brómber': 'produce', 'rúsínur': 'pantry', 'döðlur': 'produce', 'rabarbari': 'produce',
  'hvítkál': 'produce', 'rauðkál': 'produce', 'grænkál': 'produce', 'kínakál': 'produce', 'rósakál': 'produce',
  'blómkál': 'produce', 'gulrófa': 'produce', 'rófa': 'produce', 'rauðrófur': 'produce', 'maís': 'produce',
  'sykurbaunir': 'produce', 'aspas': 'produce', 'eggaldin': 'produce', 'kúrbítur': 'produce', 'chili': 'produce',
  'jalapeno': 'produce', 'graslaukur': 'produce', 'dill': 'produce', 'basilíka': 'produce', 'rósmarín': 'produce',
  'timían': 'produce', 'mynta': 'produce', 'klettasalat': 'produce', 'jöklasalat': 'produce', 'lárperu': 'produce',
  // Kjöt & fiskur
  'svínakótilettur': 'meat', 'svínahnakki': 'meat', 'grísahnakki': 'meat', 'lambahryggur': 'meat',
  'lambakótilettur': 'meat', 'lambaframpartur': 'meat', 'lambahakk': 'meat', 'nautalund': 'meat',
  'nautafillet': 'meat', 'nautagúllas': 'meat', 'kjúklingalæri': 'meat', 'kjúklingavængir': 'meat',
  'heill kjúklingur': 'meat', 'kalkúnn': 'meat', 'andabringa': 'meat', 'hangikjöt': 'meat', 'hangiálegg': 'meat',
  'spægipylsa': 'meat', 'salami': 'meat', 'vínarpylsur': 'meat', 'grillpylsur': 'meat', 'lifrarpylsa': 'meat',
  'blóðmör': 'meat', 'kæfa': 'meat', 'silungur': 'meat', 'ufsi': 'meat', 'karfi': 'meat', 'lúða': 'meat',
  'skötuselur': 'meat', 'humar': 'meat', 'hörpuskel': 'meat', 'kræklingur': 'meat', 'reyktur lax': 'meat',
  'síld': 'meat', 'makríll': 'meat', 'fiskibúðingur': 'meat',
  // Mjólkurvörur & egg
  'nýmjólk': 'dairy', 'fjörmjólk': 'dairy', 'súrmjólk': 'dairy', 'ab-mjólk': 'dairy', 'kókómjólk': 'dairy',
  'matreiðslurjómi': 'dairy', 'créme fraiche': 'dairy', 'grísk jógúrt': 'dairy', 'brauðostur': 'dairy',
  'óðalsostur': 'dairy', 'gouda': 'dairy', 'mozzarella': 'dairy', 'fetaostur': 'dairy', 'camembert': 'dairy',
  'brie': 'dairy', 'smjörvi': 'dairy', 'skyrdrykkur': 'dairy',
  // Brauð & bakkelsi
  'heilkornabrauð': 'bakery', 'vínarbrauð': 'bakery', 'bollur': 'bakery', 'formkaka': 'bakery',
  'súrdeigsbrauð': 'bakery', 'pítubrauð': 'bakery', 'naanbrauð': 'bakery', 'bagettur': 'bakery',
  'croissant': 'bakery', 'múffur': 'bakery', 'kökubotnar': 'bakery',
  // Þurrvara
  'penne': 'pantry', 'fusilli': 'pantry', 'basmati hrísgrjón': 'pantry', 'jasmín hrísgrjón': 'pantry',
  'kúskús': 'pantry', 'bygg': 'pantry', 'quinoa': 'pantry', 'heilhveiti': 'pantry', 'spelt': 'pantry',
  'púðursykur': 'pantry', 'flórsykur': 'pantry', 'matarsódi': 'pantry', 'vanilludropar': 'pantry',
  'súkkulaðibitar': 'pantry', 'hunang': 'pantry', 'síróp': 'pantry', 'kókosmjöl': 'pantry', 'möndlur': 'pantry',
  'valhnetur': 'pantry', 'kasjúhnetur': 'pantry', 'jarðhnetur': 'pantry', 'sólkjarnar': 'pantry',
  'graskersfræ': 'pantry', 'kókosolía': 'pantry', 'balsamik edik': 'pantry', 'fiskisósa': 'pantry',
  'ostrusósa': 'pantry', 'sweet chili sósa': 'pantry', 'sriracha': 'pantry', 'sinnep': 'pantry',
  'majónes': 'pantry', 'bbq sósa': 'pantry', 'salatsósa': 'pantry', 'paprikukrydd': 'pantry', 'múskat': 'pantry',
  'kúmen': 'pantry', 'óreganó': 'pantry', 'taco krydd': 'pantry', 'grillkrydd': 'pantry', 'súputeningar': 'pantry',
  'kjúklingakraftur': 'pantry', 'grænmetiskraftur': 'pantry', 'niðursoðnar baunir': 'pantry',
  'nýrnabaunir': 'pantry', 'túnfiskur': 'pantry', 'ananas í dós': 'pantry', 'kaffibaunir': 'pantry',
  'kremkex': 'pantry', 'kartöfluflögur': 'pantry', 'popp': 'pantry', 'lakkrís': 'pantry', 'tyggjó': 'pantry',
  'gos': 'pantry', 'sódavatn': 'pantry', 'safi': 'pantry', 'djús': 'pantry', 'orkudrykkur': 'pantry',
  'kornflex': 'pantry', 'cheerios': 'pantry',
  // Frystivörur
  'klakar': 'frozen', 'fiskistautar': 'frozen', 'kjúklinganaggar': 'frozen', 'rjómaís': 'frozen',
  'frosnar pönnukökur': 'frozen',
  // Heimilið
  'uppþvottatöflur': 'household', 'mýkingarefni': 'household', 'handsápa': 'household', 'hárnæring': 'household',
  'tannbursti': 'household', 'svitalyktareyðir': 'household', 'blautþurrkur': 'household', 'dömubindi': 'household',
  'túrtappar': 'household', 'frystipokar': 'household', 'plastfilma': 'household', 'bökunarpappír': 'household',
  'kerti': 'household', 'rafhlöður': 'household', 'ljósaperur': 'household', 'gúmmíhanskar': 'household',
  'wc-hreinsir': 'household', 'gluggahreinsir': 'household', 'alhliða hreinsir': 'household', 'klórtöflur': 'household',
  'saltkjöt': 'meat', 'hamborgarahryggur': 'meat', 'gular baunir': 'pantry',
  'pestó': 'pantry', 'linsubaunir': 'pantry', 'kirsuberjatómatar': 'produce', 'rósmarín': 'produce',
  'mascarpone': 'dairy', 'teriyaki sósa': 'pantry', 'tahini': 'pantry', 'maísflögur': 'pantry', 'sesamfræ': 'pantry',
}

export const PRODUCT_NAMES = Object.keys(PRODUCTS)

// Finnur deild fyrir vöruheiti. Reynir nákvæma samsvörun, svo hlutasamsvörun.
export function departmentFor(name) {
  const n = name.toLowerCase().trim()
  if (PRODUCTS[n]) return PRODUCTS[n]
  for (const key of PRODUCT_NAMES) {
    if (n.includes(key) || key.includes(n)) return PRODUCTS[key]
  }
  return 'other'
}

// Tillögur fyrir innslátt (byrjar á eða inniheldur).
export function suggest(query, limit = 6) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const starts = [], contains = []
  for (const name of PRODUCT_NAMES) {
    if (name.startsWith(q)) starts.push(name)
    else if (name.includes(q)) contains.push(name)
  }
  return [...starts, ...contains].slice(0, limit)
}
