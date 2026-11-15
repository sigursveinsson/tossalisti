// Veskið: les gjafakort / inneignarnótu / afsláttarmiða af mynd (Gemini) og skilar reitum til að forfylla.
// Aðeins innskráðir notendur (líka prufuaðgangar). Myndin er ekki geymd hér — appið geymir hana sjálft.
// ATH: deployað BEINT í Supabase. Þessi skrá er heimildin.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash']
const genConfig = (model: string) => ({
  responseMimeType: 'application/json', maxOutputTokens: 1024, temperature: 0,
  thinkingConfig: /^gemini-3/.test(model) ? { thinkingLevel: 'minimal' } : { thinkingBudget: 0 },
})
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const key = Deno.env.get('GEMINI_API_KEY')
  const SB = Deno.env.get('SUPABASE_URL'), AN = Deno.env.get('SUPABASE_ANON_KEY'), SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!key || !SB) return json({ error: 'config' }, 500)
  // innskráður notandi?
  const authz = req.headers.get('Authorization') || ''
  const ur = await fetch(SB + '/auth/v1/user', { headers: { Authorization: authz, apikey: AN || SR || '' } })
  if (!ur.ok) return json({ error: 'auth' }, 401)

  let body: any = {}
  try { body = await req.json() } catch { return json({ error: 'body' }, 400) }
  const image = String(body.image || '')
  if (!image || image.length > 6_000_000) return json({ error: 'image' }, 400)
  const today = new Date().toISOString().slice(0, 10)
  const prompt = [
    'Þú lest mynd af íslensku gjafakorti, gjafabréfi, inneignarnótu, afsláttarmiða eða vildarkorti.',
    'Skilaðu AÐEINS JSON: {"kind":"gift_card|credit_note|coupon|membership|other","store":"","title":"","amount":null,"code":"","pin":"","expires_on":"YYYY-MM-DD eða null","confidence":"high|low"}',
    '- kind: gift_card = gjafakort/gjafabréf; credit_note = inneignarnóta (eftir skil); coupon = afsláttarmiði/afsláttarkóði; membership = vildar-/félagskort.',
    '- store: verslun eða útgefandi (t.d. "Hagkaup", "Kringlan", "Elko"). title: stutt lýsing ef við á (t.d. "Gjafabréf fyrir tvo").',
    '- amount: upphæð í krónum sem heiltala (1.500 kr = 1500), null ef engin.',
    '- code: kóði/númer korts eða strikamerkis eins og það stendur (án bila). pin: PIN/öryggisnúmer ef sést, annars "".',
    '- expires_on: gildistími. "Gildir til 31.12.2027" → "2027-12-31". Ef bara mánuður/ár: síðasti dagur mánaðar. Ef "gildir í 4 ár frá útgáfu" og útgáfudagur sést, reiknaðu. Í dag er ' + today + '.',
    '- Giskaðu ALDREI. Ef reitur sést ekki: tómt eða null.',
  ].join('\n')
  for (const model of MODELS) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: body.mime || 'image/jpeg', data: image } }] }],
      generationConfig: genConfig(model),
    }) })
    const d = await r.json().catch(() => null)
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text
    if (r.status !== 200 || !text) { console.log('parse-wallet fail model=' + model + ' status=' + r.status); continue }
    let p: any = {}
    try { p = JSON.parse(text) } catch { const m = text.match(/\{[\s\S]*\}/); if (m) try { p = JSON.parse(m[0]) } catch { /* */ } }
    const kinds = ['gift_card', 'credit_note', 'coupon', 'membership', 'other']
    const amt = Number(String(p.amount ?? '').replace(/[^\d]/g, ''))
    const exp = typeof p.expires_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.expires_on) ? p.expires_on : null
    return json({
      kind: kinds.includes(p.kind) ? p.kind : 'gift_card',
      store: String(p.store || '').slice(0, 80), title: String(p.title || '').slice(0, 120),
      amount: amt > 0 && amt < 10_000_000 ? amt : null,
      code: String(p.code || '').replace(/\s+/g, '').slice(0, 80), pin: String(p.pin || '').slice(0, 20),
      expires_on: exp, confidence: p.confidence === 'high' ? 'high' : 'low',
    })
  }
  return json({ error: 'ai_down', ai_down: true }, 200)
})
