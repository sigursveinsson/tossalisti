// Tilkynningar í tölvupósti (Resend) úr notify_queue — keyrt af pg_cron á klukkutíma fresti.
// ATH: deployað BEINT í Supabase (verify_jwt = false). Þessi skrá er heimildin.
//
// Leyndarmál (Edge Functions → Secrets): RESEND_API_KEY (skylda), NOTIFY_FROM (valkv., sjálfg. noreply@tossalisti.is),
// ADMIN_EMAIL (valkv., sjálfg. sigursveinsson@gmail.com).
//
// Sendir:
//   • Admin: samantekt um vörur í bið, útleysingarbeiðnir og skönnunarbilanir (≥15% af ≥5 skönnunum síðustu 24 klst).
//   • Vörumerkis-ritstjórar: útleysingar sem eru samþykktar og bíða afhendingar frá þeim.
//   • Notandi: samþykkt / hafnað / afhent útleysing.
// Öryggi: engin leynd í kallinu, en fallið sendir aðeins efni úr biðröðinni til réttmætra viðtakenda
// og neitar að keyra oftar en á 5 mín fresti (app_settings.notify_last_run).

const SB = Deno.env.get('SUPABASE_URL')!
const SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const H = { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' }
const APP = 'https://tossalisti.is'

async function q(path: string, init: RequestInit = {}) {
  const r = await fetch(SB + '/rest/v1/' + path, { ...init, headers: { ...H, ...(init.headers || {}) } })
  if (!r.ok) throw new Error(path + ' ' + r.status + ' ' + (await r.text()))
  const t = await r.text()
  return t ? JSON.parse(t) : null
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const li = (s: string) => '<li style="margin:4px 0">' + s + '</li>'
function wrap(title: string, body: string) {
  return '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1b1b1f">' +
    '<div style="font-size:13px;letter-spacing:.08em;color:#f5a623;font-weight:700">GRÍPTU</div>' +
    '<h2 style="margin:6px 0 16px;font-size:20px">' + esc(title) + '</h2>' + body +
    '<p style="margin-top:28px;font-size:12px;color:#777">Sjálfvirk tilkynning frá Tossalista / Gríptu.</p></div>'
}

async function send(key: string, from: string, to: string, subject: string, html: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  if (!r.ok) throw new Error('resend ' + r.status + ' ' + (await r.text()))
}

Deno.serve(async () => {
  const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } })
  try {
    const key = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('NOTIFY_FROM') || 'Gríptu <noreply@tossalisti.is>'
    const admin = Deno.env.get('ADMIN_EMAIL') || 'sigursveinsson@gmail.com'

    // Hraðatakmörkun: ekki oftar en á 5 mín fresti
    const last = await q('app_settings?key=eq.notify_last_run&select=value')
    const lastAt = last?.[0]?.value ? new Date(String(last[0].value).replace(/"/g, '')).getTime() : 0
    if (Date.now() - lastAt < 5 * 60 * 1000) return json({ skipped: 'rate_limit' })
    await q('app_settings', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'notify_last_run', value: JSON.stringify(new Date().toISOString()) }) })

    const rows: any[] = await q('notify_queue?sent_at=is.null&order=created_at&limit=200')

    // Skönnunarheilsa síðustu 24 klst (aðeins einu sinni á dag í pósti)
    const ev: any[] = await q('scan_events?select=outcome&created_at=gte.' + new Date(Date.now() - 86400000).toISOString())
    const n = ev.length, bad = ev.filter((e) => e.outcome !== 'ok').length
    const alertSetting = await q('app_settings?key=eq.notify_scan_alert_at&select=value')
    const alertAt = alertSetting?.[0]?.value ? new Date(String(alertSetting[0].value).replace(/"/g, '')).getTime() : 0
    const scanAlert = n >= 5 && bad / n >= 0.15 && Date.now() - alertAt > 86400000

    if (!rows.length && !scanAlert) return json({ sent: 0 })
    if (!key) return json({ error: 'missing RESEND_API_KEY', pending: rows.length }, 500)

    let sent = 0
    // --- Admin samantekt ---
    const prod = rows.filter((r) => r.kind === 'product_pending')
    const req = rows.filter((r) => r.kind === 'redemption_requested')
    const parts: string[] = []
    if (prod.length) parts.push('<h3 style="font-size:15px">Vörur sem bíða samþykkis (' + prod.length + ')</h3><ul>' +
      prod.map((r) => li('<b>' + esc(r.payload.name) + '</b> · ' + esc(r.payload.brand) + ' · frá ' + esc(r.payload.by || '—'))).join('') +
      '</ul><p><a href="' + APP + '">Opna Verðlaunakerfi → Bíða samþykkis</a></p>')
    if (req.length) parts.push('<h3 style="font-size:15px">Útleysingarbeiðnir (' + req.length + ')</h3><ul>' +
      req.map((r) => li('<b>' + esc(r.payload.offer) + '</b> · ' + esc(r.payload.points) + ' stig · ' + esc(r.payload.name) + ' (' + esc(r.payload.user_email) + ')')).join('') +
      '</ul><p><a href="' + APP + '">Opna Útleysingar</a></p>')
    if (scanAlert) parts.push('<h3 style="font-size:15px;color:#b42318">Skönnun: ' + bad + ' af ' + n + ' kvittunum klikkuðu síðustu 24 klst (' + Math.round(bad / n * 100) + '%)</h3>' +
      '<p>Skoðaðu Stjórnborð → Tölfræði → Kvittanaskönnun.</p>')
    if (parts.length) {
      await send(key, from, admin, 'Gríptu: ' + [prod.length && prod.length + ' vörur í bið', req.length && req.length + ' útleysingar', scanAlert && 'skönnunarbilanir'].filter(Boolean).join(', '),
        wrap('Það bíður þín', parts.join('')))
      sent++
      if (scanAlert) await q('app_settings', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ key: 'notify_scan_alert_at', value: JSON.stringify(new Date().toISOString()) }) })
    }

    // --- Vörumerki: samþykktar útleysingar sem þau eiga að afhenda ---
    const appr = rows.filter((r) => r.kind === 'redemption_approved')
    const byBrand = new Map<string, any[]>()
    for (const r of appr) { if (r.brand_id) byBrand.set(r.brand_id, [...(byBrand.get(r.brand_id) || []), r]) }
    for (const [brandId, list] of byBrand) {
      const eds: any[] = await q('brand_members?brand_id=eq.' + brandId + '&role=eq.editor&select=email')
      for (const e of eds) {
        await send(key, from, e.email, 'Gríptu: ' + list.length + ' útleysing' + (list.length > 1 ? 'ar' : '') + ' til afhendingar',
          wrap('Samþykktar útleysingar — ' + (list[0].payload.brand || ''),
            '<p>Eftirfarandi hafa verið samþykktar og bíða afhendingar frá ykkur. Nafn og afhendingarupplýsingar eru í stjórnborðinu undir Útleysingar.</p><ul>' +
            list.map((r) => li('<b>' + esc(r.payload.offer) + '</b> · ' + esc(r.payload.points) + ' stig')).join('') + '</ul>'))
        sent++
      }
    }

    // --- Notandi: staða útleysingar ---
    const userMsgs: Record<string, [string, string]> = {
      redemption_approved: ['Útleysingin þín er samþykkt', 'Beiðnin um <b>{offer}</b> hefur verið samþykkt. {brand} afhendir hana á næstu dögum og hefur samband ef þarf.'],
      redemption_rejected: ['Útleysingin þín var ekki samþykkt', 'Beiðnin um <b>{offer}</b> var ekki samþykkt{note}. Stigin eru aftur laus til notkunar. Svaraðu þessum pósti ef þú vilt fá skýringu.'],
      redemption_delivered: ['Útleysingin þín er afhent', '<b>{offer}</b> er merkt afhent. Takk fyrir að taka þátt í Gríptu!'],
    }
    for (const r of rows.filter((r) => userMsgs[r.kind] && r.payload.user_email)) {
      const [subj, tpl] = userMsgs[r.kind]
      const body = tpl.replace('{offer}', esc(r.payload.offer)).replace('{brand}', esc(r.payload.brand || 'Vörumerkið'))
        .replace('{note}', r.payload.note ? ': „' + esc(r.payload.note) + '“' : '')
      await send(key, from, r.payload.user_email, 'Gríptu: ' + subj, wrap(subj, '<p>' + body + '</p>'))
      sent++
    }

    if (rows.length) await q('notify_queue?id=in.(' + rows.map((r) => r.id).join(',') + ')', { method: 'PATCH', body: JSON.stringify({ sent_at: new Date().toISOString() }) })
    console.log('notify-admin sent=' + sent + ' queue=' + rows.length + ' scanAlert=' + scanAlert)
    return json({ sent, queue: rows.length, scanAlert })
  } catch (e) {
    console.log('notify-admin error ' + String(e))
    return json({ error: String(e) }, 500)
  }
})
