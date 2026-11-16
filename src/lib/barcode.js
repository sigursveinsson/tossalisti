// Flettir strikamerki (EAN/UPC) upp í Open Food Facts og skilar bestu íslensku
// vöruheiti sem völ er á. Skilar null ef ekkert nothæft heiti finnst.
//
// Open Food Facts er opið, ókeypis API með CORS leyft fyrir vafra, og geymir
// staðbundin vöruheiti í reitum eins og product_name_is (íslenska).

const FIELDS = [
  'product_name_is',
  'generic_name_is',
  'product_name',
  'generic_name',
  'abbreviated_product_name',
  'brands',
  'image_front_small_url',
  'image_small_url',
  'image_front_url',
  'image_url',
  'categories_tags',
].join(',')

// Kortleggur OFF-flokka (categories_tags) í okkar búðardeildir.
// Röðin skiptir máli (áfengi á undan drykkjum, sælgæti á undan þurrvöru o.s.frv.).
const CAT_RULES = [
  ['alcohol', /alcoholic|\bwines?\b|\bbeers?\b|whisk|spirits|vodka|\bgins?\b|\brums?\b|liqueur|cognac|brennivin|ciders?|aperitif|champagne/],
  ['dairy', /dairies|\bmilks?\b|cheeses|yogurts|yoghurts|\bbutters?\b|\bcreams?\b|skyr|dairy/],
  ['frozen', /frozen/],
  ['candy', /sweet-snacks|chocolates|candies|confectioner|\bsweets\b|biscuits|cookies|desserts|ice-cream/],
  ['snacks', /salty-snacks|chips|crisps|crackers|popcorn|\bnuts\b/],
  ['beverages', /beverages|\bwaters\b|sodas|juices|soft-drinks|carbonated|energy-drinks|\bdrinks\b/],
  ['bakery', /\bbreads?\b|bakery|viennoiser|pastries|\bbuns\b/],
  ['meat', /\bmeats?\b|poultry|\bfishes?\b|seafood|sausages|\bhams?\b|\bbeef\b|\bpork\b|chicken|\bfish\b/],
  ['produce', /\bfruits?\b|vegetables|fresh-vegetables|fresh-fruits|legumes/],
  ['baking', /\bflours?\b|\bsugars?\b|baking|yeast/],
  ['pantry', /groceries|canned|\bpastas?\b|\brices?\b|sauces|condiments|cereals|spreads|breakfast|coffees|\bteas\b|honeys|oils/],
  ['personalcare', /hygiene|toothpaste|shampoo|deodorant|soap|cosmetics/],
  ['cleaning', /cleaning|detergent|laundry/],
]

function deptFromCategories(tags) {
  if (!Array.isArray(tags) || !tags.length) return null
  const s = tags.join(' ').toLowerCase()
  for (const [dept, re] of CAT_RULES) { if (re.test(s)) return dept }
  return null
}

function clean(name) {
  if (!name) return ''
  // Fjarlægja umframbil og einfalda. Höldum fyrsta hluta ef mörg heiti eru aðskilin með kommu.
  let s = String(name).replace(/\s+/g, ' ').trim()
  if (s.includes(',')) s = s.split(',')[0].trim()
  return s
}

export async function lookupBarcode(code) {
  const ean = String(code || '').replace(/\D/g, '')
  if (!ean) return null
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=${FIELDS}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    const name =
      p.product_name_is ||
      p.generic_name_is ||
      p.product_name ||
      p.generic_name ||
      p.abbreviated_product_name ||
      p.brands ||
      ''
    const c = clean(name)
    if (!c) return null
    const image =
      p.image_front_small_url ||
      p.image_small_url ||
      p.image_front_url ||
      p.image_url ||
      null
    const dept = deptFromCategories(p.categories_tags)
    return { name: c, image, dept }
  } catch {
    return null
  }
}
