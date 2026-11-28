import { installIsLocale } from './lib/isLocale.js'
installIsLocale() // á undan öllu: íslenskar tölur og dagsetningar líka þar sem vafrinn kann ekki 'is-IS'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import DemoBudget from './components/DemoBudget.jsx'
import WishView from './components/WishView.jsx'
import ScanLanding from './components/ScanLanding.jsx'
import { pageContext, isBot } from './lib/attribution.js'
import './index.css'
import { isNative, hideSplash, setStatusBar, onAppUrlOpen, onBackButton } from './lib/native.js'

// /siggaogjon (líka /syning): bókhald með tilbúnum gögnum — sjálfstæð síða án innskráningar og án gagnagrunns
const isDemo = /^\/(sig+aogjon|syning)\/?$/i.test(window.location.pathname) || /^#(sig+aogjon|syning)$/i.test(window.location.hash)
// /osk/<tákn>: óskalisti sem eigandinn deildi — gestir skoða og taka frá án skráningar
const wishTok = (window.location.pathname.match(/^\/osk\/([A-Za-z0-9]{8,40})\/?$/) || [])[1]
// /kvittun: lendingarsíða fyrir auglýsingar — dæmakvittun skönnuð með einum smelli, svo skráning
// ?skanna=1 (hlekkur í áminningarpósti): skanninn opnast um leið og notandinn er kominn inn
try {
  const q = new URLSearchParams(window.location.search)
  if (q.has('skanna')) {
    localStorage.setItem('tossa.openScan', '1')
    q.delete('skanna')
    const rest = q.toString()
    window.history.replaceState(window.history.state, '', window.location.pathname + (rest ? '?' + rest : '') + window.location.hash)
  }
} catch {}
// Nýir gestir af Facebook/Instagram sem lenda á forsíðunni fá lendingarsíðuna í stað appsins.
// Ekki: boðs-/uppskriftahlekkir, tæki sem hefur skráð sig inn eða er með virka setu (líka gestasetu),
// þeir sem völdu „Prófa án skráningar“ (tossa.openScan) né þeir sem fluttust úr Facebook-vafranum (esc).
function fbNewVisitor() {
  try {
    if (window.location.pathname !== '/' || isBot()) return false
    const p = new URLSearchParams(window.location.search)
    if (['invite', 'uppskrift', 'reset', 'griptu', 'esc'].some(k => p.has(k))) return false
    if (localStorage.getItem('tossa.known') || localStorage.getItem('tossa.noAuto') || localStorage.getItem('tossa.openScan')) return false
    if (Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) return false
    const s = pageContext().source
    return s === 'facebook' || s === 'instagram'
  } catch { return false }
}
const isScanLp = /^\/kvittun\/?$/i.test(window.location.pathname) || fbNewVisitor()
createRoot(document.getElementById('root')).render(isDemo ? <DemoBudget /> : wishTok ? <WishView token={wishTok} /> : isScanLp ? <ScanLanding /> : <App />)

if (isNative()) {
  // iOS/Android app (Capacitor): engin service worker — appið ber sjálft vefskrárnar. Ræsiskjár burt þegar React er komið upp.
  requestAnimationFrame(() => { hideSplash(); setStatusBar() })
  // Djúptenglar: tossalisti.is/k/<kóði>, auðkennistenglar (#access_token…) og boð → sama slóðakerfi og á vefnum
  onAppUrlOpen((u) => { if (u.hostname === 'tossalisti.is' || u.hostname === 'www.tossalisti.is') window.location.assign(u.pathname + u.search + u.hash) })
  // Android til-baka: opnir gluggar eiga færslu í vafrasögunni (backstack.js) → history.back() lokar þeim.
  // Ekkert opið og engin saga → ekkert gert (appið lokast ekki fyrir slysni).
  onBackButton((canGoBack) => { if (canGoBack) window.history.back() })
} else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Uppsett app (iPhone/Android) er oft vakið úr bakgrunni án endurhleðslu og keyrir þá gamla útgáfu dögum saman.
      // Athuga hvort ný útgáfa sé til í hvert sinn sem appið kemur í forgrunn, og endurhlaða þegar hún tekur við.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}) })
      let hadController = !!navigator.serviceWorker.controller
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) { hadController = true; return } // fyrsta uppsetning: ekkert að endurhlaða
        if (window.__tossaReloading) return
        window.__tossaReloading = true
        window.location.reload()
      })
    }).catch(() => {})
  })
}
