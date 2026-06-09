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

async function preprocess(file) {
  const img = await loadImage(file)
  const targetW = 1500
  const scale = img.width > targetW ? targetW / img.width : (img.width < 900 ? 1.6 : 1)
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(img.src)
  const imgData = ctx.getImageData(0, 0, w, h)
  const a = imgData.data
  const contrast = 1.6
  for (let i = 0; i < a.length; i += 4) {
    let g = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]
    g = (g - 128) * contrast + 128
    g = g < 0 ? 0 : g > 255 ? 255 : g
    a[i] = a[i + 1] = a[i + 2] = g
  }
  ctx.putImageData(imgData, 0, 0)
  return c
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

export async function parseReceiptVision(file) {
  if (!supabase || !supabase.functions) return null
  const image = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('parse-receipt', { body: { image, mime: file.type || 'image/jpeg' } })
  if (error || !data || data.error) return null
  const items = Array.isArray(data.items)
    ? data.items.map(i => ({ name: String(i.name || '').trim(), price: i.price == null ? null : Number(i.price) })).filter(i => i.name)
    : []
  return { store: data.store || '', items, total: data.total == null ? null : Number(data.total), date: data.date || null }
}

// Les kvittun: reynir sjónlíkan fyrst (nákvæmt), fellur á Tesseract annars.
export async function parseReceipt(file, onProgress) {
  try {
    const ai = await parseReceiptVision(file)
    if (ai && ai.items && ai.items.length) return ai
  } catch (e) { /* fall back */ }

  const Tesseract = (await import('tesseract.js')).default
  let image = file
  try { image = await preprocess(file) } catch (e) { image = file }
  const { data } = await Tesseract.recognize(image, 'isl', {
    logger: (m) => { if (onProgress && m.status === 'recognizing text') onProgress(m.progress) },
  })
  return parseReceiptText(data.text || '')
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
