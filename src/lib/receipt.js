import { supabase } from './supabaseClient.js'

// Ókeypis kvittanalestur sem keyrir í vafranum (Tesseract.js, íslenska).
// Engin bakendaþjónusta og enginn API-lykill. Lakari en vision-líkan, en
// staðfestingarskjárinn leyfir notanda að lagfæra. Hægt að skipta út síðar.

const STORES = [
  'bónus', 'bonus', 'krónan', 'kronan', 'nettó', 'netto', 'hagkaup', 'iceland',
  'prís', 'pris', 'kostur', 'fjarðarkaup', 'fjardarkaup', 'krambúð', 'kjörbúð',
  'samkaup', 'heimkaup', 'costco', 'extra', '10-11', 'kvosin',
]

function parsePrice(s) {
  if (!s) return null
  const n = parseFloat(String(s).replace(/[.\s]/g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

const PRICE_RE = /(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{2})?)\s*(?:kr\.?)?$/i
const SKIP = /(samtals|total|afsláttur|afslattur|vsk|virðisauk|greitt|greidsla|debet|kredit|kort|reikning|kvittun|afgreidsl|posi|sími|kennitala|heimilisfang)/i

export function parseReceiptText(raw) {
  const text = raw || ''
  const low = text.toLowerCase()
  let store = ''
  for (const s of STORES) {
    if (low.includes(s)) { store = s.charAt(0).toUpperCase() + s.slice(1); break }
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let total = null
  const items = []
  for (const line of lines) {
    const m = line.match(PRICE_RE)
    if (!m) continue
    if (/(samtals|total|greitt|kort|debet|kredit)/i.test(line)) {
      const t = parsePrice(m[1]); if (t != null) total = t
      continue
    }
    const name = line.slice(0, line.length - m[0].length).trim().replace(/\s{2,}/g, ' ')
    if (name.length < 2) continue
    if (SKIP.test(name) && !/[a-záéíóúýþæðö]{3}/i.test(name)) continue
    if (!/[a-záéíóúýþæðö]/i.test(name)) continue
    const price = parsePrice(m[1])
    if (price == null) continue
    items.push({ name, price })
  }
  return { store, items, total }
}

// Myndvinnsla fyrir lestur: rétt stærð + grátóna + auka birtuskil.
// Bætir Tesseract verulega á varmaprentuðum kvittunum.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Afkóðar mynd EINU SINNI í minnkaðri útgáfu með sem minnstu minnisálagi.
// iOS Safari drepur ferlið ef heil 12–48MP myndavélarmynd er afkóðuð í striga;
// createImageBitmap með resizeWidth afkóðar beint í minni stærð þar sem það er stutt,
// með mun lægra minnistoppi en new Image() + canvas.
async function loadDownscaledCanvas(file, maxW) {
  // AÐEINS niðurkvörðuð afkóðun (createImageBitmap með resizeWidth) — JPEG afkóðast
  // beint í minni stærð svo minnistoppurinn er lágur. ENGIN full-afkóðunar-varaleið:
  // hún gæti sprengt minnið og Android/iOS drepur þá síðuna (ógrípanlegt). Ef þetta
  // bregst kastar fallið villu og kallandinn sendir hráu skrána á netþjóninn í staðinn.
  if (typeof createImageBitmap !== 'function') throw new Error('no createImageBitmap')
  const bmp = await createImageBitmap(file, { resizeWidth: maxW, resizeQuality: 'medium' })
  const scale = bmp.width > maxW ? maxW / bmp.width : 1
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const c = document.createElement('canvas'); c.width = w; c.height = h
  c.getContext('2d').drawImage(bmp, 0, 0, w, h)
  if (bmp.close) bmp.close()
  return c
}

// Grátóna + birtuskil á ÞEGAR-minnkuðum striga (fyrir Tesseract). Breytir striganum á staðnum.
function enhanceForOcr(canvas) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const a = imgData.data
  const contrast = 1.6
  for (let i = 0; i < a.length; i += 4) {
    let g = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]
    g = (g - 128) * contrast + 128
    g = g < 0 ? 0 : g > 255 ? 255 : g
    a[i] = a[i + 1] = a[i + 2] = g
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas
}

// Sjónlíkan (Supabase Edge Function -> Gemini). Skilar skipulögðum gögnum.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

// Striga → base64 JPEG fyrir sjónlíkanið (striginn er þegar minnkaður).
function canvasToVisionBase64(canvas, quality = 0.7) {
  return (canvas.toDataURL('image/jpeg', quality).split(',')[1]) || ''
}

// Kallar edge-fallið og vinnur úr svarinu.
async function visionInvoke(image, mime) {
  const { data, error } = await supabase.functions.invoke('parse-receipt', { body: { image, mime } })
  if (error || !data || data.error) return null
  const items = Array.isArray(data.items)
    ? data.items.map(i => ({ name: String(i.name || '').trim(), price: i.price == null ? null : Number(i.price) })).filter(i => i.name)
    : []
  return { store: data.store || '', items, total: data.total == null ? null : Number(data.total), date: data.date || null }
}

export async function parseReceiptVision(file) {
  if (!supabase || !supabase.functions) return null
  let image, mime = 'image/jpeg'
  try {
    const c = await loadDownscaledCanvas(file, 1100)
    image = canvasToVisionBase64(c, 0.7)
  } catch (e) {
    // Afkóðun klikkaði (t.d. minnislaust) — sendu hráu skrána, netþjónninn afkóðar.
    image = await fileToBase64(file); mime = file.type || 'image/jpeg'
  }
  return visionInvoke(image, mime)
}

// Þrálátur Tesseract-worker — búinn til EINU sinni og endurnýttur.
// Þannig er íslenski málgangurinn sóttur/hlaðinn aðeins einu sinni (ekki í hvert skipti).
let _ocrWorker = null
let _ocrProgress = null
let _ocrReady = false
function getOcrWorker() {
  if (!_ocrWorker) {
    _ocrWorker = (async () => {
      const { createWorker } = await import('tesseract.js')
      const w = await createWorker('isl', 1, {
        logger: (m) => { if (m.status === 'recognizing text' && _ocrProgress) _ocrProgress(m.progress) },
      })
      _ocrReady = true
      return w
    })()
  }
  return _ocrWorker
}
// Satt þegar OCR-worker er tilbúinn (málgangur hlaðinn) — notað til að fela „fyrsta skipti“ skilaboð.
export function ocrIsReady() { return _ocrReady }

// Les kvittun: reynir sjónlíkan fyrst (nákvæmt), fellur á Tesseract annars.
export async function parseReceipt(file, onProgress) {
  // Afkóða EINU SINNI í minnkaðri stærð — endurnýtt fyrir bæði sjónlíkan og OCR-vara.
  // Heldur minnistoppi niðri svo síminn endurhleðist ekki (Android/iOS OOM).
  let canvas = null, image = null, mime = 'image/jpeg'
  // Mjög stór mynd (líklega há-upplausnar myndavélarmynd) → EKKI afkóða í síma,
  // senda hráu skrána beint; netþjónninn afkóðar. Varnar OOM-endurhleðslu.
  const BIG = 6 * 1024 * 1024
  if (file.size && file.size <= BIG) {
    try {
      canvas = await loadDownscaledCanvas(file, 1100)
      image = canvasToVisionBase64(canvas, 0.7)
    } catch (e) { canvas = null; image = null }
  }
  if (!image) {
    try { image = await fileToBase64(file); mime = file.type || 'image/jpeg' } catch (e2) { image = null }
  }

  // 1) Sjónlíkan (nákvæmt). Virkar líka þegar afkóðun klikkaði — hráa skráin fer á netþjóninn.
  if (image && supabase && supabase.functions) {
    try {
      const ai = await visionInvoke(image, mime)
      if (ai && ai.items && ai.items.length) return ai
    } catch (e) { /* fall back */ }
  }

  // 2) Tesseract-vara — aðeins ef afkóðun tókst (annars myndi full upplausn sprengja minnið aftur).
  if (canvas) {
    _ocrProgress = onProgress
    try {
      const worker = await getOcrWorker()
      const { data } = await worker.recognize(enhanceForOcr(canvas))
      return parseReceiptText(data.text || '')
    } catch (e) { /* skila tómu */ } finally { _ocrProgress = null }
  }

  // Ekkert tókst — notandi skráir handvirkt í yfirferðar-skrefinu.
  return { store: '', items: [], total: null, date: null }
}

// --- Pörun kvittunarlína við vörur á lista ---
export function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|stk|cl|x|pk)\b/g, ' ')
    .replace(/[^a-záéíóúýþæðö ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Skilar fylki af item.id sem passa við einhverja kvittunarlínu.
export function matchListItems(listItems, receiptItems) {
  const rNames = (receiptItems || []).map(r => normalize(r.name)).filter(Boolean)
  const ids = []
  for (const it of listItems || []) {
    if (it.checked) continue
    const n = normalize(it.name)
    if (!n) continue
    const first = n.split(' ')[0]
    const hit = rNames.some(rn => rn.includes(n) || n.includes(rn) || (first.length >= 4 && rn.includes(first)))
    if (hit) ids.push(it.id)
  }
  return ids
}
