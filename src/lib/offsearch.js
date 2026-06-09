// Leitar að raunverulegum vörum í Open Food Facts á meðan notandi skrifar.
// Sía á vörur sem seldar eru á Íslandi (countries = iceland) og forgangsraðar
// íslenskum heitum. Keyrir í vafranum (sama uppspretta og strikamerkjaskanninn).

const FIELDS = 'product_name_is,product_name,brands,image_front_small_url,image_small_url'

export async function searchProducts(query, signal) {
  const q = (query || '').trim()
  if (q.length < 3) return []
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?json=1&action=process' +
    '&tagtype_0=countries&tag_contains_0=contains&tag_0=iceland' +
    '&sort_by=unique_scans_n&page_size=12' +
    '&fields=' + encodeURIComponent(FIELDS) +
    '&search_terms=' + encodeURIComponent(q)
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return []
    const data = await res.json()
    const seen = new Set()
    const out = []
    for (const p of (data.products || [])) {
      let name = (p.product_name_is || p.product_name || '').trim()
      if (!name) continue
      name = name.replace(/\s+/g, ' ')
      const key = name.toLowerCase()
      if (key.length < 2 || seen.has(key)) continue
      seen.add(key)
      out.push({ name, image: p.image_front_small_url || p.image_small_url || null })
      if (out.length >= 6) break
    }
    return out
  } catch (e) {
    return []
  }
}
