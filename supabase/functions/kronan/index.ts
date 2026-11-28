// kronan — prufutenging við Krónan Public API (BETA). Lokaður aðgangur á meðan beðið er svars Krónunnar.
// Hver notandi notar SINN EIGIN Krónu-lykil: hann límir hann sjálfur inn í appið (action 'token_set'), lykillinn er
// prófaður gegn /me/ og geymdur dulkóðaður í Supabase Vault. Hann fer aldrei til baka í vafrann, í svör eða í logga.
// Aðgangur: (a) stjórnandi (am_admin) — eigin lykill ef til, annars KRONAN_TOKEN (leyndarmál sem Sverrir setti sjálfur),
//           (b) notendur á private.kronan_users — AÐEINS með eigin lykli (aldrei lykli stjórnanda),
//           (c) x-cron-secret — aðeins lestur með KRONAN_TOKEN (til að kanna gögnin úr gagnagrunni).
// ALDREI er gengið frá pöntun. Krónan: 200 fyrirspurnir á 200 sek; Authorization: AccessToken <token>.
// ATH: deployað BEINT í Supabase (verify_jwt=false; auðkenning er gerð hér). Þessi skrá er heimildin.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BASE = 'https://api.kronan.is/api/v1'
const UA = 'Tossalisti/1.0 (+https://tossalisti.is)'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const SB = Deno.env.get('SUPABASE_URL')!, ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const db = createClient(SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

async function krWith(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch(BASE + path, { ...init, headers: { Authorization: 'AccessToken ' + token, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA, ...(init.headers || {}) } })
  const text = await r.text()
  let data: unknown = null
  try { data = JSON.parse(text) } catch { data = text.slice(0, 500) }
  return { status: r.status, data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const secret = Deno.env.get('CRON_SECRET')
  const ENV_TOKEN = Deno.env.get('KRONAN_TOKEN') || ''
  let b: any = {}
  try { b = await req.json() } catch {}
  const a = String(b.action || '')

  let readOnly = true, token = ''
  if (secret && req.headers.get('x-cron-secret') === secret) { token = ENV_TOKEN }
  else {
    const authz = req.headers.get('authorization') || ''
    const { data: ud } = await db.auth.getUser(authz.replace(/^Bearer\s+/i, ''))
    const user = ud?.user
    if (!user || user.is_anonymous) return json({ error: 'not authorized' }, 403)
    const uid = user.id
    // Stjórnandi? (sama athugun og áður: am_admin í nafni notandans)
    const chk = await fetch(SB + '/rest/v1/rpc/am_admin', { method: 'POST', headers: { apikey: ANON, Authorization: authz, 'Content-Type': 'application/json' }, body: '{}' })
    const isAdmin = chk.ok && (await chk.json()) === true
    if (!isAdmin) {
      const { data: ok } = await db.rpc('kronan_user_allowed', { p_user: uid })
      if (ok !== true) return json({ error: 'not authorized' }, 403)
    }
    readOnly = false
    // Notandinn setur inn eigin lykil: prófaður gegn Krónunni áður en hann er vistaður. Aldrei skrifaður í logga né svar.
    if (a === 'token_set') {
      const t = String(b.token || '').trim()
      if (t.length < 8 || t.length > 400 || /\s/.test(t)) return json({ ok: false, error: 'format' }, 400)
      const me = await krWith(t, '/me/')
      if (me.status !== 200) return json({ ok: false, error: me.status === 401 || me.status === 403 ? 'rejected' : 'kronan_' + me.status }, 400)
      const { error } = await db.rpc('kronan_token_set', { p_user: uid, p_token: t })
      if (error) return json({ ok: false, error: 'store' }, 500)
      const m: any = me.data || {}
      return json({ ok: true, name: String(m.name || m.fullName || m.firstName || '').slice(0, 60) })
    }
    if (a === 'token_clear') {
      const { error } = await db.rpc('kronan_token_clear', { p_user: uid })
      return json({ ok: !error })
    }
    const { data: own } = await db.rpc('kronan_token_get', { p_user: uid })
    token = typeof own === 'string' && own ? own : (isAdmin ? ENV_TOKEN : '')
    if (!token) return json({ error: 'no_token' }, 428)
  }
  if (!token) return json({ error: 'KRONAN_TOKEN vantar' }, 500)
  const kr = (path: string, init: RequestInit = {}) => krWith(token, path, init)

  try {
    if (a === 'me') return json(await kr('/me/'))
    if (a === 'stats') return json(await kr(`/product-purchase-stats/?sort=${encodeURIComponent(b.sort || 'most_frequent')}&limit=${Math.min(100, +b.limit || 50)}&offset=${+b.offset || 0}`))
    if (a === 'orders') return json(await kr(`/orders/?limit=${Math.min(50, +b.limit || 10)}`))
    if (a === 'order') return json(await kr(`/orders/${encodeURIComponent(b.token)}/`))
    if (a === 'summary') return json(await kr(`/orders/line-summary/?from_year=${+b.from_year || new Date().getUTCFullYear() - 1}&from_month=${+b.from_month || 1}`))
    if (a === 'note') return json(await kr('/shopping-notes/'))
    if (a === 'search') {
      const r = await kr('/products/search/', { method: 'POST', body: JSON.stringify({ query: String(b.q || '').slice(0, 64), pageSize: Math.min(48, +b.pageSize || 8) }) })
      const hits = (((r.data as any)?.hits) || []).map((h: any) => ({ sku: h.sku, name: h.name, price: h.price, image: h.thumbnail, priceInfo: h.priceInfo, shortage: !!h.temporaryShortage }))
      return json({ status: r.status, hits, count: (r.data as any)?.count ?? hits.length })
    }
    // Lestur: uppskriftir, flokkar, tilboð (prufa)
    if (a === 'recipes_search') return json(await kr('/recipes/search/', { method: 'POST', body: JSON.stringify({ query: String(b.q || '').slice(0, 64), page: Math.max(1, +b.page || 1), ...(Array.isArray(b.tags) ? { tags: b.tags.map(Number).filter(Number.isFinite).slice(0, 10) } : {}) }) }))
    if (a === 'recipe') return json(await kr('/recipes/' + encodeURIComponent(String(b.slug || '')) + '/'))
    if (a === 'categories') return json(await kr('/categories/'))
    if (a === 'category_products') return json(await kr('/categories/' + encodeURIComponent(String(b.slug || '')) + '/products/?page=' + Math.max(1, +b.page || 1) + (b.pageSize ? '&page_size=' + Math.min(60, +b.pageSize) : '')))
    if (a === 'on_sale') return json(await kr('/products/on-sale/?limit=' + Math.min(100, +b.limit || 60) + '&offset=' + (+b.offset || 0)))
    // Karfa í Snjallverslun. ALDREI er gengið frá pöntun (checkout/complete er ekki notað) — notandinn greiðir sjálfur hjá Krónunni.
    const skuLines = () => (Array.isArray(b.lines) ? b.lines : []).slice(0, 80)
      .filter((l: any) => l && l.sku)
      .map((l: any) => ({ sku: String(l.sku).slice(0, 40), quantity: Math.max(1, Math.min(500, Math.round(+l.quantity || 1))) }))
    if (a === 'cart_preview') {
      const lines = skuLines()
      if (!lines.length) return json({ error: 'engar línur' }, 400)
      return json(await kr('/checkout/preview-lines/', { method: 'POST', body: JSON.stringify({ lines }) }))
    }
    if (a === 'cart_get') return json(await kr('/checkout/'))
    if (a === 'cart_add') {
      if (readOnly) return json({ error: 'read only' }, 403)
      const lines = skuLines()
      if (!lines.length) return json({ error: 'engar línur' }, 400)
      // replace:false — bætir við körfuna sem fyrir er, eyðir engu (sjálfgefið hjá Krónunni er að skipta öllu út!)
      const r = await kr('/checkout/lines/', { method: 'POST', body: JSON.stringify({ lines, replace: false }) })
      const cart = await kr('/checkout/')
      return json({ status: r.status, result: r.data, cart: cart.data })
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
