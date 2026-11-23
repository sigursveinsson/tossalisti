// Áframsendar kvittanir: Resend „email.received“ webhook.
// Notandi áframsendir kvittun (t.d. PDF-reikning frá ELKO) á sitt netfang <tóki>@<INBOUND_DOMAIN>.
// Hér er skeytið sótt, viðhengið (PDF/mynd) eða textinn vistaður í kvittanageymslu notandans og
// tilkynning sett í Tilkynningar. Lesturinn sjálfur (Gemini) gerist ekki hér heldur þegar notandinn
// opnar kvittunina í appinu og staðfestir — sama flæði og skönnun, enginn AI-kostnaður af ruslpósti.
// ATH: deployað BEINT í Supabase (verify_jwt=false; undirskrift Resend/Svix staðfest hér). Þessi skrá er heimildin.
// Leyndarmál (sett af Sverri): RESEND_API_KEY (til), RESEND_WEBHOOK_SECRET (whsec_…), INBOUND_DOMAIN (t.d. kvittun.tossalisti.is)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })
const MAX_FILES = 3
const MAX_BYTES = 10 * 1024 * 1024
const MAX_PER_DAY = 30

// ── Svix-undirskrift (Resend webhooks) ──
function b64ToBytes(s: string) { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a }
function bytesToB64(a: Uint8Array) { let s = ''; for (const b of a) s += String.fromCharCode(b); return btoa(s) }
async function verify(req: Request, body: string) {
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET') || ''
  const id = req.headers.get('svix-id') || '', ts = req.headers.get('svix-timestamp') || '', sig = req.headers.get('svix-signature') || ''
  if (!secret || !id || !ts || !sig) return false
  const now = Math.floor(Date.now() / 1000)
  if (!/^\d+$/.test(ts) || Math.abs(now - Number(ts)) > 300) return false
  const key = await crypto.subtle.importKey('raw', b64ToBytes(secret.replace(/^whsec_/, '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)))
  const expected = bytesToB64(mac)
  return sig.split(' ').some((p) => { const v = p.split(',')[1] || ''; return v.length === expected.length && timingSafe(v, expected) })
}
function timingSafe(a: string, b: string) { let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0 }

// ── Hjálparföll ──
const addrOf = (s: unknown) => { const m = /<([^>]+)>/.exec(String(s || '')); return (m ? m[1] : String(s || '')).trim().toLowerCase() }
function tokenFrom(list: string[], domain: string) {
  for (const raw of list) {
    const a = addrOf(raw)
    const at = a.lastIndexOf('@'); if (at < 1) continue
    const local = a.slice(0, at), dom = a.slice(at + 1)
    if (domain && dom !== domain) continue
    const t = local.replace(/^kvittun[+.-]?/, '')
    if (/^[a-z0-9]{8,16}$/.test(t)) return t
  }
  return null
}
function htmlToText(h: string) {
  return h
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d|table)>/gi, '\n').replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
}
async function resend(path: string) {
  const r = await fetch('https://api.resend.com' + path, { headers: { Authorization: 'Bearer ' + Deno.env.get('RESEND_API_KEY') } })
  if (!r.ok) throw new Error('resend ' + r.status + ' ' + path)
  return await r.json()
}
const extOf = (mime: string) => mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : /hei[cf]/.test(mime) ? 'heic' : mime === 'text/plain' ? 'txt' : 'jpg'
// Sumir póstþjónar merkja PDF sem application/octet-stream — skráarendingin ræður þá
const normMime = (a: any) => { const m = String(a?.content_type || '').toLowerCase().split(';')[0].trim(); return m === 'application/octet-stream' && /\.pdf$/i.test(String(a?.filename || '')) ? 'application/pdf' : m }
const OK_MIME =/^(application\/pdf|image\/(jpeg|jpg|png|webp|heic|heif))$/

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405)
  const raw = await req.text()
  if (!(await verify(req, raw))) return json({ error: 'unauthorized' }, 401)
  let ev: any
  try { ev = JSON.parse(raw) } catch { return json({ error: 'json' }, 400) }
  if (ev?.type !== 'email.received') return json({ ok: true, ignored: ev?.type || null })
  const d = ev.data || {}
  const emailId = String(d.email_id || '')
  if (!emailId) return json({ ok: true, ignored: 'no id' })

  const domain = (Deno.env.get('INBOUND_DOMAIN') || '').toLowerCase()
  const token = tokenFrom([...(d.to || []), ...(d.cc || []), ...(d.bcc || []), ...(d.received_for || [])], domain)
  if (!token) { console.log('inbound: no token'); return json({ ok: true, ignored: 'no token' }) }
  const { data: rm } = await db.from('receipt_mail').select('user_id').eq('token', token).maybeSingle()
  if (!rm) { console.log('inbound: unknown token'); return json({ ok: true, ignored: 'unknown' }) }
  const uid = rm.user_id as string

  // Endurtekin sending sama skeytis (Resend reynir aftur) → hunsað
  const { data: seen } = await db.from('mail_receipts').select('id').eq('email_id', emailId).limit(1)
  if (seen && seen.length) return json({ ok: true, dup: true })
  const { count } = await db.from('mail_receipts').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', new Date(Date.now() - 864e5).toISOString())
  if ((count || 0) >= MAX_PER_DAY) { console.log('inbound: rate limit'); return json({ ok: true, ignored: 'rate' }) }

  try {
    const email = await resend('/emails/receiving/' + encodeURIComponent(emailId))
    const subject = String(email.subject || d.subject || '').slice(0, 200)
    const from = String(email.headers?.from || email.from || d.from || '').slice(0, 200)

    // Viðhengi: PDF og myndir (ekki smámyndir/lógó sem eru „inline“ í HTML)
    const files: { bytes: Uint8Array, mime: string, name: string }[] = []
    const atts = (email.attachments || []).filter((a: any) => OK_MIME.test(normMime(a)))
      .filter((a: any) => normMime(a) === 'application/pdf' || (!a.content_id && (a.size || 0) > 30000))
    if (atts.length) {
      const list = await resend('/emails/receiving/' + encodeURIComponent(emailId) + '/attachments')
      for (const a of (list.data || [])) {
        if (files.length >= MAX_FILES) break
        if (!atts.some((x: any) => x.id === a.id)) continue
        if ((a.size || 0) > MAX_BYTES) continue
        const r = await fetch(a.download_url)
        if (!r.ok) continue
        const bytes = new Uint8Array(await r.arrayBuffer())
        if (bytes.length > MAX_BYTES) continue
        let mime = normMime(a); if (mime === 'image/jpg') mime = 'image/jpeg'
        files.push({ bytes, mime, name: String(a.filename || 'kvittun').slice(0, 120) })
      }
    }
    // Engin viðhengi: kvittunin er í meginmáli póstsins (algengt hjá netverslunum)
    if (!files.length) {
      const txt = (email.text && String(email.text).trim()) || (email.html ? htmlToText(String(email.html)) : '')
      const clean = txt.slice(0, 20000)
      if (clean.length >= 40 && /\d/.test(clean)) {
        const head = `Efni: ${subject}\nFrá: ${from}\n\n`
        files.push({ bytes: new TextEncoder().encode(head + clean), mime: 'text/plain', name: 'kvittun.txt' })
      }
    }
    if (!files.length) {
      await db.from('mail_receipts').insert({ user_id: uid, email_id: emailId, from_addr: from, subject, status: 'rejected' })
      await db.from('inbox_messages').insert({ user_id: uid, kind: 'mail', title: 'Fann enga kvittun í póstinum', body: (subject ? '„' + subject.slice(0, 80) + '“ — ' : '') + 'Sendu PDF-viðhengið eða póstinn sjálfan áfram óbreyttan.' })
      return json({ ok: true, files: 0 })
    }

    let saved = 0
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const id = crypto.randomUUID()
      const path = `${uid}/mail/${id}.${extOf(f.mime)}`
      const up = await db.storage.from('receipts').upload(path, f.bytes, { contentType: f.mime, upsert: false })
      if (up.error) { console.log('inbound upload ' + up.error.message); continue }
      const { error } = await db.from('mail_receipts').insert({ id, user_id: uid, email_id: i === 0 ? emailId : emailId + '#' + i, from_addr: from, subject, path, mime: f.mime, filename: f.name })
      if (error) { await db.storage.from('receipts').remove([path]); continue }
      saved++
    }
    if (saved) {
      // Áframsendur póstur er „frá“ notandanum sjálfum, svo efnislínan (án Fwd:) segir mest
      const subj = subject.replace(/^\s*((fwd?|fw|áfram|tr|wg)\s*:\s*)+/i, '').trim()
      await db.from('inbox_messages').insert({
        user_id: uid, kind: 'mail', action: 'mail_receipt',
        title: saved > 1 ? saved + ' kvittanir bárust í tölvupósti' : 'Kvittun barst í tölvupósti',
        body: (subj ? '„' + subj.slice(0, 90) + '“ — ' : '') + 'Opnaðu hana og staðfestu, þá fer hún í bókhaldið.',
      })
    }
    console.log('inbound ok files=' + files.length + ' saved=' + saved)
    return json({ ok: true, saved })
  } catch (e) {
    console.log('inbound error ' + String(e).slice(0, 200))
    return json({ error: 'temporary' }, 500) // Resend reynir aftur
  }
})
