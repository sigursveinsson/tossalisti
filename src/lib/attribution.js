// Greinir hvaðan notandi kom (fyrsta heimsókn) og geymir í localStorage þar til
// hann skráir sig — þá er uppruninn skráður á notandann (sjá store.recordAttribution).
const KEY = 'korfan.attr'

const isFb = (s) => /facebook|fb\.com|fb\.me|fbclid/.test(s)
const isIg = (s) => /instagram|igshid|ig_/.test(s)
const isGg = (s) => /google/.test(s)

function detect() {
  const p = new URLSearchParams(window.location.search)
  const utm_source = (p.get('utm_source') || '').toLowerCase()
  const utm_medium = (p.get('utm_medium') || '').toLowerCase()
  const utm_campaign = p.get('utm_campaign') || ''
  const ref = p.get('ref') || ''
  const invite = p.get('invite') || ''
  const referrer = document.referrer || ''
  let host = ''
  try { host = referrer ? new URL(referrer).hostname.toLowerCase() : '' } catch {}

  let source = 'direct'
  if (invite || ref) source = 'tossalisti'           // boð/tilvísun frá öðrum notanda
  else if (utm_source) {
    if (isFb(utm_source)) source = 'facebook'
    else if (isIg(utm_source)) source = 'instagram'
    else if (isGg(utm_source)) source = 'google'
    else source = 'other'
  } else if (host) {
    if (isFb(host)) source = 'facebook'
    else if (isIg(host)) source = 'instagram'
    else if (isGg(host)) source = 'google'
    else if (host.includes('tossalisti')) source = 'tossalisti'
    else source = 'other'
  }
  if (source === 'direct' && p.get('fbclid')) source = 'facebook'

  return { source, utm_source, utm_medium, utm_campaign, referrer }
}

// Fyrsta-snerting: fyrsti markverði uppruninn vinnur; bein heimsókn geymd „mjúkt"
// svo seinni heimsókn (t.d. í gegnum Facebook) geti uppfært hann.
export function captureAttribution() {
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (existing && !existing._soft) return
    const a = detect()
    if (a.source === 'direct') {
      if (!existing) localStorage.setItem(KEY, JSON.stringify({ ...a, _soft: true }))
    } else {
      localStorage.setItem(KEY, JSON.stringify(a))
    }
  } catch {}
}

export function getAttribution() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || 'null'); if (a) delete a._soft; return a } catch { return null }
}
