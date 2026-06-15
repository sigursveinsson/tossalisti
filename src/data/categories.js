import { departmentFor } from './products.js'

// Útgjaldaflokkar — nýtast bæði á undirliði kvittana og á heilar færslur.
export const EXPENSE_CATEGORIES = [
  { key: 'matur', name: 'Matur', icon: '🍽️', color: '#e8954a' },
  { key: 'drykkir', name: 'Drykkir', icon: '🥤', color: '#1f8ac0' },
  { key: 'afengi', name: 'Áfengi', icon: '🍷', color: '#7a1f3d' },
  { key: 'snakk', name: 'Snakk & sælgæti', icon: '🍫', color: '#d98c00' },
  { key: 'hreinlaeti', name: 'Hreinlæti', icon: '🧽', color: '#14a37a' },
  { key: 'snyrti', name: 'Snyrtivörur', icon: '🧴', color: '#7a52cc' },
  { key: 'heimili', name: 'Heimili', icon: '🧻', color: '#a83b66' },
  { key: 'born', name: 'Barnavörur', icon: '🧸', color: '#e8c84a' },
  { key: 'ferdalog', name: 'Ferðalög', icon: '✈️', color: '#4aa6c8' },
  { key: 'samgongur', name: 'Samgöngur', icon: '🚗', color: '#5a9e5a' },
  { key: 'reikningar', name: 'Reikningar', icon: '🧾', color: '#6b7a93' },
  { key: 'heilsa', name: 'Heilsa', icon: '💊', color: '#e8615a' },
  { key: 'afthreying', name: 'Afþreying', icon: '🎬', color: '#9a5ad0' },
  { key: 'veitingar', name: 'Veitingar & kaffihús', icon: '🍔', color: '#e07b39' },
  { key: 'skemmtun', name: 'Skemmtun & barir', icon: '🍸', color: '#c0398c' },
  { key: 'fot', name: 'Föt', icon: '👕', color: '#3f8fd0' },
  { key: 'gjafir', name: 'Gjafir', icon: '🎁', color: '#d4537e' },
  { key: 'tomstundir', name: 'Tómstundir & sport', icon: '⚽', color: '#5a9e5a' },
  { key: 'askriftir', name: 'Áskriftir', icon: '📺', color: '#5a6fd0' },
  { key: 'gaeludyr', name: 'Gæludýr', icon: '🐾', color: '#8a6d3b' },
  { key: 'annad', name: 'Annað', icon: '📦', color: '#9aa6ba' },
]

export const CAT_BY_KEY = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.key, c]))

// Vörudeild → útgjaldaflokkur (nýtir flokkun vörubankans).
const DEPT_TO_CAT = {
  produce: 'matur', bakery: 'matur', meat: 'matur', dairy: 'matur', frozen: 'matur', pantry: 'matur', baking: 'matur',
  beverages: 'drykkir', alcohol: 'afengi', snacks: 'snakk', candy: 'snakk',
  cleaning: 'hreinlaeti', personalcare: 'snyrti', household: 'heimili', other: 'annad',
}

// Sjálfvirk flokkun á undirlið kvittunar út frá vöruheiti.
export function itemCategory(name) {
  return DEPT_TO_CAT[departmentFor(name)] || 'annad'
}

// Virkur flokkur línuliðs: handvirk yfirskrift annars sjálfvirk.
export function effectiveItemCat(item) {
  return item.category || itemCategory(item.name)
}

// Sjálfvirk flokkatillaga á heilli færslu út frá verslun/heiti (fyrir handvirkar færslur).
const STORE_HINTS = [
  [['n1', 'olís', 'olis', 'orkan', 'bensín', 'bensin', 'strætó', 'straeto', 'leigubíl', 'hopp', 'bílastæði'], 'samgongur'],
  [['icelandair', 'play', 'booking', 'airbnb', 'hótel', 'hotel', 'flug', 'expedia'], 'ferdalog'],
  [['apótek', 'apotek', 'læknir', 'laeknir', 'heilsu', 'sjúkra', 'tannlæknir'], 'heilsa'],
  [['rafmagn', 'hiti', 'veitur', 'sími', 'simi', 'internet', 'tryggingar', 'áskrift', 'askrift', 'netflix', 'spotify'], 'reikningar'],
  [['bíó', 'bio', 'leikhús', 'tónleikar', 'sundlaug'], 'afthreying'],
  [['vínbúð', 'vinbud', 'áfengi'], 'afengi'],
  [['bónus', 'bonus', 'krónan', 'kronan', 'nettó', 'netto', 'hagkaup', 'iceland', 'kjörbúð', 'fjarðarkaup'], 'matur'],
]
export function suggestCategory(text) {
  const t = ' ' + (text || '').toLowerCase() + ' '
  for (const [keys, cat] of STORE_HINTS) if (keys.some(k => t.includes(k))) return cat
  return null
}

// Verslunarkeðjur — sameina mismunandi útibú („Krónan Skeifunni", „Krónan Granda" → „Krónan").
const STORE_CHAINS = [
  ['Krónan', ['krónan', 'kronan']],
  ['Bónus', ['bónus', 'bonus']],
  ['Nettó', ['nettó', 'netto']],
  ['Hagkaup', ['hagkaup']],
  ['Costco', ['costco']],
  ['Iceland', ['iceland']],
  ['Fjarðarkaup', ['fjarðarkaup', 'fjardarkaup']],
  ['Kjörbúðin', ['kjörbúð', 'kjorbud']],
  ['Krambúð', ['krambúð', 'krambud']],
  ['10-11', ['10-11', '10/11', 'tíu ellefu']],
  ['Extra', ['extra ']],
  ['Vínbúðin', ['vínbúð', 'vinbud']],
  ['Lyfja', ['lyfja']],
  ['Apótekið', ['apótek', 'apotek']],
  ['N1', ['n1']],
  ['Olís', ['olís', 'olis']],
  ['Orkan', ['orkan']],
  ['ÓB', ['ób ']],
  ['IKEA', ['ikea']],
  ['ELKO', ['elko']],
]

// Skilar nafni keðju ef þekkt, annars upprunalega söluaðila-heitið.
export function storeChain(name) {
  const raw = (name || '').trim()
  if (!raw) return 'Annað'
  const t = ' ' + raw.toLowerCase() + ' '
  for (const [chain, keys] of STORE_CHAINS) if (keys.some(k => t.includes(k))) return chain
  return raw
}
