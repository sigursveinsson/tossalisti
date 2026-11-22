// Verðvakt. Notandi límir slóð á vöru í vefverslun → heiti, mynd og verð sótt af síðunni.
// action 'add'  (innskráður notandi): sækir vöruna, skráir/endurnýtir vakt, skilar gögnum fyrir listalínuna.
// action 'run'  (pg_cron, x-cron-key): athugar vaktaðar vörur einu sinni á sólarhring; verðlækkun → skilaboð í innhólf.
// action 'test' (stjórnandi, am_admin()): les slóð án þess að vista neitt.
// Lestur: 1) JSON-LD (schema.org Product)  2) lýsigögn (og:/product:)  3) Gemini les síðutextann (aðeins ef 1–2 bregðast).
// Sparnaður: sama slóð er ein vakt fyrir alla; gervigreind er ekki kölluð aftur ef tölurnar í kringum verðið eru óbreyttar.
// ATH: deployað BEINT í Supabase. Þessi skrá er heimildin. verify_jwt=false (fallið auðkennir sjálft).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const SB_URL = Deno.env.get('SUPABASE_URL')!
const db = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const UA = 'Mozilla/5.0 (compatible; Verdvakt/1.0)'
const MAX_PER_USER = 30
const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash']

function genConfig(model: string, base: Record<string, unknown>) {
  const g3 = /^gemini-3/.test(model)
  return { ...base, temperature: 0, thinkingConfig: g3 ? { thinkingLevel: 'minimal' } : { thinkingBudget: 0 } }
}

// ---------- slóðir ----------
function hostOk(h: string) {
  h = h.toLowerCase()
  if (!h.includes('.') || h.includes(':') || h.startsWith('[')) return false
  if (/^\d+(\.\d+){3}$/.test(h)) return false
  if (/(^|\.)(localhost|local|internal|lan|home|corp|test|invalid)$/.test(h)) return false
  if (/(^|\.)supabase\.(co|com|in|net)$/.test(h)) return false
  return true
}
function normUrl(raw: string): URL | null {
  let u: URL
  try { u = new URL(String(raw || '').trim()) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  u.protocol = 'https:'
  if (u.port || u.username || u.password || !hostOk(u.hostname)) return null
  u.hash = ''
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|gbraid$|wbraid$|gad_|mc_|igshid$|srsltid$|msclkid$|_gl$)/i.test(k)) u.searchParams.delete(k)
  if (u.href.length > 600) return null
  return u
}
const hostLabel = (h: string) => h.replace(/^www\d?\./, '')

async function fetchPage(u: URL): Promise<{ html: string; final: URL } | { error: string }> {
  let cur = u
  for (let hop = 0; hop < 5; hop++) {
    let r: Response
    try {
      r = await fetch(cur.href, {
        redirect: 'manual', signal: AbortSignal.timeout(9000),
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'is,en;q=0.7' },
      })
    } catch (e) { return { error: 'fetch:' + String(e).slice(0, 60) } }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location'); try { await r.body?.cancel() } catch { /* */ }
      if (!loc) return { error: 'redirect' }
      let nx: URL; try { nx = new URL(loc, cur) } catch { return { error: 'redirect' } }
      if (nx.protocol !== 'https:' || nx.port || !hostOk(nx.hostname)) return { error: 'redirect' }
      cur = nx; continue
    }
    if (r.status !== 200) { try { await r.body?.cancel() } catch { /* */ } return { error: 'http' + r.status } }
    if (!/html/i.test(r.headers.get('content-type') || '')) { try { await r.body?.cancel() } catch { /* */ } return { error: 'nothtml' } }
    // Mest 2,5 MB lesin
    const reader = r.body!.getReader(); const chunks: Uint8Array[] = []; let n = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value); n += value.length
      if (n > 2_500_000) { try { await reader.cancel() } catch { /* */ } break }
    }
    const buf = new Uint8Array(n); let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length }
    return { html: new TextDecoder('utf-8').decode(buf), final: cur }
  }
  return { error: 'redirect' }
}

