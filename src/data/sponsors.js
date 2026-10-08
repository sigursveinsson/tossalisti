// Flokka-kostun (category sponsorship): auglýsandi "á" tiltekna búðardeild.
// Demo: Ölgerðin á drykkjarvöruflokkinn, Nathan á snyrtivörur/pantry/mjólkurvörur.
// Þetta er retail media í verki — kostaðar vörur birtast fremst þegar notandi
// bætir við vöru í þeim flokki eða leitar að nafni/leitarorði.
//
// image: settu slóð á alvöru pakkamynd (t.d. '/sponsors/malt.png' í public/)
// þegar opinbert myndefni kemur frá auglýsanda. Annars birtist litaður reitur.

const BEVERAGE_TERMS = [
  'gos', 'drykk', 'kók', 'kok', 'pepsi', 'malt', 'appelsín', 'appelsin',
  'vatn', 'safi', 'djús', 'djus', 'sódavatn', 'sodavatn', 'kristall', 'orku', 'kristal',
  '7up', 'sevenup', 'collab', 'florída', 'florida', 'frískur', 'friskur', 'egils',
]

export const CATEGORY_SPONSORS = {
  beverages: {
    brand: 'Ölgerðin',
    tag: 'Kostað · Ölgerðin',
    terms: BEVERAGE_TERMS,
    products: [
      { name: 'Egils Appelsín',  color: '#E8730C', image: null },
      { name: 'Egils Malt',      color: '#6B2A1B', image: null },
      { name: 'Egils Kristall',  color: '#2BA3D9', image: null },
      { name: 'Pepsi Max',       color: '#0E4C92', image: '/images.jpg' },
      { name: 'Pepsi',           color: '#1542A0', image: null },
      { name: '7UP',             color: '#2E9B57', image: null },
      { name: 'Collab orkudrykkur', color: '#16B7A8', image: null },
      { name: 'Florída Frískur', color: '#F0A52E', image: null },
    ],
  },
  personalcare: {
    brand: 'Nathan',
    tag: 'Kostað · Nathan',
    terms: ['vaseline', 'krem', 'húðkrem', 'hudkrem', 'rakakrem', 'varasalvi', 'body', 'lotion', 'húð', 'hud'],
    products: [
      { name: 'Vaseline Intensive Care', color: '#1F3B9B', image: 'https://nathan.is/Admin/Public/GetImage.ashx?width=400&height=400&format=webp&compression=95&image=%2FFiles%2FUploads%2F340175.png' },
      { name: 'Vaseline varasalvi',      color: '#2B57C0', image: 'https://nathan.is/Admin/Public/GetImage.ashx?width=400&height=400&format=webp&compression=95&image=%2FFiles%2FUploads%2F340280.png' },
    ],
  },
  pantry: {
    brand: 'Nathan',
    tag: 'Kostað · Nathan',
    terms: ['nutella', 'súkkulaðismjör', 'sukkuladismjor', 'knorr', 'teningur', 'teningar', 'kjötkraftur', 'kjotkraftur', 'krydd', 'sósa', 'sosa'],
    products: [
      { name: 'Nutella súkkulaðismjör', color: '#5B2C1A', image: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.879.400.jpg' },
      { name: 'Knorr teningar',         color: '#2E7D32', image: 'https://nathan.is/Admin/Public/GetImage.ashx?width=400&height=400&format=webp&compression=95&image=%2FFiles%2FUploads%2F304051.jpg' },
    ],
  },
  dairy: {
    brand: 'Nathan',
    tag: 'Kostað · Nathan',
    terms: ['sproud', 'hafradrykkur', 'hafra', 'plöntumjólk', 'plontumjolk', 'haframjólk', 'haframjolk', 'plöntu', 'plontu'],
    products: [
      { name: 'Sproud hafradrykkur', color: '#8BBF6A', image: 'https://images.openfoodfacts.org/images/products/734/015/080/0819/front_en.20.400.jpg' },
    ],
  },
}

// Auka-blokk fyrir KOSTAÐAR TILLÖGUR (ekki flokkahaus): óáfengir drykkir + te frá Nathan.
// Drykkjadeildin (beverages) er Ölgerðar fyrir flokkahausinn, svo þessar Nathan-vörur
// birtast aðeins sem kostaðar tillögur þegar leitað er að nafni/leitarorði.
const EXTRA_SUGGEST = [
  {
    brand: 'Nathan',
    dept: 'beverages',
    terms: ['lucky', 'saint', 'oddbird', 'perchs', 'sparkling', 'áfengislaus', 'afengislaus', 'óáfeng', 'oafeng', 'te'],
    products: [
      { name: 'Lucky Saint óáfengur bjór', color: '#C9A227', image: 'https://images.openfoodfacts.org/images/products/506/062/116/0113/front_en.3.400.jpg' },
      { name: 'Oddbird óáfengt vín',       color: '#7A1F3D', image: 'https://images.openfoodfacts.org/images/products/735/006/773/2226/front_en.3.400.jpg' },
      { name: 'A.C. Perchs te',            color: '#1F6F4F', image: null },
    ],
  },
  {
    // Old El Paso (Nathan) — taco/mexíkóskt. `generic` = almennt heiti sem gervigreindin
    // getur skipt út fyrir kostuðu vöruna í raddstýringu („taco veisla fyrir 6").
    brand: 'Nathan',
    dept: 'pantry',
    terms: ['taco', 'tako', 'tortill', 'vefju', 'mexík', 'mexik', 'burrito', 'fajita', 'quesadilla'],
    products: [
      { name: 'Old El Paso taco skeljar', generic: 'Taco skeljar', color: '#C8102E', image: 'https://nathan.is/Admin/Public/GetImage.ashx?width=400&height=400&format=webp&compression=95&image=%2FFiles%2FUploads%2F120330.jpg' },
    ],
  },
  {
    // Morgunkorn frá Nathan — birtist t.d. þegar leitað er að „morgunkorni".
    brand: 'Nathan',
    dept: 'pantry',
    terms: ['morgunkorn', 'cheerios', 'cheerio', 'seríós', 'serios', 'seríos', 'hafrahring', 'kornflex', 'cornflakes', 'corn flakes', 'múslí', 'musli', 'cereal'],
    products: [
      { name: 'Cheerios', color: '#F2C200', image: 'https://images.openfoodfacts.org/images/products/006/563/313/2818/front_en.4.400.jpg' },
    ],
  },
]

// Er vara á lista kostuð vara? (t.d. „cheerios" eða „old el paso taco skeljar 12 stk") → { brand } eða null.
export function sponsorFor(itemName) {
  const n = (itemName || '').toLowerCase().trim()
  if (!n) return null
  for (const s of [...Object.values(CATEGORY_SPONSORS), ...EXTRA_SUGGEST]) {
    for (const p of s.products) { const pn = p.name.toLowerCase(); if (n === pn || n.startsWith(pn + ' ')) return { brand: s.brand, name: p.name } }
  }
  return null
}

// Kostaðar vörur sem gervigreindin má nota SEM STAÐGENGLA fyrir almenna vöru í raddstýringu.
// Aðeins vörur með `generic`. [{ name, brand, generic, image, color }]
export function sponsoredForAI() {
  const blocks = [...Object.values(CATEGORY_SPONSORS), ...EXTRA_SUGGEST]
  const out = []
  for (const s of blocks) for (const p of s.products) if (p.generic) out.push({ name: p.name, brand: s.brand, generic: p.generic, image: p.image, color: p.color })
  return out
}

// Kostaðar tillögur þegar leitað er að vöru (nafn passar, eða leitarorð blokkar passar).
export function sponsoredSuggest(query, limit = 4) {
  const q = (query || '').toLowerCase().trim()
  if (!q || q.length < 2) return []
  const blocks = [
    ...Object.entries(CATEGORY_SPONSORS).map(([dept, s]) => ({ ...s, dept })),
    ...EXTRA_SUGGEST,
  ]
  const out = []
  for (const s of blocks) {
    const termHit = (s.terms || []).some(t => q.includes(t))
    for (const p of s.products) {
      if (p.name.toLowerCase().includes(q) || termHit) {
        out.push({ name: p.name, brand: s.brand, dept: s.dept, color: p.color, image: p.image })
      }
    }
  }
  const seen = new Set()
  return out.filter(o => {
    const k = o.name.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k); return true
  }).slice(0, limit)
}
