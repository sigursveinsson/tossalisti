import React, { useEffect, useMemo, useRef, useState } from 'react'
import { store } from '../lib/store.js'
import { loadDownscaledCanvas } from '../lib/receipt.js'
import { code128 } from '../lib/barcode.js'
import { useBackClose } from '../lib/backstack.js'
import { IconX, IconWallet, IconCamera, IconPencil, IconTrash, IconArrowLeft, IconCheck, IconEye, IconEyeOff, IconPlus, IconPhoto } from '@tabler/icons-react'

// Veskið: gjafakort, inneignarnótur, afsláttarkóðar og vildarkort á einum stað.
// Mynd → gervigreind les verslun, upphæð, kóða og gildistíma. Áminning fyrir gildislok (send-reminders).
// Myndir í einkageymslu ('receipts' / <uid>/wallet-<id>.jpg), sóttar með signed URL.

const KINDS = [
  ['gift_card', 'Gjafakort'], ['credit_note', 'Inneignarnóta'], ['coupon', 'Afsláttarkóði'], ['membership', 'Vildarkort'], ['other', 'Annað'],
]
const KIND = Object.fromEntries(KINDS)
const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS').replace(/,/g, '.') + ' kr'
const todayISO = () => new Date().toISOString().slice(0, 10)
const MONTHS = ['jan.', 'feb.', 'mars', 'apr.', 'maí', 'júní', 'júlí', 'ág.', 'sept.', 'okt.', 'nóv.', 'des.']
const fmt = (d) => { if (!d) return ''; const [y, m, dd] = d.split('-').map(Number); return `${dd}. ${MONTHS[m - 1]} ${y}` }
const daysUntil = (d) => Math.round((new Date(d + 'T00:00:00Z') - new Date(todayISO() + 'T00:00:00Z')) / 86400000)
const value = (w) => w.balance != null ? Number(w.balance) : (w.amount != null ? Number(w.amount) : 0)
const expLabel = (d) => { if (!d) return ''; const n = daysUntil(d); return n < 0 ? 'Runnið út' : n === 0 ? 'Rennur út í dag' : n <= 60 ? `Rennur út eftir ${n} ${n === 1 ? 'dag' : 'daga'}` : `Gildir til ${fmt(d)}` }

// Fjöldi korta sem renna út á næstu 30 dögum — notað á heimaskjá.
export function walletAlerts(items = []) {
  const t = todayISO()
  return items.filter(w => !w.used_at && w.expires_on && w.expires_on >= t && daysUntil(w.expires_on) <= 30)
    .sort((a, b) => a.expires_on.localeCompare(b.expires_on))
}

function Barcode({ text }) {
  const b = code128(text)
  if (!b) return null
  return (
    <svg className="wl-barcode" viewBox={`0 0 ${b.width} 60`} preserveAspectRatio="none" role="img" aria-label={'Strikamerki ' + text}>
      <rect x="0" y="0" width={b.width} height="60" fill="#fff" />
      {b.bars.map((r, i) => <rect key={i} x={r.x} y="0" width={r.w} height="60" fill="#000" />)}
    </svg>
  )
}

function Form({ initial, image, reading, onSave, onCancel }) {
  const [f, setF] = useState(() => ({ kind: 'gift_card', store: '', title: '', amount: '', code: '', pin: '', expires_on: '', notes: '', ...initial }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { if (initial) setF(prev => ({ ...prev, ...Object.fromEntries(Object.entries(initial).filter(([, v]) => v != null && v !== '')) })) }, [initial])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (!f.store.trim()) { setErr('Hvaða verslun eða útgefandi?'); return }
    setBusy(true); setErr('')
    try { await onSave(f) } catch (e) { setErr('Ekki tókst að vista: ' + (e.message || e)); setBusy(false) }
  }
  return (
    <div className="wl-form">
      {image && <img className="wl-form-img" src={URL.createObjectURL(image)} alt="" />}
      {reading && <div className="wl-reading">Les kortið…</div>}
      <div className="wl-kinds">
        {KINDS.map(([k, l]) => <button key={k} className={'wl-kind' + (f.kind === k ? ' on' : '')} onClick={() => setF({ ...f, kind: k })}>{l}</button>)}
      </div>
      <label className="wl-lbl">Verslun / útgefandi</label>
      <input className="dialog-input" value={f.store} onChange={set('store')} placeholder="t.d. Hagkaup, Kringlan, Elko" />
      <label className="wl-lbl">Lýsing (valkvætt)</label>
      <input className="dialog-input" value={f.title || ''} onChange={set('title')} placeholder="t.d. Gjafabréf fyrir tvo" />
      <div className="wl-row2">
        <div><label className="wl-lbl">Upphæð (kr)</label><input className="dialog-input" inputMode="numeric" value={f.amount ?? ''} onChange={set('amount')} placeholder="10000" /></div>
        <div><label className="wl-lbl">Gildir til</label><input className="dialog-input" type="date" value={f.expires_on || ''} onChange={set('expires_on')} /></div>
      </div>
      <label className="wl-lbl">Kóði / kortanúmer</label>
      <input className="dialog-input" value={f.code || ''} onChange={set('code')} placeholder="Stendur á kortinu eða undir strikamerkinu" />
      <label className="wl-lbl">PIN (valkvætt)</label>
      <input className="dialog-input" value={f.pin || ''} onChange={set('pin')} placeholder="Falið þar til þú ýtir á „Sýna“" />
      {err && <p className="signin-error">{err}</p>}
      <div className="bc-actions">
        <button className="ghost-btn" onClick={onCancel} disabled={busy}>Hætta við</button>
        <button className="primary-btn" onClick={save} disabled={busy || reading}>{busy ? '…' : 'Vista í Veskið'}</button>
      </div>
    </div>
  )
}

