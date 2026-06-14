import React, { useState, useRef, useEffect } from 'react'
import { DEPARTMENTS, DEPT_ORDER } from '../data/departments.js'
import { suggest } from '../data/products.js'
import { CATEGORY_SPONSORS, sponsoredSuggest } from '../data/sponsors.js'
import { RECURRENCE_LABELS, TIME_OPTIONS, EMOJI_CHOICES } from '../data/chores.js'
import { CatIcon } from '../data/icons.jsx'
import { resizeImageFile, isEmojiImage, emojiOf, makeEmojiImage } from '../lib/img.js'
import ScheduleForm from './ScheduleForm.jsx'
import KidsManager from './KidsManager.jsx'
import GamePanel from './GamePanel.jsx'
import KidProfile from './KidProfile.jsx'
import RewardsManager from './RewardsManager.jsx'
import GameGuide from './GameGuide.jsx'
import BarcodeScanner from './BarcodeScanner.jsx'
import AdBanner from './AdBanner.jsx'
import ShelfView from './ShelfView.jsx'
import ShoppingMode from './ShoppingMode.jsx'
import { lookupBarcode } from '../lib/barcode.js'
import { useBackClose } from '../lib/backstack.js'

const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || '?'
const initialsOf = (m) => displayName(m).slice(0, 2).toUpperCase()
const POINTS_OPTIONS = [5, 10, 20, 30, 50]
const WEEKDAYS = [
  ['daily', 'Daglega'], ['mon', 'Mánudagur'], ['tue', 'Þriðjudagur'], ['wed', 'Miðvikudagur'],
  ['thu', 'Fimmtudagur'], ['fri', 'Föstudagur'], ['sat', 'Laugardagur'], ['sun', 'Sunnudagur'],
]
const WEEKDAY_LABEL = Object.fromEntries(WEEKDAYS)
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const todayKey = () => DAY_KEYS[(new Date().getDay() + 6) % 7]

function weekStartMs() {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(now.getDate() - day)
  return d.getTime()
}

function dueTag(it) {
  if (!it.due_at) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(it.due_at + 'T00:00:00')
  const diff = Math.round((due - today) / 86400000)
  let label, overdue = false
  if (diff < 0) { label = 'Yfir tími'; overdue = true }
  else if (diff === 0) label = 'Í dag'
  else if (diff === 1) label = 'Á morgun'
  else label = due.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })
  return <span className={'due-tag' + (overdue ? ' overdue' : '')}>📅 {label}</span>
}

