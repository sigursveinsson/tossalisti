// Sjálfvirkar stiga-tillögur fyrir algeng heimilisverk.
const CHORE_POINTS = {
  'rusl': 5, 'ruslið': 5, 'fara út með rusl': 5,
  'vaska upp': 15, 'uppþvottavél': 15, 'uppvask': 15,
  'þvottur': 15, 'þvo þvott': 15, 'setja í þvottavél': 15, 'brjóta saman': 10, 'hengja upp þvott': 10,
  'ryksuga': 15, 'skúra': 20, 'moppa': 20, 'þurrka af': 10,
  'þrífa baðherbergi': 30, 'þrífa klósett': 25, 'þrífa eldhús': 30, 'þrífa': 20,
  'elda': 20, 'matseld': 20, 'undirbúa mat': 20, 'baka': 15,
  'versla': 15, 'innkaup': 15, 'kaupa í matinn': 15,
  'búa um rúm': 5, 'taka til': 10, 'ganga frá': 10,
  'fara út með hund': 10, 'ganga með hund': 10, 'gefa dýrum': 5, 'vökva blóm': 5,
  'slá grasið': 25, 'slá garð': 25, 'reyta arfa': 20, 'moka snjó': 20, 'þvo bíl': 20,
}

export function suggestChorePoints(name) {
  const n = (name || '').toLowerCase().trim()
  for (const key of Object.keys(CHORE_POINTS)) {
    if (n.includes(key)) return CHORE_POINTS[key]
  }
  return 10
}

// Tákn fyrir verk — hjálpar þeim sem ekki lesa (t.d. 🐕 = fara út með hund).
const CHORE_EMOJI = [
  [['hund', 'labba', 'ganga með'], '🐕'],
  [['rusl', 'sorp'], '🗑️'],
  [['vaska', 'uppþvott', 'uppvask', 'diska'], '🍽️'],
  [['þvott', 'þvo þvott', 'þvottavél'], '🧺'],
  [['ryksug'], '🧹'],
  [['skúra', 'moppa', 'gólf'], '🧽'],
  [['baðherbergi', 'klósett', 'wc'], '🚽'],
  [['elda', 'matseld', 'matur', 'undirbúa mat'], '🍳'],
  [['baka'], '🧁'],
  [['versla', 'innkaup', 'kaupa í matinn', 'búð'], '🛒'],
  [['rúm', 'búa um'], '🛏️'],
  [['blóm', 'vökva', 'planta'], '🪴'],
  [['köttur', 'kisa', 'gefa dýr', 'gæludýr'], '🐈'],
  [['fisk'], '🐟'],
  [['tönn', 'bursta', 'tennur'], '🪥'],
  [['gras', 'slá', 'garð'], '🌱'],
  [['snjó', 'moka'], '❄️'],
  [['bíl', 'þvo bíl'], '🚗'],
  [['lestur', 'lesa', 'heimanám', 'læra'], '📚'],
  [['æfing', 'íþrótt', 'fótbolt', 'sund'], '⚽'],
]

export function suggestChoreEmoji(name) {
  const n = (name || '').toLowerCase().trim()
  for (const [keys, emoji] of CHORE_EMOJI) {
    if (keys.some(k => n.includes(k))) return emoji
  }
  return null
}

// Algeng tákn fyrir tákn-veljarann í verk-stillingum.
export const EMOJI_CHOICES = [
  '🐕', '🐈', '🐟', '🐹', '🗑️', '🍽️', '🧺', '🧹', '🧽', '🚽', '🛁',
  '🍳', '🧁', '🥪', '🛒', '🛏️', '🪴', '🌱', '❄️', '🚗', '📚', '✏️',
  '⚽', '🏀', '🎹', '🎨', '🦷', '🪥', '🚿', '👕', '🧸', '⭐',
]

export const TIME_OPTIONS = (() => {
  const a = []
  for (let h = 0; h < 24; h++) for (const m of ['00', '30']) a.push(String(h).padStart(2, '0') + ':' + m)
  return a
})()

export const RECURRENCE_LABELS = {
  none: 'Einu sinni',
  daily: 'Daglega',
  weekly: 'Vikulega',
  monthly: 'Mánaðarlega',
}