function Detail({ w, onBack, onEdit, onChanged }) {
  const [url, setUrl] = useState(null)
  const [showPin, setShowPin] = useState(false)
  const [bal, setBal] = useState('')
  const [editBal, setEditBal] = useState(false)
  useEffect(() => { if (w.image_path) store.walletImageUrl(w.image_path).then(setUrl).catch(() => {}) }, [w.image_path])
  const upd = async (patch) => { await store.walletSave({ ...w, ...patch }); onChanged() }
  const del = async () => { if (!window.confirm('Eyða „' + (w.store || 'korti') + '“ úr Veskinu?')) return; await store.walletDelete(w); onChanged(); onBack() }
  return (
    <div className="wl-detail">
      <h2><button className="x" style={{ position: 'static', marginRight: 8 }} onClick={onBack} aria-label="Til baka"><IconArrowLeft size={20} stroke={1.75} /></button>{w.store || 'Kort'}</h2>
      <div className="wl-card big">
        <div className="wl-card-kind">{KIND[w.kind] || 'Kort'}{w.title ? ' · ' + w.title : ''}</div>
        <div className="wl-card-val">{value(w) > 0 ? kr(value(w)) : '—'}</div>
        {w.balance != null && w.amount != null && Number(w.balance) !== Number(w.amount) && <div className="wl-card-sub">af {kr(w.amount)}</div>}
        {w.expires_on && <div className={'wl-card-exp' + (daysUntil(w.expires_on) <= 30 ? ' soon' : '')}>{expLabel(w.expires_on)}</div>}
      </div>
      {w.code && (
        <div className="wl-code">
          <Barcode text={w.code} />
          <div className="wl-code-txt">{w.code}</div>
          {w.pin && <button className="wl-pin" onClick={() => setShowPin(s => !s)}>{showPin ? <IconEyeOff size={16} stroke={1.9} /> : <IconEye size={16} stroke={1.9} />} PIN: {showPin ? w.pin : '••••'}</button>}
        </div>
      )}
      {url && <img className="wl-img" src={url} alt="Mynd af korti" />}
      {!w.used_at && (
        editBal ? (
          <div className="wl-row2" style={{ alignItems: 'end' }}>
            <div><label className="wl-lbl">Eftirstöðvar (kr)</label><input className="dialog-input" inputMode="numeric" autoFocus value={bal} onChange={e => setBal(e.target.value)} /></div>
            <button className="primary-btn" onClick={async () => { await upd({ balance: bal === '' ? null : Number(bal) }); setEditBal(false) }}>Vista</button>
          </div>
        ) : (
          <div className="wl-actions">
            <button className="ghost-btn" onClick={() => { setBal(String(value(w) || '')); setEditBal(true) }}>Skrá eftirstöðvar</button>
            <button className="ghost-btn" onClick={() => upd({ used_at: new Date().toISOString(), balance: 0 })}><IconCheck size={16} stroke={2} /> Fullnýtt</button>
          </div>
        )
      )}
      {w.used_at && <div className="wl-used">Merkt sem fullnýtt <button className="linklike" onClick={() => upd({ used_at: null, balance: w.amount })}>Afturkalla</button></div>}
      <div className="wl-actions">
        <button className="ghost-btn" onClick={onEdit}><IconPencil size={16} stroke={1.9} /> Breyta</button>
        <button className="ghost-btn danger" onClick={del}><IconTrash size={16} stroke={1.9} /> Eyða</button>
      </div>
    </div>
  )
}

