import React, { useEffect, useMemo, useRef, useState } from 'react'
import { store } from '../lib/store.js'
import { makeArchiveImage } from '../lib/receipt.js'
import { useBackClose } from '../lib/backstack.js'
import {
  IconX, IconSearch, IconShieldCheck, IconArrowBackUp, IconReceipt, IconPhoto, IconCamera,
  IconShare, IconTrash, IconExternalLink, IconChevronRight, IconArrowLeft,
} from '@tabler/icons-react'

// Kvittana- og ábyrgðageymsla: allar kvittanir heimilisins, ábyrgðir sem eru í gildi,
// skilafrestir og mynd af kvittun. Myndir eru í einkageymslu (signed URL, 10 mín).

const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS').replace(/,/g, '.') + ' kr'
const todayISO = () => new Date().toISOString().slice(0, 10)
const MONTHS = ['jan.', 'feb.', 'mars', 'apr.', 'maí', 'júní', 'júlí', 'ág.', 'sept.', 'okt.', 'nóv.', 'des.']
const fmt = (d) => { if (!d) return ''; const [y, m, dd] = d.split('-').map(Number); return `${dd}. ${MONTHS[m - 1]} ${y}` }
const daysUntil = (d) => Math.round((new Date(d + 'T00:00:00Z') - new Date(todayISO() + 'T00:00:00Z')) / 86400000)
const addYears = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCFullYear(x.getUTCFullYear() + n); return x.toISOString().slice(0, 10) }
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
const leftLabel = (n) => n < 0 ? 'runnið út' : n === 0 ? 'í dag' : n < 60 ? `${n} ${n === 1 ? 'dagur' : 'dagar'}` : n < 730 ? `${Math.round(n / 30)} mán.` : `${(n / 365).toFixed(1).replace('.', ',')} ár`
const norm = (s) => (s || '').toLowerCase()

// Fjöldi ábyrgða/skilafresta sem renna út fljótlega — notað á heimaskjá.
export function receiptAlerts(purchases = []) {
  const t = todayISO()
  const out = []
  for (const p of purchases) {
    if (p.return_until && p.return_until >= t && daysUntil(p.return_until) <= 7) out.push({ kind: 'return', days: daysUntil(p.return_until), label: p.store || 'Kvittun', p })
    for (const it of (p.items || [])) {
      if (it.warranty_until && it.warranty_until >= t && daysUntil(it.warranty_until) <= 30) out.push({ kind: 'warranty', days: daysUntil(it.warranty_until), label: it.name, p })
    }
  }
  return out.sort((a, b) => a.days - b.days)
}

