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

    const itemShape = prods.length ? '{"name":"","qty":1,"price":0,"w":0,"pid":null}' : '{"name":"","qty":1,"price":0,"w":0}'
    const prompt = [
      'Þú lest íslenska kassakvittun af mynd.',
      'Skilaðu AÐEINS gildu JSON: {"legible":true,"store":"","date":"YYYY-MM-DD","date_raw":"","time":"HH:MM","receipt_no":"","register":"","vat_total":0,"discount_total":0,"items":[' + itemShape + '],"total":0}',
      '',
      'HEIÐARLEIKI — MIKILVÆGAST AF ÖLLU:',
      '- Skrifaðu AÐEINS vörulínur sem þú SÉRÐ greinilega á myndinni. ALDREI giska, fylla í eyður eða búa til línur sem „líklega" eru á kvittuninni.',
      '- Ef hluti vörulínanna er ólæsilegur (óskýr mynd, skuggi, krumpa, utan myndar): settu "legible": false og slepptu þeim línum.',
      '- Ef þú sérð engar vörulínur greinilega: "legible": false og "items": []. Það er MIKLU betra en að búa til línur.',
      '',
      'AUÐKENNI KVITTUNAR (notað til að þekkja sömu kvittun aftur):',
      '- "time": klukkan sem kvittunin var prentuð, HH:MM, annars null.',
      '- "receipt_no": KVITTANANÚMERIÐ, merkt "Kvitt", "Kvittun", "Nóta", "Reikn." eða "Nr". Ef bæði kvittananúmer og "Færsla"/"Afgr" standa á kvittuninni: notaðu ALLTAF kvittananúmerið, ekki færslunúmerið. Afritaðu tölustafina nákvæmlega, staf fyrir staf (líka núllin). Annars null.',
      '- "register": kassa- eða afgreiðslunúmer ("Kassi", "Pos", "Afgreiðsla", "Till"), annars null.',
      '- "vat_total": samanlagður virðisaukaskattur í krónum (allar VSK-línur lagðar saman, t.d. "VSK 11%" + "VSK 24%"), annars null.',
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
      '- Verð eru heiltölur í íslenskum krónum. "price" = SAMTALS fyrir línuna (magn × einingarverð), þ.e. talan lengst til hægri.',
      '- Settu hverja keypta vöru í items með hreinu nafni. Slepptu einingarorðum aftast í nafni ("stk", "st", "kg").',
      '- MAGN: Margar kvittanir (Krónan, Bónus, Nettó o.fl.) prenta magn í SÉRSTAKRI LÍNU undir vörunni, t.d. "2 stk@126   252" eða "2 x 126" eða "0,834 kg x 1.299".',
      '  Sú lína er EKKI ný vara: hún tilheyrir vörunni í línunni fyrir ofan. Settu "qty" = magnið (2, eða 0.834 fyrir vigtaða vöru) og "price" = samtalan á þeirri línu.',
      '- Magnlína tilheyrir ALLTAF vörunni BEINT fyrir ofan hana. Ef vöruheitið stendur eitt í línu (ekkert verð) og næsta lína er t.d. "2 stk@292   584", er það EIN vara: heitið úr efri línunni, qty=2 og price=584. Settu magnið ALDREI á vöruna þar á undan.',
      '- Tala INNI í vöruheiti þegar verð er á sömu línu (t.d. "FP hvítlauksbr 2stk stk   192", "Coke 6pk", "Egg 12stk") er pakkastærð, EKKI magn: qty=1, price=192.',
      '- "qty" er 1 ef ekkert magn er gefið.',
      '- Slepptu afsláttar-, samtals-, VSK- og greiðslulínum úr items. Settu samanlagða afslætti (jákvæð krónutala) í "discount_total", annars 0.',
      '- SANNPRÓFUN: verð allra lína mínus discount_total á að vera jafnt "total". Ef það stemmir ekki hefurðu misst af línu, tvítalið línu eða sett magn á ranga vöru — farðu yfir aftur áður en þú svarar.',
      '',
      'ÁBYRGÐ ("w") — fyrir hverja vöru:',
      '- "w": 0 fyrir neysluvörur sem klárast eða slitna hratt (matur, drykkir, hreinlætisvörur, snyrtivörur, lyf, pappír, föt, rafhlöður, perur o.þ.h.).',
      '- "w": 2 fyrir endingarvörur: raftæki, símar, tölvur, heyrnartól, smáraftæki (blandari, ryksuga, kaffivél), verkfæri, leikföng úr hörðu efni, íþróttabúnaður, skór og yfirhafnir í dýrari kantinum.',
      '- "w": 5 fyrir hluti sem eiga að endast verulega lengur: stór heimilistæki (þvottavél, þurrkari, ísskápur, uppþvottavél, eldavél, ofn), húsgögn, sjónvörp, rúm/dýnur, reiðhjól.',
      '- Í vafa: 0. Matvöruverslun (Bónus, Krónan, Nettó o.fl.) → nær allt 0.',
      ...(prods.length ? [
        '',
        'TILBOÐSVÖRUR — pörun:',
        'Hér fyrir neðan er listi yfir vörur sem gefa stig (kóði | vörumerki | heiti).',
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


    // --- Lestur: eitt kall á líkanið (með varaleið yfir á næsta líkan) ---
    let lastErr = ''
    async function readOnce(promptText: string): Promise<{ parsed: Record<string, any>, model: string } | null> {
      for (const model of MODELS) {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
        const body = {
          contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: mime || 'image/jpeg', data: image } }] }],
          generationConfig: genConfig(model, { responseMimeType: 'application/json', maxOutputTokens: 4096 }, 0),
        }
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await r.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (r.status === 200 && text) {
          let parsed: Record<string, any> = {}
          try { parsed = JSON.parse(text) } catch {
            const m = text.match(/\{[\s\S]*\}/)
            if (m) { try { parsed = JSON.parse(m[0]) } catch { /* ignore */ } }
          }
          return { parsed, model }
        }
        lastErr = 'model=' + model + ' status=' + r.status
        console.log('parse-receipt fail ' + lastErr + ' ms=' + (Date.now() - t0))
      }
      return null
    }

    // --- Eftirvinnsla: dagsetning, magnlínur, pörun, auðkenni ---
    function post(parsed: Record<string, any>) {
      parsed.model_date = parsed.date
      parsed.date = fixDate(parsed.date, today)
      if (Array.isArray(parsed.items)) {
        const QTY = /^\s*(\d+(?:[.,]\d+)?)\s*(?:stk|st|kg|x|×)?\s*(?:[@x×]|á)\s*([\d.,]+)\s*(?:kr)?\s*$/i
        const isNum = (t: string) => Number(t.replace(/\./g, '').replace(',', '.'))
        const merged: any[] = []
        for (const raw of parsed.items as any[]) {
          const it = { ...(raw || {}) }
          const name = String(it.name || '')
          const m = name.match(QTY)
          if (m && merged.length) {
            const prev = merged[merged.length - 1]
            const q = isNum(m[1]) || 1, unit = isNum(m[2])
            prev.qty = q
            if (unit > 0) prev.price = Math.round(q * unit)
            continue
          }
          it.name = name.replace(/\s+(stk|st|kg)\.?\s*$/i, '').trim()
          const q = Number(it.qty)
          it.qty = Number.isFinite(q) && q > 0 ? q : 1
          merged.push(it)
        }
        parsed.items = merged
      } else parsed.items = []
      let matched = 0, warranty = 0
      parsed.items = (parsed.items as any[]).map((it) => {
        const { pid, w, ...rest } = it || {}
        const id = typeof pid === 'string' ? codeToId.get(pid.trim().toUpperCase()) : undefined
        if (id) matched++
        const wy = Number(w) === 5 ? 5 : Number(w) === 2 ? 2 : 0
        if (wy) warranty++
        const out: any = { ...rest, warranty_years: wy }
        if (id) out.reward_product_id = id
        return out
      })
      for (const k of ['time', 'receipt_no', 'register']) {
        const v = parsed[k]
        parsed[k] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 40) : null
      }
      // Kvittananúmer staðlað: aðeins tölustafir, síðustu 8. Langar núllaraðir lesast stundum með einu núlli
      // of mikið/lítið („0000021149000079305“ → „00000211490000079305“); síðustu 8 stafirnir eru stöðugir.
      parsed.receipt_no_raw = parsed.receipt_no
      if (parsed.receipt_no) {
        const dg = String(parsed.receipt_no).replace(/\D/g, '')
        parsed.receipt_no = dg.length >= 4 ? dg.slice(-8) : parsed.receipt_no
      }
      parsed.vat_total = Number.isFinite(Number(parsed.vat_total)) && Number(parsed.vat_total) > 0 ? Math.round(Number(parsed.vat_total)) : null
      parsed.discount_total = Number.isFinite(Number(parsed.discount_total)) && Number(parsed.discount_total) > 0 ? Math.round(Number(parsed.discount_total)) : 0
      return { matched, warranty }
    }

    // --- Sannprófun: línur − afsláttur ≈ samtala, og VSK trúverðugur (matvara 11%, annað 24%) ---
    function check(p: Record<string, any>) {
      const items: any[] = Array.isArray(p.items) ? p.items : []
      const sum = items.reduce((s, i) => s + (Number(i.price) || 0), 0) - (Number(p.discount_total) || 0)
      const total = Number(p.total)
      const hasTotal = Number.isFinite(total) && total > 0
      const diff = hasTotal ? Math.round(sum - total) : null
      const tol = hasTotal ? Math.max(20, total * 0.01) : 0
      const vat = Number(p.vat_total)
      const vatRatio = hasTotal && Number.isFinite(vat) && vat > 0 ? vat / total : null
      const vatOk = vatRatio == null || (vatRatio >= 0.05 && vatRatio <= 0.25)
      const sumOk = hasTotal && Math.abs(diff as number) <= tol
      return {
        sum: Math.round(sum), total: hasTotal ? total : null, diff, vat_ratio: vatRatio == null ? null : Math.round(vatRatio * 1000) / 1000,
        vat_ok: vatOk, sum_ok: sumOk, legible: p.legible !== false, lines: items.length,
        // Summan ræður: stemmi línurnar við samtöluna er lesturinn traustur, jafnvel þótt VSK sé mislesinn
        // (líkanið ruglar oft dálkum í VSK-töflunni). VSK skiptir aðeins máli þegar summan stemmir ekki.
        ok: sumOk && p.legible !== false && items.length > 0,
      }
    }

    // 1. lestur
    const first = await readOnce(prompt)
    if (!first) return json({ error: lastErr })
    let parsed = first.parsed, model = first.model
    let stats = post(parsed)
    let chk = check(parsed)
    let retried = false

    // 2. endurlestur með endurgjöf ef summa/VSK stemmir ekki (en eitthvað var lesið)
    if (!chk.ok && chk.lines > 0) {
      const fb = [
        prompt, '',
        'ENDURLESTUR — fyrri lestur stóðst ekki sannprófun:',
        '- Fyrri lestur: ' + chk.lines + ' línur sem summast í ' + chk.sum + ' kr (að frádregnum afslætti)' +
          (chk.total ? ', en samtala kvittunar er ' + chk.total + ' kr (munur ' + chk.diff + ' kr).' : ', og samtala sást ekki.'),
        ...(chk.vat_ok ? [] : ['- VSK ' + parsed.vat_total + ' kr passar ekki við samtöluna — lestu VSK-töfluna aftur.']),
        '- Lestu ALLAR vörulínur aftur, eina í einu, ofan frá og niður. Leitaðu að línu sem vantar, línu sem er tvítalin og magnlínu sem er sett á ranga vöru.',
        '- Ef línurnar eru ólæsilegar: "legible": false og búðu EKKI til línur.',
      ].join('\n')
      const second = await readOnce(fb)
      if (second) {
        const p2 = second.parsed
        const s2 = post(p2)
        const c2 = check(p2)
        retried = true
        const better = (c2.ok && !chk.ok) ||
          (c2.lines > 0 && c2.diff != null && (chk.diff == null || Math.abs(c2.diff) < Math.abs(chk.diff)))
        if (better) { parsed = p2; stats = s2; chk = c2; model = second.model }
      }
    }

    // 3. Ólæsileg mynd: hafna í stað þess að skila mögulegum tilbúningi
    const bigOff = chk.total != null && chk.diff != null && Math.abs(chk.diff) > chk.total * 0.10
    const unreadable = chk.lines === 0 || (!chk.ok && (!chk.legible || !chk.vat_ok || bigOff))
    // Mislesinn VSK á annars réttum lestri: ekki geyma ranga tölu (hún er notuð sem auðkenni kvittunar)
    if (chk.ok && !chk.vat_ok) parsed.vat_total = null
    parsed.check = chk
    parsed.verified = chk.ok

    if (unreadable) {
      console.log('parse-receipt unreadable model=' + model + ' ms=' + (Date.now() - t0) + ' retried=' + retried + ' check=' + JSON.stringify(chk))
      return json({ unreadable: true, items: [], store: parsed.store || '', date: parsed.date || null, total: chk.total, check: chk })
    }

    // 4. Geyma það sem gervigreindin LAS (receipt_scans). Stig reiknast aðeins af þessu, og
    //    vörustig aðeins ef lesturinn stóðst sannprófun (verified).
    try {
      const SB = Deno.env.get('SUPABASE_URL'), SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), AN = Deno.env.get('SUPABASE_ANON_KEY')
      const authz = req.headers.get('Authorization') || ''
      if (SB && SR && authz) {
        const ur = await fetch(SB + '/auth/v1/user', { headers: { Authorization: authz, apikey: AN || SR } })
        const u = ur.ok ? await ur.json() : null
        if (u && u.id) {
          const row = {
            user_id: u.id, store: parsed.store || null, purchased_at: parsed.date || null,
            receipt_no: parsed.receipt_no || null, receipt_no_raw: parsed.receipt_no_raw || null, vat_total: parsed.vat_total ?? null,
            total: chk.total, verified: chk.ok, check: chk,
            items: (parsed.items as any[]).map((i) => ({
              name: String(i.name || '').slice(0, 120), qty: Number(i.qty) > 0 ? Number(i.qty) : 1,
              price: Number.isFinite(Number(i.price)) ? Number(i.price) : null, reward_product_id: i.reward_product_id || null,
            })),
          }
          const ins = await fetch(SB + '/rest/v1/receipt_scans', {
            method: 'POST',
            headers: { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            body: JSON.stringify(row),
          })
          if (ins.ok) { const saved = await ins.json(); parsed.scan_id = saved && saved[0] && saved[0].id }
          else console.log('parse-receipt scan save fail ' + ins.status + ' ' + (await ins.text()))
        }
      }
    } catch (e) { console.log('parse-receipt scan save error ' + String(e)) }

    const qtyLines = (parsed.items as any[]).filter((i) => Number(i.qty) !== 1).length
    console.log('parse-receipt ok model=' + model + ' ms=' + (Date.now() - t0) + ' retried=' + retried + ' verified=' + chk.ok +
      ' diff=' + chk.diff + ' vat_ratio=' + chk.vat_ratio + ' legible=' + chk.legible +
      ' scan=' + (parsed.scan_id ? 'saved' : 'none') + ' prods=' + prods.length + ' matched=' + stats.matched + ' warranty=' + stats.warranty + ' qtylines=' + qtyLines +
      ' no=' + JSON.stringify(parsed.receipt_no) + ' vat=' + JSON.stringify(parsed.vat_total) + ' date_raw=' + JSON.stringify(parsed.date_raw) + ' model_date=' + JSON.stringify(parsed.model_date) + ' final=' + JSON.stringify(parsed.date))
    return json(parsed)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
