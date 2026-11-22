// Kvittanalestur með sjónlíkani (Gemini). Kallað úr src/lib/receipt.js → parseReceiptVision().
// ATH: þetta fall er deployað BEINT í Supabase (ekki gegnum Netlify/git).
// Þessi skrá er heimildin — haltu henni í samræmi við það sem er í loftinu.
// (Samstillt við útgáfu 30 í loftinu 22.11.2026 + afsláttur á vörulínu „d“.)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// 1. lestur: hraðasta líkanið, engin rökhugsun. 3.5-flash aðeins til vara ef 2.5 svarar ekki.
// (gemini-2.5-flash-lite var lagt niður okt 2026.)
const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash']
// Endurlestur (sannprófun féll): sterkara líkan MEÐ rökhugsun. Sama líkan án hugsunar endurtekur
// sömu villuna — les nöfn og verð sem tvo strauma, ein lína dettur út og verð hliðrast þar til
// næsta magnlína festir röðina aftur (dæmi: Bónus 08.11.26, „os góðostur" datt út í 4 lestrum í röð).
const RETRY_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash']

// Gemini 3.x notar thinkingLevel; 2.5 notar thinkingBudget. Röng stilling → 400.
// Lágt hitastig er sent til allra líkana: sjálfgefið (1,0) á Gemini 3 gaf brenglaða íslensku.
function genConfig(model: string, base: Record<string, unknown>, temperature?: number, think = false) {
  const g3 = /^gemini-3/.test(model)
  return {
    ...base,
    ...(temperature === undefined ? {} : { temperature }),
    thinkingConfig: g3 ? { thinkingLevel: think ? 'low' : 'minimal' } : { thinkingBudget: think ? 2048 : 0 },
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
    const reqBody = await req.json()
    const products = reqBody.products
    // Ein mynd ({image, mime}) eða löng kvittun í 2–4 hlutum ({images: [{image, mime}]}, ofan frá og niður).
    const imgs: { image: string, mime?: string }[] = Array.isArray(reqBody.images) && reqBody.images.length
      ? reqBody.images.filter((m: any) => m && m.image).slice(0, 4)
      : (reqBody.image ? [{ image: reqBody.image, mime: reqBody.mime }] : [])
    if (!imgs.length) return json({ error: 'no image' }, 400)

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

    const itemShape = prods.length ? '{"name":"","qty":1,"price":0,"d":0,"vat":"","w":0,"pid":null}' : '{"name":"","qty":1,"price":0,"d":0,"vat":"","w":0}'
    const prompt = [
      imgs.length > 1 ? 'Þú lest íslenska kassakvittun af ' + imgs.length + ' myndum.' : 'Þú lest íslenska kassakvittun af mynd.',
      ...(imgs.length > 1 ? [
        '',
        'LÖNG KVITTUN Í HLUTUM — MIKILVÆGT:',
        '- Myndirnar ' + imgs.length + ' eru samliggjandi hlutar SÖMU kvittunar, í röð ofan frá og niður (mynd 1 = efst með haus, síðasta mynd = neðst með samtölu).',
        '- Hlutarnir skarast: síðustu línur einnar myndar sjást oft aftur efst á næstu mynd. Slíka línu skal telja EINU SINNI.',
        '- Sama vara sem er keypt tvisvar stendur í tveimur línum Á SÖMU MYND. Ef eins lína sést neðst á mynd N og efst á mynd N+1 er það skörun, ekki tvö kaup.',
        '- Skilaðu einni sameinaðri kvittun: allar vörulínur í réttri röð, haus (verslun, dagsetning, númer) og samtala/VSK þaðan sem þær sjást.',
      ] : []),
      'Skilaðu AÐEINS gildu JSON: {"legible":true,"store":"","date":"YYYY-MM-DD","date_raw":"","time":"HH:MM","receipt_no":"","register":"","vat_total":0,"vat_table":[{"code":"","rate":0,"amount":0}],"discount_total":0,"items":[' + itemShape + '],"total":0}',
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
      '- "vat_table": VSK-taflan neðst á kvittuninni, ein færsla per kóða: "code" = bókstafurinn (t.d. "D"), "rate" = prósentan, "amount" = UPPHÆÐ MEÐ VSK fyrir þann kóða (dálkurinn lengst til hægri, t.d. "Upphæð"). Ef engin tafla: [].',
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
      '- LESTU HVERJA VÖRULÍNU SEM EINA HEILD, frá vinstri til hægri: nafn → verð → VSK-kóði. Lestu ALDREI nafnadálkinn og verðdálkinn sitt í hvoru lagi og paraðu þá svo saman — þá dettur lína út og verðin hliðrast.',
      '- Verð eru heiltölur í íslenskum krónum. "price" = SAMTALS fyrir línuna (magn × einingarverð), þ.e. talan lengst til hægri.',
      '- "vat": VSK-kóðinn sem stendur aftast í línunni, hægra megin við verðið (einn bókstafur, t.d. "D" eða "E"). Ef enginn kóði: null.',
      '- Settu hverja keypta vöru í items með hreinu nafni. Slepptu einingarorðum aftast í nafni ("stk", "st", "kg") og VSK-kóðanum.',
      '- MAGN: Margar kvittanir (Krónan, Bónus, Nettó o.fl.) prenta magn í SÉRSTAKRI LÍNU undir vörunni, t.d. "2 stk@126   252" eða "2 x 126" eða "0,834 kg x 1.299".',
      '  Sú lína er EKKI ný vara: hún tilheyrir vörunni í línunni fyrir ofan. Settu "qty" = magnið (2, eða 0.834 fyrir vigtaða vöru) og "price" = samtalan á þeirri línu.',
      '- Magnlína tilheyrir ALLTAF vörunni BEINT fyrir ofan hana. Ef vöruheitið stendur eitt í línu (ekkert verð) og næsta lína er t.d. "2 stk@292   584", er það EIN vara: heitið úr efri línunni, qty=2 og price=584. Settu magnið ALDREI á vöruna þar á undan.',
      '- Tala INNI í vöruheiti þegar verð er á sömu línu (t.d. "FP hvítlauksbr 2stk stk   192", "Coke 6pk", "Egg 12stk") er pakkastærð, EKKI magn: qty=1, price=192.',
      '- "qty" er 1 ef ekkert magn er gefið.',
      '- Slepptu afsláttar-, samtals-, VSK- og greiðslulínum úr items. Settu samanlagða afslætti (jákvæð krónutala) í "discount_total", annars 0.',
      '- AFSLÁTTUR Á VÖRU ("d"): ef afsláttarlína (t.d. "Afsláttur -449", "Tilboð -200", "2 fyrir 1 -350") stendur BEINT undir vörulínu og á augljóslega við þá vöru, settu afsláttinn sem jákvæða tölu í "d" hjá ÞEIRRI vöru ("price" helst óbreytt) og teldu hann LÍKA með í discount_total. Ef afslátturinn á við alla körfuna (t.d. félagsafsláttur af samtölu) eða þú ert óviss: "d": 0.',
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
    async function readOnce(promptText: string, models: string[] = MODELS, think = false): Promise<{ parsed: Record<string, any>, model: string } | null> {
      for (const model of models) {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key
        const body = {
          contents: [{ parts: [{ text: promptText }, ...imgs.map((m) => ({ inlineData: { mimeType: m.mime || 'image/jpeg', data: m.image } }))] }],
          generationConfig: genConfig(model, { responseMimeType: 'application/json', maxOutputTokens: think ? 16384 : 8192 }, 0, think),
        }
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await r.json()
        // Með rökhugsun geta fyrstu partarnir verið hugsanir — taka síðasta textapartinn.
        const parts: any[] = data?.candidates?.[0]?.content?.parts || []
        const text = [...parts].reverse().find((p) => typeof p?.text === 'string' && !p.thought)?.text
        if (r.status === 200 && text) {
          let parsed: Record<string, any> = {}
          try { parsed = JSON.parse(text) } catch {
            const m = text.match(/\{[\s\S]*\}/)
            if (m) { try { parsed = JSON.parse(m[0]) } catch { /* ignore */ } }
          }
          return { parsed, model }
        }
        lastErr = 'model=' + model + ' status=' + r.status
        console.log('parse-receipt fail ' + lastErr + ' think=' + think + ' ms=' + (Date.now() - t0))
      }
      return null
    }

    // --- Tilkynning til stjórnanda þegar Gemini liggur niðri ---
    async function notifyAiDown(err: string) {
      try {
        const SB = Deno.env.get('SUPABASE_URL'), SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!SB || !SR) return
        const H = { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' }
        const since = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
        const r = await fetch(SB + '/rest/v1/notify_queue?kind=eq.ai_down&created_at=gte.' + since + '&select=id&limit=1', { headers: H })
        const recent = r.ok ? await r.json() : []
        if (recent.length) return
        await fetch(SB + '/rest/v1/notify_queue', { method: 'POST', headers: H,
          body: JSON.stringify({ kind: 'ai_down', payload: { error: err, at: new Date().toISOString() } }) })
        // Senda strax (notify-admin hefur sína eigin 5 mín hraðatakmörkun)
        await Promise.race([
          fetch(SB + '/functions/v1/notify-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
          new Promise((res) => setTimeout(res, 4000)),
        ])
      } catch (e) { console.log('notifyAiDown error ' + String(e)) }
    }

    const vatCode = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim().toUpperCase() : ''
      return /^[A-Z]$/.test(s) ? s : null
    }

    // --- Eftirvinnsla: dagsetning, magnlínur, pörun, auðkenni ---
    function post(parsed: Record<string, any>) {
      parsed.model_date = parsed.date
      parsed.date = fixDate(parsed.date, today)
      parsed.vat_table = (Array.isArray(parsed.vat_table) ? parsed.vat_table : [])
        .map((t: any) => ({ code: vatCode(t?.code), rate: Number(t?.rate) || null, amount: Math.round(Number(t?.amount)) || 0 }))
        .filter((t: any) => t.code && t.amount > 0)
      // Aðeins bókstafir sem standa í VSK-töflunni teljast VSK-kóðar (annars skemmist t.d. „Vítamín C“)
      const codes = new Set<string>((parsed.vat_table as any[]).map((t) => t.code))
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
            if (!vatCode(prev.vat) && vatCode(it.vat)) prev.vat = it.vat
            continue
          }
          // VSK-kóði sem lenti aftast í nafni („kristall 330 ml D“) → færa í vat
          let clean = name
          const tail = name.match(/\s+([A-Z])\s*$/)
          if (tail && codes.has(tail[1])) {
            if (!vatCode(it.vat)) it.vat = tail[1]
            clean = name.slice(0, tail.index)
          }
          it.name = clean.replace(/\s+(stk|st|kg)\.?\s*$/i, '').trim()
          const q = Number(it.qty)
          it.qty = Number.isFinite(q) && q > 0 ? q : 1
          merged.push(it)
        }
        parsed.items = merged
      } else parsed.items = []
      let matched = 0, warranty = 0
      parsed.items = (parsed.items as any[]).map((it) => {
        const { pid, w, vat, d, ...rest } = it || {}
        const id = typeof pid === 'string' ? codeToId.get(pid.trim().toUpperCase()) : undefined
        if (id) matched++
        const wy = Number(w) === 5 ? 5 : Number(w) === 2 ? 2 : 0
        if (wy) warranty++
        const out: any = { ...rest, warranty_years: wy }
        const vc = vatCode(vat)
        if (vc) out.vat = vc
        if (id) out.reward_product_id = id
        // Afsláttur sem á við þessa línu (jákvæð tala, aldrei meiri en línuverðið). Appið dregur hann frá vörunni.
        const dv = Math.round(Number(d)); const pv = Number(rest.price)
        if (Number.isFinite(dv) && dv > 0 && Number.isFinite(pv) && dv <= pv) out.discount = dv
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

    // --- Summa per VSK-kóða borin saman við VSK-töfluna: staðsetur hvar lína vantar ---
    function byVat(p: Record<string, any>) {
      const tab: any[] = Array.isArray(p.vat_table) ? p.vat_table : []
      if (!tab.length) return null
      const items: any[] = Array.isArray(p.items) ? p.items : []
      const tagged = items.filter((i) => i.vat).length
      if (tagged < items.length * 0.8) return null // of fáar línur merktar til að bera saman
      const sums: Record<string, number> = {}
      for (const i of items) if (i.vat) sums[i.vat] = (sums[i.vat] || 0) + (Number(i.price) || 0)
      return tab.map((t) => ({ code: t.code, read: Math.round(sums[t.code] || 0), table: t.amount, diff: Math.round((sums[t.code] || 0) - t.amount) }))
    }

    // --- Sannprófun: línur − afsláttur ≈ samtala, og VSK trúverðugur (matvara 11%, annað 24%) ---
    function check(p: Record<string, any>) {
      const items: any[] = Array.isArray(p.items) ? p.items : []
      const sum = items.reduce((s, i) => s + (Number(i.price) || 0), 0) - (Number(p.discount_total) || 0)
      const total = Number(p.total)
      const hasTotal = Number.isFinite(total) && total > 0
      const diff = hasTotal ? Math.round(sum - total) : null
      // Kassakvittun summast upp á krónu: 0,2% vikmörk (lágmark 5 kr fyrir aurajöfnun/námundun vigtaðra vara).
      const tol = hasTotal ? Math.max(5, total * 0.002) : 0
      const vat = Number(p.vat_total)
      const vatRatio = hasTotal && Number.isFinite(vat) && vat > 0 ? vat / total : null
      const vatOk = vatRatio == null || (vatRatio >= 0.05 && vatRatio <= 0.25)
      const sumOk = hasTotal && Math.abs(diff as number) <= tol
      return {
        sum: Math.round(sum), total: hasTotal ? total : null, diff, vat_ratio: vatRatio == null ? null : Math.round(vatRatio * 1000) / 1000,
        vat_ok: vatOk, sum_ok: sumOk, legible: p.legible !== false, lines: items.length,
        by_vat: byVat(p),
        // Summan ræður: stemmi línurnar við samtöluna er lesturinn traustur, jafnvel þótt VSK sé mislesinn
        // (líkanið ruglar oft dálkum í VSK-töflunni). VSK skiptir aðeins máli þegar summan stemmir ekki.
        ok: sumOk && p.legible !== false && items.length > 0,
      }
    }

    // 1. lestur
    const first = await readOnce(prompt)
    if (!first) {
      // Gemini svarar ekki (greiðsla/kvóti/bilun). Appið á EKKI að falla á lélegan varalestur heldur segja satt
      // og bjóða endurtekningu. Stjórnandi fær tilkynningu strax (einu sinni á 2 klst).
      await notifyAiDown(lastErr)
      return json({ error: lastErr, ai_down: true })
    }
    let parsed = first.parsed, model = first.model
    let stats = post(parsed)
    let chk = check(parsed)
    let retried = false

    // 2. endurlestur ef summa stemmir ekki: sterkara líkan MEÐ rökhugsun og nákvæm endurgjöf
    if (!chk.ok && chk.lines > 0) {
      const hints: string[] = []
      if (chk.diff != null && chk.diff < 0) {
        hints.push('- Línurnar eru ' + (-chk.diff) + ' kr of LÁGAR. Líklegast vantar EINA vörulínu (verð um ' + (-chk.diff) + ' kr), eða nafn hefur verið parað við verð línunnar fyrir neðan svo verðin hliðrast. Berðu hvert nafn saman við verðið Á SÖMU LÍNU.')
      } else if (chk.diff != null && chk.diff > 0) {
        hints.push('- Línurnar eru ' + chk.diff + ' kr of HÁAR. Líklegast er lína tvítalin, afsláttur gleymdist eða magnlína var lesin sem sér vara.')
      }
      for (const b of chk.by_vat || []) {
        if (Math.abs(b.diff) > 30) hints.push('- VSK-flokkur ' + b.code + ': línur merktar ' + b.code + ' summast í ' + b.read + ' kr en VSK-taflan segir ' + b.table + ' kr (munur ' + b.diff + ' kr, afslættir geta skýrt nokkrar krónur). Villan er í ÞESSUM flokki.')
      }
      const fb = [
        prompt, '',
        'ENDURLESTUR — fyrri lestur stóðst ekki sannprófun:',
        '- Fyrri lestur: ' + chk.lines + ' línur sem summast í ' + chk.sum + ' kr (að frádregnum afslætti)' +
          (chk.total ? ', en samtala kvittunar er ' + chk.total + ' kr (munur ' + chk.diff + ' kr).' : ', og samtala sást ekki.'),
        ...hints,
        ...(chk.vat_ok ? [] : ['- VSK ' + parsed.vat_total + ' kr passar ekki við samtöluna — lestu VSK-töfluna aftur.']),
        '- Lestu ALLAR vörulínur aftur, eina í einu, ofan frá og niður: nafn → verð → VSK-kóði á sömu línu. Teldu vörulínurnar og verðin og gakktu úr skugga um að fjöldinn sé sá sami.',
        '- Ef línurnar eru ólæsilegar: "legible": false og búðu EKKI til línur.',
      ].join('\n')
      const second = await readOnce(fb, RETRY_MODELS, true)
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
      console.log('parse-receipt unreadable model=' + model + ' imgs=' + imgs.length + ' ms=' + (Date.now() - t0) + ' retried=' + retried + ' check=' + JSON.stringify(chk))
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
            total: chk.total, verified: chk.ok, check: { ...chk, model, retried },
            items: (parsed.items as any[]).map((i) => ({
              name: String(i.name || '').slice(0, 120), qty: Number(i.qty) > 0 ? Number(i.qty) : 1,
              price: Number.isFinite(Number(i.price)) ? Number(i.price) : null, reward_product_id: i.reward_product_id || null,
              ...(i.vat ? { vat: i.vat } : {}),
              ...(i.discount ? { discount: i.discount } : {}),
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
    const discLines = (parsed.items as any[]).filter((i) => i.discount).length
    console.log('parse-receipt ok model=' + model + ' imgs=' + imgs.length + ' ms=' + (Date.now() - t0) + ' retried=' + retried + ' verified=' + chk.ok +
      ' diff=' + chk.diff + ' vat_ratio=' + chk.vat_ratio + ' by_vat=' + JSON.stringify(chk.by_vat) + ' legible=' + chk.legible +
      ' scan=' + (parsed.scan_id ? 'saved' : 'none') + ' prods=' + prods.length + ' matched=' + stats.matched + ' warranty=' + stats.warranty + ' qtylines=' + qtyLines +
      ' disc_total=' + parsed.discount_total + ' disc_lines=' + discLines +
      ' no=' + JSON.stringify(parsed.receipt_no) + ' vat=' + JSON.stringify(parsed.vat_total) + ' date_raw=' + JSON.stringify(parsed.date_raw) + ' model_date=' + JSON.stringify(parsed.model_date) + ' final=' + JSON.stringify(parsed.date))
    return json(parsed)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
