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
