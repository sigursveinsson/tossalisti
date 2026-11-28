import { useEffect, useRef } from 'react'

// Lætur vélræna „til baka"-hnappinn (og strjúk-til-baka í síma) loka opnum
// glugga/valmynd/skanna í stað þess að fara úr appinu.
//
// Hver opinn gluggi ýtir einni færslu í vafrasöguna. Þegar ýtt er á til baka
// lokast efsti glugginn. Sé glugga lokað með hnappi (X) fjarlægjum við
// sögufærsluna aftur svo sagan haldist í jafnvægi.

const stack = []
// Teljari (ekki bóóleani): ef mörgum gluggum er lokað samtímis fara mörg
// history.back() af stað og við þurfum að hunsa þau öll — annars getur óhunsuð
// bakkfærsla fellt notandann út úr appinu.
let ignoreCount = 0
// Þeir sem bíða eftir að sagan sé komin í jafnvægi (sjá whenHistoryIdle).
let waiters = []
let idleTimer = null

function flush() {
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
  const w = waiters; waiters = []
  w.forEach(fn => { try { fn() } catch (e) { /* má ekki stöðva hina */ } })
}

function onPop(e) {
  if (ignoreCount > 0) {
    ignoreCount--
    // Okkar eigin bakkfærsla (glugga lokað með hnappi): aðrir hlustendur (lista-/flipasagan í App.jsx)
    // mega ekki túlka hana sem „notandinn fór til baka“ — þá hoppaði sýnin til baka á gamla staðinn.
    if (e && e.stopImmediatePropagation) e.stopImmediatePropagation()
    if (ignoreCount === 0) flush()
    return
  }
  const top = stack.pop()
  if (top) { top.closing = true; top.close() }
}
// Skráð strax við innlestur einingarinnar, á undan hlustendum í App.jsx, svo stopImmediatePropagation dugi.
if (typeof window !== 'undefined') window.addEventListener('popstate', onPop)

// Keyrir fn þegar engin „okkar eigin“ bakkfærsla er í gangi. history.back() er ósamstillt: ef slóðinni
// er breytt (pushState) í sama andartaki og glugga er lokað lendir bakkfærslan á nýju færslunni og
// eyðir breytingunni (t.d. „vista kvittun → Bókhald“ eða „Tilkynningar → Opna listann“).
export function whenHistoryIdle(fn) {
  if (ignoreCount === 0) { fn(); return }
  waiters.push(fn)
  // Öryggisnet: berist popstate aldrei (á ekki að gerast) keyrum við samt.
  if (!idleTimer) idleTimer = setTimeout(() => { idleTimer = null; ignoreCount = 0; flush() }, 700)
}

function pushOverlay(close) {
  const entry = { close, closing: false }
  stack.push(entry)
  // Sé bakkfærsla frá öðrum glugga enn á leiðinni (gluggaskipti) bíðum við — annars lendir hún á þessari færslu.
  whenHistoryIdle(() => {
    if (stack.indexOf(entry) === -1) return
    entry.pushed = true
    window.history.pushState({ tlOverlay: stack.length }, '')
  })
  return () => {
    const idx = stack.indexOf(entry)
    if (idx === -1) return            // þegar fjarlægt af til-baka hnappi
    stack.splice(idx, 1)
    if (!entry.closing && entry.pushed) { // lokað með hnappi -> losum sögufærsluna
      ignoreCount++
      window.history.back()
    }
  }
}

export function useBackClose(open, onClose) {
  const ref = useRef(onClose)
  ref.current = onClose
  useEffect(() => {
    if (!open) return
    return pushOverlay(() => ref.current())
  }, [open])
}
