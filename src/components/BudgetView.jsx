import React, { useState, useEffect } from 'react'
import { EXPENSE_CATEGORIES, suggestCategory, effectiveItemCat, itemCategory, storeChain } from '../data/categories.js'
import { useBackClose } from '../lib/backstack.js'
import { ExpIcon, StoreIcon } from '../data/icons.jsx'
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconPhoto, IconPlus, IconReceipt, IconSearch, IconSettings, IconShieldCheck, IconX } from '@tabler/icons-react'
import { TimeBars, CumLine, Donut } from './BudgetCharts.jsx'

const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) } catch { return d } }
const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || ''

const num = (v) => parseFloat(String(v).replace(',', '.')) || 0

// Tákn og litir í boði þegar notandi býr til eigin flokk.
const CAT_EMOJIS = ['🚗', '☕', '🎬', '🍺', '🅿️', '🏋️', '🎮', '🐶', '🌱', '🎸', '✂️', '💐', '📚', '🎨', '🛠️', '🚲', '🏥', '💻', '🎵', '🍕', '⛽', '🧥', '💅', '🎂']
const CAT_COLOR = '#5b6b85' // hönnunarkerfi: einn hlutlaus litur — enginn litaval

function NewCatForm({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(CAT_EMOJIS[0])
  const save = () => { if (name.trim()) onCreate({ name: name.trim(), icon, color: CAT_COLOR }) }
  return (
    <div className="bnewcat">
      <input className="dialog-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Heiti flokks (t.d. Kaffihús)" />
      <div className="bnewcat-emojis">
        {CAT_EMOJIS.map(e => <button key={e} type="button" className={'bemoji' + (e === icon ? ' on' : '')} onClick={() => setIcon(e)}>{e}</button>)}
      </div>
      <div className="bnewcat-actions">
        <button className="ghost-btn" onClick={onCancel}>Hætta við</button>
        <button className="primary-btn" onClick={save} disabled={!name.trim()}>Búa til</button>
      </div>
    </div>
  )
}

// Flokkaval: innbyggðir + eigin flokkar + „Nýr flokkur".
function CatGrid({ cats, onPick, onAddCategory }) {
  const [creating, setCreating] = useState(false)
  if (creating) return <NewCatForm onCancel={() => setCreating(false)} onCreate={async d => { const c = await onAddCategory(d); setCreating(false); onPick((c && (c.id || c.key)) || null) }} />
  return (
    <div className="bcat-grid">
      {cats.map(c => (
        <button key={c.key} className="bcat-opt" onClick={() => onPick(c.key)}>
          <span><ExpIcon cat={c} size={20} /></span>{c.name}
        </button>
      ))}
      {onAddCategory && <button className="bcat-opt bcat-new" onClick={() => setCreating(true)}><span><IconPlus size={20} stroke={1.75} /></span>Nýr flokkur</button>}
    </div>
  )
}

function TxForm({ initial, catMap, cats, onAddCategory, onSave, onClose }) {
  const [store, setStore] = useState(initial?.store || '')
  const [date, setDate] = useState(initial?.purchased_at || today())
  const [items, setItems] = useState(() => {
    const init = (initial?.items || []).map(it => ({ name: it.name || '', price: it.price != null ? String(it.price) : '', category: it.category || null, warranty_until: it.warranty_until || null }))
    return init.length ? init : [{ name: '', price: '', category: null }]
  })
  const [override, setOverride] = useState(initial?.id && !(initial?.items || []).length && initial?.total != null ? String(initial.total) : '')
  const [catRow, setCatRow] = useState(null)
  useBackClose(true, onClose)

  const setItem = (i, patch) => setItems(arr => arr.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const addRow = () => setItems(arr => [...arr, { name: '', price: '', category: null }])
  const delRow = (i) => setItems(arr => arr.length > 1 ? arr.filter((_, idx) => idx !== i) : [{ name: '', price: '', category: null }])

  const clean = items.filter(it => it.name.trim())
  const sum = clean.reduce((s, it) => s + num(it.price), 0)
  const total = override ? num(override) : sum

  const save = () => {
    if (!store.trim()) return
    const its = clean.map(it => ({ name: it.name.trim(), price: num(it.price), category: it.category || itemCategory(it.name), warranty_until: it.warranty_until || null }))
    onSave({ store: store.trim(), purchased_at: date, total: total || 0, items: its, category: null })
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{initial?.id ? 'Breyta færslu' : 'Skrá útgjöld'} <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <input className="dialog-input" autoFocus value={store} onChange={e => setStore(e.target.value)} placeholder="Söluaðili (t.d. Ísbúð Vesturbæjar)" />
        <input className="dialog-input" type="date" value={date} onChange={e => setDate(e.target.value)} />

        <div className="modal-label">Vörur</div>
        <div className="bedit-items">
          {items.map((it, i) => {
            const c = catMap[it.category || itemCategory(it.name)] || { key: 'annad' }
            return (
              <div className="bedit-row" key={i}>
                <input value={it.name} onChange={e => setItem(i, { name: e.target.value })} placeholder="Vara (t.d. stór ís)" />
                <input className="bedit-price" value={it.price} onChange={e => setItem(i, { price: e.target.value })} placeholder="kr" inputMode="decimal" />
                <button className="bedit-cat" onClick={() => setCatRow(i)} title="Flokkur" disabled={!it.name.trim()}><ExpIcon cat={c} size={19} /></button>
                <button className="bedit-del" onClick={() => delRow(i)} aria-label="Eyða línu"><IconX size={16} stroke={1.75} /></button>
              </div>
            )
          })}
        </div>
        <button className="bedit-add" onClick={addRow}><IconPlus size={16} stroke={2} /> Bæta við vöru</button>

        <div className="bedit-total">
          <span>Upphæð</span>
          <input className="dialog-input" style={{ margin: 0, width: 120, textAlign: 'right' }} value={override} onChange={e => setOverride(e.target.value)} placeholder={sum ? kr(sum) : '0 kr'} inputMode="decimal" />
        </div>

        <button className="add-recipe-btn" style={{ marginTop: 12 }} onClick={save} disabled={!store.trim() || (!clean.length && !override)}>Vista</button>
      </div>

      {catRow != null && (
        <div className="sheet-bg center" onClick={() => setCatRow(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkur <button className="x" onClick={() => setCatRow(null)} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
            <CatGrid cats={cats} onAddCategory={onAddCategory} onPick={(key) => { setItem(catRow, { category: key }); setCatRow(null) }} />
          </div>
        </div>
      )}
    </div>
  )
}

const pad2 = (n) => String(n).padStart(2, '0')
const dk = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
const MON = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des']
const MONL = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember']
const WD = ['mán', 'þri', 'mið', 'fim', 'fös', 'lau', 'sun']
const PALETTE = ['#15315e', '#f5a623', '#14a37a', '#1f8ac0', '#a83b66', '#7a52cc', '#e8615a', '#5a9e5a']
const PERIODS = [['week', 'Vika'], ['month', 'Mánuður'], ['year', 'Ár'], ['all', 'Allt']]

// Tímabil bókhaldsins: upphaf/lok (dagslyklar YYYY-MM-DD, lok ekki með), súlur og heiti.
// offset: 0 = núverandi, -1 = fyrra o.s.frv. firstKey: elsta færsla (fyrir „Allt“).
function periodInfo(type, offset, firstKey) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const todayK = dk(now)
  if (type === 'week') {
    const s = new Date(now); s.setDate(s.getDate() - ((s.getDay() + 6) % 7) + offset * 7)
    const e = new Date(s); e.setDate(e.getDate() + 7)
    const last = new Date(e); last.setDate(last.getDate() - 1)
    const buckets = WD.map((label, i) => { const d = new Date(s); d.setDate(d.getDate() + i); const key = dk(d); return { key, label, future: key > todayK } })
    return { type, start: dk(s), end: dk(e), buckets, unit: 'day', title: `${s.getDate()}. ${MON[s.getMonth()]} – ${last.getDate()}. ${MON[last.getMonth()]}`, prevName: 'Vikan á undan' }
  }
  if (type === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const e = new Date(s.getFullYear(), s.getMonth() + 1, 1)
    const n = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate()
    const buckets = Array.from({ length: n }, (_, i) => { const key = s.getFullYear() + '-' + pad2(s.getMonth() + 1) + '-' + pad2(i + 1); return { key, label: String(i + 1), future: key > todayK } })
    return { type, start: dk(s), end: dk(e), buckets, unit: 'day', title: MONL[s.getMonth()] + ' ' + s.getFullYear(), prevName: 'Mánuðurinn á undan' }
  }
  if (type === 'year') {
    const y = now.getFullYear() + offset
    const buckets = MON.map((label, i) => { const key = y + '-' + pad2(i + 1); return { key, label: label.slice(0, 1).toUpperCase(), future: key > todayK.slice(0, 7) } })
    return { type, start: y + '-01-01', end: (y + 1) + '-01-01', buckets, unit: 'month', title: String(y), prevName: 'Árið á undan' }
  }
  // Allt: mánuðir frá elstu færslu til dagsins í dag (mest 24 síðustu á myndritinu)
  const fk = firstKey && /^\d{4}-\d{2}/.test(firstKey) ? firstKey : todayK
  let y = Number(fk.slice(0, 4)), m = Number(fk.slice(5, 7)) - 1
  const buckets = []
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
    buckets.push({ key: y + '-' + pad2(m + 1), label: MON[m] })
    m++; if (m > 11) { m = 0; y++ }
    if (buckets.length > 240) break
  }
  return { type, start: '0000-00-00', end: '9999-99-99', buckets: buckets.slice(-24), unit: 'month', title: 'Frá upphafi', prevName: '' }
}

export default function BudgetView({ purchases = [], members = [], currentUserId, customCats = [], onAddCategory, onDeleteCategory, onSave, onUpdate, onDelete, onSetCategory, onSetItemCategory, onSetItemsCategory, onScanReceipt, onOpenReceipts }) {
  const dkey = (p) => String(p.purchased_at || '').slice(0, 10)
  const firstKey = purchases.reduce((a, p) => { const k = dkey(p); return k && (!a || k < a) ? k : a }, '')
  const hasIn = (t) => { const i = periodInfo(t, 0, firstKey); return purchases.some(p => { const k = dkey(p); return k >= i.start && k < i.end }) }
  // Sjálfgefið tímabil: síðasta val notanda ef eitthvað er skráð í því, annars mánuðurinn, annars allt
  const [ptype, setPtypeRaw] = useState(() => {
    let saved = null
    try { saved = localStorage.getItem('tossa.budgetPeriod') } catch {}
    for (const t of [saved, 'month']) if (t && PERIODS.some(([k]) => k === t) && hasIn(t)) return t
    return 'all'
  })
  const [offset, setOffset] = useState(0)
  const [bucketSel, setBucketSel] = useState(null)
  const setPtype = (t) => { setPtypeRaw(t); setOffset(0); setBucketSel(null); try { localStorage.setItem('tossa.budgetPeriod', t) } catch {} }
  const step = (d) => { setOffset(o => Math.min(0, o + d)); setBucketSel(null) }
  const [mode, setModeRaw] = useState(() => { try { return localStorage.getItem('tossa.budgetMode') === 'store' ? 'store' : 'cat' } catch { return 'cat' } }) // 'cat' | 'store'
  const setMode = (m) => { setModeRaw(m); try { localStorage.setItem('tossa.budgetMode', m) } catch {} }
  const [chart, setChart] = useState('bars') // 'bars' | 'line'
  const [filterCat, setFilterCat] = useState(null)
  const [filterStore, setFilterStore] = useState(null)
  const [filterPayer, setFilterPayer] = useState(null)
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [catForItem, setCatForItem] = useState(null)
  const [openIds, setOpenIds] = useState({})
  const [manageCats, setManageCats] = useState(false)
  // Neðri hluti: kvittanir eða allar vörulínur (hægt að haka við margar og breyta flokki í einu)
  const [listMode, setListMode] = useState('receipts') // 'receipts' | 'items'
  const [picked, setPicked] = useState({})
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [itemLimit, setItemLimit] = useState(150)

  // Sameinaðir flokkar: innbyggðir + eigin flokkar notanda.
  const allCats = [...EXPENSE_CATEGORIES, ...customCats.map(c => ({ key: c.id, name: c.name, icon: c.icon, color: c.color, custom: true }))]
  const catMap = Object.fromEntries(allCats.map(c => [c.key, c]))
  const catOf = (k) => catMap[k] || { key: 'annad', name: 'Annað' }

  const info = periodInfo(ptype, offset, firstKey)
  const bkey = (p) => info.unit === 'day' ? dkey(p) : dkey(p).slice(0, 7)
  const ql = q.trim().toLowerCase()
  const storeHit = (p) => !!ql && (p.store || '').toLowerCase().includes(ql)
  const itemHit = (it) => (it.name || '').toLowerCase().includes(ql)
  // Upphæð færslu miðað við síur: flokkur og leit telja aðeins þá liði sem passa (annars heildarupphæð kvittunar).
  const amt = (p, skipCat) => {
    const fc = skipCat ? null : filterCat
    const needQ = !!ql && !storeHit(p)
    if (!fc && !needQ) return Number(p.total) || 0
    const its = p.items || []
    if (!its.length) return (!needQ && (!fc || (p.category || 'annad') === fc)) ? (Number(p.total) || 0) : 0
    return its.reduce((a, it) => a + (((!fc || effectiveItemCat(it) === fc) && (!needQ || itemHit(it))) ? (Number(it.price) || 0) : 0), 0)
  }
  const pass = (p, skip) =>
    (skip === 'store' || !filterStore || storeChain(p.store) === filterStore) &&
    (!filterPayer || p.user_id === filterPayer) &&
    (skip === 'bucket' || !bucketSel || bkey(p) === bucketSel)
  const narrowed = !!(filterCat || ql)
  const inRange = (p, i) => { const k = dkey(p); return k >= i.start && k < i.end }

  const inPeriod = purchases.filter(p => inRange(p, info)).sort((a, b) => (b.purchased_at || '').localeCompare(a.purchased_at || ''))
  const shown = inPeriod.filter(p => pass(p) && (!narrowed || amt(p) > 0))
  const grand = shown.reduce((s, p) => s + amt(p), 0)
  const storeCount = new Set(shown.map(p => storeChain(p.store))).size

  // Súlur yfir tíma (virða allar síur nema valda súlu)
  const byBucket = {}
  for (const p of inPeriod) if (pass(p, 'bucket')) { const a = amt(p); if (a) byBucket[bkey(p)] = (byBucket[bkey(p)] || 0) + a }
  const buckets = info.buckets.map(b => ({ ...b, amt: byBucket[b.key] || 0 }))

  // Fyrra tímabil til samanburðar (sömu síur)
  const prevInfo = ptype === 'all' ? null : periodInfo(ptype, offset - 1, firstKey)
  const prevBy = {}
  let prevTotal = 0
  if (prevInfo) for (const p of purchases) if (inRange(p, prevInfo) && pass(p, 'bucket')) {
    const a = amt(p); if (!a) continue
    const k = prevInfo.unit === 'day' ? dkey(p) : dkey(p).slice(0, 7)
    prevBy[k] = (prevBy[k] || 0) + a; prevTotal += a
  }
  const prevSeries = prevInfo ? prevInfo.buckets.map(b => prevBy[b.key] || 0) : []

  // Skipting eftir flokkum (hunsar flokkasíu) og verslunum (hunsar verslunarsíu) — svo hægt sé að smella á milli
  const catTotals = {}
  for (const p of inPeriod) {
    if (!pass(p)) continue
    const needQ = !!ql && !storeHit(p)
    const its = p.items || []
    if (its.length) { for (const it of its) if (!needQ || itemHit(it)) { const c = effectiveItemCat(it); catTotals[c] = (catTotals[c] || 0) + (Number(it.price) || 0) } }
    else if (!needQ) { const c = p.category || 'annad'; catTotals[c] = (catTotals[c] || 0) + (Number(p.total) || 0) }
  }
  const storeTotals = {}
  for (const p of inPeriod) if (pass(p, 'store')) { const a = amt(p); if (a) { const s = storeChain(p.store); storeTotals[s] = (storeTotals[s] || 0) + a } }

  const rows = (mode === 'cat'
    ? Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]).map(k => { const c = catOf(k); return { key: k, label: c.name, cat: c, amt: catTotals[k], color: c.color } })
    : Object.keys(storeTotals).sort((a, b) => storeTotals[b] - storeTotals[a]).map(k => ({ key: k, label: k, cat: null, amt: storeTotals[k] }))
  ).filter(r => r.amt > 0).map((r, i) => ({ ...r, color: (mode === 'cat' && r.color && r.color !== CAT_COLOR) ? r.color : PALETTE[i % PALETTE.length] }))
  const rowsTotal = rows.reduce((a, r) => a + r.amt, 0)
  const maxAmt = Math.max(1, ...rows.map(r => r.amt))
  const slices = rows.length > 7
    ? [...rows.slice(0, 6), { key: '__other', label: 'Annað', amt: rows.slice(6).reduce((a, r) => a + r.amt, 0), color: '#b6bfcc', other: true }]
    : rows
  const selKey = mode === 'store' ? filterStore : filterCat

  // Mest keypt: vörur sem passa við síurnar, eftir upphæð
  const prodMap = {}
  for (const p of shown) for (const it of (p.items || [])) {
    if (filterCat && effectiveItemCat(it) !== filterCat) continue
    if (ql && !storeHit(p) && !itemHit(it)) continue
    const k = (it.name || '').trim().toLowerCase(); if (!k) continue
    const e = prodMap[k] || (prodMap[k] = { name: (it.name || '').trim(), amt: 0, n: 0 })
    e.amt += Number(it.price) || 0; e.n += 1
  }
  const topProducts = Object.values(prodMap).sort((a, b) => b.amt - a.amt).slice(0, 5)

  // Allar vörulínur sem passa við síurnar (fyrir „Vörur“-sýnina)
  const lineItems = []
  for (const p of shown) for (const it of (p.items || [])) {
    if (filterCat && effectiveItemCat(it) !== filterCat) continue
    if (ql && !storeHit(p) && !itemHit(it)) continue
    if (it.id != null) lineItems.push({ it, p })
  }
  const pickedItems = lineItems.filter(x => picked[x.it.id])
  const allPicked = lineItems.length > 0 && pickedItems.length === lineItems.length
  const applyBulk = async (key) => {
    if (!pickedItems.length) return
    setBulkBusy(true)
    try {
      const list = pickedItems.map(x => ({ id: x.it.id, name: x.it.name }))
      if (onSetItemsCategory) await onSetItemsCategory(list, key)
      else for (const x of list) await onSetItemCategory(x.id, key, x.name)
      setPicked({}); setBulkOpen(false)
    } finally { setBulkBusy(false) }
  }

  // Hvati: vikur í röð með a.m.k. eina kvittun (núverandi vika má vera tóm enn)
  const weekKey = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return dk(x) }
  const weeks = new Set(purchases.map(p => { const k = dkey(p); return /^\d{4}-\d{2}-\d{2}$/.test(k) ? weekKey(new Date(k + 'T00:00:00')) : null }).filter(Boolean))
  let streak = 0
  { const w = new Date(); if (!weeks.has(weekKey(w))) w.setDate(w.getDate() - 7); while (weeks.has(weekKey(w)) && streak < 520) { streak++; w.setDate(w.getDate() - 7) } }

  const payerName = (p) => {
    if (p.user_id === currentUserId) return 'Þú'
    const m = members.find(x => x.kind === 'user' && x.id === p.user_id)
    return displayName(m) || ''
  }
  const payers = [...new Set(purchases.map(p => p.user_id).filter(Boolean))].map(id => ({ id, name: payerName({ user_id: id }) })).filter(x => x.name)
  const clickRow = (key) => { if (mode === 'store') setFilterStore(filterStore === key ? null : key); else setFilterCat(filterCat === key ? null : key) }
  const saveForm = async (data) => { if (form?.id) await onUpdate(form.id, data); else await onSave(data); setForm(null) }
  const bucketName = (k) => { if (!k) return ''; if (k.length === 7) return MONL[Number(k.slice(5, 7)) - 1] + ' ' + k.slice(0, 4); const d = new Date(k + 'T00:00:00'); return WD[(d.getDay() + 6) % 7] + '. ' + d.getDate() + '. ' + MON[d.getMonth()] }
  const chips = [
    bucketSel && { k: 'b', label: bucketName(bucketSel), clear: () => setBucketSel(null) },
    filterCat && { k: 'c', label: catOf(filterCat).name, clear: () => setFilterCat(null) },
    filterStore && { k: 's', label: filterStore, clear: () => setFilterStore(null) },
    filterPayer && { k: 'p', label: payerName({ user_id: filterPayer }), clear: () => setFilterPayer(null) },
    ql && { k: 'q', label: '„' + q.trim() + '“', clear: () => setQ('') },
  ].filter(Boolean)
  const clearAll = () => { setBucketSel(null); setFilterCat(null); setFilterStore(null); setFilterPayer(null); setQ('') }

  return (
    <div className="budget">
      <div className="bsum bsum2">
        <div className="bper-tabs">
          {PERIODS.map(([k, label]) => <button key={k} className={ptype === k ? 'on' : ''} onClick={() => setPtype(k)}>{label}</button>)}
        </div>
        <div className="bper-nav">
          {ptype !== 'all' && <button onClick={() => step(-1)} aria-label="Fyrra tímabil"><IconChevronLeft size={18} stroke={2} /></button>}
          <span>{info.title}</span>
          {ptype !== 'all' && <button onClick={() => step(1)} disabled={offset >= 0} aria-label="Næsta tímabil"><IconChevronRight size={18} stroke={2} /></button>}
        </div>
        <div className="bsum-val">{kr(grand)}</div>
        <div className="bsum-sub">
          {shown.length} {shown.length === 1 ? 'kvittun' : 'kvittanir'} · {storeCount} {storeCount === 1 ? 'verslun' : 'verslanir'}
          {prevInfo && prevTotal > 0 ? <> · {prevInfo.prevName.toLowerCase()}: {kr(prevTotal)}</> : null}
        </div>
      </div>

      <div className="bactions">
        <button className="primary-btn" onClick={() => setForm({})}><IconPlus size={18} stroke={2} /> Ný færsla</button>
        {onScanReceipt && <button className="bscan" onClick={onScanReceipt}><IconReceipt size={18} stroke={1.75} /> Skanna</button>}
        {onOpenReceipts && <button className="bscan" onClick={onOpenReceipts} title="Kvittanir & ábyrgðir" aria-label="Kvittanir og ábyrgðir"><IconShieldCheck size={18} stroke={1.75} /></button>}
      </div>

      {purchases.length > 0 && (
        <>
          <div className="bsearch">
            <IconSearch size={17} stroke={1.75} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Leita að vöru eða verslun, t.d. mjólk" autoComplete="off" />
            {q && <button onClick={() => setQ('')} aria-label="Hreinsa leit"><IconX size={16} stroke={2} /></button>}
          </div>
          {payers.length > 1 && (
            <div className="bchips">
              {payers.map(x => <button key={x.id} className={filterPayer === x.id ? 'on' : ''} onClick={() => setFilterPayer(filterPayer === x.id ? null : x.id)}>{x.name}</button>)}
            </div>
          )}

          <div className="bcard">
            <div className="bcard-h">
              <b>{chart === 'line' ? 'Uppsafnað' : (info.unit === 'day' ? 'Útgjöld á dag' : 'Útgjöld á mánuði')}</b>
              {ptype !== 'all' && (
                <div className="bseg">
                  <button className={chart === 'bars' ? 'on' : ''} onClick={() => setChart('bars')}>Súlur</button>
                  <button className={chart === 'line' ? 'on' : ''} onClick={() => { setChart('line'); setBucketSel(null) }}>Lína</button>
                </div>
              )}
            </div>
            {chart === 'line' && ptype !== 'all'
              ? <CumLine buckets={buckets} prev={prevSeries} />
              : <TimeBars buckets={buckets} selected={bucketSel} onSelect={setBucketSel} />}
            <div className="bcard-foot">
              {chart === 'line' && ptype !== 'all'
                ? <><i className="bleg cur" /> {info.title} {prevTotal > 0 && <><i className="bleg prev" /> {prevInfo.prevName.toLowerCase()}</>}</>
                : bucketSel ? <><b>{bucketName(bucketSel)}:</b> {kr(byBucket[bucketSel] || 0)}</> : 'Ýttu á súlu til að skoða þann ' + (info.unit === 'day' ? 'dag' : 'mánuð')}
            </div>
          </div>

          <div className="bmode">
            <button className={mode === 'cat' ? 'on' : ''} onClick={() => setMode('cat')}>Eftir flokki</button>
            <button className={mode === 'store' ? 'on' : ''} onClick={() => setMode('store')}>Eftir verslun</button>
          </div>

          {rows.length > 0 && (
            <div className="bcard bsplit">
              <Donut slices={slices} total={rowsTotal} selected={selKey} onSelect={clickRow} centerLabel={mode === 'cat' ? 'Flokkar' : 'Verslanir'} />
              <div className="bbreak">
                {rows.map(r => {
                  const on = selKey === r.key
                  return (
                    <button className={'bbreak-row' + (selKey && !on ? ' dim' : '')} key={r.key} onClick={() => clickRow(r.key)}>
                      <span className="bbreak-ic" style={{ color: r.color }}>{r.cat ? <ExpIcon cat={r.cat} size={18} /> : <StoreIcon size={18} />}</span>
                      <span className="bbreak-name" style={on ? { color: 'var(--navy)', fontWeight: 700 } : null}>{r.label}<small>{Math.round(r.amt / Math.max(1, rowsTotal) * 100)}%</small></span>
                      <span className="bbreak-bar"><i style={{ width: Math.round(r.amt / maxAmt * 100) + '%', background: r.color }} /></span>
                      <span className="bbreak-amt">{kr(r.amt)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'cat' && onAddCategory && (
        <button className="bmanage-cats" onClick={() => setManageCats(true)}><IconSettings size={16} stroke={1.75} /> Flokkar</button>
      )}

      {chips.length > 0 && (
        <div className="bchips sel">
          {chips.map(c => <button key={c.k} className="on" onClick={c.clear}>{c.label} <IconX size={13} stroke={2.2} /></button>)}
          {chips.length > 1 && <button onClick={clearAll}>Hreinsa allt</button>}
        </div>
      )}

      {topProducts.length > 1 && (
        <div className="bcard">
          <div className="bcard-h"><b>Mest keypt</b><small>ýttu á vöru til að sjá öll kaupin</small></div>
          {topProducts.map(tp => (
            <button className="btop" key={tp.name} onClick={() => setQ(tp.name)}>
              <span className="btop-name">{tp.name}</span>
              <span className="btop-n">{tp.n}×</span>
              <span className="btop-amt">{kr(tp.amt)}</span>
            </button>
          ))}
        </div>
      )}

      {purchases.length > 0 && onScanReceipt && (
        <button className="bmot" onClick={onScanReceipt}>
          <IconReceipt size={18} stroke={1.75} />
          <span>{streak >= 2 ? <><b>{streak} vikur í röð</b> með kvittanir. </> : null}{purchases.length < 10 ? 'Því fleiri kvittanir, því skýrari mynd — skannaðu næstu.' : 'Haltu áfram — skannaðu næstu kvittun.'}</span>
        </button>
      )}

      {shown.length === 0 && <p className="empty">{purchases.length === 0 ? 'Engar færslur enn — skannaðu kvittun eða bættu við með „+ Ný færsla“.' : chips.length ? 'Ekkert passar við síurnar á þessu tímabili.' : 'Ekkert skráð á þessu tímabili.'}</p>}

      {purchases.length > 0 && (
        <div className="bmode blist-mode">
          <button className={listMode === 'receipts' ? 'on' : ''} onClick={() => setListMode('receipts')}>Kvittanir ({shown.length})</button>
          <button className={listMode === 'items' ? 'on' : ''} onClick={() => setListMode('items')}>Vörur ({lineItems.length})</button>
        </div>
      )}

      {listMode === 'items' && (
        <div className={'bitems-all' + (pickedItems.length ? ' has-bulk' : '')}>
          {lineItems.length > 0 && (
            <div className="bitems-head">
              <label><input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? {} : Object.fromEntries(lineItems.map(x => [x.it.id, true])))} /> Velja allar {lineItems.length}</label>
              <small>Leitaðu eða síaðu að ofan, hakaðu við og breyttu flokki</small>
            </div>
          )}
          {lineItems.length === 0 && purchases.length > 0 && <p className="empty">Engar vörulínur passa við síurnar.</p>}
          {lineItems.slice(0, itemLimit).map(({ it, p }) => {
            const c = catOf(effectiveItemCat(it))
            const on = !!picked[it.id]
            return (
              <label className={'bline' + (on ? ' on' : '')} key={it.id}>
                <input type="checkbox" checked={on} onChange={() => setPicked(m => { const n = { ...m }; if (n[it.id]) delete n[it.id]; else n[it.id] = true; return n })} />
                <span className="bline-main"><b>{it.name}</b><small>{p.store || 'Færsla'} · {fmtDate(dkey(p))}</small></span>
                <span className="bline-cat"><ExpIcon cat={c} size={13} /> {c.name}</span>
                <span className="bline-amt">{kr(it.price)}</span>
              </label>
            )
          })}
          {lineItems.length > itemLimit && <button className="bmanage-cats" onClick={() => setItemLimit(n => n + 300)}>Sýna fleiri ({lineItems.length - itemLimit} eftir)</button>}
          {pickedItems.length > 0 && (
            <div className="bbulk">
              <span><b>{pickedItems.length}</b> {pickedItems.length === 1 ? 'vara valin' : 'vörur valdar'} · {kr(pickedItems.reduce((a, x) => a + (Number(x.it.price) || 0), 0))}</span>
              <button className="ghost-btn" onClick={() => setPicked({})}>Hætta við</button>
              <button className="primary-btn" onClick={() => setBulkOpen(true)}>Breyta flokki</button>
            </div>
          )}
        </div>
      )}

      {listMode === 'receipts' && <div className="btx-list">
        {shown.map(p => {
          const items = p.items || []
          const open = !!openIds[p.id]
          return (
            <div className="btx-wrap" key={p.id}>
              <div className="btx">
                <button className="btx-exp" onClick={() => items.length && setOpenIds(o => ({ ...o, [p.id]: !o[p.id] }))} aria-label="Sýna liði">{items.length ? (open ? <IconChevronDown size={16} stroke={1.75} /> : <IconChevronRight size={16} stroke={1.75} />) : '·'}</button>
                <button className="btx-main" onClick={() => setForm(p)}>
                  <span className="btx-store">{p.store || 'Færsla'}{p.receipt_path ? <IconPhoto size={13} stroke={1.9} className="btx-has-img" /> : null}</span>
                  <span className="btx-meta">{fmtDate(p.purchased_at)}{items.length ? ` · ${items.length} liðir` : ''}{payerName(p) ? ' · ' + payerName(p) : ''}</span>
                </button>
                <span className="btx-amt">{kr(p.total)}</span>
              </div>
              {open && items.length > 0 && (
                <div className="btx-items">
                  {items.map(it => {
                    const c = catOf(effectiveItemCat(it))
                    return (
                      <div className="bitem" key={it.id || it.name}>
                        <span className="bitem-name">{it.name}</span>
                        <span className="bitem-price">{kr(it.price)}</span>
                        <button className="bitem-cat" onClick={() => setCatForItem(it)}><ExpIcon cat={c} size={13} /> {c.name}</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>}

      {bulkOpen && (
        <div className="sheet-bg center" onClick={bulkBusy ? undefined : () => setBulkOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkur á {pickedItems.length} {pickedItems.length === 1 ? 'vöru' : 'vörur'} <button className="x" onClick={() => setBulkOpen(false)} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
            <div className="bcat-learn">{bulkBusy ? 'Breyti…' : 'Kerfið man flokkinn fyrir þessar vörur næst þegar þær eru skannaðar.'}</div>
            {!bulkBusy && <CatGrid cats={allCats} onAddCategory={onAddCategory} onPick={applyBulk} />}
          </div>
        </div>
      )}

      {form && <TxForm initial={form} catMap={catMap} cats={allCats} onAddCategory={onAddCategory} onSave={saveForm} onClose={() => setForm(null)} />}

      {catForItem && (
        <div className="sheet-bg center" onClick={() => setCatForItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkur á lið <button className="x" onClick={() => setCatForItem(null)} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
            <div className="bcat-learn">Kerfið man þennan flokk fyrir „{catForItem.name}" næst þegar hann er skannaður.</div>
            <CatGrid cats={allCats} onAddCategory={onAddCategory} onPick={async (key) => { await onSetItemCategory(catForItem.id, key, catForItem.name); setCatForItem(null) }} />
          </div>
        </div>
      )}

      {manageCats && (
        <div className="sheet-bg center" onClick={() => setManageCats(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkar <button className="x" onClick={() => setManageCats(false)} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
            <div className="modal-label">Innbyggðir</div>
            <div className="bcat-list">
              {EXPENSE_CATEGORIES.map(c => (
                <div className="bcat-line" key={c.key}><span><ExpIcon cat={c} size={17} /></span> {c.name}</div>
              ))}
            </div>
            <div className="modal-label">Þínir flokkar</div>
            {customCats.length === 0 && <p className="empty" style={{ margin: '4px 0' }}>Engir enn — búðu til flokk þegar þú flokkar færslu.</p>}
            <div className="bcat-list">
              {customCats.map(c => (
                <div className="bcat-line" key={c.id}>
                  <span><ExpIcon cat={{ ...c, custom: true }} size={17} /></span> {c.name}
                  {onDeleteCategory && <button className="bcat-del" onClick={() => onDeleteCategory(c.id)} aria-label="Eyða flokki"><IconX size={15} stroke={1.75} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