function Detail({ p, canEdit, onBack, onChanged }) {
  const [url, setUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  useEffect(() => {
    let alive = true
    setUrl(null)
    if (p.receipt_path) store.getReceiptUrl(p.receipt_path).then(u => { if (alive) setUrl(u) }).catch(() => {})
    return () => { alive = false }
  }, [p.receipt_path])

  const cycleWarranty = async (it) => {
    if (!canEdit) return
    // Núverandi ábyrgð í árum frá kaupdegi → næsta gildi: engin → 2 ár → 5 ár → engin.
    const cur = it.warranty_until ? Math.round((new Date(it.warranty_until) - new Date(p.purchased_at)) / (365.25 * 86400000)) : 0
    const next = cur === 0 ? 2 : cur <= 2 ? 5 : 0
    setBusy(true)
    try { await store.setItemWarranty(it.id, next ? addYears(p.purchased_at, next) : null); await onChanged() } finally { setBusy(false) }
  }
  const setReturn = async (days) => {
    if (!canEdit) return
    setBusy(true)
    try { await store.setReturnUntil(p.id, days ? addDays(p.purchased_at, days) : null); await onChanged() } finally { setBusy(false) }
  }
  const attach = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''
    if (!f) return
    setBusy(true)
    try { const blob = await makeArchiveImage(f); if (blob) { await store.uploadReceiptImage(p.id, blob); await onChanged() } } finally { setBusy(false) }
  }
  const removeImg = async () => {
    if (!window.confirm('Eyða mynd af kvittuninni? Færslan sjálf heldur sér.')) return
    setBusy(true)
    try { await store.removeReceiptImage(p.id, p.receipt_path); setUrl(null); await onChanged() } finally { setBusy(false) }
  }
  const share = async () => {
    if (!url) return
    try {
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], `kvittun-${(p.store || 'verslun').replace(/\s+/g, '-')}-${p.purchased_at}.jpg`, { type: blob.type || 'image/jpeg' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Kvittun' })
      else window.open(url, '_blank', 'noopener')
    } catch (e) { /* hætt við */ }
  }
  const retDays = p.return_until ? Math.round((new Date(p.return_until) - new Date(p.purchased_at)) / 86400000) : 0

  return (
    <div className="rc-detail">
      <button className="back" onClick={onBack}><IconArrowLeft size={18} stroke={1.9} /> Kvittanir</button>
      <div className="rc-d-head">
        <div><div className="rc-d-store">{p.store || 'Kvittun'}</div><div className="rc-d-meta">{fmt(p.purchased_at)}</div></div>
        <div className="rc-d-total">{kr(p.total)}</div>
      </div>

      <div className="rc-img-box">
        {p.receipt_path
          ? (url ? <img className="rc-img" src={url} alt="Kvittun" onClick={() => window.open(url, '_blank', 'noopener')} /> : <div className="rc-img-ph">Sæki mynd…</div>)
          : <div className="rc-img-ph"><IconPhoto size={28} stroke={1.5} /><span>Engin mynd geymd</span></div>}
      </div>
      <div className="rc-img-actions">
        {url && <button onClick={share}><IconShare size={17} stroke={1.75} /> Deila</button>}
        {url && <button onClick={() => window.open(url, '_blank', 'noopener')}><IconExternalLink size={17} stroke={1.75} /> Opna</button>}
        {canEdit && !p.receipt_path && (<>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={attach} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}><IconCamera size={17} stroke={1.75} /> Bæta við mynd</button>
        </>)}
        {canEdit && p.receipt_path && <button className="danger" onClick={removeImg} disabled={busy}><IconTrash size={17} stroke={1.75} /> Eyða mynd</button>}
      </div>

      <div className="modal-label">Skilafrestur</div>
      <div className="seg-mini wide">
        {[0, 14, 30].map(d => <button key={d} className={retDays === d || (!p.return_until && d === 0) ? 'on' : ''} disabled={!canEdit || busy} onClick={() => setReturn(d)}>{d ? d + ' dagar' : 'Enginn'}</button>)}
      </div>
      {p.return_until && <p className="rc-note">Skila í síðasta lagi {fmt(p.return_until)} ({leftLabel(daysUntil(p.return_until))}).</p>}

      <div className="modal-label">Vörur <span className="rc-label-hint">— ýttu á skjöldinn til að skrá ábyrgð</span></div>
      <div className="rc-items">
        {(p.items || []).map(it => (
          <div className="rc-item" key={it.id || it.name}>
            <span className="rc-item-name">{it.name}</span>
            <span className="rc-item-price">{it.price != null ? kr(it.price) : ''}</span>
            <button className={'receipt-warr' + (it.warranty_until ? ' on' : '')} disabled={!canEdit || busy} onClick={() => cycleWarranty(it)} aria-label="Ábyrgð">
              <IconShieldCheck size={16} stroke={1.75} />{it.warranty_until ? <span>til {fmt(it.warranty_until)}</span> : null}
            </button>
          </div>
        ))}
        {(!p.items || !p.items.length) && <p className="empty" style={{ margin: '4px 0' }}>Engar vörulínur skráðar.</p>}
      </div>
      <p className="rc-legal">Samkvæmt neytendakaupalögum er kvörtunarfrestur almennt 2 ár, og 5 ár fyrir hluti sem eiga að endast verulega lengur. Ábyrgð seljanda getur verið lengri.</p>
    </div>
  )
}

