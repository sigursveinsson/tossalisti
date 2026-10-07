// Kvittanalestur með sjónlíkani (Gemini). Kallað úr src/lib/receipt.js → parseReceiptVision().
// ATH: þetta fall er deployað BEINT í Supabase (ekki gegnum Netlify/git).
// Þessi skrá er heimildin — haltu henni í samræmi við það sem er í loftinu.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Hraðasta líkanið fyrst. Kvittanalestur er beinn útdráttur — engin rökhugsun þarf.
// gemini-2.5-flash-lite var lagt niður (okt 2026) — 3.5-flash-lite fyrst, 2.5-flash til vara.
const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'] // 2.5-flash-lite lagt niður; 2.5-flash les íslensku vel

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


const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000)

// Ísland er UTC allt árið — engin tímabeltis-leiðrétting þörf.
// Öryggisnet gegn dagsetningarvillum: víxlar degi/mánuði eða lagar ár ef niðurstaðan er ótrúverðug.
function fixDate(raw: unknown, today: Date): string | null {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const [y, m, d] = raw.split('-').map(Number)
  const mk = (yy: number, mm: number, dd: number) => {
    const dt = new Date(Date.UTC(yy, mm - 1, dd))
    if (dt.getUTCFullYear() !== yy || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd) return null
    return dt
  }
  const plausible = (dt: Date | null) => {
    if (!dt) return false
    const diff = daysBetween(today, dt) // jákvætt = í fortíðinni
    return diff >= -1 && diff <= 400 // ekki í framtíðinni, ekki eldri en ~ár
  }
  const first = mk(y, m, d)
  if (plausible(first)) return iso(first!)

  // 1) Dagur/mánuður víxlaðir? (05.07 lesið sem 7. maí í stað 5. júlí)
  const swapped = mk(y, d, m)
  if (plausible(swapped)) return iso(swapped!)

  // 2) Vitlaust ár? (OCR les 2026 í stað 2025 o.þ.h.)
  for (const yy of [today.getUTCFullYear(), today.getUTCFullYear() - 1]) {
    const a = mk(yy, m, d)
    if (plausible(a)) return iso(a!)
    const b = mk(yy, d, m)
    if (plausible(b)) return iso(b!)
  }
  return null // ótraustverd — appið notar dag í dag og notandi lagfærir
}

