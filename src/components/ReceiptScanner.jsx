import React, { useEffect, useRef, useState } from 'react'
import { parseReceipt } from '../lib/receipt.js'
import { store as db } from '../lib/store.js'

// Texti á pörunar-merki: „🎁 Nathan · Nutella · +50 kr"
const matchLabel = (p) => {
  if (!p) return ''
  const v = Number(p.reward_value) || 0
  const val = p.reward_type === 'percent' ? `${v}% til baka` : `+${v} kr`
  return `🎁 ${p.brand ? p.brand + ' · ' : ''}${p.name} · ${val}`
}
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
export default function ReceiptScanner({ onSave, onClose, onCheckDuplicate }) {
  const fileRef = useRef(null)
  const [phase, setPhase] = useState('capture') // capture | reading | review
  const [progress, setProgress] = useState(0)
  const [store, setStore] = useState('')
  const [date, setDate] = useState(today())
  const [items, setItems] = useState([])
  const [total, setTotal] = useState('')
  const [saving, setSaving] = useState(false)
  const [dup, setDup] = useState(null)
  const [scannedOnce, setScannedOnce] = useState(() => { try { return localStorage.getItem('korfan.scannedOnce') === '1' } catch { return false } })

  useBackClose(true, onClose)

  // Tilboðsvörur fyrir AI-pörun — sóttar strax þegar glugginn opnast (tilbúnar áður en mynd er tekin).
  const matchRef = useRef(null)
  if (!matchRef.current) {
    matchRef.current = (db.getRewardMatchList ? db.getRewardMatchList() : Promise.resolve([])).catch(() => [])
  }
  const [matchList, setMatchList] = useState([])
  useEffect(() => { matchRef.current.then(l => setMatchList(l || [])) }, [])
  const prodById = (id) => (id ? matchList.find(p => p.id === id) : null)

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setPhase('reading'); setProgress(0)
    try {
      const prods = await matchRef.current
      const res = await parseReceipt(file, setProgress, prods)
      setStore(res.store || '')
      if (res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date)) setDate(res.date)
      setItems((res.items || []).map((x, i) => ({ id: i + '_' + Date.now(), name: x.name, price: x.price ?? '', reward_product_id: x.reward_product_id || null }))
      )
      setTotal(res.total != null ? String(res.total) : '')
      try { localStorage.setItem('korfan.scannedOnce', '1') } catch {}
      setScannedOnce(true)
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
      .map(it => ({ name: (it.name || '').trim(), price: it.price === '' ? null : Number(it.price), reward_product_id: it.reward_product_id || null }))
      .filter(it => it.name)
    const payload = {
      store: store.trim(),
      purchased_at: date,
      total: total === '' ? sum(clean) : Number(total),
      items: clean,
    }
    setSaving(true)
    try {
      if (!dup && onCheckDuplicate) {
        const existing = await onCheckDuplicate(payload)
        if (existing) { setDup(existing); setSaving(false); return }
      }
      await onSave(payload)
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
            {!scannedOnce && <p className="muted-p">Fyrsta skipti tekur lengri tíma (sækir íslenskt málgagn).</p>}
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
              {items.map(it => {
                const mp = prodById(it.reward_product_id)
                return (
                  <React.Fragment key={it.id}>
                    <div className={'receipt-row' + (mp ? ' is-match' : '')}>
                      <input value={it.name} onChange={e => setItem(it.id, 'name', e.target.value)} placeholder="Vara" />
                      <input className="receipt-price" value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} placeholder="kr" inputMode="decimal" />
                      <button className="receipt-del" onClick={() => delItem(it.id)} aria-label="Eyða">×</button>
                    </div>
                    {mp && <div className="receipt-match">{matchLabel(mp)}</div>}
                  </React.Fragment>
                )
              })}
            </div>
            <button className="receipt-addrow" onClick={addRow}>+ Bæta við línu</button>
            <div className="receipt-total">
              <span>Samtals</span>
              <input value={total} onChange={e => setTotal(e.target.value)} placeholder={String(sum(items.map(i => ({ price: i.price }))))} inputMode="decimal" />
              <span>kr</span>
            </div>
            {dup && (
              <div className="receipt-datewarn">⚠️ Þessi kvittun virðist þegar skráð{dup.purchased_at ? ' (' + dup.store + ', ' + fmtDate(dup.purchased_at) + ')' : ''}. Ef hún er ný, ýttu aftur á „Vista samt".</div>
            )}
            <button className="add-recipe-btn" onClick={save} disabled={saving}>{saving ? 'Vista…' : (dup ? 'Vista samt' : 'Vista kvittun')}</button>
          </>
        )}
      </div>
    </div>
  )
}
