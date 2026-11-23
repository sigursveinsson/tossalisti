// Nafnlaus mæling á upphafssíðu: skoðaði, skrunaði, ýtti á hnappa, hve lengi gesturinn staldraði við.
// Bundið við gesta-auðkenni (slembi-id í localStorage), aldrei netfang. Vélmenni og stjórnandi eru ekki talin.
import { isCloud } from './supabaseClient.js'
import { visitorId, isBot, pageContext } from './attribution.js'

const URL_ = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const t0 = Date.now()
const sent = new Set()

function off() {
  if (!isCloud || isBot()) return true
  try { return !!localStorage.getItem('tossa.noTrack') } catch { return false }
}

// keepalive: berst líka þegar síðunni er lokað eða skipt um app.
export function landingEvent(event, { once = true } = {}) {
  if (off()) return
  if (once && sent.has(event)) return
  sent.add(event)
  let source = null
  try { source = pageContext().source || null } catch {}
  try {
    fetch(URL_ + '/rest/v1/landing_events', {
      method: 'POST',
      keepalive: true,
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ visitor: visitorId(), event, ms: Date.now() - t0, source }),
    }).catch(() => {})
  } catch {}
}

// Skráir skoðun, fyrsta skrun og hvenær gesturinn fór (eða skipti um app). Skilar hreinsifalli.
export function startLandingTracking() {
  if (off()) return () => {}
  landingEvent('view')
  const onScroll = () => { if (window.scrollY > 120) { landingEvent('scroll'); window.removeEventListener('scroll', onScroll) } }
  const onHide = () => { if (document.visibilityState === 'hidden') landingEvent('leave') }
  const onPageHide = () => landingEvent('leave')
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onPageHide)
  return () => {
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onPageHide)
  }
}

// Inni í appinu (prufuaðgangur): hve lengi gesturinn er áður en hann fer.
export function startAppTracking() {
  if (off()) return () => {}
  landingEvent('app_view')
  // Mæling á „komu og fóru strax“: var síðan nokkurn tíma sýnileg? Forhleðsla í Facebook/Instagram-vafranum
  // (síðan hlaðin í bakgrunni áður en/án þess að notandi sjái hana) lítur annars út eins og gestur sem fór á 2 sek.
  try {
    if (document.visibilityState !== 'visible') {
      landingEvent('load_hidden')
      const onFirst = () => { if (document.visibilityState === 'visible') { landingEvent('became_visible'); document.removeEventListener('visibilitychange', onFirst) } }
      document.addEventListener('visibilitychange', onFirst)
    }
    // Fyrsta snerting eða skrun = raunveruleg manneskja að skoða
    const onTouch = () => { landingEvent('first_touch'); window.removeEventListener('pointerdown', onTouch, true); window.removeEventListener('scroll', onTouch, true) }
    window.addEventListener('pointerdown', onTouch, true)
    window.addEventListener('scroll', onTouch, true)
  } catch {}
  const onHide = () => { if (document.visibilityState === 'hidden') landingEvent('app_leave') }
  const onPageHide = () => landingEvent('app_leave')
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onPageHide)
  return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onPageHide) }
}

// Gestir úr Facebook/Instagram (auglýsing eða færsla) lenda beint í appinu með prufuaðgangi.
// Ekki ef tækið hefur áður skráð sig inn, notandi valdi „Skrá inn“, eða um vélmenni er að ræða.
export function shouldAutoGuest() {
  if (!isCloud || isBot()) return false
  try {
    if (localStorage.getItem('tossa.known') || localStorage.getItem('tossa.noAuto')) return false
    const p = new URLSearchParams(window.location.search)
    if (p.has('reset') || p.has('griptu')) return false
    if (/^\/(afskra|postlisti)/.test(window.location.pathname)) return false
    // Boðshlekkur á tæki sem hefur aldrei skráð sig inn: beint inn á listann sem gestur (hægt að vista aðgang síðar)
    if (p.has('invite')) return true
    // Uppskriftahlekkur af efnissíðu: beint í „Setja hráefnin á listann“ án skráningar
    if (p.has('uppskrift')) return true
    // Af lendingarsíðunni /kvittun („Prófa með minni kvittun án skráningar“): beint í skannann sem gestur
    if (localStorage.getItem('tossa.openScan')) return true
    const c = pageContext()
    return c.source === 'facebook' || c.source === 'instagram' || p.has('fbclid') || /^\d{8,}$/.test(c.utm_campaign || '')
  } catch { return false }
}

// Vafrar inni í öppum (Facebook, Instagram o.fl.) — Google bannar innskráningu þar („disallowed_useragent“).
export function isInAppBrowser() {
  try { return /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Snapchat|TikTok|; wv\)/i.test(navigator.userAgent || '') } catch { return false }
}

// ---- Leið út úr Facebook/Instagram-vafranum ----
// Í vafra inni í appi týnist prufuaðgangurinn þegar glugganum er lokað, ekki er hægt að setja appið á heimaskjá
// og staðfestingarhlekkir opnast í öðrum vafra. Því er gestinum vísað í Chrome/Safari strax við komu,
// ÁÐUR en nokkuð er búið til (innskráningartóki fer aldrei í slóð). ?esc=1 merkir að flutningur tókst.
export function inAppPlatform() {
  if (!isInAppBrowser()) return null
  const ua = navigator.userAgent || ''
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  return null
}

export function shouldEscape() {
  if (!isCloud || isBot()) return null
  try {
    const p = new URLSearchParams(window.location.search)
    if (p.has('esc') || p.has('reset') || p.has('invite')) return null
    if (/^\/(afskra|postlisti)/.test(window.location.pathname)) return null
    if (sessionStorage.getItem('tossa.stay') || localStorage.getItem('tossa.known')) return null
  } catch { return null }
  return inAppPlatform()
}

// Sama slóð (með utm-merkjum) + esc=1 svo mælingin og „beint inn“ haldist í nýja vafranum.
export function escapeTarget(mark = '1') {
  const u = new URL(window.location.href)
  u.searchParams.delete('fbclid')
  u.searchParams.set('esc', mark)
  return u
}

export function androidIntentUrl() {
  const u = escapeTarget('1')
  const fallback = escapeTarget('fail').toString()
  return 'intent://' + u.host + u.pathname + u.search + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(fallback) + ';end'
}

// Kominn í venjulegan vafra eftir flutning: skrá og hreinsa merkið úr slóðinni.
export function noteEscaped() {
  try {
    const p = new URLSearchParams(window.location.search)
    const v = p.get('esc')
    if (!v) return
    if (v === '1' && !isInAppBrowser()) landingEvent('escaped')
    else if (v === 'fail') landingEvent('escape_fail')
    if (v === 'fail') sessionStorage.setItem('tossa.stay', '1')
    p.delete('esc')
    const q = p.toString()
    window.history.replaceState({}, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash)
  } catch {}
}