// ---------- lestur ----------
const ENT: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }
function decode(s: string) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
}
function metaMap(html: string) {
  const m: Record<string, string> = {}
  const head = html.slice(0, 400_000)
  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const key = (tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1]
    const val = (tag.match(/\bcontent\s*=\s*"([^"]*)"/i) || tag.match(/\bcontent\s*=\s*'([^']*)'/i) || [])[1]
    if (key && val != null && !(key.toLowerCase() in m)) m[key.toLowerCase()] = decode(val).trim()
  }
  return m
}
// „4.600“, „6.990,-“, „12336.00“, „1995.000“, „1,234.50“ → tala
function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : null
  const s = String(v ?? '').replace(/[^\d.,]/g, '').replace(/[.,]+$/, '')
  if (!s) return null
  let x: number
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) x = +s.replace(/[.,]/g, '')
  else if (/^\d+[.,]\d{1,2}$/.test(s)) x = +s.replace(',', '.')
  else if (/^\d{4,}\.\d+$/.test(s)) x = parseFloat(s)
  else if (/^\d{1,3}([.,]\d{3})+[.,]\d{1,2}$/.test(s)) { const i = Math.max(s.lastIndexOf('.'), s.lastIndexOf(',')); x = +(s.slice(0, i).replace(/[.,]/g, '') + '.' + s.slice(i + 1)) }
  else x = +s.replace(/[.,]/g, '')
  return Number.isFinite(x) && x > 0 ? x : null
}
type Found = { name?: string; image?: string; price?: number | null; was?: number | null; currency?: string; method?: string }

