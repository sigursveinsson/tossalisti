// send-reminders — keyrt af pg_cron á ~15 mín fresti.
// Sendir AÐEINS til notenda sem hafa kveikt á áminningum (notification_settings.push_enabled = true).
// Ísland er á UTC allt árið (engin sumartími) svo server-tími = íslenskur staðartími.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] // getDay(): 0=sun

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:sigursveinsson@gmail.com'

const VAPID_OK = !!(VAPID_PUBLIC && VAPID_PRIVATE)
if (VAPID_OK) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const db = createClient(SUPABASE_URL, SERVICE_KEY)

const minutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '')
  return m ? (+m[1]) * 60 + (+m[2]) : null
}
const inQuiet = (h: number, start: number, end: number) =>
  start === end ? false : start < end ? (h >= start && h < end) : (h >= start || h < end)

async function sendTo(subs: any[], payload: any) {
  const body = JSON.stringify(payload)
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification(s.subscription, body) }
    catch (e: any) {
      // 404/410 = úrelt áskrift → hreinsa
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
    }
  }))
}

Deno.serve(async (req) => {
  // Einföld vörn: ef CRON_SECRET er sett, krefjast þess í haus (cron-starfið sendir það).
  const secret = Deno.env.get('CRON_SECRET')
  if (secret && req.headers.get('x-cron-secret') !== secret) {
    return new Response('unauthorized', { status: 401 })
  }
  if (!VAPID_OK) return new Response(JSON.stringify({ ok: false, error: 'VAPID secrets not set' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  const now = new Date()
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  const nowMin = hour * 60 + minute
  const todayKey = DAY_KEYS[now.getUTCDay()]
  const todayISO = now.toISOString().slice(0, 10)
  const firstRunOfHour = minute < 15
  const sentLog: string[] = []

  // Notendur með push virkt + áskriftir + stillingar
  const { data: settings } = await db.from('notification_settings').select('*').eq('push_enabled', true)
  if (!settings || !settings.length) return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { 'Content-Type': 'application/json' } })

  const userIds = settings.map((s) => s.user_id)
  const { data: subsAll } = await db.from('push_subscriptions').select('user_id,endpoint,subscription').in('user_id', userIds)
  const subsByUser: Record<string, any[]> = {}
  for (const s of subsAll || []) (subsByUser[s.user_id] ||= []).push(s)
  const setByUser: Record<string, any> = {}
  for (const s of settings) setByUser[s.user_id] = s

  // ---- 1. Per-verk áminningar (verk með bjöllu, á tíma sínum í dag) ----
  const { data: items } = await db
    .from('list_items')
    .select('id,name,time,weekday,due_at,assignee,last_reminded_at,list_id,lists!inner(owner)')
    .eq('reminder_enabled', true)
  for (const it of items || []) {
    const due = (it.weekday === todayKey || it.weekday === 'daily' || it.due_at === todayISO)
    const tmin = minutes(it.time)
    if (!due || tmin == null) continue
    // Senda ef tími verksins er liðinn fyrir < 20 mín og ekki þegar minnt í dag
    if (tmin > nowMin || nowMin - tmin >= 20) continue
    if (it.last_reminded_at && String(it.last_reminded_at).slice(0, 10) === todayISO) continue
    const owner = (it as any).lists?.owner
    const recipients = new Set<string>()
    if (it.assignee && setByUser[it.assignee]) recipients.add(it.assignee)
    if (owner && setByUser[owner]) recipients.add(owner)
    let sent = false
    for (const uid of recipients) {
      const st = setByUser[uid]
      if (inQuiet(hour, st.quiet_start, st.quiet_end)) continue
      const subs = subsByUser[uid]
      if (!subs?.length) continue
      await sendTo(subs, { title: '⏰ Áminning', body: `${it.name}${it.time ? ' — kl. ' + it.time : ''}`, tag: 'task-' + it.id, url: '/' })
      sent = true
    }
    if (sent) { await db.from('list_items').update({ last_reminded_at: now.toISOString() }).eq('id', it.id); sentLog.push('task:' + it.id) }
  }

  // ---- 2. „Verk dagsins" (dagleg, valkvætt) ----
  for (const st of settings) {
    if (!st.daily_tasks || st.daily_tasks_hour !== hour || !firstRunOfHour) continue
    if (inQuiet(hour, st.quiet_start, st.quiet_end)) continue
    const subs = subsByUser[st.user_id]
    if (!subs?.length) continue
    // Telja verk sem bíða í dag: eigin listar, schedule í dag eða task, ekki hakað
    const { data: mine } = await db
      .from('list_items')
      .select('id,checked,weekday,lists!inner(owner,type)')
      .eq('lists.owner', st.user_id)
      .eq('checked', false)
    const pending = (mine || []).filter((i: any) => {
      const t = i.lists?.type
      if (t === 'schedule') return i.weekday === todayKey || i.weekday === 'daily'
      return t === 'task'
    }).length
    if (pending > 0) {
      await sendTo(subs, { title: '📋 Verk dagsins', body: `Þú átt ${pending} ${pending === 1 ? 'verk' : 'verk'} sem bíða í dag.`, tag: 'daily', url: '/' })
      sentLog.push('daily:' + st.user_id)
    }
  }

  // ---- 3. Vikulegt uppgjör (sunnudag kl. 19, valkvætt) ----
  if (todayKey === 'sun' && hour === 19 && firstRunOfHour) {
    const weekStart = new Date(now); weekStart.setUTCDate(now.getUTCDate() - 6); weekStart.setUTCHours(0, 0, 0, 0)
    for (const st of settings) {
      if (!st.weekly_summary) continue
      if (inQuiet(hour, st.quiet_start, st.quiet_end)) continue
      const subs = subsByUser[st.user_id]
      if (!subs?.length) continue
      const { data: comps } = await db
        .from('completions')
        .select('points,lists!inner(owner)')
        .eq('lists.owner', st.user_id)
        .gte('completed_at', weekStart.toISOString())
      const n = (comps || []).length
      const pts = (comps || []).reduce((a: number, c: any) => a + (c.points || 0), 0)
      if (n > 0) {
        await sendTo(subs, { title: '🏆 Vikan í tölum', body: `${n} verk kláruð og ${pts} stig í vikunni. Flott vika!`, tag: 'weekly', url: '/' })
        sentLog.push('weekly:' + st.user_id)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: sentLog.length, items: sentLog }), { headers: { 'Content-Type': 'application/json' } })
})
