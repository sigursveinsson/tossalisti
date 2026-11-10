// Samræmd vöruheiti á kvittanalínum („Líklega að klárast“). Keyrt af pg_cron á 10 mín fresti.
// Les óunnar línur (canon_at null), sendir Gemini (texti eingöngu, engar myndir) og skrifar canon + canon_label.
// Engin leyndarmál í beiðni: fallið vinnur aðeins óunnar línur, hver lína einu sinni (canon_at), svo endurtekin köll
// kosta ekkert aukalega. Skilar aðeins fjölda — engin gögn notenda í svarinu.
// ATH: deployað BEINT í Supabase (verify_jwt=false). Þessi skrá er heimildin.

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash']
const genConfig = (model: string) => ({
  responseMimeType: 'application/json', maxOutputTokens: 8192, temperature: 0,
  thinkingConfig: /^gemini-3/.test(model) ? { thinkingLevel: 'minimal' } : { thinkingBudget: 0 },
})
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })

function prompt(lines: { i: number, name: string, store: string | null }[], vocab: { canon: string, label: string }[]) {
  return [
    'Þú samræmir vöruheiti af íslenskum kassakvittunum svo að SAMA varan fái SAMA auðkenni óháð verslun.',
    'Kvittanir stytta heiti (oft í 20 stafi) og skrifa þau ólíkt: „Pepsi Max 4x2L“ (Prís) og „pepsi 4*2 lítrar max“ (Bónus) eru sama varan.',
    '',
    'Fyrir hverja línu skilaðu:',
    '- "canon": auðkenni vörunnar, lágstafir: vörumerki + vara + afbrigði + stærð. Stærð samræmd: „300 g“, „1 kg“, „2 l“, „4x2 l“, „12 stk“. Dæmi: „pepsi max 4x2 l“, „myllan ostaslaufur 4 stk“, „fk hundasnakk 300 g“, „bananar“.',
    '  Ef vörumerki er óþekkt eða varan ómerkt (ávextir, grænmeti, kjöt í borði), slepptu því: „bananar“, „agúrka“.',
    '  Leiðréttu augljósar villur („Banarar“ → „bananar“). Skammstafanir verslana má útskýra AÐEINS ef þú ert viss (my → myllan, ms → ms). Annars haltu þeim.',
    '- "label": stutt heiti eins og fólk skrifar á innkaupalista, 1–4 orð, íslenska, ENGIN stærð. Hástafur AÐEINS í fyrsta orði og í sérnöfnum/vörumerkjum („Ísey próteindrykkur“, ekki „Ísey Próteindrykkur“). Hafðu vörumerkið með þegar fólk biður almennt um það (gos, morgunkorn, snakk, sælgæti, tilbúnir réttir): „Pepsi Max“, „Myllu ostaslaufur“, „Hundasnakk“, „Bananar“.',
    '- Skilaðu "canon": null og "label": null fyrir línur sem eru EKKI vara sem er keypt aftur: burðarpokar, skilagjald/pant, afslættir, gjöld, gjafakort, þjónusta, óskiljanlegar línur.',
    '',
    vocab.length
      ? 'ÞEKKT AUÐKENNI ÞESSA NOTANDA. Ef lína er SAMA vara (sama vörumerki, vara og stærð) og eitthvað hér, notaðu NÁKVÆMLEGA sama canon og label:\n' +
        vocab.map((v) => '- ' + v.canon + ' | ' + (v.label || '')).join('\n')
      : 'Engin þekkt auðkenni enn.',
    '',
    'LÍNUR (i | verslun | texti af kvittun):',
    ...lines.map((l) => l.i + ' | ' + (l.store || '?') + ' | ' + l.name),
    '',
    'Skilaðu AÐEINS JSON: {"items":[{"i":0,"canon":"…","label":"…"}]} með einni færslu fyrir hverja línu.',
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const SB = Deno.env.get('SUPABASE_URL'), SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), KEY = Deno.env.get('GEMINI_API_KEY')
  if (!SB || !SR || !KEY) return json({ error: 'config' }, 500)
  const rpc = (fn: string, body: unknown) => fetch(SB + '/rest/v1/rpc/' + fn, {
    method: 'POST', headers: { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const t0 = Date.now()
  const r = await rpc('canon_todo', { p_limit: 150 })
  if (!r.ok) return json({ error: 'todo ' + r.status }, 500)
  const todo = await r.json() as { items: { id: string, name: string, store: string | null, user_id: string }[], vocab: Record<string, { canon: string, label: string }[]> }
  if (!todo.items.length) return json({ ok: true, done: 0 })

  const byUser = new Map<string, typeof todo.items>()
  for (const it of todo.items) (byUser.get(it.user_id) || byUser.set(it.user_id, []).get(it.user_id)!).push(it)

  let saved = 0, failed = 0
  for (const [uid, items] of byUser) {
    // 60 línur í einu svo svarið rúmist og líkanið haldi athygli; orðasafn notandans fylgir hverjum skammti.
    for (let k = 0; k < items.length; k += 60) {
      const chunk = items.slice(k, k + 60)
      const lines = chunk.map((it, i) => ({ i, name: String(it.name).slice(0, 80), store: it.store }))
      const vocab = (todo.vocab[uid] || []).slice(0, 250)
      let out: { i: number, canon: string | null, label: string | null }[] | null = null
      for (const model of MODELS) {
        try {
          const g = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + KEY, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt(lines, vocab) }] }], generationConfig: genConfig(model) }),
          })
          if (!g.ok) { console.log('canon-items model=' + model + ' status=' + g.status); continue }
          const gj = await g.json()
          const txt = gj?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
          const parsed = JSON.parse(txt)
          if (parsed && Array.isArray(parsed.items)) { out = parsed.items; break }
        } catch (e) { console.log('canon-items parse fail model=' + model + ' ' + String(e).slice(0, 120)) }
      }
      if (!out) { failed += chunk.length; continue } // reynt aftur í næstu keyrslu (canon_at enn null)
      const rows = chunk.map((it, i) => {
        const o = out!.find((x) => Number(x.i) === i)
        const canon = o && typeof o.canon === 'string' ? o.canon.trim().toLowerCase().slice(0, 80) : null
        const label = o && typeof o.label === 'string' ? o.label.trim().slice(0, 40) : null
        return { id: it.id, canon: canon || null, label: canon ? label : null }
      })
      const s = await rpc('canon_save', { p: rows })
      if (s.ok) saved += Number(await s.json()) || 0
      else { failed += chunk.length; console.log('canon-items save fail ' + s.status) }
      // Nýju auðkennin bætast við orðasafn notandans fyrir næsta skammt (samræmi innan sömu keyrslu).
      const v = todo.vocab[uid] || (todo.vocab[uid] = [])
      for (const row of rows) if (row.canon && !v.some((x) => x.canon === row.canon)) v.push({ canon: row.canon, label: row.label || '' })
    }
  }
  console.log('canon-items saved=' + saved + ' failed=' + failed + ' ms=' + (Date.now() - t0))
  return json({ ok: true, done: saved, failed })
})
