// Opt-in web push. Notandi verður sjálfur að kveikja á áminningum — ekkert gerist sjálfkrafa.
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
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

const asJSON = (sub) => (sub && (sub.toJSON ? sub.toJSON() : sub)) || null

export async function enablePush() {
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
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    const json = asJSON(sub)
    if (sub) await sub.unsubscribe()
    return json
  } catch { return null }
}

export async function currentSubscription() {
  try {
    const reg = await navigator.serviceWorker.ready
    return asJSON(await reg.pushManager.getSubscription())
  } catch { return null }
}
