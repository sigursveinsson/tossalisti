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
// Varaleið þegar createImageBitmap ræður ekki við skrána (t.d. HEIC á sumum iPhone): <img> + canvas.
// Dýrara í minni en hráa skráin er mun verri kostur (6–9 MB strengur í JSON).
function loadViaImageElement(file, maxW) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1
        const c = document.createElement('canvas')
        c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c)
      } catch (e) { reject(e) } finally { URL.revokeObjectURL(url) }
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

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
// products (valkvætt): tilboðsvörur [{id,name,brand}] sem gervigreindin parar kvittanalínur við.
async function visionInvoke(image, mime, products) {
  const prods = (products || []).filter(p => p && p.id && p.name).map(p => ({ id: p.id, name: p.name, brand: p.brand || '' }))
  const body = prods.length ? { image, mime, products: prods } : { image, mime }
  // Ein endurtekning ef netið hikstar — algengasta ástæðan fyrir „ekkert gerðist“ í síma.
  let data = null, error = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try { ({ data, error } = await supabase.functions.invoke('parse-receipt', { body })) } catch (e) { error = e; data = null }
    if (!error && data && !data.error) break
    if (attempt === 0) await new Promise(r => setTimeout(r, 800))
  }
  if (error || !data || data.error) { visionInvoke.lastError = (error && error.message) || (data && data.error) || 'unknown'; return null }
  visionInvoke.lastError = null
  const items = Array.isArray(data.items)
    ? data.items.map(i => ({
        name: String(i.name || '').trim(),
        price: i.price == null ? null : Number(i.price),
        reward_product_id: i.reward_product_id || null,
        warranty_years: [2, 5].includes(Number(i.warranty_years)) ? Number(i.warranty_years) : 0,
      })).filter(i => i.name)
    : []
  return {
    store: data.store || '', items, total: data.total == null ? null : Number(data.total), date: data.date || null,
    // Auðkenni kvittunar (svikavörn): vistast með kaupunum og flaggað á netþjóni.
    receipt_no: data.receipt_no || null, register: data.register || null, time: data.time || null,
    vat_total: data.vat_total == null ? null : Number(data.vat_total),
  }
}

