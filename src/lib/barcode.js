// Flettir strikamerki (EAN/UPC) upp í Open Food Facts og skilar bestu íslensku
// vöruheiti sem völ er á. Skilar null ef ekkert nothæft heiti finnst.
//
// Open Food Facts er opið, ókeypis API með CORS leyft fyrir vafra, og geymir
// staðbundin vöruheiti í reitum eins og product_name_is (íslenska).

const FIELDS = [
  'product_name_is',
  'generic_name_is',
  'product_name',
  'generic_name',
  'abbreviated_product_name',
  'brands',
  'image_front_small_url',
  'image_small_url',
  'image_front_url',
  'image_url',
].join(',')

function clean(name) {
  if (!name) return ''
  // Fjarlægja umframbil og einfalda. Höldum fyrsta hluta ef mörg heiti eru aðskilin með kommu.
  let s = String(name).replace(/\s+/g, ' ').trim()
  if (s.includes(',')) s = s.split(',')[0].trim()
  return s
}

export async function lookupBarcode(code) {
  const ean = String(code || '').replace(/\D/g, '')
  if (!ean) return null
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=${FIELDS}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    const name =
      p.product_name_is ||
      p.generic_name_is ||
      p.product_name ||
      p.generic_name ||
      p.abbreviated_product_name ||
      p.brands ||
      ''
    const c = clean(name)
    if (!c) return null
    const image =
      p.image_front_small_url ||
      p.image_small_url ||
      p.image_front_url ||
      p.image_url ||
      null
    return { name: c, image }
  } catch {
    return null
  }
}
