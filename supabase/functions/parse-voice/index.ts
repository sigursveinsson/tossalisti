// Raddstýring innkaupalista (Gemini). Kallað úr src/lib/voice.js → parseVoice().
// Tekur við hljóði (WAV, base64) EÐA texta og skilar vörulista með magni.
// Stækkar rétti („taco fyrir sex" → hráefni) og parar við tilboðsvörur (cashback).
// ATH: deployað BEINT í Supabase. Þessi skrá er heimildin.
// Krefst INNSKRÁÐS notanda (anon-lykillinn einn dugar ekki) — vörn gegn misnotkun.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// gemini-2.5-flash-lite var lagt niður (okt 2026) — 3.5-flash-lite fyrst, 2.5-flash til vara.
const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'] // 3.5-flash-lite skrifaði brenglaða íslensku

// Gemini 3.x notar thinkingLevel (minimal); 2.5 notar thinkingBudget:0. Röng stilling → 400.
// Lágt hitastig er sent til allra líkana: sjálfgefið (1,0) á Gemini 3 gaf brenglaða íslensku.
function genConfig(model: string, base: Record<string, unknown>, temperature?: number) {
  const g3 = /^gemini-3/.test(model)
  return {
    ...base,
    ...(temperature === undefined ? {} : { temperature }),
    thinkingConfig: g3 ? { thinkingLevel: 'minimal' } : { thinkingBudget: 0 },
  }
}

// verify_jwt hefur þegar staðfest undirskriftina — hér athugum við aðeins hlutverkið.
function jwtRole(req: Request): string | null {
  const h = req.headers.get('authorization') || ''
  const tok = h.replace(/^Bearer\s+/i, '')
  const part = tok.split('.')[1]
  if (!part) return null
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4))
    return JSON.parse(json).role || null
  } catch { return null }
}

// Normalisering + orðstofnar fyrir varnir í skrefi 2.
const norm = (t: string) => String(t || '').toLowerCase()
  .replace(/[áàâä]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòôö]/g, 'o')
  .replace(/[úùû]/g, 'u').replace(/ý/g, 'y').replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/ð/g, 'd')
  .replace(/[^a-z0-9]+/g, ' ').trim()
const STOP = new Set(['old', 'paso', 'pakki', 'stk', 'krukka', 'poki'])
function stems(t: string) { return norm(t).split(' ').filter((w) => w.length >= 4 && !STOP.has(w)).map((w) => w.slice(0, 4)) }
function sharesStem(itemName: string, sponText: string) {
  const a = new Set(stems(itemName)); return stems(sponText).some((s) => a.has(s))
}

// Skref 2: merkir hvaða línur á tilbúnum lista eru sama vörutegund og kostuð vara.
// Skilar aðeins [{i, sid}] — kallandinn staðfestir i og sid. Bregst þetta → engin kostun (öruggt).
async function sponsorMap(key: string, items: any[], spons: { code: string; name: string; brand: string; generic: string }[], said: string) {
  const prompt = [
    'Hér er innkaupalisti (númeraður) og listi yfir kostaðar vörur (kóði | kostuð vara | almenn vörutegund).',
    'Fyrir hverja línu á innkaupalistanum sem er SAMA VÖRUTEGUND og almenna vörutegund kostaðrar vöru: skilaðu {"i": númer línu, "sid": kóði}.',
    '- Aðeins línur sem eru á listanum. Þú getur EKKI bætt við vörum.',
    '- Ef notandinn nefndi sjálfur vörumerki fyrir vöruna (sjá orð notanda, eða vörumerki í heiti línunnar), slepptu línunni.',
    '- Í vafa: slepptu línunni.',
    'Skilaðu AÐEINS JSON: {"map":[{"i":0,"name":"heiti línu nákvæmlega eins og á listanum","sid":"S1"}]}',
    '',
    'Orð notanda: ' + said.slice(0, 300),
    '',
    'INNKAUPALISTI:',
    ...items.map((it, i) => i + ' | ' + it.name),
    '',
    'KOSTAÐAR VÖRUR:',
    ...spons.map((p) => p.code + ' | ' + p.name + ' | ' + p.generic),
  ].join('\n')
  for (const model of MODELS) {
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: genConfig(model, { responseMimeType: 'application/json', maxOutputTokens: 512 }, 0) }),
      })
      const d = await r.json()
      const out = d?.candidates?.[0]?.content?.parts?.[0]?.text
      if (r.status !== 200 || !out) { console.log('sponsorMap fail model=' + model + ' status=' + r.status); continue }
      const parsed = JSON.parse(out)
      return (Array.isArray(parsed.map) ? parsed.map : [])
        .map((m: any) => ({ i: Number(m?.i), name: String(m?.name || ''), sid: String(m?.sid || '').trim().toUpperCase() }))
        .filter((m: any) => Number.isInteger(m.i) && m.i >= 0 && m.i < items.length && m.sid)
        // Vörn 1: heitið sem líkanið skilar verður að passa við línuna (grípur rugling á númerum).
        .filter((m: any) => norm(m.name) === norm(items[m.i].name))
        // Vörn 2: heiti línunnar verður að deila orðstofni með kostuðu vörunni/vörutegundinni.
        .filter((m: any) => { const sp = spons.find((p) => p.code === m.sid); return !!sp && sharesStem(items[m.i].name, sp.generic + ' ' + sp.name) })
    } catch (e) { console.log('sponsorMap error model=' + model + ' ' + String(e).slice(0, 120)) }
  }
  return []
}

