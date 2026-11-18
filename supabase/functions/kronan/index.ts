// kronan — prufutenging við Krónan Public API (BETA). Aðeins stjórnandi á meðan beðið er svars Krónunnar.
// Lykillinn (KRONAN_TOKEN) er Supabase-leyndarmál sem Sverrir setti sjálfur; hann fer aldrei í vafrann eða svör.
// Aðgangur: (a) innskráður stjórnandi (am_admin) — les + skrifar á innkaupamiða Krónunnar,
//           (b) x-cron-secret — aðeins lestur (til að kanna gögnin úr gagnagrunni).
// Krónan: 200 fyrirspurnir á 200 sek; Authorization: AccessToken <token>.
const BASE = 'https://api.kronan.is/api/v1'
const UA = 'Tossalisti/1.0 (+https://tossalisti.is)'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

async function kr(path: string, init: RequestInit = {}) {
  const TOKEN = Deno.env.get('KRONAN_TOKEN')
  if (!TOKEN) throw new Error('KRONAN_TOKEN vantar')
  const r = await fetch(BASE + path, { ...init, headers: { Authorization: 'AccessToken ' + TOKEN, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA, ...(init.headers || {}) } })
  const text = await r.text()
  let data: unknown = null
  try { data = JSON.parse(text) } catch { data = text.slice(0, 500) }
  return { status: r.status, data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const SB = Deno.env.get('SUPABASE_URL')!, ANON = Deno.env.get('SUPABASE_ANON_KEY')!
  const secret = Deno.env.get('CRON_SECRET')
  let admin = false, readOnly = true
  if (secret && req.headers.get('x-cron-secret') === secret) { admin = true; readOnly = true }
  else {
    const chk = await fetch(SB + '/rest/v1/rpc/am_admin', { method: 'POST', headers: { apikey: ANON, Authorization: req.headers.get('authorization') || '', 'Content-Type': 'application/json' }, body: '{}' })
    if (chk.ok && (await chk.json()) === true) { admin = true; readOnly = false }
  }
  if (!admin) return json({ error: 'not authorized' }, 403)

  let b: any = {}
  try { b = await req.json() } catch {}
  const a = String(b.action || '')
  try {
    if (a === 'me') return json(await kr('/me/'))
    if (a === 'stats') return json(await kr(`/product-purchase-stats/?sort=${encodeURIComponent(b.sort || 'most_frequent')}&limit=${Math.min(100, +b.limit || 50)}&offset=${+b.offset || 0}`))
    if (a === 'orders') return json(await kr(`/orders/?limit=${Math.min(50, +b.limit || 10)}`))
    if (a === 'order') return json(await kr(`/orders/${encodeURIComponent(b.token)}/`))
    if (a === 'summary') return json(await kr(`/orders/line-summary/?from_year=${+b.from_year || new Date().getUTCFullYear() - 1}&from_month=${+b.from_month || 1}`))
    if (a === 'note') return json(await kr('/shopping-notes/'))
    if (a === 'search') {
      const r = await kr('/products/search/', { method: 'POST', body: JSON.stringify({ query: String(b.q || '').slice(0, 64), pageSize: Math.min(20, +b.pageSize || 8) }) })
      const hits = (((r.data as any)?.hits) || []).map((h: any) => ({ sku: h.sku, name: h.name, price: h.price, image: h.thumbnail, priceInfo: h.priceInfo, shortage: !!h.temporaryShortage }))
      return json({ status: r.status, hits, count: (r.data as any)?.count ?? hits.length })
    }
    if (a === 'note_add') {
      if (readOnly) return json({ error: 'read only' }, 403)
      // Lína: { sku } ef ákveðin Krónuvara var valin, annars frjáls texti
      const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 60).map((l: any) => {
        if (typeof l === 'string') return { text: l.slice(0, 255) }
        const q = Math.max(0, Math.min(10000, +l.quantity || 0))
        return l.sku ? { sku: String(l.sku).slice(0, 32), quantity: q } : { text: String(l.text || '').slice(0, 255), quantity: q }
      }).filter((l: any) => l.text || l.sku)
      if (!lines.length) return json({ error: 'engar línur' }, 400)
      // Ekki tvítaka: sleppa vörum sem eru þegar óhakaðar á miðanum (sama SKU eða sami texti)
      const cur = await kr('/shopping-notes/')
      const open = ((cur.data as any)?.lines || []).filter((l: any) => !l.isCompleted)
      const haveTxt = new Set(open.map((l: any) => String(l.text || '').toLowerCase().trim()).filter(Boolean))
      const haveSku = new Set(open.map((l: any) => String(l.product?.sku || '')).filter(Boolean))
      const fresh = lines.filter((l: any) => l.sku ? !haveSku.has(l.sku) : !haveTxt.has(l.text.toLowerCase().trim()))
      if (!fresh.length) return json({ status: 200, added: 0, skipped: lines.length })
      const r = await kr('/shopping-notes/add-lines/', { method: 'POST', body: JSON.stringify({ lines: fresh }) })
      return json({ ...r, added: fresh.length, skipped: lines.length - fresh.length })
    }
    return json({ error: 'unknown action' }, 400)
  } catch (e) { return json({ error: String((e as Error).message || e) }, 500) }
})
