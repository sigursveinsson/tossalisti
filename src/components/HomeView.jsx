import React from 'react'
import AdBanner from './AdBanner.jsx'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const todayKey = () => DAY_KEYS[(new Date().getDay() + 6) % 7]
const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'
const MONTHS = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember']

const COLORS = ['#e8615a', '#e8954a', '#5a9e5a', '#4aa6c8', '#4a6fd0', '#9a5ad0', '#d05a9a']
const colorFor = (s) => COLORS[[...(s || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]
const initials = (s) => (s || '?').trim().slice(0, 2).toUpperCase()

function since(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'rétt í þessu'
  if (mins < 60) return 'fyrir ' + mins + ' mín'
  const h = Math.round(mins / 60)
  if (h < 24) return 'fyrir ' + h + ' klst'
  const d = Math.round(h / 24)
  return d === 1 ? 'í gær' : 'fyrir ' + d + ' d'
}

// Þjappar feed-i: sömu klárun (sami leikari+verk) → telja; nýjar vörur (sami leikari+listi) → telja saman.
function groupFeed(feed = []) {
  const groups = []
  const idx = {}
  for (const e of feed) {
    const key = e.type === 'added' ? `added|${e.actor}|${e.list}` : `done|${e.actor}|${e.item}|${e.list}`
    if (idx[key] == null) { idx[key] = groups.length; groups.push({ ...e, n: 1 }) }
    else { groups[idx[key]].n += 1 }
  }
  return groups.slice(0, 8)
}

function feedText(g) {
  if (g.type === 'added') return `bætti við ${g.n} ${g.n === 1 ? 'atriði' : 'atriðum'} á „${g.list}“`
  return `kláraði „${g.item || 'verk'}“${g.n > 1 ? ` (${g.n}×)` : ''}`
}

export default function HomeView({ name, summary, lists = [], purchases = [], onOpenList, onOpenSpending, canInstall, onInstall, onOpenReminders }) {
  const s = summary || { week_points: 0, week_done: 0, feed: [] }
  const tk = todayKey()

  const pending = (l) => l.type === 'schedule'
    ? l.items.filter(i => (i.weekday === tk || (i.weekday || 'daily') === 'daily') && !i.checked).length
    : l.items.filter(i => !i.checked).length
  const waiting = lists
    .map(l => ({ l, n: pending(l) }))
    .filter(x => x.n > 0)
    .slice(0, 4)

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const monthSpend = purchases
    .filter(p => p.purchased_at && new Date(p.purchased_at) >= monthStart)
    .reduce((a, p) => a + (Number(p.total) || 0), 0)
  const hasShopping = lists.some(l => l.type === 'shopping')

  const groups = groupFeed(s.feed)

  const typeIcon = (t) => t === 'schedule' ? '📅' : t === 'task' ? '✅' : '🛒'

  return (
    <div className="home">
      <div className="home-hi">
        <div className="home-greet">Góðan dag{name ? ', ' + name : ''}</div>
        <div className="home-ach">
          {s.week_done > 0
            ? <>🔥 Þú hefur klárað <b>{s.week_done}</b> {s.week_done === 1 ? 'verk' : 'verk'} í vikunni{s.week_points > 0 ? ` — ${s.week_points} stig` : ''}</>
            : <>👋 Nýr dagur — kláraðu fyrsta verkið þitt og safnaðu stigum.</>}
        </div>
      </div>

      {canInstall && (
        <button className="home-install" onClick={() => onInstall && onInstall()}>
          <span className="home-install-ic">📲</span>
          <span className="home-install-txt"><b>Settu Tossalista á heimaskjáinn</b><small>Opnast eins og app — og þú getur fengið áminningar</small></span>
          <span className="home-row-go">›</span>
        </button>
      )}

      {waiting.length > 0 && (
        <div className="home-sec">
          <div className="home-sec-h">Bíður þín</div>
          {waiting.map(({ l, n }) => (
            <button className="home-row" key={l.id} onClick={() => onOpenList(l.id)}>
              <span className="home-row-ic">{typeIcon(l.type)}</span>
              <span className="home-row-name">{l.name}</span>
              <span className="home-row-sub">{n} {l.type === 'shopping' ? (n === 1 ? 'vara eftir' : 'vörur eftir') : (n === 1 ? 'verk' : 'verk')}{l.type === 'schedule' ? ' í dag' : ''}</span>
              <span className="home-row-go">›</span>
            </button>
          ))}
        </div>
      )}

      {hasShopping && (
        <button className="home-spend" onClick={() => onOpenSpending && onOpenSpending()}>
          <div>
            <div className="home-spend-label">Útgjöld í {MONTHS[new Date().getMonth()]}</div>
            <div className="home-spend-val">{kr(monthSpend)}</div>
          </div>
          <span className="home-row-go">›</span>
        </button>
      )}

      {groups.length > 0 && (
        <div className="home-sec">
          <div className="home-sec-h">Hjá fjölskyldunni</div>
          {groups.map((g, i) => (
            <div className="home-feed" key={i}>
              <span className="home-feed-ava" style={{ background: colorFor(g.actor) }}>{initials(g.actor)}</span>
              <div className="home-feed-txt">
                <span><b>{g.actor}</b> {feedText(g)}</span>
                <span className="home-feed-time">{since(g.at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdBanner />
    </div>
  )
}
