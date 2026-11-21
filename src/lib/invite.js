// Boðshlekkur (?invite=token). Táknið er geymt í vafranum svo það lifi af skráningu:
// Google-innskráning og staðfestingarpóstur koma til baka á slóð án ?invite, og þá týndist boðið áður.
const KEY = 'tossa.invite'
const MAX_AGE = 14 * 86400000

export const urlInvite = (() => {
  try { return new URLSearchParams(window.location.search).get('invite') || null } catch { return null }
})()
if (urlInvite) { try { localStorage.setItem(KEY, JSON.stringify({ t: urlInvite, at: Date.now() })) } catch {} }

// Boð sem bíður: úr slóðinni, annars geymt (mest 14 daga gamalt).
export function pendingInvite() {
  if (urlInvite) return urlInvite
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && s.t && Date.now() - (s.at || 0) < MAX_AGE) return s.t
  } catch {}
  return null
}
export function clearInvite() { try { localStorage.removeItem(KEY) } catch {} }