function fromJsonLd(html: string): Found | null {
  const out: Found = {}
  const visit = (n: any, depth: number): boolean => {
    if (!n || depth > 6) return false
    if (Array.isArray(n)) { for (const x of n) if (visit(x, depth + 1)) return true; return false }
    if (typeof n !== 'object') return false
    const t = ([] as string[]).concat(n['@type'] || []).map(String)
    if (t.some(x => /^(Product|ProductGroup|IndividualProduct)$/i.test(x))) {
      const node = (Array.isArray(n.hasVariant) && n.hasVariant[0] && !n.offers) ? { ...n.hasVariant[0], name: n.name || n.hasVariant[0].name, image: n.image || n.hasVariant[0].image } : n
      out.name = typeof node.name === 'string' ? node.name : undefined
      const img = Array.isArray(node.image) ? node.image[0] : node.image
      out.image = typeof img === 'string' ? img : (img && (img.url || img.contentUrl)) || undefined
      const offers = ([] as any[]).concat(node.offers || [])
      const prices: number[] = []; let cur: string | undefined
      for (const o of offers) {
        if (!o || typeof o !== 'object') continue
        cur = cur || o.priceCurrency || (o.priceSpecification && ([] as any[]).concat(o.priceSpecification)[0]?.priceCurrency)
        for (const c of [o.price, o.lowPrice, ...([] as any[]).concat(o.priceSpecification || []).map((p: any) => p && p.price)]) { const x = num(c); if (x) prices.push(x) }
        for (const sub of ([] as any[]).concat(o.offers || [])) { const x = num(sub && sub.price); if (x) prices.push(x); cur = cur || (sub && sub.priceCurrency) }
      }
      if (prices.length) { out.price = Math.min(...prices); out.currency = cur }
      return true
    }
    for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item']) if (n[k] && visit(n[k], depth + 1)) return true
    return false
  }
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    try { if (visit(JSON.parse(m[1].trim()), 0) && (out.price || out.name)) break } catch { /* ógilt JSON */ }
  }
  return out.name || out.price ? out : null
}
function fromMeta(mm: Record<string, string>): Found {
  const cands = [mm['product:sale_price:amount'], mm['product:price:amount'], mm['og:price:amount'], mm['price']].map(num).filter((x): x is number => !!x)
  const orig = [mm['product:original_price:amount'], mm['og:price:standard_amount']].map(num).filter((x): x is number => !!x)
  const price = cands.length ? Math.min(...cands) : null
  const hi = Math.max(0, ...cands, ...orig)
  return {
    name: mm['og:title'] || mm['twitter:title'], image: mm['og:image:secure_url'] || mm['og:image'] || mm['twitter:image'],
    price, was: price && hi > price ? hi : null,
    currency: mm['product:price:currency'] || mm['og:price:currency'] || mm['product:sale_price:currency'] || mm['pricecurrency'],
  }
}
function pageText(html: string) {
  return decode(html
    .replace(/<(script|style|svg|noscript|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim()
}
const squash = (t: string) => t.replace(/(\d)[.\s ,](?=\d{3}(\D|$))/g, '$1')
// „Fingrafar“: tölurnar í kringum verðið. Óbreytt fingrafar = óbreytt verð → engin gervigreind.
function sigOf(text: string, price: number | null | undefined): string | null {
  if (!price) return null
  const t = squash(text); const i = t.indexOf(String(Math.round(price)))
  if (i < 0) return null
  const win = t.slice(Math.max(0, i - 220), i + 260)
  return (win.match(/\d{3,}/g) || []).slice(0, 24).join(',')
}
function cleanTitle(t: string, site: string, host: string) {
  let s = decode(t || '').replace(/\s+/g, ' ').trim()
  const tails = [site, hostLabel(host), hostLabel(host).split('.')[0]].filter(Boolean).map(x => x.toLowerCase())
  for (let k = 0; k < 2; k++) {
    const m = s.match(/^(.*\S)\s+[|–—·\-]\s+([^|–—·]+)$/)
    if (!m) break
    const tail = m[2].trim().toLowerCase()
    if (tails.some(x => tail === x || tail.includes(x) || x.includes(tail)) && m[1].length >= 3) s = m[1].trim(); else break
  }
  return s.slice(0, 90)
}
async function aiRead(text: string, url: string, title: string): Promise<Found | null> {
  const key = Deno.env.get('GEMINI_API_KEY'); if (!key) return null
  // Byrja nálægt heiti vörunnar (sleppa valmyndum) ef það finnst í textanum
  const head = (title || '').split(/\s+/).slice(0, 3).join(' ')
  let start = head.length >= 6 ? text.indexOf(head) : -1
  if (start < 0 || start > 60_000) start = 0
  const body = text.slice(Math.max(0, start - 300), start + 9000)
  const prompt = 'Þetta er texti af síðu í vefverslun.\nSlóð: ' + url + '\nHeiti síðu: ' + title + '\n\n' +
    'Finndu AÐALVÖRUNA á síðunni og skilaðu JSON: {"found": boolean, "name": string, "price": number|null, "was": number|null, "currency": string}.\n' +
    '- price: verðið sem viðskiptavinur greiðir núna (tilboðsverð ef varan er á tilboði). Tala án þúsundaskila.\n' +
    '- was: fyrra/fullt verð ef varan er á tilboði, annars null.\n- currency: ISO-kóði (ISK, EUR, USD, GBP, DKK, SEK, NOK).\n' +
    '- Notaðu AÐEINS tölur sem standa í textanum. Ekki giska. Hunsaðu tengdar vörur, sendingarkostnað, afborganir á mánuði og punkta.\n' +
    '- Ef þetta er ekki vörusíða eða verð aðalvörunnar finnst ekki: found=false.\n\nTEXTI:\n' + body
  for (const model of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: genConfig(model, { responseMimeType: 'application/json', maxOutputTokens: 300 }) }),
      })
      const data = await r.json().catch(() => null)
      const out = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('')
      if (r.status !== 200 || !out) { console.log('price-watch ai fail model=' + model + ' status=' + r.status); continue }
      const j = JSON.parse(out)
      if (!j || !j.found) return null
      const price = num(j.price), was = num(j.was)
      // Vörn gegn tilbúningi: verðið verður að standa í textanum
      if (!price || !squash(body).includes(String(Math.round(price)))) return null
      return { name: typeof j.name === 'string' ? j.name : undefined, price, was: was && was > price && squash(body).includes(String(Math.round(was))) ? was : null, currency: typeof j.currency === 'string' ? j.currency.toUpperCase().slice(0, 3) : undefined, method: 'ai' }
    } catch (e) { console.log('price-watch ai error ' + String(e).slice(0, 100)) }
  }
  return null
}

