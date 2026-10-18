import React, { useEffect, useRef, useState } from 'react'
import { parseReceipt } from '../lib/receipt.js'
import { store as db } from '../lib/store.js'

// Texti á pörunar-merki: „Nathan · Nutella · +50 stig" (gjafatákn birt í JSX)
const matchLabel = (p) => {
  if (!p) return ''
  const v = Number(p.reward_value) || 0
  const val = p.reward_type === 'percent' ? `${v}% í stigum` : `+${v} stig`
  return `${p.brand ? p.brand + ' · ' : ''}${p.name} · ${val}`
}
import { useBackClose } from '../lib/backstack.js'
import CameraCapture from './CameraCapture.jsx'
import { IconAlertTriangle, IconArchive, IconCamera, IconGift, IconShieldCheck, IconX } from '@tabler/icons-react'

const today = () => new Date().toISOString().slice(0, 10)
const sum = (items) => items.reduce((a, b) => a + (Number(b.price) || 0), 0)
// OCR les oft ártal vitlaust. Flöggum ef dagsetning er meira en mánuður frá í dag (aftur í tímann eða fram).
const dateLooksOff = (d) => {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const diff = Math.abs(new Date(d + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime())
  return diff > 31 * 86400000
}
// Ábyrgð: dagsetning + N ár (YYYY-MM-DD). Skilafrestur: dagsetning + N dagar.
const addYears = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCFullYear(x.getUTCFullYear() + n); return x.toISOString().slice(0, 10) }
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
const nextW = (w) => (w === 0 ? 2 : w === 2 ? 5 : 0)
const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d } }

