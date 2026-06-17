import React, { useRef, useState } from 'react'
import { parseReceipt } from '../lib/receipt.js'
import { useBackClose } from '../lib/backstack.js'

const today = () => new Date().toISOString().slice(0, 10)
const sum = (items) => items.reduce((a, b) => a + (Number(b.price) || 0), 0)
// OCR les oft ártal vitlaust. Flöggum ef dagsetning er meira en mánuður frá í dag (aftur í tímann eða fram).
const dateLooksOff = (d) => {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const diff = Math.abs(new Date(d + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime())
  return diff > 31 * 86400000
}
const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d } }

// Flæði: taka mynd → lesa (Tesseract) → staðfesta/laga → vista.
export default function ReceiptScanner({ onSave, onClose }) {
  const fileRef = useRef(null)
  const [phase, setPhase] = useState('capture') // capture | reading | review
  const [progress, setProgress] = useState(0)
  const [store, setStore] = useState('')
  const [date, setDate] = useState(today())
  const [items, setItems] = useState([])
  const [total, setTotal] = useState('')
  const [saving, setSaving] = useState(false)

  useBackClose(true, onClose)

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setPhase('reading'); setProgress(0)
    try {
      const res = await parseReceipt(file, setProgress)
      setStore(res.store || '')
      if (res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date)) setDate(res.date)
      setItems((res.items || []).map((x, i) => ({ id: i + '_' + Date.now(), name: x.name, price: x.price ?? '' }))
      )
      setTotal(res.total != null ? String(res.total) : '')
    } catch (err) {
      setItems([])
    }
    setPhase('review')
  }

  const setItem = (id, field, val) => setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it))
  const delItem = (id) => setItems(items.filter(it => it.id !== id))
  const addRow = () => setItems([...items, { id: 'n_' + Date.now(), name: '', price: '' }])

  const save = async () => {
    const clean = items
      .map(it => ({ name: (it.name || '').trim(), price: it.price === '' ? null : Number(it.price) }))
      .filter(it => it.name)
    setSaving(true)
    try {
      await onSave({
        store: store.trim(),
        purchased_at: date,
        total: total === '' ? sum(clean) : Number(total),
        items: clean,
      })
      onClose()
    } catch (e) {
      setSaving(false)
    }
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal receipt-modal" onClick={e => e.stopPropagation()}>
        <h2>Skrá kvittun <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        {phase === 'capture' && (
          <>
            <p className="muted-p">Taktu mynd af kassakvittuninni. Appið les vörur og verð — þú getur lagað áður en þú vistar.</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
            <button className="add-recipe-btn" onClick={() => fileRef.current && fileRef.current.click()}>📸 Taka mynd af kvittun</button>
          </>
        )}

        {phase === 'reading' && (
          <div className="receipt-reading">
            <p>Les kvittun… {Math.round(progress * 100)}%</p>
            <div className="progress-bar"><div style={{ width: Math.round(progress * 100) + '%' }} /></div>
            <p className="muted-p">Fyrsta skipti tekur lengri tíma (sækir íslenskt málgagn).</p>
          </div>
        )}

        {phase === 'review' && (
          <>
            <div className="receipt-meta">
              <input className="dialog-input" value={store} onChange={e => setStore(e.target.value)} placeholder="Verslun (t.d. Bónus)" />
              <input className="dialog-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {dateLooksOff(date) && (
              <div className="receipt-datewarn">⚠️ Dagsetningin les sem <b>{fmtDate(date)}</b> — meira en mánuður frá í dag. Er ártalið örugglega rétt? Skönnun les ártal oft vitlaust. Leiðréttu hér að ofan ef þarf.</div>
            )}
            {items.length === 0 && <p className="muted-p">Engar línur lásust — bættu þeim við handvirkt.</p>}
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
              <input value={total} onChange={e => setTotal(e.target.value)} placeholder={String(sum(items.map(i => ({ price: i.price }))))} inputMode="decimal" />
              <span>kr</span>
            </div>
            <button className="add-recipe-btn" onClick={save} disabled={saving}>{saving ? 'Vista…' : 'Vista kvittun'}</button>
          </>
        )}
      </div>
    </div>
  )
}