export default function WalletView({ onClose, onChanged }) {
  useBackClose(true, onClose)
  const [items, setItems] = useState(null)
  const [mode, setMode] = useState('list') // list | add | edit | detail
  const [openId, setOpenId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [image, setImage] = useState(null)
  const [reading, setReading] = useState(false)
  const [showUsed, setShowUsed] = useState(false)
  const fileRef = useRef(null)

  const load = () => store.walletList().then(setItems).catch(() => setItems([]))
  useEffect(() => { load() }, [])
  const changed = () => { load(); onChanged && onChanged() }

  const active = useMemo(() => (items || []).filter(w => !w.used_at), [items])
  const used = useMemo(() => (items || []).filter(w => w.used_at), [items])
  const total = active.reduce((s, w) => s + value(w), 0)
  const soon = walletAlerts(items || [])
  const open = openId ? (items || []).find(w => w.id === openId) : null

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = ''
    if (!file) return
    setMode('add'); setDraft({}); setReading(true)
    try {
      const c = await loadDownscaledCanvas(file, 1100)
      const blob = await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.75))
      setImage(blob)
      const base64 = c.toDataURL('image/jpeg', 0.75).split(',')[1]
      const r = await store.walletParse(base64, 'image/jpeg')
      if (r) setDraft({ kind: r.kind, store: r.store, title: r.title, amount: r.amount ?? '', code: r.code, pin: r.pin, expires_on: r.expires_on || '' })
    } catch (err) { /* lestur mistókst — notandi fyllir út sjálf(ur) */ }
    setReading(false)
  }
  const saveNew = async (f) => {
    await store.walletSave({ ...f, balance: f.amount }, image)
    setImage(null); setDraft(null); setMode('list'); changed()
  }
  const saveEdit = async (f) => {
    const keepBal = open && open.balance != null && Number(open.balance) !== Number(open.amount)
    await store.walletSave({ ...open, ...f, balance: keepBal ? open.balance : f.amount })
    setMode('detail'); changed()
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal rc-modal wl-modal" onClick={e => e.stopPropagation()}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFile} />
        {mode === 'detail' && open ? (
          <Detail w={open} onBack={() => { setMode('list'); setOpenId(null) }} onEdit={() => setMode('edit')} onChanged={changed} />
        ) : mode === 'edit' && open ? (<>
          <h2>Breyta <button className="x" onClick={() => setMode('detail')} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
          <Form initial={{ ...open, amount: open.amount ?? '', expires_on: open.expires_on || '' }} onSave={saveEdit} onCancel={() => setMode('detail')} />
        </>) : mode === 'add' ? (<>
          <h2>Nýtt í Veskið <button className="x" onClick={() => { setMode('list'); setImage(null) }} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
          <Form initial={draft} image={image} reading={reading} onSave={saveNew} onCancel={() => { setMode('list'); setImage(null) }} />
        </>) : (<>
          <h2><span className="h2-ico"><IconWallet size={20} stroke={1.75} /></span>Veskið <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

          <div className="rv-balance">
            <div className="rv-bal-val">{kr(total)}</div>
            <div className="rv-bal-lbl">{active.length ? `á ${active.length} ${active.length === 1 ? 'korti' : 'kortum'} — gjafakort, inneignarnótur og kóðar` : 'Gjafakort, inneignarnótur og afsláttarkóðar á einum stað'}</div>
          </div>

          <div className="wl-add">
            <button className="primary-btn" onClick={() => fileRef.current && fileRef.current.click()}><IconCamera size={18} stroke={1.9} /> Taka mynd af korti</button>
            <button className="ghost-btn" onClick={() => { setDraft({}); setImage(null); setMode('add') }}><IconPlus size={16} stroke={2} /> Slá inn</button>
          </div>

          {items === null && <div className="bd-muted">Sæki…</div>}
          {items && items.length === 0 && (
            <div className="wl-empty">Taktu mynd af gjafakorti eða inneignarnótu. Appið les upphæðina, kóðann og gildistímann — og minnir þig á áður en það rennur út.</div>
          )}

          {soon.length > 0 && <div className="modal-label">Rennur út fljótlega</div>}
          {[...soon, ...active.filter(w => !soon.includes(w))].map(w => (
            <button className="wl-row" key={w.id} onClick={() => { setOpenId(w.id); setMode('detail') }}>
              <span className="wl-row-ico">{w.image_path ? <IconPhoto size={18} stroke={1.75} /> : <IconWallet size={18} stroke={1.75} />}</span>
              <span className="rc-main"><b>{w.store || 'Kort'}</b><small>{KIND[w.kind]}{w.expires_on ? ' · ' + expLabel(w.expires_on) : ''}</small></span>
              <span className={'wl-row-val' + (w.expires_on && daysUntil(w.expires_on) <= 30 ? ' soon' : '')}>{value(w) > 0 ? kr(value(w)) : ''}</span>
            </button>
          ))}

          {used.length > 0 && (<>
            <button className="tpl-link" onClick={() => setShowUsed(s => !s)}>Fullnýtt ({used.length})</button>
            {showUsed && used.map(w => (
              <button className="wl-row used" key={w.id} onClick={() => { setOpenId(w.id); setMode('detail') }}>
                <span className="wl-row-ico"><IconCheck size={18} stroke={1.75} /></span>
                <span className="rc-main"><b>{w.store || 'Kort'}</b><small>{KIND[w.kind]}</small></span>
              </button>
            ))}
          </>)}
          <p className="wl-note">Myndir og kóðar eru geymd læst og aðeins þú sérð þau.</p>
        </>)}
      </div>
    </div>
  )
}
