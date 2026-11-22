// Verðvakt í tölvupósti: sendir verðlækkanir (inbox_messages kind='price') til þeirra sem báðu um það (price_email).
// Keyrt af pg_cron á klukkutíma fresti (x-cron-key), rétt á eftir price-watch. Afskráning með einum smelli (/afskra).
// ATH: deployað BEINT í Supabase (verify_jwt=false). Þessi skrá er heimildin.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const APP = 'https://tossalisti.is'
const https = (u: unknown) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : '')

function html(m: any) {
  const img = https(m.image_url), link = https(m.link)
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#1b2a4a">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:24px">
    <tr><td style="font-size:12px;letter-spacing:1px;color:#6b7a93;font-weight:bold">TOSSALISTI · VERÐVAKT</td></tr>
    <tr><td style="padding-top:12px;font-size:20px;font-weight:bold;line-height:1.3">${esc(m.title)}</td></tr>
    ${img ? `<tr><td style="padding-top:16px" align="center"><img src="${esc(img)}" alt="" width="220" style="max-width:220px;height:auto;border-radius:12px"></td></tr>` : ''}
    <tr><td style="padding-top:14px;font-size:16px;line-height:1.5">${esc(m.body)}</td></tr>
    ${link ? `<tr><td style="padding-top:20px"><a href="${esc(link)}" style="display:inline-block;background:#1b2a4a;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;padding:12px 20px">Skoða vöruna</a></td></tr>` : ''}
    <tr><td style="padding-top:24px;font-size:12px;line-height:1.5;color:#6b7a93">Þú færð þennan póst af því að þú baðst um tilkynningar frá Verðvaktinni í tölvupósti.
      <a href="${APP}/afskra?t=${esc(m.unsub)}" style="color:#6b7a93">Afskrá mig</a> · tossalisti@tossalisti.is</td></tr>
  </table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const k = req.headers.get('x-cron-key') || ''
  const { data: ok } = k ? await db.rpc('cron_key_ok', { p_name: 'price_watch_cron', p_key: k }) : { data: false }
  if (!ok) return json({ error: 'unauthorized' }, 401)
  const KEY = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('NOTIFY_FROM') || 'Tossalisti <noreply@tossalisti.is>'
  if (!KEY) return json({ error: 'config' }, 500)

  const { data: out, error } = await db.rpc('price_mail_outbox', { p_limit: 100 })
  if (error) return json({ error: 'outbox' }, 500)
  let sent = 0, failed = 0
  const done: string[] = []
  for (const m of out || []) {
    const unsubUrl = APP + '/afskra?t=' + m.unsub
    const s = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [m.email], subject: String(m.title || 'Verðið lækkaði').slice(0, 120), html: html(m), headers: { 'List-Unsubscribe': '<' + unsubUrl + '>' } }),
    })
    if (!s.ok) { failed++; console.log('send-price-mail resend ' + s.status); continue }
    done.push(m.id); sent++
  }
  if (done.length) await db.rpc('price_mail_mark', { p_ids: done })
  console.log('send-price-mail due=' + (out || []).length + ' sent=' + sent + ' failed=' + failed)
  return json({ ok: true, sent, failed })
})
