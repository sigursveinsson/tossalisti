import React, { useState, useEffect } from 'react'
import { EXPENSE_CATEGORIES, CAT_BY_KEY, suggestCategory, effectiveItemCat, itemCategory } from '../data/categories.js'
import { useBackClose } from '../lib/backstack.js'

const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) } catch { return d } }
const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || ''

const num = (v) => parseFloat(String(v).replace(',', '.')) || 0

function TxForm({ initial, onSave, onClose }) {
  const [store, setStore] = useState(initial?.store || '')
  const [date, setDate] = useState(initial?.purchased_at || today())
  const [items, setItems] = useState(() => {
    const init = (initial?.items || []).map(it => ({ name: it.name || '', price: it.price != null ? String(it.price) : '', category: it.category || null }))
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
    const its = clean.map(it => ({ name: it.name.trim(), price: num(it.price), category: it.category || itemCategory(it.name) }))
    onSave({ store: store.trim(), purchased_at: date, total: total || 0, items: its, category: null })
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{initial?.id ? 'Breyta færslu' : 'Skrá útgjöld'} <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <input className="dialog-input" autoFocus value={store} onChange={e => setStore(e.target.value)} placeholder="Söluaðili (t.d. Ísbúð Vesturbæjar)" />
        <input className="dialog-input" type="date" value={date} onChange={e => setDate(e.target.value)} />

        <div className="modal-label">Vörur</div>
        <div className="bedit-items">
          {items.map((it, i) => {
            const c = CAT_BY_KEY[it.category || itemCategory(it.name)] || { icon: '📦', color: '#9aa6ba' }
            return (
              <div className="bedit-row" key={i}>
                <input value={it.name} onChange={e => setItem(i, { name: e.target.value })} placeholder="Vara (t.d. stór ís)" />
                <input className="bedit-price" value={it.price} onChange={e => setItem(i, { price: e.target.value })} placeholder="kr" inputMode="decimal" />
                <button className="bedit-cat" style={{ color: c.color }} onClick={() => setCatRow(i)} title="Flokkur" disabled={!it.name.trim()}>{c.icon}</button>
                <button className="bedit-del" onClick={() => delRow(i)} aria-label="Eyða línu">×</button>
              </div>
            )
          })}
        </div>
        <button className="bedit-add" onClick={addRow}>+ Bæta við vöru</button>

        <div className="bedit-total">
          <span>Upphæð</span>
          <input className="dialog-input" style={{ margin: 0, width: 120, textAlign: 'right' }} value={override} onChange={e => setOverride(e.target.value)} placeholder={sum ? kr(sum) : '0 kr'} inputMode="decimal" />
        </div>

        <button className="add-recipe-btn" style={{ marginTop: 12 }} onClick={save} disabled={!store.trim() || (!clean.length && !override)}>Vista</button>
      </div>

      {catRow != null && (
        <div className="sheet-bg center" onClick={() => setCatRow(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkur <button className="x" onClick={() => setCatRow(null)} aria-label="Loka">×</button></h2>
            <div className="bcat-grid">
              {EXPENSE_CATEGORIES.map(c => (
                <button key={c.key} className="bcat-opt" onClick={() => { setItem(catRow, { category: c.key }); setCatRow(null) }}>
                  <span>{c.icon}</span>{c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BudgetView({ purchases = [], members = [], currentUserId, onSave, onUpdate, onDelete, onSetCategory, onSetItemCategory, onScanReceipt }) {
  const [period, setPeriod] = useState('month')
  const [mode, setMode] = useState('cat') // 'cat' | 'store'
  const [filterCat, setFilterCat] = useState(null)
  const [filterStore, setFilterStore] = useState(null)
  const [form, setForm] = useState(null)
  const [catForItem, setCatForItem] = useState(null)
  const [openIds, setOpenIds] = useState({})

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const all = purchases
    .filter(p => period === 'all' || (p.purchased_at && new Date(p.purchased_at) >= monthStart))
    .sort((a, b) => (b.purchased_at || '').localeCompare(a.purchased_at || ''))
  const grand = all.reduce((s, p) => s + (Number(p.total) || 0), 0)

  // Flokka-samtölur úr undirliðum (eða heildarfærslu ef engir liðir).
  const catTotals = {}
  for (const p of all) {
    const items = p.items || []
    if (items.length) for (const it of items) { const c = effectiveItemCat(it); catTotals[c] = (catTotals[c] || 0) + (Number(it.price) || 0) }
    else { const c = p.category || 'annad'; catTotals[c] = (catTotals[c] || 0) + (Number(p.total) || 0) }
  }
  const storeTotals = {}
  for (const p of all) { const s = (p.store || '').trim() || 'Annað'; storeTotals[s] = (storeTotals[s] || 0) + (Number(p.total) || 0) }

  const rows = mode === 'cat'
    ? Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]).map(k => ({ key: k, label: (CAT_BY_KEY[k] || { name: 'Annað' }).name, icon: (CAT_BY_KEY[k] || { icon: '📦' }).icon, color: (CAT_BY_KEY[k] || { color: '#9aa6ba' }).color, amt: catTotals[k] }))
    : Object.keys(storeTotals).sort((a, b) => storeTotals[b] - storeTotals[a]).map(k => ({ key: k, label: k, icon: '🏪', color: '#4a6fd0', amt: storeTotals[k] }))
  const maxAmt = Math.max(1, ...rows.map(r => r.amt))

  let shown = all
  if (filterStore) shown = all.filter(p => ((p.store || '').trim() || 'Annað') === filterStore)
  else if (filterCat) shown = all.filter(p => {
    const items = p.items || []
    return items.length ? items.some(it => effectiveItemCat(it) === filterCat) : (p.category || 'annad') === filterCat
  })

  const payerName = (p) => {
    if (p.user_id === currentUserId) return 'Þú'
    const m = members.find(x => x.kind === 'user' && x.id === p.user_id)
    return displayName(m) || ''
  }
  const clickRow = (r) => {
    if (mode === 'store') { setFilterStore(filterStore === r.key ? null : r.key); setFilterCat(null) }
    else { setFilterCat(filterCat === r.key ? null : r.key); setFilterStore(null) }
  }
  const saveForm = async (data) => { if (form?.id) await onUpdate(form.id, data); else await onSave(data); setForm(null) }
  const activeFilter = filterStore || (filterCat && (CAT_BY_KEY[filterCat] || {}).name)

  return (
    <div className="budget">
      <div className="bsum">
        <div>
          <div className="bsum-label">Útgjöld {period === 'month' ? 'í mánuðinum' : 'alls'}</div>
          <div className="bsum-val">{kr(grand)}</div>
        </div>
        <div className="bperiod">
          <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>Mánuður</button>
          <button className={period === 'all' ? 'on' : ''} onClick={() => setPeriod('all')}>Allt</button>
        </div>
      </div>

      <div className="bactions">
        <button className="primary-btn" onClick={() => setForm({})}>+ Ný færsla</button>
        {onScanReceipt && <button className="bscan" onClick={onScanReceipt}>🧾 Skanna</button>}
      </div>

      <div className="bmode">
        <button className={mode === 'cat' ? 'on' : ''} onClick={() => { setMode('cat'); setFilterStore(null) }}>Eftir flokki</button>
        <button className={mode === 'store' ? 'on' : ''} onClick={() => { setMode('store'); setFilterCat(null) }}>Eftir verslun</button>
      </div>

      {rows.length > 0 && (
        <div className="bbreak">
          {rows.map(r => {
            const on = (mode === 'store' ? filterStore : filterCat) === r.key
            return (
              <button className="bbreak-row" key={r.key} onClick={() => clickRow(r)}>
                <span className="bbreak-ic">{r.icon}</span>
                <span className="bbreak-name" style={on ? { color: r.color, fontWeight: 700 } : null}>{r.label}</span>
                <span className="bbreak-bar"><i style={{ width: Math.round(r.amt / maxAmt * 100) + '%', background: r.color }} /></span>
                <span className="bbreak-amt">{kr(r.amt)}</span>
              </button>
            )
          })}
        </div>
      )}

      {activeFilter && (
        <button className="bfilter-clear" onClick={() => { setFilterCat(null); setFilterStore(null) }}>Sýni: {activeFilter} — sýna allt ×</button>
      )}

      {shown.length === 0 && <p className="empty">Engar færslur enn — skannaðu kvittun eða bættu við með „+ Ný færsla“.</p>}

      <div className="btx-list">
        {shown.map(p => {
          const items = p.items || []
          const open = !!openIds[p.id]
          return (
            <div className="btx-wrap" key={p.id}>
              <div className="btx">
                <button className="btx-exp" onClick={() => items.length && setOpenIds(o => ({ ...o, [p.id]: !o[p.id] }))} aria-label="Sýna liði">{items.length ? (open ? '▾' : '▸') : '·'}</button>
                <button className="btx-main" onClick={() => setForm(p)}>
                  <span className="btx-store">{p.store || 'Færsla'}</span>
                  <span className="btx-meta">{fmtDate(p.purchased_at)}{items.length ? ` · ${items.length} liðir` : ''}{payerName(p) ? ' · ' + payerName(p) : ''}</span>
                </button>
                <span className="btx-amt">{kr(p.total)}</span>
              </div>
              {open && items.length > 0 && (
                <div className="btx-items">
                  {items.map(it => {
                    const c = CAT_BY_KEY[effectiveItemCat(it)] || { icon: '📦', name: 'Annað', color: '#9aa6ba' }
                    return (
                      <div className="bitem" key={it.id || it.name}>
                        <span className="bitem-name">{it.name}</span>
                        <span className="bitem-price">{kr(it.price)}</span>
                        <button className="bitem-cat" style={{ background: c.color + '22', color: c.color }} onClick={() => setCatForItem(it.id)}>{c.icon} {c.name}</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {form && <TxForm initial={form} onSave={saveForm} onClose={() => setForm(null)} />}

      {catForItem && (
        <div className="sheet-bg center" onClick={() => setCatForItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkur á lið <button className="x" onClick={() => setCatForItem(null)} aria-label="Loka">×</button></h2>
            <div className="bcat-grid">
              {EXPENSE_CATEGORIES.map(c => (
                <button key={c.key} className="bcat-opt" onClick={async () => { await onSetItemCategory(catForItem, c.key); setCatForItem(null) }}>
                  <span>{c.icon}</span>{c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
