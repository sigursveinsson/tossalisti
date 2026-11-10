import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { isNative, hideSplash, setStatusBar, onAppUrlOpen, onBackButton } from './lib/native.js'

createRoot(document.getElementById('root')).render(<App />)

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