// Flæði: taka mynd → lesa (Tesseract) → staðfesta/laga → vista.
// requireImage: boðshópur Gríptu — myndin er geymd alltaf (skoðuð áður en karfa er afhent), ekki hægt að afhaka.
export default function ReceiptScanner({ onSave, onClose, onCheckDuplicate, requireImage = false }) {
  const fileRef = useRef(null)
  const [phase, setPhase] = useState('capture') // capture | reading | review
  const [progress, setProgress] = useState(0)
  const [store, setStore] = useState('')
  const [date, setDate] = useState(today())
  const [items, setItems] = useState([])
  const [total, setTotal] = useState('')
  const [saving, setSaving] = useState(false)
  const [dup, setDup] = useState(null)
  const [archive, setArchive] = useState(null)   // mynd af kvittun til geymslu
  const [ident, setIdent] = useState({})          // auðkenni af kvittun: receipt_no, register, time, vat_total (svikavörn)
  const [failed, setFailed] = useState(null)       // 'network' | 'decode' | 'empty' | null — af hverju lesturinn skilaði engu
  const [camera, setCamera] = useState(false)      // lifandi myndataka (aðalleið í síma; sparar minni)
  const canCamera = typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  const [keepImage, setKeepImage] = useState(true)
  const [returnDays, setReturnDays] = useState(0) // 0 = enginn skilafrestur skráður
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

  const onFile = (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ''; if (file) handleFile(file) }
  const handleFile = async (file) => {
    setCamera(false)
    setPhase('reading'); setProgress(0)
    try {
      const prods = await matchRef.current
      const res = await parseReceipt(file, setProgress, prods)
      setStore(res.store || '')
      if (res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date)) setDate(res.date)
      setItems((res.items || []).map((x, i) => ({ id: i + '_' + Date.now(), name: x.name, qty: x.qty && x.qty !== 1 ? x.qty : 1, price: x.price ?? '', reward_product_id: x.reward_product_id || null, w: x.warranty_years || 0 }))
      )
      setArchive(res.archive || null)
      setFailed(res.failed || null)
      setIdent({ receipt_no: res.receipt_no || null, register: res.register || null, receipt_time: res.time || null, vat_total: res.vat_total ?? null })
      setTotal(res.total != null ? String(res.total) : '')
      try { localStorage.setItem('korfan.scannedOnce', '1') } catch {}
      setScannedOnce(true)
    } catch (err) {
      setItems([]); setFailed('network')
    }
    setPhase('review')
  }

  const setItem = (id, field, val) => setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it))
  const delItem = (id) => setItems(items.filter(it => it.id !== id))
  const addRow = () => setItems([...items, { id: 'n_' + Date.now(), name: '', qty: 1, price: '', w: 0 }])

  const save = async () => {
    const clean = items
      .map(it => ({ name: (it.name || '').trim(), qty: Number(it.qty) > 0 ? Number(it.qty) : 1, price: it.price === '' ? null : Number(it.price), reward_product_id: it.reward_product_id || null, warranty_until: it.w ? addYears(date, it.w) : null }))
      .filter(it => it.name)
    const payload = {
      store: store.trim(),
      purchased_at: date,
      total: total === '' ? sum(clean) : Number(total),
      items: clean,
      return_until: returnDays ? addDays(date, returnDays) : null,
      archive: (keepImage || requireImage) ? archive : null,
      ...ident,
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
        <h2>Skrá kvittun <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        {phase === 'capture' && (
          <>
            <p className="muted-p">Taktu mynd af kassakvittuninni. Appið les vörur og verð — þú getur lagað áður en þú vistar.</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
            <button className="add-recipe-btn" onClick={() => canCamera ? setCamera(true) : fileRef.current && fileRef.current.click()}><IconCamera size={19} stroke={1.9} /> Taka mynd af kvittun</button>
            {canCamera && <button className="ghost-btn receipt-alt" onClick={() => fileRef.current && fileRef.current.click()}>Velja mynd úr myndasafni</button>}
            {camera && <CameraCapture onCapture={handleFile} onPickFile={() => { setCamera(false); setTimeout(() => fileRef.current && fileRef.current.click(), 50) }} onClose={() => setCamera(false)} />}
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
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Dagsetningin les sem <b>{fmtDate(date)}</b> — meira en mánuður frá í dag. Er ártalið örugglega rétt? Skönnun les ártal oft vitlaust. Leiðréttu hér að ofan ef þarf.</span></div>
            )}
            {items.length === 0 && failed === 'network' && <div className="receipt-fail"><b>Náði ekki sambandi við kvittanalesarann.</b> Athugaðu netið og reyndu aftur með „Skanna aftur“, eða skráðu línurnar handvirkt.</div>}
            {items.length === 0 && failed === 'decode' && <div className="receipt-fail"><b>Náði ekki að opna myndina.</b> Prófaðu að taka myndina beint með myndavélinni í stað þess að velja úr myndasafni.</div>}
            {items.length === 0 && failed === 'empty' && <div className="receipt-fail"><b>Kvittanalesarinn fann engar vörur á myndinni.</b> Er myndin skýr og kvittunin öll í ramma? Reyndu aftur eða skráðu handvirkt.</div>}
            {items.length === 0 && !failed && <p className="muted-p">Engar línur lásust — bættu þeim við handvirkt.</p>}
            {items.length === 0 && <button className="ghost-btn receipt-rescan" onClick={() => { setFailed(null); if (canCamera) { setPhase('capture'); setCamera(true) } else fileRef.current && fileRef.current.click() }}><IconCamera size={16} stroke={1.9} /> Skanna aftur</button>}
            <div className="receipt-items">
              {items.map(it => {
                const mp = prodById(it.reward_product_id)
                return (
                  <React.Fragment key={it.id}>
                    <div className={'receipt-row' + (mp ? ' is-match' : '')}>
                      <input className="receipt-qty" value={it.qty ?? 1} onChange={e => setItem(it.id, 'qty', e.target.value.replace(',', '.'))} inputMode="decimal" aria-label="Magn" title="Magn" />
                      <input value={it.name} onChange={e => setItem(it.id, 'name', e.target.value)} placeholder="Vara" />
                      <input className="receipt-price" value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} placeholder="kr" inputMode="decimal" />
                      <button className={'receipt-warr' + (it.w ? ' on' : '')} onClick={() => setItem(it.id, 'w', nextW(it.w || 0))} title="Ábyrgð: ýttu til að skipta (engin / 2 ár / 5 ár)" aria-label="Ábyrgð">
                        <IconShieldCheck size={16} stroke={1.75} />{it.w ? <span>{it.w} ár</span> : null}
                      </button>
                      <button className="receipt-del" onClick={() => delItem(it.id)} aria-label="Eyða"><IconX size={16} stroke={1.75} /></button>
                    </div>
                    {mp && <div className="receipt-match"><IconGift size={13} stroke={2} />{matchLabel(mp)}</div>}
                  </React.Fragment>
                )
              })}
            </div>
            <button className="receipt-addrow" onClick={addRow}>+ Bæta við línu</button>
            {items.some(i => i.w) && <p className="receipt-hint"><IconShieldCheck size={14} stroke={1.9} /> Gervigreindin merkti vörur með ábyrgð. Þú færð áminningu mánuði áður en hún rennur út.</p>}
            <div className="receipt-return">
              <span>Skilafrestur</span>
              <div className="seg-mini">
                {[0, 14, 30].map(d => <button key={d} className={returnDays === d ? 'on' : ''} onClick={() => setReturnDays(d)}>{d ? d + ' dagar' : 'Enginn'}</button>)}
              </div>
            </div>
            {archive && requireImage && (
              <label className="receipt-keep locked"><input type="checkbox" checked readOnly disabled /> <IconArchive size={16} stroke={1.75} /> Mynd af kvittun er geymd — Gríptu skoðar hana áður en karfa er afhent. Aðeins þú, heimilið og Gríptu sjáið hana.</label>
            )}
            {archive && !requireImage && (
              <label className="receipt-keep"><input type="checkbox" checked={keepImage} onChange={e => setKeepImage(e.target.checked)} /> <IconArchive size={16} stroke={1.75} /> Geyma mynd af kvittun (aðeins þú og heimilið sjáið hana)</label>
            )}
            <div className="receipt-total">
              <span>Samtals</span>
              <input value={total} onChange={e => setTotal(e.target.value)} placeholder={String(sum(items.map(i => ({ price: i.price }))))} inputMode="decimal" />
              <span>kr</span>
            </div>
            {dup && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Þessi kvittun virðist þegar skráð{dup.purchased_at ? ' (' + dup.store + ', ' + fmtDate(dup.purchased_at) + ')' : ''}. Ef hún er ný, ýttu aftur á „Vista samt".</span></div>
            )}
            <button className="add-recipe-btn" onClick={save} disabled={saving}>{saving ? 'Vista…' : (dup ? 'Vista samt' : 'Vista kvittun')}</button>
          </>
        )}
      </div>
    </div>
  )
}
