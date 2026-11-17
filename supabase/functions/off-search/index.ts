// off-search — leit í Open Food Facts eftir heiti (fyrir vörumyndatól stjórnanda).
// Vafrinn má ekki kalla beint á leitarþjónustu OFF (CORS), svo leitin fer hér í gegn.
// Aðeins stjórnandi: athugað með RPC am_admin() með auðkenni notandans. verify_jwt = true.
// OFF biður um lýsandi User-Agent og hóflega notkun (~10 leitir á mínútu).
const UA = 'Tossalisti/1.0 (+https://tossalisti.is)'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

type P = { code: string, name: string, brand: string, quantity: string, image: string | null, small: string | null }
const FIELDS = 'code,product_name,product_name_is,brands,quantity,image_front_url,image_front_small_url'
const map = (p: any): P => ({
  code: String(p.code || ''), name: p.product_name_is || p.product_name || '',
  brand: Array.isArray(p.brands) ? (p.brands[0] || '') : String(p.brands || '').split(',')[0],
  quantity: p.quantity || '', image: p.image_front_url || null, small: p.image_front_small_url || null,
})

async function salSearch(q: string, iceland: boolean): Promise<P[]> {
  const query = iceland ? `${q} countries_tags:"en:iceland"` : q
  const r = await fetch('https://search.openfoodfacts.org/search?page_size=16&fields=' + FIELDS + '&q=' + encodeURIComponent(query), { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error('sal ' + r.status)
  return ((await r.json()).hits || []).map(map)
}
async function cgiSearch(q: string, iceland: boolean): Promise<P[]> {
  const u = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=16&search_terms=' + encodeURIComponent(q)
    + (iceland ? '&tagtype_0=countries&tag_contains_0=contains&tag_0=iceland' : '') + '&fields=' + FIELDS
  const r = await fetch(u, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error('cgi ' + r.status)
  return ((await r.json()).products || []).map(map)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const SB = Deno.env.get('SUPABASE_URL')!, ANON = Deno.env.get('SUPABASE_ANON_KEY')!
  const auth = req.headers.get('authorization') || ''
  const chk = await fetch(SB + '/rest/v1/rpc/am_admin', { method: 'POST', headers: { apikey: ANON, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' })
  if (!chk.ok || (await chk.json()) !== true) return json({ error: 'not authorized' }, 403)

  let body: any = {}
  try { body = await req.json() } catch {}
  const q = String(body.q || '').trim().slice(0, 80)
  if (!q) return json({ products: [] })
  const iceland = body.iceland !== false
  let products: P[] = [], source = 'sal'
  try { products = await salSearch(q, iceland) } catch {
    source = 'cgi'
    try { products = await cgiSearch(q, iceland) } catch (e2) { return json({ error: String((e2 as Error).message || e2), products: [] }, 502) }
  }
  return json({ products: products.filter(p => p.image || p.small), source })
})
