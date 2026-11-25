// Áminningar um fyrstu kvittun — keyrt af pg_cron á 10 mín fresti (x-cron-key):
//  A) „Minntu mig á“ (lendingarsíðan): gestur án kvittunar valdi tíma og gaf netfang. EIN áminning á þeim tíma,
//     og EIN eftirfylgni viku síðar ef engin kvittun er komin. Síðan ekkert meira.
//  B) Nýskráðir sem hafa ekki skannað kvittun 20–48 klst eftir skráningu: EINN póstur.
// Hnappurinn í póstinum er innskráningarhlekkur (Supabase magic link) sem opnar Tossalista beint í skannanum (?skanna=1).
// GET ?stop=<tóki> afþakkar frekari áminningar (A). POST {dry:true} sýnir hvað yrði sent án þess að senda.
// ATH: deployað BEINT í Supabase (verify_jwt=false). Þessi skrá er heimildin.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const APP = 'https://tossalisti.is'
const FN = Deno.env.get('SUPABASE_URL') + '/functions/v1/scan-reminders'
const REDIRECT = APP + '/?skanna=1'

// Innskráningarhlekkur. Ef notandinn er ekki til er hann stofnaður (netfang staðfestist þegar hlekkurinn er opnaður).
async function loginLink(email: string): Promise<{ link: string, user_id: string | null } | null> {
  let r = await db.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: REDIRECT } })
  if (r.error) {
    const c = await db.auth.admin.createUser({ email, email_confirm: false, user_metadata: { via: 'scan_reminder' } })
    if (c.error && !/already|exists|registered/i.test(c.error.message || '')) { console.log('createUser ' + c.error.message); return null }
    r = await db.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: REDIRECT } })
    if (r.error) { console.log('generateLink ' + r.error.message); return null }
  }
  const link = (r.data as any)?.properties?.action_link
  return link ? { link, user_id: (r.data as any)?.user?.id || null } : null
}

async function hasReceipt(email: string) {
  const { data } = await db.rpc('email_has_receipt', { p_email: email })
  return data === true
}