type Read = { ok: true; title: string; image: string | null; price: number | null; was: number | null; currency: string; method: string; sig: string | null; host: string; ai: boolean } | { ok: false; reason: string }
async function readProduct(u: URL, prev?: { method?: string | null; sig?: string | null; price?: number | null; price_was?: number | null }): Promise<Read> {
  let page = await fetchPage(u)
  if ('error' in page) return { ok: false, reason: page.error }
  // Shopify-verslanir (t.d. 66°Norður) velja land og gjaldmiðil eftir IP-tölu; netþjónninn okkar er erlendis og fær þá EUR.
  // Biðjum sérstaklega um íslenska markaðinn.
  const shopCountry = (page.html.match(/Shopify\.country\s*=\s*"([A-Z]{2})"/) || [])[1]
  if (shopCountry && shopCountry !== 'IS' && !u.searchParams.has('country')) {
    const u2 = new URL(u.href); u2.searchParams.set('country', 'IS')
    const p2 = await fetchPage(u2)
    if (!('error' in p2) && /Shopify\.country\s*=\s*"IS"/.test(p2.html)) page = p2
  }
  const { html, final } = page
  const mm = metaMap(html)
  const ld = fromJsonLd(html)
  const me = fromMeta(mm)
  const rawTitle = (ld && ld.name) || me.name || decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '')
  const title = cleanTitle(rawTitle, mm['og:site_name'] || '', final.hostname) || hostLabel(final.hostname)
  let image: string | null = me.image || (ld && ld.image) || null
  if (image) { try { const iu = new URL(image, final); iu.protocol = 'https:'; image = iu.href.length < 600 ? iu.href : null } catch { image = null } }
  let price: number | null = null, was: number | null = null, currency = '', method = '', ai = false
  const ps = [ld && ld.price, me.price].filter((x): x is number => !!x)
  if (ps.length) {
    price = Math.min(...ps); method = ld && ld.price ? 'jsonld' : 'meta'
    const hi = Math.max(...ps, me.was || 0); was = hi > price ? hi : null
    currency = (ld && ld.currency) || me.currency || ''
  }
  let sig: string | null = null
  if (!price) {
    const text = pageText(html)
    // Sama fingrafar og síðast → verðið er óbreytt, engin gervigreind
    if (prev && prev.method === 'ai' && prev.sig && prev.price && sigOf(text, prev.price) === prev.sig) {
      price = prev.price; was = prev.price_was ?? null; method = 'ai'; sig = prev.sig
    } else if (text.length > 200) {
      ai = true
      const a = await aiRead(text, final.href, title)
      if (a && a.price) { price = a.price; was = a.was ?? null; currency = a.currency || ''; method = 'ai'; sig = sigOf(text, a.price) }
    }
  }
  currency = (currency || (/\.is$/.test(final.hostname) ? 'ISK' : '')).toUpperCase().slice(0, 3)
  return { ok: true, title, image, price: price ? Math.round(price) : null, was: was ? Math.round(was) : null, currency, method, sig, host: hostLabel(final.hostname), ai }
}

const fmt = (n: number, cur: string) => Math.round(n).toLocaleString('de-DE') + (cur === 'ISK' || !cur ? ' kr.' : ' ' + cur)

async function runDue(limit: number) {
  const t0 = Date.now()
  const { data: due, error } = await db.rpc('price_watch_due', { p_limit: limit })
  if (error) return { error: error.message }
  const stats = { due: (due || []).length, checked: 0, changed: 0, drops: 0, failed: 0, ai: 0, notified: 0 }
  const queue = [...(due || [])]
  const work = async () => {
    while (queue.length && Date.now() - t0 < 110_000) {
      const w = queue.shift()!
      const u = normUrl(w.url); if (!u) continue
      const r = await readProduct(u, w)
      stats.checked++
      const now = new Date().toISOString()
      if (!r.ok || !r.price) {
        stats.failed++
        const fails = (w.fails || 0) + 1
        await db.from('price_watches').update({ fails, checked_at: now, status: fails >= 5 ? 'gone' : 'ok' }).eq('id', w.id)
        continue
      }
      if (r.ai) stats.ai++
      const old = w.price as number | null
      const upd: Record<string, unknown> = { checked_at: now, fails: 0, method: r.method, sig: r.sig, price_was: r.was }
      if (!w.image_url && r.image) upd.image_url = r.image
      const cur = r.currency || 'ISK'
      if (cur !== (w.currency || 'ISK')) {
        // Gjaldmiðill breyttist (t.d. EUR → ISK eftir leiðréttingu): byrja upp á nýtt, engin tilkynning
        upd.price = r.price; upd.currency = cur; upd.first_price = r.price; upd.title = r.title
        await db.from('list_items').update({ ext_price: r.price, price_first: r.price, ext_cur: cur }).eq('watch_id', w.id)
      } else if (old && r.price !== old) {
        stats.changed++
        upd.price = r.price; upd.changed_at = now
        const { data: items } = await db.from('list_items').update({ ext_price: r.price }).eq('watch_id', w.id).eq('checked', false).select('created_by,list_id')
        if (r.price < old * 0.99) {
          stats.drops++
          const seen = new Set<string>()
          const rows = (items || []).filter((i: any) => i.created_by && !seen.has(i.created_by) && seen.add(i.created_by)).map((i: any) => ({
            user_id: i.created_by, kind: 'price', title: 'Verðið lækkaði: ' + (w.title || 'vara á Verðvakt'),
            body: 'Úr ' + fmt(old, w.currency) + ' í ' + fmt(r.price!, w.currency) + ' hjá ' + w.host + '.',
            link: w.url, list_id: i.list_id, image_url: w.image_url || r.image,
          }))
          if (rows.length) { const { error: e } = await db.from('inbox_messages').insert(rows); if (!e) stats.notified += rows.length }
        }
      } else if (!old) upd.price = r.price
      await db.from('price_watches').update(upd).eq('id', w.id)
    }
  }
  await Promise.all([work(), work(), work(), work()])
  console.log('price-watch run ' + JSON.stringify(stats) + ' ms=' + (Date.now() - t0))
  return stats
}

