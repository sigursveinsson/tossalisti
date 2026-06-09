// Búðardeildir í þeirri röð sem fólk gengur venjulega um verslun.
export const DEPARTMENTS = [
  { key: 'produce',     name: 'Ávextir & grænmeti', icon: '🥬', color: '#4d7a18' },
  { key: 'bakery',      name: 'Brauð & bakkelsi',   icon: '🍞', color: '#9a6512' },
  { key: 'meat',        name: 'Kjöt & fiskur',      icon: '🍖', color: '#c0451f' },
  { key: 'dairy',       name: 'Mjólkurvörur & egg', icon: '🥛', color: '#2563eb' },
  { key: 'frozen',      name: 'Frystivörur',        icon: '❄️', color: '#0f8a6a' },
  { key: 'pantry',      name: 'Þurrvara',           icon: '🥫', color: '#5b4bd1' },
  { key: 'baking',      name: 'Bökunarvörur',       icon: '🧁', color: '#b5651d' },
  { key: 'beverages',   name: 'Drykkjarvörur',      icon: '🥤', color: '#1f8ac0' },
  { key: 'snacks',      name: 'Snakk',              icon: '🍿', color: '#d98c00' },
  { key: 'candy',       name: 'Sælgæti',            icon: '🍫', color: '#c0398c' },
  { key: 'cleaning',    name: 'Hreinlætisvörur',    icon: '🧽', color: '#14a37a' },
  { key: 'personalcare',name: 'Snyrtivörur',        icon: '🧴', color: '#7a52cc' },
  { key: 'household',   name: 'Heimilið',           icon: '🧻', color: '#a83b66' },
  { key: 'other',       name: 'Annað',              icon: '📦', color: '#6b7a93' },
]

export const DEPT_BY_KEY = Object.fromEntries(DEPARTMENTS.map(d => [d.key, d]))
export const DEPT_ORDER = Object.fromEntries(DEPARTMENTS.map((d, i) => [d.key, i]))
