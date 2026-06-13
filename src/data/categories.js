// Útgjaldaflokkar fyrir bókhald.
export const EXPENSE_CATEGORIES = [
  { key: 'matur', name: 'Matur', icon: '🍽️', color: '#e8954a' },
  { key: 'heimili', name: 'Heimili', icon: '🏠', color: '#4a6fd0' },
  { key: 'ferdalog', name: 'Ferðalög', icon: '✈️', color: '#4aa6c8' },
  { key: 'veisla', name: 'Veisla', icon: '🎉', color: '#d05a9a' },
  { key: 'samgongur', name: 'Samgöngur', icon: '🚗', color: '#5a9e5a' },
  { key: 'born', name: 'Börn', icon: '🧸', color: '#e8c84a' },
  { key: 'afthreying', name: 'Afþreying', icon: '🎬', color: '#9a5ad0' },
  { key: 'reikningar', name: 'Reikningar', icon: '🧾', color: '#6b7a93' },
  { key: 'heilsa', name: 'Heilsa', icon: '💊', color: '#e8615a' },
  { key: 'annad', name: 'Annað', icon: '📦', color: '#9aa6ba' },
]

export const CAT_BY_KEY = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.key, c]))

// Sjálfvirk flokkatillaga út frá verslun/heiti.
const HINTS = [
  [['bónus', 'bonus', 'krónan', 'kronan', 'nettó', 'netto', 'hagkaup', 'iceland', 'costco', 'kjörbúð', 'fjarðarkaup', 'pizza', 'veitinga', 'restaurant', 'kaffi', 'bakarí'], 'matur'],
  [['n1', 'olís', 'olis', ' ob ', 'orkan', 'bensín', 'bensin', 'strætó', 'straeto', 'leigubíl', 'hopp', 'parka', 'bílastæði'], 'samgongur'],
  [['icelandair', 'play', 'booking', 'airbnb', 'hótel', 'hotel', 'flug', 'expedia'], 'ferdalog'],
  [['apótek', 'apotek', 'læknir', 'laeknir', 'heilsu', 'sjúkra', 'tannlæknir'], 'heilsa'],
  [['rafmagn', 'hiti', 'veitur', 'sími', 'simi', 'internet', 'tryggingar', 'áskrift', 'askrift', 'netflix', 'spotify'], 'reikningar'],
  [['ikea', 'húsasmiðjan', 'husasmidjan', 'byko', 'rúmfatalager', 'heimili'], 'heimili'],
]

export function suggestCategory(text) {
  const t = ' ' + (text || '').toLowerCase() + ' '
  for (const [keys, cat] of HINTS) if (keys.some(k => t.includes(k))) return cat
  return null
}
