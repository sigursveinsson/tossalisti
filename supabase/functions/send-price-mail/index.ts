// Tilkynningar út úr appinu, keyrt af pg_cron á 10 mín fresti (x-cron-key):
//  1) Push í símann: persónulegar tilkynningar (inbox_messages kind 'price' = verðlækkun, 'join' = einhver gekk í listann,
//     'mail' = kvittun barst í tölvupósti)
//     til þeirra sem hafa kveikt á tilkynningum (push_enabled), utan næðistíma. Merkt pushed_at.
//  2) Tölvupóstur: verðlækkanir til þeirra sem báðu um það (price_email). Afskráning með einum smelli (/afskra).
// ATH: deployað BEINT í Supabase (verify_jwt=false). Þessi skrá er heimildin.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const APP = 'https://tossalisti.is'
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? '', VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? ''
const VAPID_OK = !!(VAPID_PUBLIC && VAPID_PRIVATE)
if (VAPID_OK) webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:tossalisti@tossalisti.is', VAPID_PUBLIC, VAPID_PRIVATE)
const inQuiet = (h: number, s: number, e: number) => s === e ? false : s < e ? (h >= s && h < e) : (h >= s || h < e)

// Push: persónulegar tilkynningar síðustu 2 daga sem hafa ekki verið afgreiddar
async function pushInbox() {
  if (!VAPID_OK) return { push: 'no-vapid' }
  const since = new Date(Date.now() - 2 * 864e5).toISOString()
  const { data: msgs } = await db.from('inbox_messages').select('id,user_id,kind,title,body,link,list_id')
    .in('kind', ['price', 'join', 'mail']).not('user_id', 'is', null).is('pushed_at', null).gte('created_at', since).order('created_at').limit(200)
  if (!msgs?.length) return { pushed: 0 }
  const ids = [...new Set(msgs.map((m: any) => m.user_id))]
  const { data: st } = await db.from('notification_settings').select('user_id,push_enabled,quiet_start,quiet_end').in('user_id', ids)
  const hour = new Date().getUTCHours() // Ísland = UTC
  const done: string[] = []; let pushed = 0
  for (const m of msgs) {
    const s = (st || []).find((x: any) => x.user_id === m.user_id)
    if (!s || !s.push_enabled) { done.push(m.id); continue }                     // engin push: afgreitt (sést í appinu)
    if (inQuiet(hour, s.quiet_start ?? 21, s.quiet_end ?? 8)) continue            // næðistími: bíður til morguns
    const { data: subs } = await db.from('push_subscriptions').select('*').eq('user_id', m.user_id)
    const url = m.kind === 'join' && m.list_id ? '/#list=' + m.list_id : '/#view=home'
    const body = JSON.stringify({ title: (m.kind === 'price' ? '📉 ' : m.kind === 'mail' ? '🧾 ' : '👋 ') + m.title, body: m.body || '', tag: m.kind + '-' + m.id, url })
    for (const sub of subs || []) {
      if (sub.subscription?.native || !/^https?:/.test(sub.endpoint || '')) continue
      try { await webpush.sendNotification(sub.subscription, body); pushed++ }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint) }
    }
    done.push(m.id)
  }
  if (done.length) await db.from('inbox_messages').update({ pushed_at: new Date().toISOString() }).in('id', done)
  return { pushed, handled: done.length }
}

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
      <a href="${APP}/afskra?t=${esc(m.unsub)}" style="color:#6b7a93">Afskrá mig</a> · tossalisti@tossalisti.is<br>
      Fylgdu Tossalista á <a href="https://www.facebook.com/tossalisti" style="color:#1b2a4a">Facebook</a> og <a href="https://www.instagram.com/tossalisti.is/" style="color:#1b2a4a">Instagram</a></td></tr>
  </table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const k = req.headers.get('x-cron-key') || ''
  const { data: ok } = k ? await db.rpc('cron_key_ok', { p_name: 'price_watch_cron', p_key: k }) : { data: false }
  if (!ok) return json({ error: 'unauthorized' }, 401)
  const p = await pushInbox().catch((e) => ({ pushErr: String(e).slice(0, 120) }))
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
  return json({ ok: true, sent, failed, ...p })
})