Deno.serve(async (req) => {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const t0 = Date.now()
    const { image, mime, products } = await req.json()
    if (!image) return json({ error: 'no image' }, 400)

    // AI-pörun: valkvæður listi yfir tilboðsvörur. Stuttir kóðar (P1, P2…) í stað uuid
    // svo líkanið rugli þeim ekki; netþjónninn varpar til baka og hafnar ógildum kóðum.
    const prods = (Array.isArray(products) ? products : [])
      .filter((p: any) => p && p.id && p.name)
      .slice(0, 200)
      .map((p: any, i: number) => ({ code: 'P' + (i + 1), id: String(p.id), name: String(p.name).slice(0, 80), brand: String(p.brand || '').slice(0, 40) }))
    const codeToId = new Map<string, string>(prods.map((p) => [p.code, p.id] as [string, string]))
    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) return json({ error: 'missing GEMINI_API_KEY' }, 500)

    const today = new Date()
    const todayStr = iso(today)

    const itemShape = prods.length ? '{"name":"","price":0,"pid":null}' : '{"name":"","price":0}'
    const prompt = [
      'Þú lest íslenska kassakvittun af mynd.',
      'Skilaðu AÐEINS gildu JSON: {"store":"","date":"YYYY-MM-DD","date_raw":"","items":[' + itemShape + '],"total":0}',
      '',
      'DAGSETNING — MIKILVÆGT:',
      '- Íslenskar kvittanir rita dagsetningu ALLTAF með DAGINN FYRST: DD.MM.YYYY, DD.MM.YY eða DD/MM/YYYY.',
      '- Dæmi: "05.07.2026" merkir 5. júlí 2026 (EKKI 7. maí). "11.03.25" merkir 11. mars 2025.',
      '- Lestu ALDREI sem mánuð-fyrst (bandarískt MM/DD). Þetta er algengasta villan — varðastu hennar.',
      '- Tveggja stafa ár: 25 = 2025, 26 = 2026.',
      '- Í dag er ' + todayStr + '. Kvittun getur ALDREI verið dagsett í framtíðinni og er nær alltaf innan fárra vikna frá í dag.',
      '- Ef þú ert óviss eða dagsetning sést ekki: skilaðu "date": null.',
      '- Settu ALLTAF nákvæmlega þann textastreng sem þú last af kvittuninni í "date_raw" (t.d. "05.07.2026 14:32").',
      '',
      'VÖRUR:',
      '- Verð eru heiltölur í íslenskum krónum.',
      '- Settu hverja keypta vöru í items með hreinu nafni.',
      '- Slepptu afsláttar-, samtals-, VSK- og greiðslulínum úr items.',
      ...(prods.length ? [
        '',
        'TILBOÐSVÖRUR — pörun:',
        'Hér fyrir neðan er listi yfir vörur sem gefa cashback (kóði | vörumerki | heiti).',
        'Fyrir HVERJA línu í items: settu "pid" = kóði vörunnar (t.d. "P3") ef línan er GREINILEGA sú vara, annars "pid": null.',
        '- Sama vörumerki OG sama vörutegund. Stærð, magn og pakkning mega vera aðrar (t.d. "NUTELLA 400G" = Nutella).',
        '- Íslenskar kvittanir stytta heiti oft (t.d. "EGILS APP 2L" = Egils Appelsín, "RITZ SALTKEX" = Ritz). Notaðu skynsemi.',
        '- Ólíkar vörur sama framleiðanda eru EKKI sama vara (Egils Malt er ekki Egils Appelsín).',
        '- Ef þú ert í vafa: null. Röng pörun er verri en engin.',
        ...prods.map((p) => p.code + ' | ' + (p.brand || '-') + ' | ' + p.name),
      ] : []),
      '',
      'Ekkert nema JSON.',
    ].join('\n')


    let lastErr = ''
    for (const model of MODELS) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
      // Lágmarks-„hugsun" — kvittanalestur er beinn útdráttur (sparar sekúndur).
      const body = {
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mime || 'image/jpeg', data: image } }] }],
        generationConfig: genConfig(model, { responseMimeType: 'application/json', maxOutputTokens: 3072 }, 0),
      }
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (r.status === 200 && text) {
        let parsed: Record<string, unknown> = {}
        try { parsed = JSON.parse(text) } catch {
          const m = text.match(/\{[\s\S]*\}/)
          if (m) { try { parsed = JSON.parse(m[0]) } catch { /* ignore */ } }
        }
        const before = parsed.date
        parsed.date = fixDate(parsed.date, today)
        // Varpa pid-kóðum í raunveruleg vöru-id; hafna öllu sem ekki var í listanum.
        let matched = 0
        if (Array.isArray(parsed.items)) {
          parsed.items = (parsed.items as any[]).map((it) => {
            const { pid, ...rest } = it || {}
            const id = typeof pid === 'string' ? codeToId.get(pid.trim().toUpperCase()) : undefined
            if (id) matched++
            return id ? { ...rest, reward_product_id: id } : rest
          })
        }
        console.log('parse-receipt ok model=' + model + ' ms=' + (Date.now() - t0) +
          ' prods=' + prods.length + ' matched=' + matched +
          ' date_raw=' + JSON.stringify(parsed.date_raw) + ' model_date=' + JSON.stringify(before) + ' final=' + JSON.stringify(parsed.date))
        return json(parsed)
      }
      lastErr = 'model=' + model + ' status=' + r.status
      console.log('parse-receipt fail ' + lastErr + ' ms=' + (Date.now() - t0))
    }
    return json({ error: lastErr })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