export async function parseReceiptVision(file, products) {
  if (!supabase || !supabase.functions) return null
  let image, mime = 'image/jpeg'
  try {
    const c = await loadDownscaledCanvas(file, 1100)
    image = canvasToVisionBase64(c, 0.7)
  } catch (e) {
    // Afkóðun klikkaði (t.d. minnislaust) — sendu hráu skrána, netþjónninn afkóðar.
    image = await fileToBase64(file); mime = file.type || 'image/jpeg'
  }
  return visionInvoke(image, mime, products)
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

// Mynd til geymslu (kvittanasafn): minnkaður JPEG úr striganum, eða hráa skráin ef hún er hófleg.
function canvasToBlob(canvas, quality = 0.72) {
  return new Promise((resolve) => { try { canvas.toBlob(b => resolve(b), 'image/jpeg', quality) } catch (e) { resolve(null) } })
}
const ARCHIVE_RAW_MAX = 9 * 1024 * 1024

// Mæling: hver skönnunartilraun skráð (líka þær sem deyja í símanum) — Stjórnborð → Skönnun.
async function logScan(ev) {
  try {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('scan_events').insert({
      user_id: user.id, outcome: ev.outcome, stage: ev.stage || null, ms: ev.ms ?? null,
      file_bytes: ev.file_bytes ?? null, file_type: ev.file_type || null, decoded: ev.decoded ?? null, items: ev.items ?? null,
      device_mem: (typeof navigator !== 'undefined' && navigator.deviceMemory) || null,
      ua: (typeof navigator !== 'undefined' && navigator.userAgent || '').slice(0, 200), error: ev.error ? String(ev.error).slice(0, 200) : null,
    })
  } catch (e) { /* mæling má aldrei stöðva skönnun */ }
}

// Les kvittun: reynir sjónlíkan fyrst (nákvæmt), fellur á Tesseract annars.
// Skilar líka `archive` (Blob) — mynd af kvittuninni til að geyma í kvittanasafni.
export async function parseReceipt(file, onProgress, products) {
  const t0 = Date.now()
  const base = { file_bytes: file.size || null, file_type: file.type || null }
  try {
    const res = await parseReceiptInner(file, onProgress, products)
    const outcome = res.items && res.items.length ? 'ok' : (res.failed || 'empty')
    logScan({ ...base, outcome, stage: res.stage || (outcome === 'ok' ? 'done' : null), ms: Date.now() - t0, decoded: !!res.decoded, items: (res.items || []).length, error: visionInvoke.lastError })
    return res
  } catch (e) {
    logScan({ ...base, outcome: 'crash', ms: Date.now() - t0, error: e && (e.message || e) })
    throw e
  }
}

async function parseReceiptInner(file, onProgress, products) {
  // Afkóða EINU SINNI í minnkaðri stærð — endurnýtt fyrir bæði sjónlíkan og OCR-vara.
  // Heldur minnistoppi niðri svo síminn endurhleðist ekki (Android/iOS OOM).
  let canvas = null, image = null, mime = 'image/jpeg'
  // Mjög stór mynd (líklega há-upplausnar myndavélarmynd) → EKKI afkóða í síma,
  // senda hráu skrána beint; netþjónninn afkóðar. Varnar OOM-endurhleðslu.
  const BIG = 12 * 1024 * 1024
  if (file.size && file.size <= BIG) {
    try {
      canvas = await loadDownscaledCanvas(file, 1100)
    } catch (e) {
      try { canvas = await loadViaImageElement(file, 1100) } catch (e2) { canvas = null }
    }
    if (canvas) { try { image = canvasToVisionBase64(canvas, 0.7) } catch (e) { image = null } }
  }
  // Síðasta úrræði: hrá skrá, en aðeins ef hún er hófleg — stærri strengur sprengir minnið í síma.
  if (!image && file.size && file.size <= 4 * 1024 * 1024) {
    try { image = await fileToBase64(file); mime = file.type || 'image/jpeg' } catch (e2) { image = null }
  }
  // Geymslumynd búin til ÁÐUR en OCR-varaleiðin breytir striganum (grátóna).
  let archive = null
  if (canvas) archive = await canvasToBlob(canvas)
  else if (file.size && file.size <= ARCHIVE_RAW_MAX) archive = file

  // 1) Sjónlíkan (nákvæmt). Virkar líka þegar afkóðun klikkaði — hráa skráin fer á netþjóninn.
  let aiReached = false
  if (image && supabase && supabase.functions) {
    try {
      const ai = await visionInvoke(image, mime, products)
      if (ai) { aiReached = true; if (ai.items && ai.items.length) return { ...ai, archive, decoded: !!canvas, stage: 'ai' } }
    } catch (e) { /* fall back */ }
  }

  // 2) Tesseract-vara — AÐEINS ef gervigreindin náðist ekki (ekki ef hún svaraði tómu), afkóðun tókst,
  //    og tækið hefur minni í það (málgangur + pixlavinnsla hefur fellt síma með litlu minni).
  const lowMem = typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory < 4
  if (canvas && !aiReached && !lowMem) {
    _ocrProgress = onProgress
    try {
      const worker = await getOcrWorker()
      const { data } = await worker.recognize(enhanceForOcr(canvas))
      return { ...parseReceiptText(data.text || ''), archive, decoded: true, stage: 'ocr' }
    } catch (e) { /* skila tómu */ } finally { _ocrProgress = null }
  }

  // Ekkert tókst — notandi skráir handvirkt í yfirferðar-skrefinu. `failed` segir skjánum að útskýra.
  return { store: '', items: [], total: null, date: null, archive, decoded: !!canvas, stage: image ? (aiReached ? 'ai' : 'upload') : 'decode', failed: image ? (aiReached ? 'empty' : 'network') : 'decode' }
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

// Mynd af kvittun → Blob til geymslu (notað þegar mynd er bætt við eldri færslu).
export async function makeArchiveImage(file) {
  if (!file) return null
  if (file.size && file.size <= 6 * 1024 * 1024) {
    try { const c = await loadDownscaledCanvas(file, 1200); const b = await canvasToBlob(c); if (b) return b } catch (e) { /* hrátt */ }
  }
  return file.size && file.size <= ARCHIVE_RAW_MAX ? file : null
}