export default function ReceiptsView({ purchases = [], currentUserId, onClose, onChanged, onScanReceipt }) {
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  useBackClose(true, onClose)
  useBackClose(!!openId, () => setOpenId(null)) // til baka úr smáatriðum → aftur í lista

  const t = todayISO()
  const hit = (p) => {
    const s = norm(q).trim(); if (!s) return true
    return norm(p.store).includes(s) || (p.items || []).some(i => norm(i.name).includes(s))
  }
  const shown = useMemo(() => purchases.filter(hit), [purchases, q])
  const warranties = useMemo(() => {
    const out = []
    for (const p of shown) for (const it of (p.items || [])) if (it.warranty_until && it.warranty_until >= t) out.push({ it, p })
    return out.sort((a, b) => a.it.warranty_until.localeCompare(b.it.warranty_until))
  }, [shown])
  const returns = useMemo(() => shown.filter(p => p.return_until && p.return_until >= t).sort((a, b) => a.return_until.localeCompare(b.return_until)), [shown])
  const open = openId ? purchases.find(p => p.id === openId) : null

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal rc-modal" onClick={e => e.stopPropagation()}>
        {open ? (
          <Detail p={open} canEdit={!currentUserId || open.user_id === currentUserId || open.user_id === 'me'} onBack={() => setOpenId(null)} onChanged={onChanged} />
        ) : (<>
          <h2><span className="h2-ico"><IconReceipt size={20} stroke={1.75} /></span>Kvittanir & ábyrgðir <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
          <div className="rc-search"><IconSearch size={17} stroke={1.75} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Leita — t.d. „ryksuga“ eða „Elko“" /></div>

          {warranties.length > 0 && (<>
            <div className="modal-label">Ábyrgðir í gildi</div>
            {warranties.map(({ it, p }) => {
              const n = daysUntil(it.warranty_until)
              return (
                <button className="rc-row" key={it.id} onClick={() => setOpenId(p.id)}>
                  <span className="rc-ico"><IconShieldCheck size={19} stroke={1.75} /></span>
                  <span className="rc-main"><b>{it.name}</b><small>{p.store} · {fmt(p.purchased_at)}</small></span>
                  <span className={'rc-left' + (n <= 60 ? ' soon' : '')}>{leftLabel(n)}</span>
                </button>
              )
            })}
          </>)}

          {returns.length > 0 && (<>
            <div className="modal-label">Skilafrestur</div>
            {returns.map(p => {
              const n = daysUntil(p.return_until)
              return (
                <button className="rc-row" key={'r' + p.id} onClick={() => setOpenId(p.id)}>
                  <span className="rc-ico"><IconArrowBackUp size={19} stroke={1.75} /></span>
                  <span className="rc-main"><b>{p.store || 'Kvittun'}</b><small>skila fyrir {fmt(p.return_until)}</small></span>
                  <span className={'rc-left' + (n <= 7 ? ' soon' : '')}>{leftLabel(n)}</span>
                </button>
              )
            })}
          </>)}

          <div className="modal-label">Allar kvittanir</div>
          {shown.length === 0 && <p className="empty">{q ? 'Ekkert fannst.' : 'Engar kvittanir enn — skannaðu kvittun og hún geymist hér.'}</p>}
          {shown.slice(0, 200).map(p => (
            <button className="rc-row" key={p.id} onClick={() => setOpenId(p.id)}>
              <span className="rc-ico">{p.receipt_path ? <IconPhoto size={19} stroke={1.75} /> : <IconReceipt size={19} stroke={1.75} />}</span>
              <span className="rc-main"><b>{p.store || 'Kvittun'}</b><small>{fmt(p.purchased_at)}{(p.items || []).length ? ` · ${(p.items || []).length} vörur` : ''}</small></span>
              <span className="rc-amt">{kr(p.total)}</span>
              <IconChevronRight size={16} stroke={1.75} className="rc-go" />
            </button>
          ))}
          {onScanReceipt && <button className="primary-btn" style={{ marginTop: 12 }} onClick={onScanReceipt}><IconCamera size={18} stroke={1.9} /> Skanna kvittun</button>}
        </>)}
      </div>
    </div>
  )
}
