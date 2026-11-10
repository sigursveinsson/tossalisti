// Brú yfir í Capacitor (iOS/Android app). Allt hér er feature-detect: á vefnum er window.Capacitor ekki til
// og hver fall skilar null/false. Engin static import á @capacitor/* — vefbyggingin má ekki brotna þótt
// app-pakkarnir séu ekki uppsettir.

const cap = () => (typeof window !== 'undefined' && window.Capacitor) || null
const plugin = (name) => { const c = cap(); return c && c.Plugins && c.Plugins[name] ? c.Plugins[name] : null }

export const isNative = () => { const c = cap(); return !!(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()) }
export const platform = () => { const c = cap(); return c && typeof c.getPlatform === 'function' ? c.getPlatform() : 'web' }

// ---- Skjalaskanni (ML Kit á Android, VisionKit á iOS) — skilar File[] eða null ef ekki í boði ----
// @capgo/capacitor-document-scanner: scanDocument({ maxNumDocuments, responseType:'imageFilePath' })
export const hasDocumentScanner = () => isNative() && !!plugin('DocumentScanner')
export async function scanDocuments({ maxPages = 4 } = {}) {
  const ds = plugin('DocumentScanner')
  if (!ds) return null
  const r = await ds.scanDocument({ maxNumDocuments: maxPages, responseType: 'imageFilePath', letUserAdjustCrop: true, croppedImageQuality: 92 })
  const paths = (r && (r.scannedImages || r.images)) || []
  const c = cap()
  const files = []
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i]
    const url = c && typeof c.convertFileSrc === 'function' ? c.convertFileSrc(p) : p
    const blob = await fetch(url).then(x => x.blob())
    files.push(new File([blob], `kvittun-scan-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' }))
  }
  return files
}

// ---- Push-tilkynningar (APNs/FCM). Skilar tóka eða null. Kallað eftir innskráningu, aðeins ef notandi kveikir á áminningum.
export async function registerPush(onToken, onNotification) {
  const pn = plugin('PushNotifications')
  if (!pn) return false
  const perm = await pn.requestPermissions()
  if (!perm || perm.receive !== 'granted') return false
  pn.addListener('registration', (t) => onToken && onToken({ token: t.value, platform: platform() }))
  pn.addListener('registrationError', () => {})
  if (onNotification) {
    pn.addListener('pushNotificationReceived', (n) => onNotification(n, false))
    pn.addListener('pushNotificationActionPerformed', (a) => onNotification(a.notification, true))
  }
  await pn.register()
  return true
}

// ---- Djúptenglar (auðkenning með tölvupósti, boð, /k/<kóði>) → sama leiðarkerfi og á vefnum
export function onAppUrlOpen(handler) {
  const app = plugin('App')
  if (!app) return () => {}
  const h = app.addListener('appUrlOpen', ({ url }) => { try { handler(new URL(url)) } catch {} })
  return () => { try { h.then ? h.then(x => x.remove()) : h.remove() } catch {} }
}

// Android „til baka“-takki: loka opnum glugga/flipa frekar en að loka appinu
export function onBackButton(handler) {
  const app = plugin('App')
  if (!app) return () => {}
  const h = app.addListener('backButton', ({ canGoBack }) => handler(canGoBack))
  return () => { try { h.then ? h.then(x => x.remove()) : h.remove() } catch {} }
}

export async function hideSplash() { const s = plugin('SplashScreen'); if (s) { try { await s.hide() } catch {} } }
export async function setStatusBar() {
  const sb = plugin('StatusBar'); if (!sb) return
  try { await sb.setStyle({ style: 'LIGHT' }); if (platform() === 'android') await sb.setBackgroundColor({ color: '#ffffff' }) } catch {}
}
