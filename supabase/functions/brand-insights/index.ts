// Vörumerkja-innsýn (Gemini). Kallað úr BrandDashboard.jsx.
// Fær SAMANTEKNAR tölur (reiknaðar í gagnagrunninum af brand_dashboard) og skilar
// helstu innsýn + herferðartillögu, eða svari við spurningu. Gervigreindin má
// ALDREI búa til tölur — hún útskýrir aðeins það sem er í gögnunum.
// ATH: deployað BEINT í Supabase. Krefst innskráðs notanda.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash']

function jwtRole(req: Request): string | null {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const part = tok.split('.')[1]
  if (!part) return null
  try {
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4))).role || null
  } catch { return null }
}

Deno.serve(async (req) => {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const t0 = Date.now()
    if (jwtRole(req) !== 'authenticated') return json({ error: 'login required' }, 401)

    const { data, question, demo } = await req.json()
    if (!data || typeof data !== 'object') return json({ error: 'no data' }, 400)
    const dataStr = JSON.stringify(data)
    if (dataStr.length > 30000) return json({ error: 'data too large' }, 413)
    const q = typeof question === 'string' ? question.trim().slice(0, 300) : ''

    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) return json({ error: 'missing GEMINI_API_KEY' }, 500)

    const brand = String((data as any).brand || 'vörumerkið').slice(0, 60)
    const prompt = [
      'Þú ert greinandi fyrir vörumerkið ' + brand + ' á Gríptu — íslensku tryggðar- og cashback-kerfi sem les kassakvittanir neytenda þvert á ALLAR verslanakeðjur (Krónan, Bónus, Nettó, Hagkaup o.fl.).',
      'Hér eru SAMANTEKNAR, nafnlausar tölur úr staðfestum kvittunum (JSON). Skýringar á reitum:',
      '- totals.lines = staðfestar kaupalínur, buyers = einstakir kaupendur, receipts = kvittanir, revenue = sala í kr (af kvittunum), units = einingar,',
      '- repeat_rate = hlutfall kaupenda sem keyptu oftar en einu sinni á tímabilinu, new_rate = hlutfall kaupenda sem keyptu vörumerkið í fyrsta sinn á tímabilinu,',
      '- cashback = greitt cashback í kr, by_chain = eftir verslanakeðju, by_product = eftir vöru, basket = vörur sem oft eru keyptar í sömu körfu (share = hlutfall kvittana), by_week = vikuleg þróun.',
      '- Hópar með færri en min_group kaupendum eru faldir (persónuvernd).',
      ...(demo ? ['ATH: Þetta eru SÝNIDÆMI (tilbúin gögn til kynningar), ekki raunveruleg sala. Talaðu eðlilega um tölurnar en ekki fullyrða að þær séu raunverulegar.'] : []),
      '',
      'REGLUR:',
      '- Notaðu AÐEINS tölur sem standa í gögnunum. ALDREI búa til tölur, prósentur eða samanburð sem er ekki í gögnunum.',
      '- Ef ekki er hægt að svara út frá gögnunum, segðu það hreinskilnislega og hvaða gögn vantar.',
      '- Skrifaðu á eðlilegri, hnitmiðaðri íslensku fyrir markaðs- og sölustjóra. Krónur með punkti sem þúsundaskil (t.d. 1.240 kr).',
      '- Hlutföll í gögnunum eru á bilinu 0–1: skrifaðu þau ALLTAF sem prósentur (0.52 → 52%), aldrei sem tugabrot.',
      q
        ? '- Verkefni: svaraðu spurningunni í 2–5 setningum og vísaðu í tölur. Skilaðu JSON: {"answer":""}'
        : '- Verkefni: gefðu 4 helstu innsýn (hver ein setning með tölu) og eina konkreta tillögu að herferð eða aðgerð sem byggir á gögnunum. Skilaðu JSON: {"bullets":["","","",""],"action":""}',
      '',
      'GÖGN:',
      dataStr,
      ...(q ? ['', 'SPURNING: ' + q] : []),
      '',
      'Ekkert nema JSON.',
    ].join('\n')

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json', maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
    }

    let lastErr = ''
    for (const model of MODELS) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      const out = d?.candidates?.[0]?.content?.parts?.[0]?.text
      if (r.status === 200 && out) {
        let parsed: any = {}
        try { parsed = JSON.parse(out) } catch {
          const m = out.match(/\{[\s\S]*\}/)
          if (m) { try { parsed = JSON.parse(m[0]) } catch { /* ignore */ } }
        }
        const res = q
          ? { answer: String(parsed.answer || '').slice(0, 1200) }
          : {
              bullets: (Array.isArray(parsed.bullets) ? parsed.bullets : []).map((b: any) => String(b).slice(0, 300)).slice(0, 5),
              action: String(parsed.action || '').slice(0, 500),
            }
        console.log('brand-insights ok model=' + model + ' ms=' + (Date.now() - t0) + ' q=' + (q ? 'yes' : 'no') + ' demo=' + !!demo)
        return json(res)
      }
      lastErr = 'model=' + model + ' status=' + r.status
      console.log('brand-insights fail ' + lastErr)
    }
    return json({ error: lastErr })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
