import React, { useEffect, useState } from 'react'
import ZoomImg from './ZoomImg.jsx'
import { store } from '../lib/store.js'
import { IconX, IconCheck, IconBan, IconPhoto, IconTicket } from '@tabler/icons-react'

// Yfirferð vinninga úr herferðum (skyndiherferðir / stimpilkort). Vinningur lendir hér þegar kvittun er
// grunsamleg (óstaðfest summa, flögg) eða þegar kóðar eru búnir. Samþykki úthlutar kóða og sendir notanda póst.
const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const when = (d) => { try { return new Date(d).toLocaleString('is-IS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return d } }
const FLAG = { dup_receipt_no_same_user: 'Sama kvittananúmer hjá notanda', dup_receipt_no_other_user: 'Sama númer hjá öðrum notanda', no_receipt_no: 'Ekkert kvittananúmer', no_image: 'Engin mynd' }

function Row({ a, onDone }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open && a.receipt_path && !url) store.getReceiptUrl(a.receipt_path).then(setUrl).catch(() => {}) }, [open])
  const act = async (action) => {
    setBusy(true)
    try { const r = await store.reviewAward(a.id, action, note); if (r && r.ok === false) window.alert(r.reason === 'no_codes_left' ? 'Engir kóðar eftir — vörumerkið þarf að bæta við.' : 'Tókst ekki.'); onDone() }
    catch (e) { window.alert(e.message || 'Villa') } finally { setBusy(false) }
  }
  return (
    <div className={'ra-item' + (open ? ' open' : '')}>
      <button className="ra-item-h" onClick={() => setOpen(o => !o)}>
        <span className="ra-who"><b>{a.user_email}</b><small>{a.brand} · {a.campaign} · {when(a.created_at)}</small></span>
        <span className="ra-amt"><IconTicket size={14} stroke={2} /> {a.prize}</span>
        {a.receipt_path ? <IconPhoto size={15} stroke={1.9} className="ra-has-img" /> : <span className="ra-noimg">engin mynd</span>}
        <span className={'ra-status ra-' + a.status}>{a.status === 'pending_review' ? 'Í yfirferð' : a.status === 'awarded' ? 'Veitt' : 'Hafnað'}</span>
      </button>
      {open && (
        <div className="ra-body">
          <div className="ra-meta">
            <span>Búð <b>{a.store || '—'}</b></span><span>Samtala <b>{a.total != null ? num(a.total) + ' kr' : '—'}</b></span>
            {Array.isArray(a.flags) && a.flags.length > 0 && <span className="ra-flags">{a.flags.map(f => <em key={f}>{FLAG[f] || f}</em>)}</span>}
          </div>
          {a.receipt_path ? (url ? <ZoomImg className="ra-img" src={url} alt="Kvittun" /> : <div className="bd-muted">Sæki mynd…</div>) : <div className="ra-noimg-box">Engin kvittanamynd.</div>}
          {a.status === 'pending_review' && (
            <>
              <input className="dialog-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Athugasemd (sést notanda ef hafnað)" />
              <div className="bc-actions">
                <button className="ghost-btn danger" onClick={() => act('reject')} disabled={busy}><IconBan size={16} stroke={2} /> Hafna</button>
                <button className="primary-btn" onClick={() => act('approve')} disabled={busy}><IconCheck size={16} stroke={2} /> Samþykkja og senda kóða</button>
              </div>
            </>
          )}
          {a.review_note && <div className="bd-muted">Athugasemd: {a.review_note}</div>}
        </div>
      )}
    </div>
  )
}

export default function AwardsAdmin({ onClose }) {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('pending_review')
  const load = () => store.adminAwards(filter === 'all' ? null : filter).then(setList).catch(() => setList([]))
  useEffect(() => { setList(null); load() }, [filter])
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal ra-modal" onClick={e => e.stopPropagation()}>
        <h2>Vinningar úr herferðum <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <div className="seg-mini ra-seg">
          {[['pending_review', 'Í yfirferð'], ['awarded', 'Veittir'], ['rejected', 'Hafnað'], ['all', 'Allir']].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        {list === null && <div className="bd-muted">Sæki…</div>}
        {list && list.length === 0 && <div className="bd-muted">Ekkert hér.</div>}
        {list && list.map(a => <Row key={a.id} a={a} onDone={load} />)}
      </div>
    </div>
  )
}
