import { useEffect, useRef } from 'react'

// Lætur vélræna „til baka"-hnappinn (og strjúk-til-baka í síma) loka opnum
// glugga/valmynd/skanna í stað þess að fara úr appinu.
//
// Hver opinn gluggi ýtir einni færslu í vafrasöguna. Þegar ýtt er á til baka
// lokast efsti glugginn. Sé glugga lokað með hnappi (X) fjarlægjum við
// sögufærsluna aftur svo sagan haldist í jafnvægi.

const stack = []
let listening = false
let ignoreNext = false

function onPop() {
  if (ignoreNext) { ignoreNext = false; return }
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
      ignoreNext = true
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
