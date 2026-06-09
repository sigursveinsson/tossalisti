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

// Les mynd með Tesseract. onProgress(0..1) valfrjálst.
export async function parseReceipt(file, onProgress) {
  const Tesseract = (await import('tesseract.js')).default
  const { data } = await Tesseract.recognize(file, 'isl', {
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
