// Íslenskt tölu- og dagsetningasnið þar sem vafrinn kann það ekki.
// Chrome (einkum á Android og Windows) er oft án 'is-IS' gagna og fellur þá þegjandi á ensku:
// „November 26, 2026“ og „3,837 kr“ í stað „26. nóvember 2026“ og „3.837 kr“. Allt appið kallar á
// toLocaleString('is-IS') / toLocaleDateString('is-IS'), svo við lögum það á einum stað: sé útkoman
// ekki íslensk tökum við við þeim köllum (aðeins fyrir 'is-IS'; önnur tungumál eru ósnert).

const MON = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember']
const MON_S = ['jan.', 'feb.', 'mar.', 'apr.', 'maí', 'jún.', 'júl.', 'ágú.', 'sep.', 'okt.', 'nóv.', 'des.']
const WD = ['sunnudagur', 'mánudagur', 'þriðjudagur', 'miðvikudagur', 'fimmtudagur', 'föstudagur', 'laugardagur']
const WD_S = ['sun.', 'mán.', 'þri.', 'mið.', 'fim.', 'fös.', 'lau.']
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const isIs = (loc) => loc === 'is-IS' || loc === 'is'

// Dagur/mánuður/ár/vikudagur — í tímabelti ef beðið er um það, annars staðartími tækisins.
function parts(d, tz) {
  if (tz) {
    try {
      const p = {}
      new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
        .formatToParts(d).forEach(x => { p[x.type] = x.value })
      return { y: Number(p.year), m: Number(p.month) - 1, d: Number(p.day), w: Math.max(0, WD_EN.indexOf(p.weekday)) }
    } catch (e) { /* óþekkt tímabelti: staðartími */ }
  }
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), w: d.getDay() }
}

export function isDate(date, opt) {
  if (isNaN(date.getTime())) return 'Invalid Date'
  const o = opt || {}
  const p = parts(date, o.timeZone)
  if (!o.day && !o.month && !o.year && !o.weekday) return p.d + '.' + (p.m + 1) + '.' + p.y
  const wd = o.weekday ? (o.weekday === 'long' ? WD[p.w] : WD_S[p.w]) : ''
  let s
  if (o.month === 'numeric' || o.month === '2-digit') {
    const two = (n) => (o.month === '2-digit' || o.day === '2-digit') ? String(n).padStart(2, '0') : String(n)
    s = [o.day ? two(p.d) : null, two(p.m + 1), o.year ? (o.year === '2-digit' ? String(p.y).slice(-2) : p.y) : null].filter(x => x != null).join('.')
  } else {
    const mon = o.month ? (o.month === 'long' ? MON[p.m] : MON_S[p.m]) : ''
    s = [o.day ? p.d + '.' : '', mon, o.year ? String(p.y) : ''].filter(Boolean).join(' ')
  }
  return wd ? (s ? wd + (o.weekday === 'long' ? ', ' : ' ') + s : wd) : s
}

export function installIsLocale() {
  let numOk = false, dateOk = false
  try { numOk = (1234567.5).toLocaleString('is-IS') === '1.234.567,5' } catch (e) {}
  try { dateOk = /nóv/i.test(new Date(2026, 10, 2).toLocaleDateString('is-IS', { day: 'numeric', month: 'long' })) } catch (e) {}

  if (!numOk) {
    const orig = Number.prototype.toLocaleString
    // Enska sniðið með skiptum táknum: 1,234.5 → 1.234,5
    Number.prototype.toLocaleString = function (loc, opt) {
      if (!isIs(loc)) return orig.call(this, loc, opt)
      try { return orig.call(this, 'en-US', opt).replace(/[.,]/g, c => (c === ',' ? '.' : ',')) } catch (e) { return String(this) }
    }
  }
  if (!dateOk) {
    const origD = Date.prototype.toLocaleDateString
    Date.prototype.toLocaleDateString = function (loc, opt) {
      if (!isIs(loc)) return origD.call(this, loc, opt)
      try { return isDate(this, opt) } catch (e) { return origD.call(this, loc, opt) }
    }
    const origT = Date.prototype.toLocaleTimeString
    // 24 tíma klukka („17:00“), ekki „5:00 PM“
    Date.prototype.toLocaleTimeString = function (loc, opt) {
      if (!isIs(loc)) return origT.call(this, loc, opt)
      try { return origT.call(this, 'en-GB', opt) } catch (e) { return origT.call(this, loc, opt) }
    }
  }
}
