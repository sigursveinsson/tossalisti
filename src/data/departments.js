// Búðardeildir í þeirri röð sem fólk gengur venjulega um verslun.
export const DEPARTMENTS = [
  { key: 'produce', name: 'Ávextir & grænmeti', icon: '🥬', color: '#7bc043' },
  { key: 'meat',    name: 'Kjöt & fiskur',      icon: '🍖', color: '#f07a4f' },
  { key: 'dairy',   name: 'Mjólkurvörur & egg', icon: '🥛', color: '#4ba3f5' },
  { key: 'bakery',  name: 'Brauð & bakkelsi',   icon: '🍞', color: '#e0a23c' },
  { key: 'pantry',  name: 'Þurrvara',           icon: '🛒', color: '#8b7ff0' },
  { key: 'frozen',  name: 'Frystivörur',        icon: '❄️', color: '#34d39e' },
  { key: 'household',name:'Heimilið',           icon: '🧻', color: '#e06a93' },
  { key: 'other',   name: 'Annað',              icon: '📦', color: '#aab0bc' },
]

export const DEPT_BY_KEY = Object.fromEntries(DEPARTMENTS.map(d => [d.key, d]))
export const DEPT_ORDER = Object.fromEntries(DEPARTMENTS.map((d, i) => [d.key, i]))
