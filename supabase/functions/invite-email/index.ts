// Boð á lista í tölvupósti, sent beint frá Tossalista (Deila → „Bjóða með netfangi“).
// Innskráður notandi (ekki gestur) sendir { list_id, email }. Fallið býr til boðshlekk Í NAFNI notandans
// (create_invite athugar að hann sé meðlimur listans) og sendir viðtakanda póst með hlekknum.
// Varnir gegn misnotkun (við sendum póst á netfang sem notandi velur): aðeins skráðir notendur,
// mest 10 boð á sólarhring á notanda, sama netfang + listi ekki oftar en á 10 mín. fresti.
// ATH: deployað BEINT í Supabase (verify_jwt=true). Þessi skrá er heimildin.
// Leyndarmál (til): RESEND_API_KEY, NOTIFY_FROM (valfrjálst).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_ = Deno.env.get('SUPABASE_URL')!
const admin = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const MAX_PER_DAY = 10
const SITE = 'https://tossalisti.is'

function html(who: string, fromEmail: string, listName: string, link: string) {
  return `<!doctype html><html lang="is"><body style="margin:0;background:#f4f6fa;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1b2a4a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa"><tr><td align="center" style="padding:24px 12px">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:14px;padding:26px 24px">
    <tr><td style="font-size:15px;font-weight:bold;color:#1b2a4a">Tossalisti</td></tr>
    <tr><td style="padding-top:12px;font-size:21px;font-weight:bold;line-height:1.3">${esc(who)} bauð þér á listann „${esc(listName)}“</td></tr>
    <tr><td style="padding-top:12px;font-size:16px;line-height:1.5">Þið sjáið sama listann. Allt sem þið bætið við eða hakið við uppfærist strax hjá báðum.</td></tr>
    <tr><td style="padding-top:20px"><a href="${esc(link)}" style="display:inline-block;background:#1b2a4a;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:10px;padding:14px 22px;font-size:16px">Opna listann</a></td></tr>
    <tr><td style="padding-top:14px;font-size:14px;line-height:1.5;color:#4a5b78">Ókeypis og engin skráning nauðsynleg. Hlekkurinn gildir í 30 daga.</td></tr>
    <tr><td style="padding-top:24px;font-size:12px;line-height:1.5;color:#6b7a93">Þú færð þennan póst því ${esc(who)} (${esc(fromEmail)}) sló inn netfangið þitt á tossalisti.is. Þekkirðu ekki sendandann geturðu hunsað póstinn, þá gerist ekkert.<br>Tossalisti · Wonder ehf.</td></tr>
  </table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const auth = req.headers.get('Authorization') || ''
  const jwt = auth.replace(/^Bearer\s+/i, '')
  const { data: ud } = await admin.auth.getUser(jwt)
  const user = ud?.user
  if (!user) return json({ error: 'unauthorized' }, 401)
  if (user.is_anonymous || !user.email) return json({ error: 'guest' }, 403)

  let b: any
  try { b = await req.json() } catch { return json({ error: 'json' }, 400) }
  const listId = String(b?.list_id || '')
  const email = String(b?.email || '').trim().toLowerCase()
  if (!/^[0-9a-f-]{36}$/i.test(listId)) return json({ error: 'list' }, 400)
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'email' }, 400)
  if (email === user.email.toLowerCase()) return json({ error: 'self' }, 400)

  const since = new Date(Date.now() - 864e5).toISOString()
  const { data: recent } = await admin.from('list_invite_mails').select('email,list_id,created_at').eq('user_id', user.id).gte('created_at', since)
  const rows = recent || []
  // Sama boð nýsent (tvísmellur / óþolinmæði): ekki senda aftur
  if (rows.some((r: any) => r.email === email && r.list_id === listId && Date.now() - new Date(r.created_at).getTime() < 10 * 60 * 1000)) return json({ ok: true, dup: true })
  if (rows.length >= MAX_PER_DAY) return json({ error: 'rate' }, 429)

  // Boðshlekkur í nafni notandans: create_invite hafnar ef hann er ekki meðlimur listans
  const asUser = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: 'Bearer ' + jwt } } })
  const { data: token, error: invErr } = await asUser.rpc('create_invite', { p_list: listId })
  if (invErr || !token) return json({ error: 'forbidden' }, 403)

  const [{ data: list }, { data: prof }] = await Promise.all([
    admin.from('lists').select('name').eq('id', listId).maybeSingle(),
    admin.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ])
  const listName = String(list?.name || 'Innkaupalisti').slice(0, 80)
  const base = String(prof?.name || user.email.split('@')[0]).trim().slice(0, 40)
  const who = base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Vinur þinn'
  const link = SITE + '/?invite=' + encodeURIComponent(String(token))

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + Deno.env.get('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('NOTIFY_FROM') || 'Tossalisti <noreply@tossalisti.is>',
      to: [email], reply_to: user.email,
      subject: `${who} bauð þér á listann „${listName}“`,
      html: html(who, user.email, listName, link),
    }),
  })
  if (!r.ok) { console.log('invite-email resend ' + r.status); return json({ error: 'send' }, 502) }
  await admin.from('list_invite_mails').insert({ user_id: user.id, list_id: listId, email })
  console.log('invite-email sent')
  return json({ ok: true })
})
