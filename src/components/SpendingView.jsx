import React, { useState } from 'react'
import ReceiptScanner from './ReceiptScanner.jsx'
import { useBackClose } from '../lib/backstack.js'

const kr = (n) => (n == null ? '—' : Math.round(Number(n)).toLocaleString('is-IS') + ' kr')
const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) } catch { return d }
}
const monthKey = (d) => (d || '').slice(0, 7)
const sum = (items) => items.reduce((a, b) => a + (Number(b.price) || 0), 0)

export default function SpendingView({ purchases = [], onSave, onDelete, onUpdate }) {
  const [scanning, setScanning] = useState(false)
  const [open, setOpen] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [editing, setEditing] = useState(null)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = purchases
    .filter(p => monthKey(p.purchased_at) === thisMonth)
    .reduce((a, p) => a + (Number(p.total) || 0), 0)

  return (
    <div>
      <button className="primary-btn" onClick={() => setScanning(true)}>📸 Skrá kvittun</button>

      <div className="spend-summary">
        <span className="spend-label">Eyðsla þennan mánuð</span>
        <span className="spend-big">{kr(monthTotal)}</span>
      </div>

      {purchases.length === 0 && <p className="empty">Engar kvittanir enn — skráðu þá fyrstu með „📸 Skrá kvittun".</p>}

      <div className="group">
        {purchases.map(p => (
          <div className="spend-item" key={p.id}>
            <button className="spend-head" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <span className="spend-store">{p.store || 'Verslun'}</span>
              <span className="spend-date">{fmtDate(p.purchased_at)}</span>
              <span className="spend-amt">{kr(p.total)}</span>
              <span className="spend-chev">{open === p.id ? '▴' : '▾'}</span>
            </button>
            {open === p.id && (
              <div className="spend-lines">
                {(p.items || []).length === 0 && <div className="spend-line muted">Engar vörulínur skráðar</div>}
                {(p.items || []).map((it, i) => (
                  <div className="spend-line" key={i}>
                    <span>{it.name}</span>
                    <span>{kr(it.price)}</span>
                  </div>
                ))}
                {confirmDel === p.id ? (
                  <div className="spend-confirm">
                    <span>Eyða þessari kvittun?</span>
                    <button className="del-yes" onClick={() => { onDelete && onDelete(p.id); setConfirmDel(null) }}>Eyða</button>
                    <button className="del-no" onClick={() => setConfirmDel(null)}>Hætta</button>
                  </div>
                ) : (
                  <div className="spend-actions">
                    <button onClick={() => setEditing({ ...p, items: (p.items || []).map(i => ({ ...i })) })}>✎ Leiðrétta</button>
                    <button className="spend-del" onClick={() => setConfirmDel(p.id)}>🗑 Eyða</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {scanning && (
        <ReceiptScanner
          onSave={async (purchase) => { await onSave(purchase) }}
          onClose={() => setScanning(false)}
        />
      )}

      {editing && (
        <EditPurchase
          purchase={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => { if (onUpdate) await onUpdate(editing.id, patch); setEditing(null) }}
        />
      )}
    </div>
  )
}

function EditPurchase({ purchase, onClose, onSave }) {
  const [store, setStore] = useState(purchase.store || '')
  const [date, setDate] = useState((purchase.purchased_at || '').slice(0, 10))
  const [items, setItems] = useState((purchase.items || []).map((it, i) => ({ id: i + '_' + Date.now(), name: it.name || '', price: it.price ?? '' })))
  const [total, setTotal] = useState(purchase.total != null ? String(purchase.total) : '')
  const [saving, setSaving] = useState(false)
  useBackClose(true, onClose)

  const setItem = (id, field, val) => setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it))
  const delItem = (id) => setItems(items.filter(it => it.id !== id))
  const addRow = () => setItems([...items, { id: 'n_' + Date.now(), name: '', price: '' }])

  const save = async () => {
    const clean = items.map(it => ({ name: (it.name || '').trim(), price: it.price === '' ? null : Number(it.price) })).filter(it => it.name)
    setSaving(true)
    try {
      await onSave({ store: store.trim(), purchased_at: date, total: total === '' ? sum(clean) : Number(total), items: clean })
    } catch (e) { setSaving(false) }
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal receipt-modal" onClick={e => e.stopPropagation()}>
        <h2>Leiðrétta kvittun <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <div className="receipt-meta">
          <input className="dialog-input" value={store} onChange={e => setStore(e.target.value)} placeholder="Verslun" />
          <input className="dialog-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="receipt-items">
          {items.map(it => (
            <div className="receipt-row" key={it.id}>
              <input value={it.name} onChange={e => setItem(it.id, 'name', e.target.value)} placeholder="Vara" />
              <input className="receipt-price" value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} placeholder="kr" inputMode="decimal" />
              <button className="receipt-del" onClick={() => delItem(it.id)} aria-label="Eyða">×</button>
            </div>
          ))}
        </div>
        <button className="receipt-addrow" onClick={addRow}>+ Bæta við línu</button>
        <div className="receipt-total">
          <span>Samtals</span>
          <input value={total} onChange={e => setTotal(e.target.value)} inputMode="decimal" />
          <span>kr</span>
        </div>
        <button className="add-recipe-btn" onClick={save} disabled={saving}>{saving ? 'Vista…' : 'Vista breytingar'}</button>
      </div>
    </div>
  )
}
