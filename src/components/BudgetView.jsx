import React, { useState, useEffect } from 'react'
import { EXPENSE_CATEGORIES, CAT_BY_KEY, suggestCategory } from '../data/categories.js'
import { useBackClose } from '../lib/backstack.js'

const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) } catch { return d } }
const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || ''

function catChip(key) {
  const c = CAT_BY_KEY[key]
  if (!c) return <span className="bcat none">+ Flokka</span>
  return <span className="bcat" style={{ background: c.color + '22', color: c.color }}>{c.icon} {c.name}</span>
}

function TxForm({ initial, onSave, onClose }) {
  const [store, setStore] = useState(initial?.store || '')
  const [total, setTotal] = useState(initial?.total != null ? String(initial.total) : '')
  const [date, setDate] = useState(initial?.purchased_at || today())
  const [cat, setCat] = useState(initial?.category || null)
  const [touchedCat, setTouchedCat] = useState(!!initial?.category)
  useBackClose(true, onClose)

  useEffect(() => {
    if (touchedCat) return
    const s = suggestCategory(store)
    if (s) setCat(s)
  }, [store, touchedCat])

  const save = () => {
    const amt = parseFloat(String(total).replace(',', '.')) || 0
    if (!store.trim() && !amt) return
    onSave({ store: store.trim(), total: amt, purchased_at: date, category: cat })
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{initial?.id ? 'Breyta færslu' : 'Ný færsla'} <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <input className="dialog-input" autoFocus value={store} onChange={e => setStore(e.target.value)} placeholder="Heiti / verslun (t.d. Bónus)" />
        <div className="bform-row">
          <input className="dialog-input" style={{ margin: 0 }} value={total} onChange={e => setTotal(e.target.value)} placeholder="Upphæð" inputMode="decimal" />
          <input className="dialog-input" style={{ margin: 0 }} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="modal-label">Flokkur</div>
        <div className="bcat-grid">
          {EXPENSE_CATEGORIES.map(c => (
            <button key={c.key} className={'bcat-opt' + (cat === c.key ? ' on' : '')} onClick={() => { setCat(c.key); setTouchedCat(true) }}>
              <span>{c.icon}</span>{c.name}
            </button>
          ))}
        </div>
        <button className="add-recipe-btn" style={{ marginTop: 12 }} onClick={save} disabled={!store.trim()}>Vista</button>
      </div>
    </div>
  )
}

export default function BudgetView({ purchases = [], members = [], currentUserId, onSave, onUpdate, onDelete, onSetCategory, onScanReceipt }) {
  const [period, setPeriod] = useState('month') // 'month' | 'all'
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [catFor, setCatFor] = useState(null)

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const all = purchases
    .filter(p => period === 'all' || (p.purchased_at && new Date(p.purchased_at) >= monthStart))
    .sort((a, b) => (b.purchased_at || '').localeCompare(a.purchased_at || ''))

  const totals = {}
  for (const p of all) { const k = p.category || 'annad'; totals[k] = (totals[k] || 0) + (Number(p.total) || 0) }
  const grand = all.reduce((s, p) => s + (Number(p.total) || 0), 0)
  const cats = Object.keys(totals).sort((a, b) => totals[b] - totals[a])
  const maxCat = Math.max(1, ...cats.map(k => totals[k]))

  const shown = filter === 'all' ? all : all.filter(p => (p.category || 'annad') === filter)
  const payerName = (p) => {
    const m = members.find(x => x.kind === 'user' && x.id === p.user_id)
    if (p.user_id === currentUserId) return 'Þú'
    return displayName(m) || ''
  }

  const saveForm = async (data) => {
    if (form?.id) await onUpdate(form.id, data)
    else await onSave(data)
    setForm(null)
  }

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

      {cats.length > 0 && (
        <div className="bbreak">
          {cats.map(k => {
            const c = CAT_BY_KEY[k] || { name: 'Annað', icon: '📦', color: '#9aa6ba' }
            return (
              <button className="bbreak-row" key={k} onClick={() => setFilter(filter === k ? 'all' : k)}>
                <span className="bbreak-ic">{c.icon}</span>
                <span className="bbreak-name" style={filter === k ? { color: c.color, fontWeight: 700 } : null}>{c.name}</span>
                <span className="bbreak-bar"><i style={{ width: Math.round(totals[k] / maxCat * 100) + '%', background: c.color }} /></span>
                <span className="bbreak-amt">{kr(totals[k])}</span>
              </button>
            )
          })}
        </div>
      )}

      {filter !== 'all' && (
        <button className="bfilter-clear" onClick={() => setFilter('all')}>Sýni: {(CAT_BY_KEY[filter] || {}).name} — sýna allt ×</button>
      )}

      {shown.length === 0 && <p className="empty">Engar færslur enn — bættu við með „+ Ný færsla“.</p>}

      <div className="btx-list">
        {shown.map(p => {
          const c = CAT_BY_KEY[p.category]
          return (
            <div className="btx" key={p.id}>
              <span className="btx-ic" style={{ background: (c?.color || '#9aa6ba') + '22' }}>{c?.icon || '📦'}</span>
              <button className="btx-main" onClick={() => setForm(p)}>
                <span className="btx-store">{p.store || 'Færsla'}</span>
                <span className="btx-meta">{fmtDate(p.purchased_at)}{payerName(p) ? ' · ' + payerName(p) : ''}</span>
              </button>
              <div className="btx-right">
                <span className="btx-amt">{kr(p.total)}</span>
                <button className="btx-cat" onClick={() => setCatFor(p.id)}>{catChip(p.category)}</button>
              </div>
            </div>
          )
        })}
      </div>

      {form && <TxForm initial={form} onSave={saveForm} onClose={() => setForm(null)} />}

      {catFor && (
        <div className="sheet-bg center" onClick={() => setCatFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Flokkur <button className="x" onClick={() => setCatFor(null)} aria-label="Loka">×</button></h2>
            <div className="bcat-grid">
              {EXPENSE_CATEGORIES.map(c => (
                <button key={c.key} className="bcat-opt" onClick={async () => { await onSetCategory(catFor, c.key); setCatFor(null) }}>
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