function mail(title: string, lead: string, link: string, footer: string, extra = '') {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#1b2a4a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:24px">
    <tr><td style="font-size:12px;letter-spacing:1px;color:#6b7a93;font-weight:bold">TOSSALISTI</td></tr>
    <tr><td style="padding-top:12px;font-size:21px;font-weight:bold;line-height:1.3">${esc(title)}</td></tr>
    <tr><td style="padding-top:12px;font-size:16px;line-height:1.5">${esc(lead)}</td></tr>
    <tr><td style="padding-top:20px"><a href="${esc(link)}" style="display:inline-block;background:#1b2a4a;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;padding:14px 22px;font-size:16px">Skanna kvittunina</a></td></tr>
    ${extra}
    <tr><td style="padding-top:24px;font-size:12px;line-height:1.5;color:#6b7a93">${footer}<br>
      Fylgdu Tossalista á <a href="https://www.facebook.com/tossalisti" style="color:#1b2a4a">Facebook</a> og <a href="https://www.instagram.com/tossalisti.is/" style="color:#1b2a4a">Instagram</a></td></tr>
  </table></td></tr></table></body></html>`
}

async function send(to: string, subject: string, html: string) {
  const KEY = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('NOTIFY_FROM') || 'Tossalisti <noreply@tossalisti.is>'
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!r.ok) console.log('resend ' + r.status)
  return r.ok
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  // Afþakka (hlekkur neðst í áminningu)
  if (req.method === 'GET') {
    const t = url.searchParams.get('stop') || ''
    if (/^[a-f0-9]{32}$/.test(t)) await db.from('scan_reminders').update({ cancelled_at: new Date().toISOString() }).eq('token', t).is('cancelled_at', null)
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:Arial;padding:40px;color:#1b2a4a;text-align:center"><h2>Engar fleiri áminningar</h2><p>Þú færð ekki fleiri áminningar frá Tossalista.</p><p><a href="' + APP + '">tossalisti.is</a></p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const k = req.headers.get('x-cron-key') || ''
  const { data: ok } = k ? await db.rpc('cron_key_ok', { p_name: 'price_watch_cron', p_key: k }) : { data: false }
  if (!ok) return json({ error: 'unauthorized' }, 401)
  let body: any = {}
  try { body = await req.json() } catch {}
  const dry = !!body.dry
  const now = new Date().toISOString()
  const out: any = { first: 0, followup: 0, day1: 0, skipped: 0, plan: [] as any[] }

  // A1) Fyrsta áminning
  const { data: due } = await db.from('scan_reminders').select('id,email,token').is('sent_at', null).is('cancelled_at', null).lte('send_at', now).limit(50)
  for (const r of due || []) {
    if (dry) { out.plan.push({ kind: 'first', email: r.email.replace(/^(.).*@/, '$1…@') }); continue }
    if (await hasReceipt(r.email)) { await db.from('scan_reminders').update({ sent_at: now, followup_sent_at: now }).eq('id', r.id); out.skipped++; continue }
    const l = await loginLink(r.email)
    if (!l) continue
    const stop = FN + '?stop=' + r.token
    const okSend = await send(r.email, 'Varstu að versla? Taktu mynd af kvittuninni', mail(
      'Varstu að versla? Taktu mynd af kvittuninni',
      'Það tekur 10 sekúndur. Tossalisti les kvittunina, flokkar hverja vöru og þú sérð strax hvert peningarnir fóru.',
      l.link,
      `Þú baðst um þessa áminningu á tossalisti.is. Við sendum í mesta lagi eina til viðbótar. <a href="${esc(stop)}" style="color:#6b7a93">Engar fleiri áminningar</a>`))
    if (okSend) { await db.from('scan_reminders').update({ sent_at: now, user_id: l.user_id }).eq('id', r.id); out.first++ }
  }

  // A2) Eftirfylgni viku síðar, aðeins ef engin kvittun er komin
  const { data: fu } = await db.from('scan_reminders').select('id,email,token').not('sent_at', 'is', null).is('followup_sent_at', null).is('cancelled_at', null).lte('followup_at', now).limit(50)
  for (const r of fu || []) {
    if (dry) { out.plan.push({ kind: 'followup', email: r.email.replace(/^(.).*@/, '$1…@') }); continue }
    if (await hasReceipt(r.email)) { await db.from('scan_reminders').update({ followup_sent_at: now }).eq('id', r.id); out.skipped++; continue }
    const l = await loginLink(r.email)
    if (!l) continue
    const stop = FN + '?stop=' + r.token
    const okSend = await send(r.email, 'Smá áminning frá Tossalista', mail(
      'Fyrsta kvittunin tekur 10 sekúndur',
      'Taktu mynd af næstu kvittun og sjáðu útgjöldin flokkuð: matur, drykkir, heimili og fleira. Ókeypis og íslenskt.',
      l.link,
      `Þetta er síðasta áminningin sem þú færð. <a href="${esc(stop)}" style="color:#6b7a93">Afþakka</a>`))
    if (okSend) { await db.from('scan_reminders').update({ followup_sent_at: now }).eq('id', r.id); out.followup++ }
  }

  // B) Nýskráðir án kvittunar, einu sinni
  const { data: nb } = await db.rpc('onboarding_due', { p_limit: 50 })
  for (const u of nb || []) {
    if (dry) { out.plan.push({ kind: 'day1', email: String(u.email).replace(/^(.).*@/, '$1…@') }); continue }
    const l = await loginLink(u.email)
    if (!l) continue
    const okSend = await send(u.email, 'Fyrsta kvittunin tekur 10 sekúndur', mail(
      'Velkomin(n) í Tossalista!',
      'Næst þegar þú verslar: taktu mynd af kvittuninni. Tossalisti les hana, flokkar vörurnar og byrjar heimilisbókhaldið fyrir þig.',
      l.link,
      'Þú fékkst þennan póst af því að þú skráðir þig í Tossalista. Þetta er eini pósturinn af þessu tagi.'))
    if (okSend) { await db.from('onboarding_mails').insert({ user_id: u.user_id, kind: 'day1' }); out.day1++ }
  }

  console.log('scan-reminders ' + JSON.stringify({ ...out, plan: out.plan.length }))
  return json({ ok: true, dry, ...out })
})
