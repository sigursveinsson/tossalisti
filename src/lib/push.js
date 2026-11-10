// Opt-in web push. Notandi verður sjálfur að kveikja á áminningum — ekkert gerist sjálfkrafa.
import { isNative, registerPush } from './native.js'
const VAPID_PUBLIC = 'BEeSrgHNkbxxlNKY_gGEEMe9ij8Dbo_DHoN1X5vXBROHqIhM9dyDW66Myr6WRfo1XML3uHr3aN6rCr89V1IuJIM'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported() {
  if (isNative()) return true
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

const asJSON = (sub) => (sub && (sub.toJSON ? sub.toJSON() : sub)) || null

// iOS/Android app: APNs/FCM-tóki í stað web-push áskriftar. Vistað í sömu töflu (push_subscriptions) með
// endpoint „apns:<tóki>“ / „fcm:<tóki>“ svo send-push fallið geti greint á milli. (Sending um APNs/FCM: á listanum.)
const NATIVE_KEY = 'tossa.nativePush'
async function enableNativePush() {
  const tok = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Tókst ekki að skrá tilkynningar. Reyndu aftur.')), 15000)
    registerPush((r) => { clearTimeout(t); resolve(r) }).then((ok) => { if (!ok) { clearTimeout(t); reject(new Error('Þú hafnaðir tilkynningum. Hægt er að breyta því í stillingum símans.')) } }).catch((e) => { clearTimeout(t); reject(e) })
  })
  const sub = { endpoint: `${tok.platform}:${tok.token}`, native: true, platform: tok.platform, token: tok.token }
  try { localStorage.setItem(NATIVE_KEY, JSON.stringify(sub)) } catch {}
  return sub
}

export async function enablePush() {
  if (isNative()) return enableNativePush()
  if (!pushSupported()) throw new Error('Tækið styður ekki tilkynningar. Settu appið á heimaskjáinn og reyndu aftur.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Þú hafnaðir tilkynningum. Hægt er að breyta því í stillingum vafrans.')
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  return asJSON(sub)
}

export async function disablePush() {
  if (isNative()) {
    let sub = null
    try { sub = JSON.parse(localStorage.getItem(NATIVE_KEY) || 'null'); localStorage.removeItem(NATIVE_KEY) } catch {}
    return sub
  }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    const json = asJSON(sub)
    if (sub) await sub.unsubscribe()
    return json
  } catch { return null }
}

export async function currentSubscription() {
  if (isNative()) { try { return JSON.parse(localStorage.getItem(NATIVE_KEY) || 'null') } catch { return null } }
  try {
    const reg = await navigator.serviceWorker.ready
    return asJSON(await reg.pushManager.getSubscription())
  } catch { return null }
}