Deno.serve(async (req) => {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const t0 = Date.now()
    if (jwtRole(req) !== 'authenticated') return json({ error: 'login required' }, 401)

    const { audio, mime, text, products, existing, sponsored } = await req.json()
    const hasAudio = typeof audio === 'string' && audio.length > 100
    const hasText = typeof text === 'string' && text.trim().length > 0
    if (!hasAudio && !hasText) return json({ error: 'no input' }, 400)
    if (hasAudio && audio.length > 4_000_000) return json({ error: 'audio too long' }, 413) // ~3 MB ≈ 90 sek WAV 16kHz

    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) return json({ error: 'missing GEMINI_API_KEY' }, 500)

    const prods = (Array.isArray(products) ? products : [])
      .filter((p: any) => p && p.id && p.name)
      .slice(0, 200)
      .map((p: any, i: number) => ({ code: 'P' + (i + 1), id: String(p.id), name: String(p.name).slice(0, 80), brand: String(p.brand || '').slice(0, 40) }))
    const codeToId = new Map<string, string>(prods.map((p) => [p.code, p.id] as [string, string]))
    const have = (Array.isArray(existing) ? existing : []).slice(0, 150).map((s: any) => String(s).slice(0, 60))
    // Kostaðar staðgengilsvörur: { name, brand, generic } → kóðar S1, S2…
    const spons = (Array.isArray(sponsored) ? sponsored : [])
      .filter((p: any) => p && p.name && p.generic)
      .slice(0, 100)
      .map((p: any, i: number) => ({ code: 'S' + (i + 1), name: String(p.name).slice(0, 80), brand: String(p.brand || '').slice(0, 40), generic: String(p.generic).slice(0, 60) }))
    const sponByCode = new Map<string, { name: string; brand: string }>(spons.map((p) => [p.code, { name: p.name, brand: p.brand }] as [string, { name: string; brand: string }]))

    const prompt = [
      hasAudio
        ? 'Þú hlustar á íslenska raddskipun þar sem notandi segir hvað á að fara á innkaupalista.'
        : 'Þú lest íslenska beiðni um hvað á að fara á innkaupalista.',
      'Skilaðu AÐEINS gildu JSON: {"transcript":"","items":[{"name":"","qty":"","unit":"","pid":null}]}',
      '',
      'REGLUR:',
      '- "transcript": það sem notandinn sagði/skrifaði, orðrétt (stutt).',
      '- Hver vara er sér lína. "mjólk, egg og brauð" = þrjár vörur.',
      '- "name": venjulegt íslenskt vöruheiti í nefnifalli, stór fyrsti stafur (t.d. "Mjólk", "Kartöflur", "Egils Appelsín"). Haltu vörumerki ef það er nefnt.',
      '- "qty" og "unit": aðeins ef magn er nefnt eða augljóst (t.d. "tvö kíló af kartöflum" → qty "2", unit "kg"; "sex egg" → qty "6", unit "stk"). Annars tómur strengur.',
      '- Ef notandi nefnir RÉTT eða TILEFNI (t.d. "taco fyrir sex", "pönnukökur", "grillveisla fyrir tíu"): búðu til hæfilegan hráefnalista með sanngjörnu magni miðað við fjölda. Hámark 12 vörur fyrir einn rétt.',
      '- Hunsaðu hik, uppfyllingarorð og hluti sem eru ekki vörur ("já", "og svo", "ég held").',
      '- Ef ekkert vörutengt heyrist/sést: items = [].',
      ...(have.length ? ['- Þetta er þegar á listanum (ekki tvítaka sömu vöru nema notandi biðji um meira): ' + have.join(', ')] : []),
      ...(prods.length ? [
        '',
        'TILBOÐSVÖRUR — pörun:',
        'Fyrir hverja vöru: "pid" = kóði ef hún er GREINILEGA sú tilboðsvara (sama vörumerki/vörutegund), annars null.',
        '- Almennt heiti parast EKKI við vörumerki: "súkkulaðismjör" er ekki Nutella nema notandi segi Nutella. Í vafa: null.',
        ...prods.map((p) => p.code + ' | ' + (p.brand || '-') + ' | ' + p.name),
      ] : []),
      // ATH: kostaðar vörur eru VILJANDI ekki hér — listinn verður til án vitneskju um kostun
      // (skref 1). Kostun er aðeins merkt á tilbúinn lista í sér kalli (skref 2, sponsorMap).
      '',
      'Ekkert nema JSON.',
    ].join('\n')

    const parts: any[] = [{ text: prompt }]
    if (hasAudio) parts.push({ inlineData: { mimeType: mime || 'audio/wav', data: audio } })
    else parts.push({ text: 'Beiðni notanda: ' + String(text).slice(0, 500) })


    let lastErr = ''
    for (const model of MODELS) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
      const body = { contents: [{ parts }], generationConfig: genConfig(model, { responseMimeType: 'application/json', maxOutputTokens: 2048 }, 0) }
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      const out = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (r.status === 200 && out) {
        let parsed: any = {}
        try { parsed = JSON.parse(out) } catch {
          const m = out.match(/\{[\s\S]*\}/)
          if (m) { try { parsed = JSON.parse(m[0]) } catch { /* ignore */ } }
        }
        let matched = 0
        let sponsoredCount = 0
        const items = (Array.isArray(parsed.items) ? parsed.items : [])
          .map((it: any) => {
            const name = String(it?.name || '').trim().slice(0, 60)
            if (!name) return null
            const id = typeof it?.pid === 'string' ? codeToId.get(it.pid.trim().toUpperCase()) : undefined
            if (id) matched++
            const o: any = { name, qty: String(it?.qty ?? '').trim().slice(0, 10), unit: String(it?.unit ?? '').trim().slice(0, 10) }
            if (id) o.reward_product_id = id
            return o
          })
          .filter(Boolean)
          .slice(0, 40)
        // SKREF 2: merkja kostaðar staðgengilsvörur á TILBÚINN lista. Getur hvorki bætt við
        // vörum né breytt magni — aðeins merkt línur sem eru þegar til (staðfest hér).
        if (spons.length && items.length) {
          const map = await sponsorMap(key, items, spons, String(parsed.transcript || (hasText ? text : '')))
          for (const m of map) {
            const sp = sponByCode.get(m.sid)
            if (sp && items[m.i] && !items[m.i].sponsored) { items[m.i].sponsored = sp; sponsoredCount++ }
          }
        }
        console.log('parse-voice ok model=' + model + ' ms=' + (Date.now() - t0) + ' mode=' + (hasAudio ? 'audio' : 'text') +
          ' items=' + items.length + ' matched=' + matched + ' sponsored=' + sponsoredCount)
        return json({ transcript: String(parsed.transcript || '').slice(0, 300), items })
      }
      lastErr = 'model=' + model + ' status=' + r.status + ' ' + JSON.stringify(data?.error?.message || '').slice(0, 200)
      console.log('parse-voice fail ' + lastErr + ' ms=' + (Date.now() - t0))
    }
    return json({ error: lastErr })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