export default function ListView({ items, listType = 'shopping', members = [], kids = [], completions = [], rewards = [], redemptions = [], currentUserId, catalog = {}, onCatalog, onCatalogLookup, onSetQty, onAdd, onToggle, onRemove, onAssign, onSetPoints, onSetRecurrence, onSetItemImage, onCreateKid, onUpdateKid, onDeleteKid, onCreateReward, onUpdateReward, onDeleteReward, onRedeemReward, onDeleteRedemption, onAddSchedule, onNewWeek, onRecategorize, onSetDue, onSetWeekday, onSetTime, listId }) {
  const isTask = listType === 'task'
  const isSchedule = listType === 'schedule'
  const [text, setText] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [showSchedForm, setShowSchedForm] = useState(false)
  const [viewDay, setViewDay] = useState(todayKey())
  const [assigning, setAssigning] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deptItem, setDeptItem] = useState(null)
  const [kidsOpen, setKidsOpen] = useState(false)
  const [profilePerson, setProfilePerson] = useState(null)
  const [rewardsOpen, setRewardsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [schedView, setSchedView] = useState(() => { try { return localStorage.getItem('korfan.schedview') || 'week' } catch { return 'week' } })
  const setSchedViewP = (v) => { setSchedView(v); try { localStorage.setItem('korfan.schedview', v) } catch (e) {} }
  const [showImages, setShowImages] = useState(() => { try { return localStorage.getItem('korfan.hideImages') !== '1' } catch { return true } })
  const toggleImages = () => setShowImages(v => { const nv = !v; try { localStorage.setItem('korfan.hideImages', nv ? '0' : '1') } catch (e) {} return nv })
  const [lbWindow, setLbWindow] = useState('week')
  const [scanning, setScanning] = useState(false)
  const [scanFeed, setScanFeed] = useState([])
  const scanLock = useRef({})
  const [linkScan, setLinkScan] = useState(null)
  const sugg = (isTask || isSchedule) ? [] : suggest(text)
  const isShopping = !isTask && !isSchedule
  const sponSugg = (isTask || isSchedule) ? [] : sponsoredSuggest(text)
  const catSugg = (isShopping && text.trim().length >= 2)
    ? Object.keys(catalog).filter(n => n.includes(text.toLowerCase().trim()) && !sugg.includes(n)).slice(0, 5)
    : []
  const closeScan = () => { setScanning(false); setScanFeed([]); scanLock.current = {} }
  useBackClose(scanning, closeScan)

  const [shelf, setShelf] = useState(false)
  const [shopMode, setShopMode] = useState(false)
  const commitShelf = async (picks) => {
    for (const p of picks) { await onAdd(p.name, undefined, undefined, undefined, p.image) }
  }

  const canManageKids = typeof onCreateKid === 'function'
  // Sýna foreldra-leiðbeiningar sjálfkrafa í fyrsta sinn á verk-/skemalista.
  useEffect(() => {
    if (!canManageKids || !(isTask || isSchedule)) return
    try { if (localStorage.getItem('korfan.gameguide.seen') === '1') return } catch (e) { return }
    setGuideOpen(true)
    try { localStorage.setItem('korfan.gameguide.seen', '1') } catch (e) {}
  }, [])
  const canAssign = members.length > 1 && typeof onAssign === 'function'
  const personById = (id) => members.find(p => p.id === id) || null
  const assignedPerson = (it) => it.assignee_kid ? personById(it.assignee_kid) : (it.assignee ? personById(it.assignee) : null)
  // Hringlaga mynd/upphafsstafir fyrir einstakling (krakka eða notanda)
  const personChip = (p, opts = {}) => {
    const cls = 'assign-chip' + (p && p.avatar_url ? ' has-avatar' : '')
    const style = { ...(opts.static ? { pointerEvents: 'none' } : {}), background: (p && p.color) || undefined }
    if (p && p.avatar_url) return <span className={cls} style={style}><img src={p.avatar_url} alt="" /></span>
    return <span className={cls} style={style}>{initialsOf(p)}</span>
  }

  const add = (name, image) => {
    const v = (name ?? text).trim()
    if (!v) return
    if (!isTask && qty.trim()) onAdd(`${v} ${qty.trim()}${unit.trim() ? ' ' + unit.trim() : ''}`, undefined, undefined, undefined, image)
    else onAdd(v, undefined, undefined, undefined, image)
    setText(''); setQty('')
  }

  const onScan = async (code) => {
    const now = Date.now()
    if (scanLock.current[code] && now - scanLock.current[code] < 4000) return
    scanLock.current[code] = now
    setScanFeed(f => [{ id: now, txt: 'Leita…', kind: 'wait' }, ...f].slice(0, 6))
    const res = (onCatalogLookup && await onCatalogLookup(code)) || await lookupBarcode(code)
    setScanFeed(f => f.filter(x => x.id !== now))
    if (!res || !res.name) {
      setScanFeed(f => [{ id: now, txt: `Óþekkt vara (${code})`, kind: 'miss' }, ...f].slice(0, 6))
      setLinkScan(code)
      return
    }
    const { name, image, dept } = res
    if (onCatalog) onCatalog({ barcode: code, name, image, dept })
    if (items.some(i => i.name === name.toLowerCase().trim())) {
      setScanFeed(f => [{ id: now, txt: `${name} — þegar á lista`, kind: 'dup', img: image }, ...f].slice(0, 6))
      return
    }
    onAdd(name, undefined, undefined, undefined, image, dept)
    setScanFeed(f => [{ id: now, txt: name, kind: 'ok', img: image }, ...f].slice(0, 6))
  }

  const doLink = (it) => {
    if (onCatalog && linkScan) onCatalog({ barcode: linkScan, name: it.name })
    setScanFeed(f => [{ id: Date.now(), txt: `Tengt við ${it.name}`, kind: 'ok' }, ...f].slice(0, 6))
    setLinkScan(null)
  }

  // #50: skanna meðan þú verslar — gefur skilaboð sem ShoppingMode birtir
  const scanInStore = async (code) => {
    const res = (onCatalogLookup && await onCatalogLookup(code)) || await lookupBarcode(code)
    if (!res || !res.name) return { kind: 'miss', txt: 'Óþekkt vara' }
    const { name, image, dept } = res
    if (onCatalog) onCatalog({ barcode: code, name, image, dept })
    const nn = name.toLowerCase().trim()
    const existing = items.find(i => i.name === nn)
    if (existing) {
      if (!existing.checked) await onToggle(existing, false)
      return { kind: 'ok', txt: name + ' ✓ í körfu', img: image }
    }
    await onAdd(name, undefined, undefined, undefined, image, dept)
    return { kind: 'add', txt: name + ' — bætt á lista', img: image }
  }

  const scanner = scanning && (
    <BarcodeScanner onDetect={onScan} onClose={closeScan}>
      {linkScan && (
        <div className="scan-link">
          <div className="scan-link-head">Óþekkt vara — tengdu hana við vöru á listanum:</div>
          <div className="scan-link-items">
            {items.filter(i => !i.checked).length === 0 && <div className="scan-link-empty">Engin vara á listanum til að tengja við.</div>}
            {items.filter(i => !i.checked).map(it => (
              <button key={it.id} onClick={() => doLink(it)}>{it.name}</button>
            ))}
          </div>
          <button className="scan-link-skip" onClick={() => setLinkScan(null)}>Sleppa</button>
        </div>
      )}
      {scanFeed.length > 0 && (
        <div className="scan-feed">
          {scanFeed.map(f => (
            <div key={f.id} className={'scan-feed-row ' + f.kind}>
              <span>{f.kind === 'ok' ? '✓' : f.kind === 'wait' ? '…' : f.kind === 'dup' ? '•' : '✕'}</span>
              {f.img && <img className="scan-feed-img" src={f.img} alt="" />}
              {f.txt}
            </div>
          ))}
        </div>
      )}
      <button className="scan-done" onClick={closeScan}>Búinn</button>
    </BarcodeScanner>
  )

  const inPeriod = (iso, rec) => {
    const d = new Date(iso)
    if (rec === 'daily') { const t = new Date(); return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate() }
    return d.getTime() >= weekStartMs()
  }
  // Í vikuskema er hvert verk sjálfstæð lína → haka er bundin línunni (it.checked).
  // Annars (verkalisti með endurtekningu) telst verk búið ef afrek er á tímabilinu.
  const isDone = (it) => (!isSchedule && it.recurrence && it.recurrence !== 'none')
    ? completions.some(c => c.item_id === it.id && inPeriod(c.completed_at, it.recurrence))
    : it.checked

  const open = items.filter(i => !isDone(i)).length

  const assignBtn = (it) => {
    if (!canAssign) return null
    const p = assignedPerson(it)
    return p
      ? <button className="assign-chip-btn" onClick={() => setAssigning(it)} title={displayName(p)}>{personChip(p, { static: true })}</button>
      : <button className="assign-add" onClick={() => setAssigning(it)} aria-label="Úthluta">＋</button>
  }

  const itemRow = (it, color, chore) => {
    const done = isDone(it)
    return (
      <div className={'item' + (done ? ' done' : '')} key={it.id}>
        <div className="check" style={{ background: done ? color : 'transparent', borderColor: done ? color : undefined }} onClick={() => onToggle(it, done)}>{done ? '✓' : ''}</div>
        {(() => {
          if (!chore && !showImages) return null
          const img = it.image_url || (!chore ? catalog[it.name] : null)
          if (img) {
            if (isEmojiImage(img)) return <span className={'item-emoji' + (chore ? ' chore' : '')} onClick={() => onToggle(it, done)}>{emojiOf(img)}</span>
            return <img className={'item-img' + (chore ? ' chore' : '')} src={img} alt="" loading="lazy" onClick={() => onToggle(it, done)} />
          }
          // Engin alvöru mynd → samræmt flokkaíkon (aðeins innkaup)
          if (!chore) return <CatIcon dept={it.dept} size={52} className="item-cat" onClick={() => onToggle(it, done)} />
          return null
        })()}
        <span className="label" onClick={() => onToggle(it, done)}>
          {chore && it.time && <span className="time-tag">{it.time}</span>}
          {it.name}
          {chore && !isSchedule && it.recurrence && it.recurrence !== 'none' && <span className="rec-tag">🔁 {RECURRENCE_LABELS[it.recurrence]}</span>}
          {isSchedule && it.weekday === 'daily' && <span className="rec-tag">🔁 daglega</span>}
          {dueTag(it)}
        </span>
        {!chore && onSetQty && (
          <span className="qty-step" onClick={e => e.stopPropagation()}>
            <button onClick={() => onSetQty(it, (it.qty ?? 1) - 1)} disabled={(it.qty ?? 1) <= 1} aria-label="Fækka">−</button>
            <span className="qty-n">{it.qty ?? 1}</span>
            <button onClick={() => onSetQty(it, (it.qty ?? 1) + 1)} aria-label="Fjölga">+</button>
          </span>
        )}
        {chore && <button className="points-badge" onClick={() => setEditItem(it)}>{it.points ?? 10} stig</button>}
        {!chore && it.dept === 'other' && onRecategorize && <button className="recat-btn" onClick={() => setDeptItem(it)} title="Flokka vöru">🏷️</button>}
        {assignBtn(it)}
        <button className="del" onClick={() => onRemove(it)} aria-label="Eyða">×</button>
      </div>
    )
  }

  const addBar = (
    <div className="addbar">
      <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={(isTask || isSchedule) ? 'Bættu við verki…' : 'Bættu við vöru…'} autoComplete="off" />
      {!isTask && <input className="qty-in" value={qty} onChange={e => setQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="magn" inputMode="decimal" />}
      {!isTask && <input className="unit-in" value={unit} onChange={e => setUnit(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="g/stk" />}
      {isShopping && <button className="scan-btn" onClick={() => setScanning(true)} aria-label="Skanna strikamerki" title="Skanna strikamerki">📷</button>}
      <button className="add" onClick={() => add()} aria-label="Bæta við">+</button>
      {(sugg.length > 0 || sponSugg.length > 0 || catSugg.length > 0) && (
        <div className="suggest">
          {sponSugg.map(o => (
            <div key={'sp_' + o.name} className="suggest-spon" onClick={() => add(o.name, o.image)}>
              <span className="spon-mark" style={{ background: o.color }}>
                {o.image ? <img src={o.image} alt="" /> : o.name.charAt(0)}
              </span>
              <span className="spon-name">{o.name}</span>
              <span className="spon-tag">Kostað · {o.brand}</span>
            </div>
          ))}
          {catSugg.map(n => (
            <div key={'cat_' + n} className="suggest-off" onClick={() => add(n, catalog[n])}>
              {catalog[n] && <img src={catalog[n]} alt="" />}
              <span>{n}</span>
            </div>
          ))}
          {sugg.map(s => <div key={s} onClick={() => add(s)}>{s}</div>)}
        </div>
      )}
    </div>
  )

  const assignModal = assigning && (
    <div className="sheet-bg center" onClick={() => setAssigning(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Hver ber ábyrgð? <button className="x" onClick={() => setAssigning(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 10 }}>{assigning.name}</div>
        {members.map(p => (
          <button className="pick-row" key={p.kind + p.id} onClick={() => { onAssign(assigning, { kind: p.kind, id: p.id }); setAssigning(null) }}>
            <span>{displayName(p)}{p.kind === 'user' && p.id === currentUserId ? ' (þú)' : ''}</span>
            {personChip(p, { static: true })}
          </button>
        ))}
        <button className="pick-row" onClick={() => { onAssign(assigning, null); setAssigning(null) }}><span>Enginn</span></button>
        {canManageKids && <button className="pick-row add-kid-row" onClick={() => { setAssigning(null); setKidsOpen(true) }}><span>＋ Stofna krakka</span></button>}
      </div>
    </div>
  )

  const settingsModal = editItem && (
    <div className="sheet-bg center" onClick={() => setEditItem(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Verk-stillingar <button className="x" onClick={() => setEditItem(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 12 }}>{editItem.name}</div>

        <div className="modal-label">Stig</div>
        <div className="points-options">
          {POINTS_OPTIONS.map(p => (
            <button key={p} className={'points-opt' + ((editItem.points ?? 10) === p ? ' on' : '')} onClick={() => { onSetPoints(editItem, p); setEditItem({ ...editItem, points: p }) }}>{p}</button>
          ))}
        </div>

        {onSetItemImage && (
          <>
            <div className="modal-label">Mynd eða tákn <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(fyrir þá sem ekki lesa)</span></div>
            <div className="emoji-grid">
              {EMOJI_CHOICES.map(e => (
                <button key={e} className={'emoji-opt' + (emojiOf(editItem.image_url) === e ? ' on' : '')} onClick={() => { const v = makeEmojiImage(e); onSetItemImage(editItem, v); setEditItem({ ...editItem, image_url: v }) }}>{e}</button>
              ))}
            </div>
            <div className="emoji-actions">
              <label className="emoji-photo-btn">📷 Taka mynd
                <input type="file" accept="image/*" capture="environment" hidden onChange={async ev => {
                  const f = ev.target.files && ev.target.files[0]; if (!f) return
                  try { const url = await resizeImageFile(f, 256); onSetItemImage(editItem, url); setEditItem({ ...editItem, image_url: url }) } catch (err) {}
                }} />
              </label>
              {editItem.image_url && <button className="emoji-clear" onClick={() => { onSetItemImage(editItem, null); setEditItem({ ...editItem, image_url: null }) }}>Fjarlægja</button>}
            </div>
          </>
        )}

        {isSchedule ? (
          <>
            <div className="modal-label">Dagur</div>
            <select className="list-select" value={editItem.weekday || 'daily'} onChange={e => { onSetWeekday(editItem, e.target.value); setEditItem({ ...editItem, weekday: e.target.value }) }}>
              {WEEKDAYS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <div className="modal-label">Tími</div>
            <select className="list-select" value={editItem.time || ''} onChange={e => { onSetTime(editItem, e.target.value); setEditItem({ ...editItem, time: e.target.value }) }}>
              <option value="">— enginn tími —</option>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </>
        ) : (
          <>
            <div className="modal-label">Endurtekning</div>
            <div className="rec-options">
              {Object.keys(RECURRENCE_LABELS).map(k => (
                <button key={k} className={'rec-opt' + ((editItem.recurrence || 'none') === k ? ' on' : '')} onClick={() => { onSetRecurrence(editItem, k); setEditItem({ ...editItem, recurrence: k }) }}>{RECURRENCE_LABELS[k]}</button>
              ))}
            </div>
            <div className="modal-label">Lokadagur</div>
            <input className="dialog-input" type="date" value={editItem.due_at || ''} onChange={e => { onSetDue(editItem, e.target.value); setEditItem({ ...editItem, due_at: e.target.value }) }} />
          </>
        )}

        <button className="add-recipe-btn" style={{ marginTop: 4 }} onClick={() => setEditItem(null)}>Loka</button>
      </div>
    </div>
  )

  const deptModal = deptItem && (
    <div className="sheet-bg center" onClick={() => setDeptItem(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Flokka vöru <button className="x" onClick={() => setDeptItem(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 10 }}>{deptItem.name}</div>
        {DEPARTMENTS.filter(d => d.key !== 'other').map(d => (
          <button className="pick-row" key={d.key} onClick={() => { onRecategorize(deptItem, d.key); setDeptItem(null) }}>
            <span>{d.icon} {d.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const kidsBtn = canManageKids ? (
    <span className="top-btns">
      <button className="kids-btn" onClick={() => setKidsOpen(true)}>🧒 Krakkar</button>
      <button className="help-btn" onClick={() => setGuideOpen(true)} aria-label="Leiðbeiningar" title="Leiðbeiningar">?</button>
    </span>
  ) : null

  const gamePanel = members.length > 0 && (
    <GamePanel
      listId={listId}
      people={members}
      completions={completions}
      rewards={rewards}
      redemptions={redemptions}
      currentUserId={currentUserId}
      onOpenProfile={setProfilePerson}
      onManageRewards={canManageKids ? () => setRewardsOpen(true) : null}
    />
  )

  const kidsModal = kidsOpen && (
    <KidsManager
      kids={kids}
      onCreate={onCreateKid}
      onUpdate={onUpdateKid}
      onDelete={onDeleteKid}
      onClose={() => setKidsOpen(false)}
    />
  )

  const profileModal = profilePerson && (
    <KidProfile
      person={profilePerson}
      completions={completions}
      rewards={rewards}
      redemptions={redemptions}
      canRedeem={true}
      onRedeem={(r, p) => { if (onRedeemReward) onRedeemReward(r, p) }}
      onDeleteRedemption={canManageKids ? onDeleteRedemption : null}
      onClose={() => setProfilePerson(null)}
    />
  )

  const rewardsModal = rewardsOpen && (
    <RewardsManager
      rewards={rewards}
      onCreate={onCreateReward}
      onUpdate={onUpdateReward}
      onDelete={onDeleteReward}
      onClose={() => setRewardsOpen(false)}
    />
  )

  const guideModal = guideOpen && <GameGuide onClose={() => setGuideOpen(false)} />

  if (isSchedule) {
    const idx = DAY_KEYS.indexOf(viewDay)
    const go = (delta) => setViewDay(DAY_KEYS[(idx + delta + 7) % 7])
    const dayBucket = (wd) => items.filter(i => i.weekday === wd || (i.weekday || 'daily') === 'daily')
    const sortDay = (arr) => [...arr].sort((a, b) => {
      if (!a.time && !b.time) return a.name.localeCompare(b.name)
      if (!a.time) return 1
      if (!b.time) return -1
      return a.time.localeCompare(b.time)
    })

    const header = (
      <>
        <div className="sched-top">
          <button className="primary-btn" style={{ marginTop: 4 }} onClick={() => setShowSchedForm(true)}>+ Nýtt verk</button>
          {kidsBtn}
        </div>
        <div className="sched-viewtoggle">
          <button className={schedView === 'week' ? 'on' : ''} onClick={() => setSchedViewP('week')}>📅 Vika</button>
          <button className={schedView === 'day' ? 'on' : ''} onClick={() => setSchedViewP('day')}>📋 Dagur</button>
        </div>
        {gamePanel}
        {onNewWeek && items.length > 0 && (
          <button className="newweek-btn" onClick={() => { if (window.confirm('Byrja nýja viku? Öll verk verða af-hökuð — stigin og afrekin haldast.')) onNewWeek() }}>🔄 Byrja nýja viku</button>
        )}
      </>
    )

    const schedModals = (
      <>
        {assignModal}
        {settingsModal}
        {kidsModal}
        {profileModal}
        {rewardsModal}
        {guideModal}
        {showSchedForm && (
          <ScheduleForm
            members={members}
            currentUserId={currentUserId}
            defaultDay={viewDay}
            onManageKids={canManageKids ? () => { setShowSchedForm(false); setKidsOpen(true) } : null}
            onCreate={(name, days, time, assignee, image) => { onAddSchedule(name, days, time, assignee, image); setShowSchedForm(false) }}
            onClose={() => setShowSchedForm(false)}
          />
        )}
      </>
    )

    // ----- Vikuyfirlit (öll vikan í einu; lóðrétt í síma, 7 dálka grid á breiðum) -----
    if (schedView === 'week') {
      const weekTask = (it) => {
        const done = isDone(it)
        const p = assignedPerson(it)
        const img = it.image_url
        return (
          <div className={'wk-task' + (done ? ' done' : '')} key={it.id} onClick={() => onToggle(it, done)}>
            <span className="wk-check" style={{ background: done ? 'var(--accent)' : 'transparent', borderColor: done ? 'var(--accent)' : undefined }}>{done ? '✓' : ''}</span>
            {it.time && <span className="wk-time">{it.time}</span>}
            {img && (isEmojiImage(img) ? <span className="wk-emoji">{emojiOf(img)}</span> : <img className="wk-img" src={img} alt="" loading="lazy" />)}
            <span className="wk-name">{it.name}</span>
            {p && <span className="wk-chip">{personChip(p, { static: true })}</span>}
          </div>
        )
      }
      return (
        <div>
          {header}
          {items.length === 0 && <p className="empty">Engin verk enn — bættu við með „+ Nýtt verk".</p>}
          <div className="wk-week">
            {DAY_KEYS.map(wd => {
              const di = sortDay(dayBucket(wd))
              const total = di.length
              const done = di.filter(isDone).length
              const isToday = wd === todayKey()
              return (
                <div className={'wk-day' + (isToday ? ' today' : '')} key={wd}>
                  <button className="wk-day-head" onClick={() => { setViewDay(wd); setSchedViewP('day') }}>
                    <span className="wk-day-name">{WEEKDAY_LABEL[wd]}{isToday ? ' · í dag' : ''}</span>
                    {total > 0 && <span className={'wk-day-count' + (done === total ? ' all' : '')}>{done}/{total}</span>}
                    <span className="wk-day-go">›</span>
                  </button>
                  <div className="wk-day-tasks">
                    {total === 0 ? <div className="wk-empty">—</div> : di.map(weekTask)}
                  </div>
                </div>
              )
            })}
          </div>
          {schedModals}
        </div>
      )
    }

    // ----- Dagssýn (einn dagur í fókus, tímalína) -----
    const dayItems = dayBucket(viewDay)
    const timeless = dayItems.filter(i => !i.time).sort((a, b) => a.name.localeCompare(b.name))
    const timed = dayItems.filter(i => i.time)
    const hourOf = (t) => parseInt(t.slice(0, 2), 10)
    let startH = 7, endH = 21
    if (timed.length) {
      const hs = timed.map(i => hourOf(i.time))
      startH = Math.min(startH, ...hs); endH = Math.max(endH, ...hs)
    }
    const hours = []
    for (let h = startH; h <= endH; h++) hours.push(h)
    const atHour = (h) => timed.filter(i => hourOf(i.time) === h).sort((a, b) => a.time.localeCompare(b.time))
    return (
      <div>
        {header}
        <div className="day-nav">
          <button onClick={() => go(-1)} aria-label="Fyrri dagur">‹</button>
          <span className="day-nav-label">{WEEKDAY_LABEL[viewDay]}{viewDay === todayKey() ? ' · í dag' : ''}</span>
          <button onClick={() => go(1)} aria-label="Næsti dagur">›</button>
        </div>
        {dayItems.length === 0 && <p className="empty">Engin verk á þessum degi — bættu við með „+ Nýtt verk".</p>}
        {timeless.length > 0 && (
          <div className="group">
            <div className="group-head"><span className="name" style={{ color: 'var(--muted)' }}>Hvenær sem er</span></div>
            {timeless.map(it => itemRow(it, 'var(--accent)', true))}
          </div>
        )}
        {timed.length > 0 && (
          <div className="timetable">
            {hours.map(h => (
              <div className="tt-hour" key={h}>
                <div className="tt-time">{String(h).padStart(2, '0')}:00</div>
                <div className="tt-tasks">{atHour(h).map(it => itemRow(it, 'var(--accent)', true))}</div>
              </div>
            ))}
          </div>
        )}
        {schedModals}
      </div>
    )
  }

  if (isTask) {
    const ordered = [...items].sort((a, b) => { const da = isDone(a), db = isDone(b); return da === db ? 0 : da ? 1 : -1 })
    return (
      <div>
        {addBar}
        <div className="sched-top"><span className="badge">{open} eftir</span>{kidsBtn}</div>
        {gamePanel}
        {items.length === 0 && <p className="empty">Listinn er tómur — bættu við verki að ofan.</p>}
        <div className="group">{ordered.map(it => itemRow(it, 'var(--accent)', true))}</div>
        {assignModal}
        {settingsModal}
        {kidsModal}
        {profileModal}
        {rewardsModal}
        {guideModal}
      </div>
    )
  }

  const groups = DEPARTMENTS
    .map(d => ({ ...d, items: items.filter(i => i.dept === d.key) }))
    .filter(g => g.items.length)
    .sort((a, b) => DEPT_ORDER[a.key] - DEPT_ORDER[b.key])

  return (
    <div>
      {addBar}
      <span className="badge">{open} vörur eftir</span>
      <div className="list-actions">
        <button className="shop-go" onClick={() => setShopMode(true)}>🛒 Versla</button>
        <button className="shelf-open" onClick={() => setShelf(true)}>🛍️ Vöruhilla</button>
        <button className="shelf-open" onClick={toggleImages} title={showImages ? 'Fela myndir' : 'Sýna myndir'}>{showImages ? '🖼️ Fela' : '🖼️ Sýna'}</button>
      </div>
      <AdBanner />
      {groups.length === 0 && <p className="empty">Listinn er tómur — bættu við vöru að ofan.</p>}
      {groups.map(g => {
        const spon = CATEGORY_SPONSORS[g.key]
        return (
          <div className="group" key={g.key}>
            <div className="group-head">
              <span className="emoji">{g.icon}</span>
              <span className="name" style={{ color: g.color }}>{g.name}</span>
              {spon && <span className="spon-badge">{spon.tag}</span>}
            </div>
            {spon && (
              <div className="spon-strip">
                {spon.products.map(p => (
                  <button key={p.name} className="spon-chip" onClick={() => add(p.name, p.image)}>
                    <span className="spon-cmark" style={{ background: p.color }}>
                      {p.image ? <img src={p.image} alt="" /> : p.name.charAt(0)}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {g.items.map(it => itemRow(it, g.color, false))}
          </div>
        )
      })}
      {assignModal}
      {deptModal}
      {scanner}
      {shelf && <ShelfView catalog={catalog} onCommit={commitShelf} existing={items.map(i => i.name)} onClose={() => setShelf(false)} />}
      {shopMode && <ShoppingMode items={items} catalog={catalog} onToggle={onToggle} onScanCode={scanInStore} onClose={() => setShopMode(false)} />}
    </div>
  )
}
