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

const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash']

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

Deno.serve(async (req) => {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const t0 = Date.now()
    if (jwtRole(req) !== 'authenticated') return json({ error: 'login required' }, 401)

    const { audio, mime, text, products, existing } = await req.json()
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
      '',
      'Ekkert nema JSON.',
    ].join('\n')

    const parts: any[] = [{ text: prompt }]
    if (hasAudio) parts.push({ inlineData: { mimeType: mime || 'audio/wav', data: audio } })
    else parts.push({ text: 'Beiðni notanda: ' + String(text).slice(0, 500) })

    const body = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }

    let lastErr = ''
    for (const model of MODELS) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
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
        console.log('parse-voice ok model=' + model + ' ms=' + (Date.now() - t0) + ' mode=' + (hasAudio ? 'audio' : 'text') +
          ' items=' + items.length + ' matched=' + matched)
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
