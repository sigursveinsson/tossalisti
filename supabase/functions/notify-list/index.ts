// notify-list — tilkynningar á sameiginlegum innkaupalista („Anna bætti við mjólk, eggjum +2“, „Jón er að fara að versla“).
// Biðröð: list_notify_queue (trigger á list_items + RPC notify_shopping). pg_cron keyrir á 2 mín fresti.
// Hópað: sending bíður þar til viðkomandi hefur ekki bætt neinu við í 90 sek, svo 10 vörur verða EIN tilkynning.
// Sent aðeins til þeirra sem hafa kveikt á tilkynningum (push_enabled) og „Breytingar á listum“ (list_activity), utan næðistíma.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? '', VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? ''
const VAPID_OK = !!(VAPID_PUBLIC && VAPID_PRIVATE)
if (VAPID_OK) webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:tossalisti@tossalisti.is', VAPID_PUBLIC, VAPID_PRIVATE)
const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { 'Content-Type': 'application/json' } })
const inQuiet = (h: number, s: number, e: number) => s === e ? false : s < e ? (h >= s && h < e) : (h >= s || h < e)

async function sendTo(subs: any[], payload: any) {
  const body = JSON.stringify(payload)
  let n = 0
  await Promise.all((subs || []).map(async (s) => {
    if (s.subscription?.native || !/^https?:/.test(s.endpoint || '')) return
    try { await webpush.sendNotification(s.subscription, body); n++ }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint) }
  }))
  return n
}

const itemsText = (names: string[]) => {
  const u = [...new Set(names.filter(Boolean))]
  if (u.length <= 3) return u.join(', ')
  return u.slice(0, 2).join(', ') + ` og ${u.length - 2} fleiri`
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET')
  if (secret && req.headers.get('x-cron-secret') !== secret) return new Response('unauthorized', { status: 401 })
  if (!VAPID_OK) return json({ ok: false, error: 'VAPID' })
  await db.from('list_notify_queue').delete().lt('created_at', new Date(Date.now() - 2 * 864e5).toISOString())

  const { data: q } = await db.from('list_notify_queue').select('*').is('sent_at', null).order('created_at')
  if (!q?.length) return json({ ok: true, sent: 0 })

  // Hópa eftir lista + geranda + tegund; senda aðeins ef nýjasta færslan er eldri en 90 sek (gerandinn er hættur að bæta við)
  const groups = new Map<string, any[]>()
  for (const r of q) { const k = r.list_id + '|' + r.actor + '|' + r.kind; (groups.get(k) || groups.set(k, []).get(k)!).push(r) }
  const cutoff = Date.now() - 90_000
  const ready = [...groups.values()].filter((g) => new Date(g[g.length - 1].created_at).getTime() < cutoff)
  if (!ready.length) return json({ ok: true, sent: 0, waiting: groups.size })

  const listIds = [...new Set(ready.map((g) => g[0].list_id))]
  const actorIds = [...new Set(ready.map((g) => g[0].actor))]
  const [{ data: lists }, { data: members }, { data: actors }] = await Promise.all([
    db.from('lists').select('id,name,owner').in('id', listIds),
    db.from('list_members').select('list_id,user_id').in('list_id', listIds),
    db.from('profiles').select('id,name').in('id', actorIds),
  ])
  const hour = new Date().getUTCHours() // Ísland = UTC
  let sent = 0
  for (const g of ready) {
    const { list_id, actor, kind } = g[0]
    const list = lists?.find((l) => l.id === list_id)
    if (!list) continue
    const people = new Set<string>([list.owner, ...(members || []).filter((m) => m.list_id === list_id).map((m) => m.user_id)])
    people.delete(actor)
    const ids = [...people].filter(Boolean)
    if (ids.length) {
      const { data: st } = await db.from('notification_settings').select('user_id,quiet_start,quiet_end,list_activity').in('user_id', ids).eq('push_enabled', true)
      const ok = (st || []).filter((s) => s.list_activity !== false && !inQuiet(hour, s.quiet_start ?? 21, s.quiet_end ?? 8)).map((s) => s.user_id)
      if (ok.length) {
        const { data: subs } = await db.from('push_subscriptions').select('*').in('user_id', ok)
        const who = (actors?.find((a) => a.id === actor)?.name || 'Einhver').split(' ')[0]
        const payload = kind === 'shopping'
          ? { title: '🛒 ' + list.name, body: `${who} er að fara að versla. Viltu bæta einhverju á listann?`, tag: 'shop-' + list_id, url: '/#list=' + list_id }
          : { title: '🛒 ' + list.name, body: `${who} bætti við: ${itemsText(g.map((r) => r.item))}`, tag: 'add-' + list_id, url: '/#list=' + list_id }
        sent += await sendTo(subs || [], payload)
      }
    }
    await db.from('list_notify_queue').update({ sent_at: new Date().toISOString() }).in('id', g.map((r) => r.id))
  }
  console.log('notify-list groups=' + ready.length + ' sent=' + sent)
  return json({ ok: true, groups: ready.length, sent })
})
