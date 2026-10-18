import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { CatIcon } from '../data/icons.jsx'
import { departmentFor } from '../data/products.js'
import { IconPlus, IconPackage, IconPhoto, IconBarcode, IconPencil, IconTrash, IconClock, IconCircleCheck, IconCircleX, IconInfoCircle, IconSearch } from '@tabler/icons-react'
import BarcodeScanner from './BarcodeScanner.jsx'

// Vörur vörumerkis (Gríptu). Heildsalinn skráir sjálfur: heiti, stærð, strikamerki, mynd, leitarorð og grunnverðlaun.
// Ný eða breytt vara fer í BIÐ þar til stjórnandi Tossalista samþykkir (trigger í gagnagrunni) —
// leitarorðin ráða hvaða kvittanalínur gefa stig, svo þau þarf að yfirfara.

const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const STATUS = {
  pending: ['Bíður samþykkis', 'pend', IconClock],
  approved: ['Samþykkt', 'ok', IconCircleCheck],
  rejected: ['Hafnað', 'no', IconCircleX],
}
const STOP = new Set(['og', 'með', 'án', 'í', 'á', 'frá', 'the', 'and', 'with', 'stk', 'pk', 'pakki', 'flaska', 'dós'])
const isSize = (w) => /^\d+([.,]\d+)?\s*(g|kg|ml|cl|l|dl|stk|x)?$/i.test(w)
export function kwSuggest(name) {
  const words = (name || '').toLowerCase().replace(/[^0-9a-záðéíóúýþæö\s]/gi, ' ').split(/\s+/).filter(w => w.length >= 2 && !STOP.has(w) && !isSize(w))
  // Fyrsta uppástunga: fyrstu 1–2 orðin saman (t.d. „old el paso“ → „old el“ dugar sjaldan, svo við tökum allt heitið án stærðar sem eitt leitarorð)
  return words.length ? [words.join(' ')] : []
}
const EMPTY = { name: '', size: '', barcode: '', image_url: '', keywords: '', reward_type: 'fixed', reward_value: '' }

function Form({ brandId, initial, onDone, onCancel }) {
  const editing = !!(initial && initial.id)
  const [f, setF] = useState(() => initial ? { ...EMPTY, ...initial, keywords: (initial.match_keywords || []).join(', '), reward_value: String(initial.reward_value ?? '') } : EMPTY)
  const [kwEdited, setKwEdited] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [looking, setLooking] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))
  const kwValue = kwEdited ? f.keywords : kwSuggest(f.name).join(', ')
  const kws = kwValue.split(',').map(s => s.trim()).filter(Boolean)
  const ok = f.name.trim().length >= 2 && kws.length > 0 && Number(f.reward_value) >= 0

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = ''
    if (!file) return
    setBusy(true); setMsg('')
    try { const url = await store.uploadRewardImage(file, brandId); setF(v => ({ ...v, image_url: url })) }
    catch (err) { setMsg('Náði ekki að hlaða upp mynd.') }
    setBusy(false)
  }
  const lookup = async (code) => {
    const bc = (typeof code === 'string' ? code : f.barcode).trim(); if (!bc) return
    setLooking(true); setMsg('')
    try {
      const info = await store.lookupBarcode(bc)
      if (info && (info.name || info.image_url || info.size)) {
        setF(v => ({ ...v, name: v.name || info.name || '', size: v.size || info.size || '', image_url: v.image_url || info.image_url || '' }))
        setMsg(info.name ? `Sótt úr Open Food Facts: ${info.name}` : 'Vara fannst (án heitis).')
      } else setMsg('Fannst ekki í Open Food Facts — fylltu inn handvirkt.')
    } catch { setMsg('Náði ekki í Open Food Facts.') }
    setLooking(false)
  }
  const save = async () => {
    if (!ok || busy) return
    setBusy(true); setMsg('')
    const row = { brand_id: brandId, name: f.name.trim(), size: f.size.trim() || null, barcode: f.barcode.trim() || null, image_url: f.image_url || null, match_keywords: kws, reward_type: f.reward_type, reward_value: Number(f.reward_value) || 0 }
    try {
      if (editing) await store.updateRewardProduct(initial.id, row)
      else await store.addRewardProduct(row)
      onDone()
    } catch (e) { setMsg('Gat ekki vistað — athugaðu réttindi.') }
    setBusy(false)
  }
  return (
    <div className="bc-form">
      <div className="bc-row bp-bcrow">
        <input className="dialog-input" value={f.barcode} onChange={set('barcode')} placeholder="Strikamerki (valfrjálst)" inputMode="numeric" />
        <button className="ghost-btn" onClick={() => setScanning(true)} title="Skanna strikamerki með myndavél"><IconBarcode size={15} stroke={2} /> Skanna</button>
        <button className="ghost-btn" onClick={() => lookup()} disabled={!f.barcode.trim() || looking} title="Sækja heiti, stærð og mynd eftir strikamerki"><IconSearch size={15} stroke={2} /> {looking ? 'Sæki…' : 'Sækja'}</button>
      </div>
      <small className="bp-hint">Skannaðu strikamerkið með myndavélinni eða sláðu það inn og ýttu á Sækja — heiti, stærð og mynd koma þá sjálfkrafa þegar varan er þekkt.</small>
      {scanning && (
        <div onClick={e => e.stopPropagation()}>
          <BarcodeScanner onDetect={(code) => { setF(x => ({ ...x, barcode: code })); setScanning(false); lookup(code) }} onClose={() => setScanning(false)} />
        </div>
      )}
      <input className="dialog-input" autoFocus value={f.name} onChange={e => { set('name')(e); setMsg('') }} placeholder="Heiti vöru — t.d. „Sproud hafradrykkur“" />
      <div className="bc-row">
        <input className="dialog-input" value={f.size} onChange={set('size')} placeholder="Stærð — t.d. 1 l" />
        <label className="ghost-btn bp-upload"><IconPhoto size={15} stroke={2} /> {f.image_url ? 'Skipta um mynd' : 'Mynd'}<input type="file" accept="image/*" onChange={pick} hidden /></label>
      </div>
      {f.image_url && <img className="bp-preview" src={f.image_url} alt="" />}
      <label className="bp-field">Leitarorð á kvittun
        <input className="dialog-input" value={kwValue} onChange={e => { setKwEdited(true); set('keywords')(e) }} placeholder="t.d. sproud, hafradrykkur sproud" />
        <small>Aðskilin með kommu. Eitt leitarorð dugar til að línan gefi stig; orð með bili þurfa öll að koma fyrir í línunni. Vertu nákvæm — „mild“ eitt og sér myndi ná „mild cheddar“.</small>
      </label>
      <div className="bc-row">
        <select className="bd-select" value={f.reward_type} onChange={set('reward_type')}>
          <option value="fixed">Grunnstig per eining</option>
          <option value="percent">% af verði</option>
        </select>
        <input className="dialog-input" value={f.reward_value} onChange={set('reward_value')} placeholder={f.reward_type === 'fixed' ? 'stig' : '%'} inputMode="decimal" />
      </div>
      <div className="bd-muted"><IconInfoCircle size={14} stroke={2} /> Grunnstig gilda þegar engin herferð er í gangi (hámark 500 stig á einingu eða 50%). Herferð yfirskrifar þau á sínu tímabili.</div>
      {editing && initial.status === 'approved' && (
        <div className="bd-muted"><IconInfoCircle size={14} stroke={2} /> Nafn, stærð, mynd og stig má breyta án þess að varan fari úr loftinu. Breyting á <b>leitarorðum eða strikamerki</b> sendir hana aftur til samþykktar og stig stoppa þar til hún er samþykkt.</div>
      )}
      {msg && <div className="bc-err">{msg}</div>}
      <div className="bc-actions">
        <button className="ghost-btn" onClick={onCancel}>Hætta við</button>
        <button className="primary-btn" onClick={save} disabled={!ok || busy}>{busy ? 'Vista…' : editing ? 'Vista breytingar' : 'Senda til samþykktar'}</button>
      </div>
    </div>
  )
}

