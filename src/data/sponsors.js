// Flokka-kostun (category sponsorship): auglýsandi "á" tiltekna búðardeild.
// Demo: Ölgerðin á drykkjarvöruflokkinn. Þetta er retail media í verki —
// kostaðar vörur birtast fremst þegar notandi bætir við drykk.
//
// image: settu slóð á alvöru pakkamynd (t.d. '/sponsors/malt.png' í public/)
// þegar opinbert myndefni kemur frá auglýsanda. Annars birtist litaður reitur.
export const CATEGORY_SPONSORS = {
  beverages: {
    brand: 'Ölgerðin',
    tag: 'Kostað · Ölgerðin',
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
}

const BEVERAGE_TERMS = [
  'gos', 'drykk', 'kók', 'kok', 'pepsi', 'malt', 'appelsín', 'appelsin',
  'vatn', 'safi', 'djús', 'djus', 'sódavatn', 'sodavatn', 'kristall', 'orku', 'kristal',
  '7up', 'sevenup', 'collab', 'florída', 'florida', 'frískur', 'friskur', 'egils',
]

// Kostaðar tillögur þegar leitað er að drykk (eða nafn passar við kostaða vöru).
export function sponsoredSuggest(query, limit = 4) {
  const q = (query || '').toLowerCase().trim()
  if (!q || q.length < 2) return []
  const out = []
  for (const [dept, s] of Object.entries(CATEGORY_SPONSORS)) {
    const termHit = BEVERAGE_TERMS.some(t => q.includes(t))
    for (const p of s.products) {
      if (p.name.toLowerCase().includes(q) || termHit) {
        out.push({ name: p.name, brand: s.brand, dept, color: p.color, image: p.image })
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