Deno.serve(async (req) => {
  const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    if (action === 'run') {
      const k = req.headers.get('x-cron-key') || ''
      const { data: ok } = k ? await db.rpc('cron_key_ok', { p_name: 'price_watch_cron', p_key: k }) : { data: false }
      if (!ok) return json({ error: 'unauthorized' }, 401)
      return json(await runDue(Math.min(60, Number(body.limit) || 40)))
    }

    const auth = req.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    const { data: au } = token ? await db.auth.getUser(token) : ({ data: { user: null } } as any)
    const user = au && au.user
    if (!user) return json({ error: 'login required' }, 401)

    const u = normUrl(body.url)
    if (!u) return json({ ok: false, reason: 'badurl' })

    if (action === 'test') {
      // Stjórnandi einn: am_admin() metur það út frá innskráningu kallandans
      const asUser = createClient(SB_URL, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
      const { data: isAdmin } = await asUser.rpc('am_admin')
      if (!isAdmin) return json({ error: 'forbidden' }, 403)
      return json(await readProduct(u))
    }
    if (action !== 'add') return json({ error: 'unknown action' }, 400)

    const { count } = await db.from('list_items').select('id', { count: 'exact', head: true }).eq('created_by', user.id).eq('checked', false).not('watch_id', 'is', null)
    const full = (count || 0) >= MAX_PER_USER

    const { data: ex } = await db.from('price_watches').select('*').eq('url', u.href).maybeSingle()
    const fresh = ex && ex.checked_at && Date.now() - new Date(ex.checked_at).getTime() < 6 * 3600_000
    if (ex && fresh) {
      const watch = ex.status === 'ok' && ex.price && !full
      return json({ ok: true, url: ex.url, host: ex.host, title: ex.title, image: ex.image_url, price: ex.price, was: ex.price_was, currency: ex.currency, watch_id: watch ? ex.id : null, watching: !!watch, limit: full })
    }
    const r = await readProduct(u, ex || undefined)
    if (!r.ok) return json({ ok: false, reason: r.reason, url: u.href, host: hostLabel(u.hostname) })
    const now = new Date().toISOString()
    const row = { url: u.href, host: r.host, title: r.title, image_url: r.image, price: r.price, price_was: r.was, currency: r.currency || 'ISK', method: r.method || null, sig: r.sig, status: r.price ? 'ok' : 'noprice', fails: 0, checked_at: now }
    const { data: saved, error } = ex
      ? await db.from('price_watches').update(row).eq('id', ex.id).select('id').single()
      : await db.from('price_watches').insert({ ...row, first_price: r.price }).select('id').single()
    if (error) console.log('price-watch save ' + error.message)
    const watch = !!(saved && r.price && !full)
    console.log('price-watch add host=' + r.host + ' method=' + (r.method || 'none') + ' price=' + (r.price ? 'y' : 'n') + ' ai=' + r.ai)
    return json({ ok: true, url: u.href, host: r.host, title: r.title, image: r.image, price: r.price, was: r.was, currency: r.currency || 'ISK', watch_id: watch ? saved!.id : null, watching: watch, limit: full })
  } catch (e) {
    console.log('price-watch error ' + String(e).slice(0, 200))
    return json({ error: 'server' }, 500)
  }
})
