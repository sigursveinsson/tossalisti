// Tilboðspóstur: einn póstur á notanda þegar ný herferð byrjar, aðeins til þeirra sem skráðu sig (offers_email).
// Í mesta lagi einn tilboðspóstur á 6 daga fresti á notanda (offers_outbox sér um það). Keyrt af pg_cron kl. 11 daglega.
// Afskráning með einu smelli: https://tossalisti.is/afskra?t=<unsub_token> (+ List-Unsubscribe haus).
// Heildsalar fá aldrei netföngin — við sendum. ATH: deployað BEINT í Supabase (verify_jwt=false). Þessi skrá er heimildin.

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const fmtD = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? Number(m[3]) + '.' + Number(m[2]) + '.' : '' }
const APP = 'https://tossalisti.is'

function what(c: any) {
  if (c.kind === 'instant') return c.prize ? 'Vinningur: ' + c.prize : 'Vinningur við kaup'
  if (c.kind === 'stamps') return c.prize ? 'Stimpilkort: ' + c.prize : 'Stimpilkort'
  if (c.reward_value) return (c.reward_type === 'percent' ? c.reward_value + '% í stigum' : '+' + c.reward_value + ' stig') + (c.product ? ' af ' + c.product : '')
  return ''
}

function html(camps: any[], unsub: string) {
  const items = camps.map((c) => `
    <tr><td style="padding:14px 16px;border:1px solid #e3e8f0;border-radius:12px;background:#fff">
      <div style="font-size:12px;color:#6b7a93;text-transform:uppercase;letter-spacing:.04em">${esc(c.brand)} · til ${esc(fmtD(c.ends_on))}</div>
      <div style="font-size:17px;font-weight:700;color:#15315e;margin:4px 0">${esc(c.title)}</div>
      ${c.description ? `<div style="font-size:14px;color:#3d4b63;margin-bottom:6px">${esc(c.description)}</div>` : ''}
      ${what(c) ? `<div style="font-size:14px;font-weight:600;color:#0F6E56">${esc(what(c))}</div>` : ''}
    </td></tr><tr><td style="height:10px"></td></tr>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" style="max-width:520px" cellspacing="0" cellpadding="0">
    <tr><td style="background:#15315e;color:#fff;padding:18px 20px;border-radius:14px 14px 0 0;font-size:18px;font-weight:700">Tossalisti · Gríptu</td></tr>
    <tr><td style="background:#f5f7fb;padding:18px 4px 6px;font-size:15px;color:#15315e">${camps.length === 1 ? 'Ný herferð er komin í gang:' : 'Nýjar herferðir eru komnar í gang:'}</td></tr>
    ${items}
    <tr><td align="center" style="padding:8px 0 20px"><a href="${APP}/?opna=griptu" style="display:inline-block;background:#f5a623;color:#3a2600;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Opna Gríptu</a></td></tr>
    <tr><td style="font-size:12px;color:#6b7a93;line-height:1.5;padding:0 4px">Kauptu vöruna í hvaða búð sem er og skannaðu kvittunina í Tossalista. Skilmálar hverrar herferðar eru í appinu.<br><br>
      Þú færð þennan póst af því að þú skráðir þig fyrir tilboðum og herferðum í Tossalista. Við sendum í mesta lagi einn slíkan póst á viku og deilum netfanginu þínu aldrei með vörumerkjum.<br>
      <a href="${APP}/afskra?t=${esc(unsub)}" style="color:#6b7a93">Afskrá mig</a> · tossalisti@tossalisti.is</td></tr>
  </table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const SB = Deno.env.get('SUPABASE_URL'), SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), KEY = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('OFFERS_FROM') || Deno.env.get('NOTIFY_FROM') || 'Gríptu <noreply@tossalisti.is>'
  if (!SB || !SR || !KEY) return json({ error: 'config' }, 500)
  const rpc = (fn: string, body: unknown) => fetch(SB + '/rest/v1/rpc/' + fn, {
    method: 'POST', headers: { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const r = await rpc('offers_outbox', { p_limit: 200 })
  if (!r.ok) return json({ error: 'outbox ' + r.status }, 500)
  const out = await r.json() as { user_id: string, email: string, unsub: string, campaigns: any[] }[]
  let sent = 0, failed = 0
  for (const u of out) {
    const camps = u.campaigns || []
    if (!camps.length) continue
    const subject = camps.length === 1 ? 'Ný herferð: ' + camps[0].title : camps.length + ' nýjar herferðir í Gríptu'
    const unsubUrl = APP + '/afskra?t=' + u.unsub
    const s = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [u.email], subject, html: html(camps, u.unsub), headers: { 'List-Unsubscribe': '<' + unsubUrl + '>' } }),
    })
    if (!s.ok) { failed++; console.log('send-offers resend ' + s.status); continue }
    await rpc('offers_mark_sent', { p: camps.map((c) => ({ user_id: u.user_id, campaign_id: c.id })) })
    sent++
  }
  console.log('send-offers users=' + out.length + ' sent=' + sent + ' failed=' + failed)
  return json({ ok: true, sent, failed })
})
