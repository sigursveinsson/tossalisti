// SÝNIDÆMI fyrir vörumerkja-mælaborð — TILBÚIN GÖGN til kynningar (t.d. fyrir Nathan-fund).
// Sýnir hvernig mælaborðið lítur út með nokkur hundruð kaupendum. Alltaf merkt skýrt
// sem sýnidæmi í viðmótinu — ALDREI kynna sem raunverulega sölu.
// Sama snið og brand_dashboard() í gagnagrunninum skilar. Fast (seeded) — sömu tölur í hvert sinn.

function rng(seed) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}
function hash(str) {
  let h = 2166136261
  for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}
const iso = (d) => d.toISOString().slice(0, 10)

// Þekktar vörur: [þyngd í sölu, endurkaupahlutfall, meðalverð]
const KNOWN = [
  [/nutella/i, 0.24, 0.41, 799],
  [/sproud/i, 0.18, 0.52, 549],
  [/vaseline/i, 0.15, 0.22, 1190],
  [/knorr/i, 0.14, 0.33, 399],
  [/lucky/i, 0.12, 0.36, 349],
  [/perchs/i, 0.10, 0.29, 1490],
  [/oddbird/i, 0.07, 0.18, 1990],
  [/egils|appels/i, 0.26, 0.47, 329],
  [/pepsi/i, 0.22, 0.44, 299],
  [/malt/i, 0.15, 0.39, 319],
  [/ritz/i, 0.12, 0.31, 459],
  [/salsa/i, 0.08, 0.19, 529],
]

const CHAINS = [
  ['Krónan', 0.33], ['Bónus', 0.30], ['Nettó', 0.14], ['Hagkaup', 0.12],
  ['Fjarðarkaup', 0.05], ['Kjörbúðin', 0.03], ['Annað (sameinað)', 0.03],
]

const BASKET = [
  ['Brauð', 0.38], ['Bananar', 0.31], ['Nýmjólk', 0.29], ['Hafragrjón', 0.21],
  ['Smjör', 0.18], ['Egg', 0.16], ['Ostur', 0.15], ['Jarðarber', 0.09],
]

export function demoDashboard(brand, productNames = [], days = 90) {
  const r = rng(hash(brand + '|' + days))
  const weeks = Math.max(4, Math.round(days / 7))

  // Vikuleg þróun: hægur vöxtur + herferðarhopp síðustu 4 vikurnar.
  const now = new Date()
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  const by_week = []
  let L = 0
  for (let i = 0; i < weeks; i++) {
    const d = new Date(monday); d.setUTCDate(d.getUTCDate() - (weeks - 1 - i) * 7)
    let base = 78 + 22 * (i / Math.max(1, weeks - 1))
    if (i >= weeks - 4) base *= 1.42
    const lines = Math.round(base * (0.9 + r() * 0.2))
    L += lines
    by_week.push({ week: iso(d), lines, buyers: Math.round(lines * (0.66 + r() * 0.08)) })
  }

  const buyers = Math.round(L * 0.47)
  const receipts = Math.round(L * 0.86)
  const repeat_rate = days <= 31 ? 0.24 : days >= 300 ? 0.52 : 0.38
  const new_rate = days <= 31 ? 0.41 : days >= 300 ? 0.74 : 0.57

  // Vörur
  const names = productNames.length ? productNames : ['Vara A', 'Vara B', 'Vara C']
  const specs = names.map(n => {
    const k = KNOWN.find(([re]) => re.test(n))
    return { name: n, w: k ? k[1] : 0.05 + r() * 0.15, rep: k ? k[2] : 0.15 + r() * 0.3, price: k ? k[3] : 400 + Math.round(r() * 800) }
  })
  const wsum = specs.reduce((s, p) => s + p.w, 0)
  let revenue = 0
  const by_product = specs
    .map(p => {
      const lines = Math.round(L * p.w / wsum)
      revenue += lines * p.price
      return { name: p.name, lines, buyers: Math.round(lines * 0.55), repeat_rate: Math.round(p.rep * 1000) / 1000, suppressed: false }
    })
    .sort((a, b) => b.lines - a.lines)

  const by_chain = CHAINS.map(([chain, s]) => ({ chain, lines: Math.round(L * s), buyers: Math.round(buyers * s * 1.08) }))
  const basket = BASKET.map(([label, share]) => ({ label, receipts: Math.round(receipts * share), share }))

  return {
    brand, days, since: iso(new Date(Date.now() - days * 86400000)), min_group: 5,
    insufficient: false, demo: true,
    totals: {
      lines: L, units: Math.round(L * 1.18), revenue, receipts, buyers,
      repeat_buyers: Math.round(buyers * repeat_rate), repeat_rate,
      new_buyers: Math.round(buyers * new_rate), new_rate,
      cashback: Math.round(L * 34),
    },
    by_week, by_chain, by_product, basket,
  }
}
