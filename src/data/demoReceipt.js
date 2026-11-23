import { CAT_BY_KEY } from './categories.js'

// Dæmakvittun fyrir nýja notendur: sýnir lesturinn og bókhaldið án þess að vera með kvittun við höndina.
// Raunveruleg kvittun (Bónus Fiskislóð 2.11.2026, frá Sverri) — línurnar eins og appið las þær.
// Notuð í kvittanaskannanum (dæmi) og á lendingarsíðunni /kvittun.
export const DEMO_STORE = 'Bónus Fiskislóð (dæmi)'
export const DEMO_DATE = '2026-11-02'
export const DEMO_IMG = '/postur/demo-kvittun.jpg'
export const DEMO_ITEMS = [
  ['Starbucks 10 stk', 1, 769, 'drykkir'], ['EF hamborgarasósa 400 ml', 1, 487, 'matur'], ['OS Rjómaostur 400 g', 1, 998, 'matur'], ['Lambhaga salat box', 1, 525, 'matur'],
  ['HP kleinur 7 stk', 1, 559, 'matur'], ['OS Góðostur 26% biti', 1, 1313, 'matur'], ['SFG agúrka', 1, 275, 'matur'], ['ES frosin bláber', 1, 459, 'matur'],
  ['DJ döðlur', 1, 369, 'matur'], ['MCV Hob Nobs 262 g', 1, 314, 'snakk'], ['Bónus poki', 1, 53, 'heimili'],
]
export const DEMO_TOTAL = DEMO_ITEMS.reduce((a, [, , pr]) => a + pr, 0)
export const DEMO_CATS = (() => {
  const m = {}
  for (const [, , pr, c] of DEMO_ITEMS) m[c] = (m[c] || 0) + pr
  return Object.entries(m).map(([key, amount]) => ({ key, amount, ...(CAT_BY_KEY[key] || { name: 'Annað', color: '#6b7a93', icon: '•' }) })).sort((a, b) => b.amount - a.amount)
})()
