// Sjálfgefnar vörumyndir fyrir almenn heiti („mjólk“, „léttmjólk“, „nautahakk“).
// „nautahakk 500 g“, „gulrætur 3 stk“ og „Mjólk“ verða öll að lyklinum án magns.
const QTY = /\s+(\d+([.,]\d+)?|½|¼)\s*(g|gr|kg|ml|dl|cl|l|ltr|stk|msk|tsk|rif|pk|pakk|poki|dós|dósir|fl)?\.?$/i

export function genericKey(name) {
  let s = String(name || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
  for (let i = 0; i < 3; i++) { const t = s.replace(QTY, '').trim(); if (t === s) break; s = t }
  return s
}

// Mynd fyrir vöru á lista: eigin mynd > vara úr vörubanka (nákvæmt heiti) > sjálfgefin mynd almenna heitisins
export function imageFor(name, catalog = {}, generic = {}) {
  const n = String(name || '').toLowerCase().trim()
  return catalog[n] || generic[genericKey(n)] || null
}

// Algengustu almennu heitin (úr listum og kvittunum notenda) — gátlisti fyrir myndatöku í búð
export const GENERIC_TARGETS = [
  'mjólk', 'nýmjólk', 'léttmjólk', 'fjörmjólk', 'laktósafrí mjólk', 'haframjólk', 'kókómjólk', 'súrmjólk',
  'skyr', 'jógúrt', 'rjómi', 'matreiðslurjómi', 'sýrður rjómi', 'smjör', 'smjörvi', 'ostur', 'rifinn ostur', 'egg',
  'brauð', 'samlokubrauð', 'hamborgarabrauð', 'pylsubrauð', 'tortillur', 'flatkökur',
  'nautahakk', 'kjúklingabringur', 'kjúklingur', 'pylsur', 'beikon', 'skinka', 'lax',
  'kartöflur', 'laukur', 'hvítlaukur', 'gulrætur', 'tómatar', 'gúrka', 'paprika', 'kál', 'sveppir', 'avókadó',
  'bananar', 'epli', 'appelsínur', 'vínber', 'sítróna',
  'kaffi', 'te', 'pasta', 'spaghetti', 'hrísgrjón', 'hveiti', 'sykur', 'haframjöl', 'morgunkorn', 'niðursoðnir tómatar',
  'gos', 'sódavatn', 'safi', 'snakk', 'popp', 'súkkulaði',
  'klósettpappír', 'eldhúsrúlla', 'uppþvottalögur', 'þvottaefni', 'bleiur', 'ruslapokar',
]
