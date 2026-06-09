// Emoji fyrir generic vörur (þegar engin alvöru ljósmynd er til).
// Gerir vöruhilluna lifandi strax; ljósmyndir bætast við með skönnun.
const MAP = [
  // Ávextir & grænmeti
  [/(tómat|tomat)/, '🍅'], [/svepp/, '🍄'], [/epli/, '🍎'], [/banan/, '🍌'], [/appelsín|appelsin/, '🍊'],
  [/sítrón|sitron|límón|limon/, '🍋'], [/vínber|vinber/, '🍇'], [/jarðarber|jardarber/, '🍓'],
  [/bláber|blaber|hindber|\bber\b/, '🫐'], [/melón|melon/, '🍈'], [/ananas/, '🍍'], [/avókadó|avokado/, '🥑'],
  [/gúrk|gurk/, '🥒'], [/paprik/, '🫑'], [/gulr(ó|o)t|gulræt/, '🥕'], [/kartöfl|kartofl/, '🥔'],
  [/laukur|laukar|rauðlauk/, '🧅'], [/hvítlauk|hvitlauk/, '🧄'], [/salat|spínat|spinat|kál/, '🥬'],
  [/brokkól|brokkol|blómkál|blomkal/, '🥦'], [/maís|mais/, '🌽'], [/chili|jalap/, '🌶️'],
  [/pera|perur/, '🍐'], [/ferskj|nektarín/, '🍑'], [/kókos|kokos/, '🥥'], [/engifer/, '🫚'],
  // Kjöt & fiskur
  [/kjúkling|kjukling/, '🍗'], [/nauta|hakk|steik|gúllas|gullas|lamba|grís|gris/, '🥩'], [/beikon|flesk/, '🥓'],
  [/pylsur|pylsa|bjúgu|bjugu/, '🌭'], [/lax|fisk|ýsa|ysa|þorsk|thorsk|silung|reyk/, '🐟'], [/rækj|raekj|humar/, '🦐'],
  // Mjólkurvörur & egg
  [/mjólk|mjolk/, '🥛'], [/ostur|\bost\b/, '🧀'], [/egg/, '🥚'], [/smjör|smjor/, '🧈'], [/jógúrt|jogurt|skyr/, '🥛'],
  // Brauð & bakkelsi
  [/brauð|braud|baguett|rúnstyk|bollur/, '🍞'], [/croissant|vínarbrauð/, '🥐'], [/kaka|terta|muffin|múffa/, '🧁'],
  [/kringl|beygl/, '🥨'], [/pönnukök|vöffl|voffl/, '🥞'],
  // Þurrvara & bökun
  [/pasta|spag|penne|núðl|nudl|makkar/, '🍝'], [/hrísgrjón|hrisgrjon|grjón/, '🍚'], [/hveiti|mjöl|mjol/, '🌾'],
  [/súpa|supa/, '🥫'], [/tómatsós|\bsósa\b|\bsosa\b/, '🥫'], [/\bsalt\b/, '🧂'], [/olía|olia/, '🫒'], [/hunang/, '🍯'],
  [/kaffi/, '☕'], [/\bte\b/, '🍵'], [/súkkulaði|sukkuladi|kakó|kako/, '🍫'],
  // Drykkir
  [/gos|kók|\bkok\b|pepsi|sprite|fanta|malt|kristall|sódavatn|sodavatn|\bvatn/, '🥤'],
  [/safi|djús|djus/, '🧃'], [/bjór|bjor/, '🍺'], [/\bvín\b|\bvin\b/, '🍷'], [/orku/, '⚡'],
  // Snakk & sælgæti
  [/snakk|flögur|flogur|popp|\bkex\b|saltstang/, '🍿'], [/lakkrís|lakkris|nammi|sælgæti|brjóstsyk|karamell/, '🍬'],
  [/\bís\b|\bis\b|rjómaís/, '🍦'],
  // Heimili / hreinlæti / snyrti
  [/klósett|klosett|pappír|papp|rúlla|rulla/, '🧻'], [/þvotta|tvotta|sápa|sapa|hreinsi|uppþvotta/, '🧼'],
  [/tannkrem|tannbursti/, '🪥'], [/sjampó|sjampo|hárnær/, '🧴'], [/bleiur|bleia/, '🍼'],
]

const DEPT = {
  produce: '🥬', meat: '🍖', dairy: '🥛', bakery: '🍞', pantry: '🥫', frozen: '🧊',
  beverages: '🥤', snacks: '🍿', candy: '🍫', baking: '🧁', cleaning: '🧽',
  personalcare: '🧴', household: '🧻', other: '🛒',
}

export function productEmoji(name, dept) {
  const n = (name || '').toLowerCase()
  for (const [re, e] of MAP) { if (re.test(n)) return e }
  return DEPT[dept] || '🛒'
}
