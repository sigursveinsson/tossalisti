// Velkomupóstur: einu sinni á hvern nýjan notanda með netfang (skráning eða vistaður prufuaðgangur).
// welcome_outbox() velur viðtakendur (frá 14.11.2026, ekki stjórnandi/prófun/vörumerki) og býr til tóka fyrir
// póstlistahnappinn (/postlisti?t=<tóki> → join_offers). Keyrt af pg_cron á 10 mín fresti. verify_jwt=false.
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
// Sniðmátið er birt á vefnum (public/postur/velkomin.html) svo hægt sé að breyta því með venjulegu deploy.
const TEMPLATE_URL = 'https://tossalisti.is/postur/velkomin.html'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const SB = Deno.env.get('SUPABASE_URL'), SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), KEY = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('WELCOME_FROM') || Deno.env.get('NOTIFY_FROM') || 'Tossalisti <noreply@tossalisti.is>'
  if (!SB || !SR || !KEY) return json({ error: 'config' }, 500)
  const rpc = (fn: string, body: unknown) => fetch(SB + '/rest/v1/rpc/' + fn, {
    method: 'POST', headers: { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const t = await fetch(TEMPLATE_URL + '?v=' + Date.now())
  const TEMPLATE = t.ok ? await t.text() : ''
  if (!TEMPLATE.includes('{{TOKEN}}')) return json({ error: 'template ' + t.status }, 500)
  const r = await rpc('welcome_outbox', { p_limit: 50 })
  if (!r.ok) return json({ error: 'outbox ' + r.status }, 500)
  const out = await r.json() as { user_id: string, email: string, name: string, token: string }[]
  const done: string[] = []
  let failed = 0
  for (const u of out) {
    const html = TEMPLATE.replaceAll('{{TOKEN}}', u.token)
    const s = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [u.email], reply_to: 'tossalisti@tossalisti.is',
        subject: 'Velkomin(n) í Tossalista — svona færðu mest út úr honum', html }),
    })
    if (!s.ok) { failed++; console.log('send-welcome resend ' + s.status + ' ' + (await s.text()).slice(0, 200)); continue }
    done.push(u.user_id)
  }
  if (done.length) await rpc('welcome_mark_sent', { p_users: done })
  console.log('send-welcome users=' + out.length + ' sent=' + done.length + ' failed=' + failed)
  return json({ ok: true, sent: done.length, failed })
})
