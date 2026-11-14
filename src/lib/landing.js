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