export default function BrandProducts({ brandId, canEdit, onChanged }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null) // null | {} (ný) | vara
  const load = () => store.brandProducts(brandId).then(setList).catch(() => setList([]))
  useEffect(() => { setList(null); setEditing(null); if (brandId) load() }, [brandId])
  const done = () => { setEditing(null); load(); onChanged && onChanged() }
  const del = async (p) => {
    if (!window.confirm(`Eyða vörunni „${p.name}“?`)) return
    try { await store.deleteRewardProduct(p.id); done() } catch { window.alert('Ekki hægt að eyða samþykktri vöru eða vöru sem hefur gefið stig — settu hana frekar óvirka með því að biðja Tossalista.') }
  }
  const pending = (list || []).filter(p => p.status === 'pending').length

  return (
    <div className="bd-card">
      <div className="bd-card-h"><IconPackage size={17} stroke={1.75} className="bd-h-ico" /> Vörur <span>vörurnar sem gefa stig — Tossalisti yfirfer leitarorðin áður en vara verður virk</span></div>
      {pending > 0 && <div className="bp-note"><IconClock size={15} stroke={2} /> {pending} {pending === 1 ? 'vara bíður' : 'vörur bíða'} samþykkis. Það tekur venjulega innan við virkan dag.</div>}
      {list === null && <div className="bd-muted">Sæki…</div>}
      {list && list.length === 0 && !editing && <div className="bd-muted">Engin vara skráð enn{canEdit ? ' — skráðu þá fyrstu.' : '.'}</div>}
      {list && list.map(p => {
        const [label, cls, Ico] = STATUS[p.status] || STATUS.pending
        return (
          <div key={p.id} className="bp-item">
            <div className="bp-img">{p.image_url ? <img src={p.image_url} alt="" /> : <CatIcon name={p.name} dept={departmentFor(p.name)} size={36} />}</div>
            <div className="bp-body">
              <div className="bp-name">{p.name}{p.size ? <small> · {p.size}</small> : null}</div>
              <div className="bp-meta">{(p.match_keywords || []).map(k => <code key={k}>{k}</code>)} · {p.reward_type === 'percent' ? `${num(p.reward_value)}%` : `${num(p.reward_value)} stig`}</div>
              {p.status === 'rejected' && p.review_note && <div className="bp-reject">Athugasemd: {p.review_note}</div>}
            </div>
            <span className={'bc-status ' + cls}><Ico size={13} stroke={2.2} /> {label}</span>
            {canEdit && (
              <div className="bp-tools">
                <button onClick={() => setEditing(p)} title="Breyta"><IconPencil size={15} stroke={2} /></button>
                {p.status !== 'approved' && <button className="danger" onClick={() => del(p)} title="Eyða"><IconTrash size={15} stroke={2} /></button>}
              </div>
            )}
          </div>
        )
      })}
      {canEdit && !editing && list && <button className="bd-btn ghost" onClick={() => setEditing({})}><IconPlus size={16} stroke={2} /> Ný vara</button>}
      {editing && <Form brandId={brandId} initial={editing.id ? editing : null} onDone={done} onCancel={() => setEditing(null)} />}
    </div>
  )
}
