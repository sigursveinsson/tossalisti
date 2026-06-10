import { useEffect, useRef } from 'react'

// Lætur vélræna „til baka"-hnappinn (og strjúk-til-baka í síma) loka opnum
// glugga/valmynd/skanna í stað þess að fara úr appinu.
//
// Hver opinn gluggi ýtir einni færslu í vafrasöguna. Þegar ýtt er á til baka
// lokast efsti glugginn. Sé glugga lokað með hnappi (X) fjarlægjum við
// sögufærsluna aftur svo sagan haldist í jafnvægi.

const stack = []
let listening = false
// Teljari (ekki bóóleani): ef mörgum gluggum er lokað samtímis fara mörg
// history.back() af stað og við þurfum að hunsa þau öll — annars getur óhunsuð
// bakkfærsla fellt notandann út úr appinu.
let ignoreCount = 0

function onPop() {
  if (ignoreCount > 0) { ignoreCount--; return }
  const top = stack.pop()
  if (top) { top.closing = true; top.close() }
}

function pushOverlay(close) {
  if (!listening) { window.addEventListener('popstate', onPop); listening = true }
  const entry = { close, closing: false }
  stack.push(entry)
  window.history.pushState({ tlOverlay: stack.length }, '')
  return () => {
    const idx = stack.indexOf(entry)
    if (idx === -1) return            // þegar fjarlægt af til-baka hnappi
    stack.splice(idx, 1)
    if (!entry.closing) {             // lokað með hnappi -> losum sögufærsluna
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
