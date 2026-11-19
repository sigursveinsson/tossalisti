import React from 'react'
import AdBanner from './AdBanner.jsx'
import RestockCard from './RestockCard.jsx'
import { receiptAlerts } from './ReceiptsView.jsx'
import { walletAlerts } from './WalletView.jsx'
import { IconShoppingBag, IconArrowBackUp, IconCalendar, IconChecklist, IconChevronRight, IconDeviceMobile, IconGift, IconReceipt, IconShieldCheck, IconShoppingCart, IconUsers, IconWallet, IconMicrophone, IconPlus, IconChartBar } from '@tabler/icons-react'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const todayKey = () => DAY_KEYS[(new Date().getDay() + 6) % 7]
const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'
const MONTHS = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember']

// Hönnunarkerfi: engir regnbogalitir — allir avatarar í sama hlutlausa tóni.
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

export default function HomeView({ name, summary, lists = [], purchases = [], onOpenList, onOpenSpending, canInstall, onInstall, onOpenReminders, adsEnabled, bannerEnabled, hasSharedList = true, onInvite, cashback = 0, onOpenRewards, onOpenGriptu, onOpenRestock, rewardsEnabled = false, inPilot = true, onScanReceipt, onOpenReceipts, onCreateList, onDemoReceipt, wallet = [], onOpenWallet, staples = null, onOpenMyList, onAddStaples, onNewList, onVoice, voiceListName = '' }) {
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
  // Fyrsta heimsókn: enginn listi með vörum enn → stór „Búa til lista“ efst.
  const firstTime = !lists.some(l => (l.items || []).length > 0)

  const groups = groupFeed(s.feed)
  const alerts = receiptAlerts(purchases)
  const wSoon = walletAlerts(wallet)
  const wActive = wallet.filter(w => !w.used_at)
  const wTotal = wActive.reduce((s, w) => s + (w.balance != null ? Number(w.balance) : Number(w.amount || 0)), 0)
  const krr = (n) => Math.round(n).toLocaleString('is-IS').replace(/,/g, '.') + ' kr'

  const typeIcon = (t) => { const I = t === 'schedule' ? IconCalendar : t === 'task' ? IconChecklist : IconShoppingCart; return <I size={20} stroke={1.75} /> }
  const Go = () => <span className="home-row-go"><IconChevronRight size={18} stroke={1.75} /></span>

  return (
    <div className="home">
      <div className="home-hi">
        <div className="home-greet">Góðan dag{name ? ', ' + name : ''}</div>
        <div className="home-ach">
          {s.week_done > 0
            ? <>Þú hefur klárað <b>{s.week_done}</b> {s.week_done === 1 ? 'verk' : 'verk'} í vikunni{s.week_points > 0 ? ` — ${s.week_points} stig` : ''}</>
            : (firstTime && purchases.length === 0) ? <>Byrjaðu á einu: búðu til lista eða skannaðu kvittun.</> : <>Nýr dagur — kláraðu fyrsta verkið þitt og safnaðu stigum.</>}
        </div>
      </div>

      <div className="home-quick">
        {onScanReceipt && <button onClick={() => onScanReceipt()}><span className="hq-ic"><IconReceipt size={24} stroke={1.75} /></span><b>Skanna kvittun</b></button>}
        {onVoice && <button onClick={() => onVoice()}><span className="hq-ic"><IconMicrophone size={24} stroke={1.75} /></span><b>Tala inn á lista</b>{voiceListName ? <small>{voiceListName}</small> : null}</button>}
        {firstTime && onCreateList
          ? <button onClick={() => onCreateList()}><span className="hq-ic"><IconShoppingCart size={24} stroke={1.75} /></span><b>Búa til lista</b></button>
          : onNewList && <button onClick={() => onNewList()}><span className="hq-ic"><IconPlus size={24} stroke={1.75} /></span><b>Nýr listi</b></button>}
        <button onClick={() => onOpenSpending && onOpenSpending()}><span className="hq-ic"><IconChartBar size={24} stroke={1.75} /></span><b>Bókhaldið</b><small>{kr(monthSpend)} í {MONTHS[new Date().getMonth()].slice(0, 3)}.</small></button>
      </div>

      {waiting.length > 0 && (
        <div className="home-sec">
          <div className="home-sec-h">Listarnir þínir</div>
          {waiting.map(({ l, n }) => (
            <button className="home-row" key={l.id} onClick={() => onOpenList(l.id)}>
              <span className="home-row-ic">{typeIcon(l.type)}</span>
              <span className="home-row-name">{l.name}</span>
              <span className="home-row-sub">{n} {l.type === 'shopping' ? (n === 1 ? 'vara eftir' : 'vörur eftir') : 'verk'}{l.type === 'schedule' ? ' í dag' : ''}</span>
              <Go />
            </button>
          ))}
        </div>
      )}

      {/* Boðskóðaborði sýndur engum: þátttakendur eru skráðir inn með netfangi (pilot_emails). */}
      {onOpenRewards && rewardsEnabled && (cashback > 0 || inPilot) && (
        <button className={'home-cashback' + (cashback > 0 ? '' : ' promo')} onClick={() => onOpenRewards()}>
          <span className="home-cashback-ic"><IconGift size={22} stroke={1.75} /></span>
          {cashback > 0
            ? <span className="home-cashback-txt"><small>Gríptu stigin þín</small><b>{Math.round(cashback).toLocaleString('is-IS')} stig</b></span>
            : inPilot
              ? <span className="home-cashback-txt"><small>Nýtt: Gríptu stig</small><b>Safnaðu stigum af innkaupum</b></span>
              : <span className="home-cashback-txt"><small>Gríptu stig · lokuð prufa</small><b>Ertu með boðskóða?</b></span>}
          <Go />
        </button>
      )}

      {onOpenRestock && <RestockCard compact onOpen={onOpenRestock} refreshKey={purchases.length + ':' + lists.length} />}

      {onOpenGriptu && (
        <button className="home-invite home-griptu" onClick={() => onOpenGriptu()}>
          <span className="home-invite-ic"><IconGift size={22} stroke={1.75} /></span>
          <span className="home-invite-txt">
            <b>Gríptu vörur og herferðir</b>
            <small>Sjáðu hvaða vörur gefa stig núna og settu þær á innkaupalistann</small>
          </span>
          <Go />
        </button>
      )}

      {onOpenReceipts && alerts.length > 0 && (
        <button className="home-invite home-alert" onClick={() => onOpenReceipts()}>
          <span className="home-invite-ic">{alerts[0].kind === 'return' ? <IconArrowBackUp size={22} stroke={1.75} /> : <IconShieldCheck size={22} stroke={1.75} />}</span>
          <span className="home-invite-txt">
            <b>{alerts[0].kind === 'return' ? `Skilafrestur: ${alerts[0].label}` : `Ábyrgð: ${alerts[0].label}`}</b>
            <small>Rennur út {alerts[0].days === 0 ? 'í dag' : `eftir ${alerts[0].days} ${alerts[0].days === 1 ? 'dag' : 'daga'}`}{alerts.length > 1 ? ` · ${alerts.length - 1} í viðbót` : ''}</small>
          </span>
          <Go />
        </button>
      )}

      {onOpenMyList && staples && (staples.items?.length > 0 || purchases.length > 0) && (() => {
        const items = staples.items || []
        const due = items.filter(i => i.due)
        const names = due.slice(0, 3).map(i => i.name)
        return (
          <div className={'home-invite home-mylist' + (due.length ? ' home-alert' : '')} role="button" tabIndex={0} onClick={() => onOpenMyList()}>
            <span className="home-invite-ic"><IconShoppingBag size={22} stroke={1.75} /></span>
            <span className="home-invite-txt">
              {due.length
                ? <><b>Oft keypt · {due.length} {due.length === 1 ? 'vantar' : 'vantar'} líklega</b><small>{names.join(', ')}{due.length > 3 ? ` og ${due.length - 3} fleiri` : ''}</small></>
                : items.length
                  ? <><b>Oft keypt · {items.length} vörur</b><small>Það sem þú kaupir oft, lært af kvittunum</small></>
                  : <><b>Oft keypt</b><small>Fyllist sjálfur eftir 2–3 kvittanir</small></>}
            </span>
            {due.length > 0 && onAddStaples
              ? <button className="home-mylist-add" onClick={(e) => { e.stopPropagation(); onAddStaples(due.map(i => i.name)) }}>Á listann</button>
              : <Go />}
          </div>
        )
      })()}
      {onOpenWallet && (!(firstTime && purchases.length === 0) || wActive.length > 0) && (
        <button className={'home-invite' + (wSoon.length ? ' home-alert' : ' home-wallet')} onClick={() => onOpenWallet()}>
          <span className="home-invite-ic"><IconWallet size={22} stroke={1.75} /></span>
          <span className="home-invite-txt">
            {wSoon.length
              ? <><b>{wSoon[0].store || 'Gjafakort'} rennur út eftir {Math.max(0, Math.round((new Date(wSoon[0].expires_on + 'T00:00:00Z') - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 86400000))} daga</b><small>{wSoon.length > 1 ? `${wSoon.length - 1} í viðbót renna út fljótlega · ` : ''}Opnaðu Veskið</small></>
              : wActive.length
                ? <><b>Veskið · {krr(wTotal)}</b><small>á {wActive.length} {wActive.length === 1 ? 'korti' : 'kortum'} — gjafakort, inneignarnótur og kóðar</small></>
                : <><b>Nýtt: Veskið</b><small>Geymdu gjafakort og inneignarnótur — við minnum þig áður en þau renna út</small></>}
          </span>
          <Go />
        </button>
      )}

      {onScanReceipt && onDemoReceipt && purchases.length === 0 && (
        <button className="home-demo-link" onClick={() => onDemoReceipt()}>
          Engin kvittun við höndina? <b>Sjáðu dæmi</b>
        </button>
      )}

      {!hasSharedList && onInvite && !(firstTime && purchases.length === 0) && (
        <button className="home-invite" onClick={() => onInvite()}>
          <span className="home-invite-ic"><IconUsers size={22} stroke={1.75} /></span>
          <span className="home-invite-txt"><b>Bjóddu heimilisfólki á listann</b><small>Tossalisti er bestur þegar fjölskyldan deilir — sjáið innkaup og verk uppfærast í rauntíma</small></span>
          <Go />
        </button>
      )}

      {canInstall && (
        <button className="home-install" onClick={() => onInstall && onInstall()}>
          <span className="home-install-ic"><IconDeviceMobile size={22} stroke={1.75} /></span>
          <span className="home-install-txt"><b>Settu Tossalista á heimaskjáinn</b><small>Opnast eins og app — og þú getur fengið áminningar</small></span>
          <Go />
        </button>
      )}

      {groups.length > 0 && (
        <div className="home-sec">
          <div className="home-sec-h">Hjá fjölskyldunni</div>
          {groups.map((g, i) => (
            <div className="home-feed" key={i}>
              <span className="home-feed-ava">{initials(g.actor)}</span>
              <div className="home-feed-txt">
                <span><b>{g.actor}</b> {feedText(g)}</span>
                <span className="home-feed-time">{since(g.at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {bannerEnabled && <AdBanner />}
    </div>
  )
}
