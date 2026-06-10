// Spilun (gamification). Allt reiknað úr `completions`:
//   [{ user_id, kid_id, points, completed_at }]
// Engin ný gögn geymd — level, raðir og merki eru afleidd af afrekum.

const DAY = 86400000

const personMatch = (c, person) =>
  person && (person.kind === 'kid' ? c.kid_id === person.id : c.user_id === person.id)

export function personCompletions(completions, person) {
  return (completions || []).filter(c => personMatch(c, person))
}

export function totalPoints(completions, person) {
  return personCompletions(completions, person).reduce((s, c) => s + (c.points || 0), 0)
}

/* ----------------------------- Level / borð ----------------------------- */
// Hvert þrep: lágmarksstig, heiti og tákn. Nöfn hugsuð fyrir krakka.
export const LEVELS = [
  { min: 0,    title: 'Byrjandi',       icon: '🌱' },
  { min: 50,   title: 'Hjálparhella',   icon: '🤝' },
  { min: 150,  title: 'Dugnaðarforkur', icon: '💪' },
  { min: 350,  title: 'Heimilishetja',  icon: '🦸' },
  { min: 700,  title: 'Súperstjarna',   icon: '🌟' },
  { min: 1200, title: 'Goðsögn',        icon: '👑' },
]

export function levelFor(points = 0) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1] || null
  const span = next ? next.min - cur.min : 0
  const progress = next ? Math.min(1, (points - cur.min) / span) : 1
  return {
    idx, level: idx + 1, title: cur.title, icon: cur.icon,
    points, min: cur.min, next, toNext: next ? next.min - points : 0, progress,
  }
}

/* ------------------------------- Raðir 🔥 ------------------------------- */
const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime() }

function dayMsSet(completions, person) {
  return new Set(personCompletions(completions, person).map(c => midnight(c.completed_at)))
}

// Núverandi röð: samfelldir dagar með a.m.k. einu afreki, sem enda í dag eða í gær.
export function streakDays(completions, person) {
  const days = dayMsSet(completions, person)
  if (!days.size) return 0
  let cursor = midnight(Date.now())
  if (!days.has(cursor)) { cursor -= DAY; if (!days.has(cursor)) return 0 }
  let n = 0
  while (days.has(cursor)) { n++; cursor -= DAY }
  return n
}

// Lengsta röð sögunnar (notuð fyrir merki svo þau hverfi ekki þó röðin slitni).
export function maxStreak(completions, person) {
  const days = [...dayMsSet(completions, person)].sort((a, b) => a - b)
  let best = 0, cur = 0, prev = null
  for (const d of days) { cur = (prev !== null && d - prev === DAY) ? cur + 1 : 1; prev = d; if (cur > best) best = cur }
  return best
}

/* ------------------------------- Merki 🏅 ------------------------------- */
export const BADGES = [
  { id: 'first',   icon: '🥇', name: 'Fyrsta verkið', desc: 'Klára fyrsta verkið' },
  { id: 'ten',     icon: '🔟', name: 'Tíu verk',       desc: 'Klára 10 verk' },
  { id: 'fifty',   icon: '🏅', name: 'Fimmtíu verk',   desc: 'Klára 50 verk' },
  { id: 'p100',    icon: '💯', name: '100 stig',        desc: 'Safna 100 stigum' },
  { id: 'p500',    icon: '🏆', name: '500 stig',        desc: 'Safna 500 stigum' },
  { id: 'streak3', icon: '🔥', name: '3 daga röð',      desc: 'Klára verk 3 daga í röð' },
  { id: 'streak7', icon: '⚡', name: 'Vikuröð',         desc: 'Klára verk 7 daga í röð' },
  { id: 'early',   icon: '🌅', name: 'Morgunhani',      desc: 'Klára verk fyrir kl. 9' },
  { id: 'night',   icon: '🌙', name: 'Kvöldhetja',      desc: 'Klára verk eftir kl. 20' },
]

export function earnedBadges(completions, person) {
  const cs = personCompletions(completions, person)
  const count = cs.length
  const pts = cs.reduce((s, c) => s + (c.points || 0), 0)
  const best = maxStreak(completions, person)
  const hours = cs.map(c => new Date(c.completed_at).getHours())
  const has = {
    first: count >= 1,
    ten: count >= 10,
    fifty: count >= 50,
    p100: pts >= 100,
    p500: pts >= 500,
    streak3: best >= 3,
    streak7: best >= 7,
    early: hours.some(h => h < 9),
    night: hours.some(h => h >= 20),
  }
  return new Set(Object.keys(has).filter(k => has[k]))
}

/* ----------------------------- Verðlaun / budda ---------------------------- */
// Eytt stig = summa kostnaðar af innleystum verðlaunum.
export function spentPoints(redemptions, person) {
  return (redemptions || [])
    .filter(r => personMatch(r, person))
    .reduce((s, r) => s + (r.cost || 0), 0)
}

// Budda: aflað − eytt (aldrei undir 0 í birtingu).
export function balance(completions, redemptions, person) {
  return Math.max(0, totalPoints(completions, person) - spentPoints(redemptions, person))
}
