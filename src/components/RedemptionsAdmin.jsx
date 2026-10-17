import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import { IconX, IconGift, IconCheck, IconCircleX, IconClock, IconTruckDelivery, IconBuildingStore, IconPhoto, IconAlertTriangle, IconChevronDown, IconChevronUp } from '@tabler/icons-react'

// Yfirferð útleysinga (stjórnandi). Samþykkt = kvittanir notandans skoðaðar með myndum → öll stig hans í bið verða
// samþykkt og útleysingin dregst frá. Höfnun fylgir skýring sem notandinn sér; stigin standa.

const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des']
const fmt = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${Number(m[3])}. ${MONTHS[Number(m[2]) - 1]}` : '' }
const STATUS = { pending: ['Í yfirferð', 'pend', IconClock], approved: ['Samþykkt', 'ok', IconCheck], delivered: ['Afhent', 'ok', IconCheck], rejected: ['Hafnað', 'no', IconCircleX] }

function Receipt({ r }) {
  const [url, setUrl] = useState(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { if (open && r.receipt_path && !url) store.getReceiptUrl(r.receipt_path).then(setUrl).catch(() => {}) }, [open])
  const pts = (r.earnings || []).reduce((s, e) => s + Number(e.value || 0), 0)
  return (
    <div className={'ra-rcpt' + (r.dup_users > 0 ? ' warn' : '')}>
      <button className="ra-rcpt-h" onClick={() => setOpen(o => !o)}>
        <span className="ra-rcpt-store">{r.store || 'Óþekkt búð'} <small>{fmt(r.purchased_at)} · {num(r.total)} kr</small></span>
        <span className="ra-rcpt-meta">
          {r.dup_users > 0 && <span className="ra-flag" title="Sama kvittun hjá öðrum notanda"><IconAlertTriangle size={13} stroke={2.2} /> {r.dup_users}</span>}
          {r.receipt_path ? <IconPhoto size={15} stroke={1.9} className="ra-has-img" /> : <span className="ra-noimg">engin mynd</span>}
          <b>{pts > 0 ? `+${num(pts)}` : '—'}</b>
          {open ? <IconChevronUp size={15} stroke={2} /> : <IconChevronDown size={15} stroke={2} />}
        </span>
      </button>
      {open && (
        <div className="ra-rcpt-body">
          {r.receipt_path ? (url ? <img className="ra-img" src={url} alt="Kvittun" /> : <div className="bd-muted">Sæki mynd…</div>) : <div className="ra-noimg-box">Engin kvittanamynd var geymd með þessari kvittun.</div>}
          <div className="ra-lines">
            {(r.items || []).map((it, i) => {
              const e = (r.earnings || []).find(x => x.product_name && it.name && x.product_name.toLowerCase().split(' ')[0] && it.name.toLowerCase().includes(x.product_name.toLowerCase().split(' ')[0]))
              return <div key={i} className={'ra-line' + (e ? ' hit' : '')}><span>{it.qty && Number(it.qty) !== 1 ? `${num(it.qty)} × ` : ''}{it.name}</span><span>{it.price != null ? `${num(it.price)} kr` : ''}</span></div>
            })}
          </div>
          {(r.earnings || []).length > 0 && <div className="ra-earn">{(r.earnings || []).map(e => <span key={e.id}>{e.product_name} <b>+{num(e.value)}</b></span>)}</div>}
        </div>
      )}
    </div>
  )
}

function Review({ red, onDone }) {
  const [receipts, setReceipts] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { store.adminUserReceipts(red.user_id, 60).then(setReceipts).catch(() => setReceipts([])) }, [red.id])
  const act = async (action) => {
    if (action === 'rejected' && !note.trim()) { window.alert('Skrifaðu stutta skýringu sem notandinn sér.'); return }
    if (!window.confirm(action === 'approved' ? `Samþykkja útleysingu fyrir ${red.name}? Öll stig notandans í bið verða samþykkt og ${num(red.points)} dregin frá.` : `Hafna beiðni ${red.name}?`)) return
    setBusy(true)
    try { await store.reviewRedemption(red.id, action, note); onDone() } catch (e) { window.alert('Tókst ekki: ' + (e.message || e)) }
    setBusy(false)
  }
  const withImg = (receipts || []).filter(r => r.receipt_path).length
  const flagged = (receipts || []).filter(r => r.dup_users > 0).length
  return (
    <div className="ra-review">
      <div className="ra-sum">
        <span><b>{num(red.available)}</b> stig tiltæk</span>
        <span><b>{receipts ? receipts.length : '…'}</b> kvittanir 60 d.</span>
        <span><b>{withImg}</b> með mynd</span>
        {flagged > 0 && <span className="ra-flag"><IconAlertTriangle size={13} stroke={2.2} /> {flagged} tvítekin</span>}
      </div>
      {receipts === null && <div className="bd-muted">Sæki kvittanir…</div>}
      {receipts && receipts.length === 0 && <div className="bd-muted">Engar kvittanir síðustu 60 daga.</div>}
      {receipts && receipts.map(r => <Receipt key={r.id} r={r} />)}
      <input className="dialog-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Athugasemd (sýnd notanda ef hafnað)" />
      <div className="bc-actions">
        <button className="ghost-btn danger" onClick={() => act('rejected')} disabled={busy}><IconCircleX size={15} stroke={2} /> Hafna</button>
        <button className="primary-btn" onClick={() => act('approved')} disabled={busy}><IconCheck size={15} stroke={2.2} /> Samþykkja</button>
      </div>
    </div>
  )
}

export default function RedemptionsAdmin({ onClose }) {
  const [list, setList] = useState(null)
  const [openId, setOpenId] = useState(null)
  useBackClose(true, onClose)
  const load = () => store.adminRedemptions().then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])
  const pending = (list || []).filter(r => r.status === 'pending')
  const done = (list || []).filter(r => r.status !== 'pending')
  const Row = ({ r }) => {
    const [label, cls, Ico] = STATUS[r.status] || STATUS.pending
    const isOpen = openId === r.id
    return (
      <div className={'ra-item' + (isOpen ? ' open' : '')}>
        <button className="ra-item-h" onClick={() => setOpenId(isOpen ? null : r.id)}>
          <div className="ra-who"><b>{r.name}</b><small>{r.email || ''} · {r.phone} · {r.delivery === 'home' ? <><IconTruckDelivery size={12} stroke={2} /> {r.address}</> : <><IconBuildingStore size={12} stroke={2} /> sækir</>}</small></div>
          <div className="ra-what"><span>{r.offer_title}</span><small>{num(r.points)} stig · {fmt(r.created_at)}</small></div>
          <span className={'bc-status ' + cls}><Ico size={13} stroke={2.2} /> {label}</span>
        </button>
        {isOpen && r.status === 'pending' && <Review red={r} onDone={() => { setOpenId(null); load() }} />}
        {isOpen && r.status !== 'pending' && <div className="ra-review"><div className="bd-muted">{r.status === 'rejected' ? `Hafnað${r.review_note ? ': ' + r.review_note : ''}` : r.status === 'delivered' ? `Afhent ${fmt(r.delivered_at)}` : `Samþykkt ${fmt(r.reviewed_at)} — bíður afhendingar hjá vörumerkinu`}</div></div>}
      </div>
    )
  }
  return (
    <div className="sheet-bg center" onClick={e => { e.stopPropagation(); onClose() }}>
      <div className="modal adm-modal" onClick={e => e.stopPropagation()}>
        <h2><span className="h2-ico green"><IconGift size={20} stroke={1.75} /></span>Útleysingar <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="muted-p">Opnaðu beiðni, skoðaðu kvittanirnar og myndirnar. Samþykkt staðfestir öll stig notandans og sendir nafn og síma til vörumerkisins, sem afhendir.</p>
        {list === null && <div className="bd-muted">Sæki…</div>}
        {list && list.length === 0 && <div className="bd-muted">Engin beiðni enn.</div>}
        {pending.length > 0 && <div className="adm-head">Bíða yfirferðar <small className="rw-pendcount">{pending.length}</small></div>}
        {pending.map(r => <Row key={r.id} r={r} />)}
        {done.length > 0 && <div className="adm-head">Afgreiddar</div>}
        {done.map(r => <Row key={r.id} r={r} />)}
      </div>
    </div>
  )
}
