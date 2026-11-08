import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { IconGift, IconPlus, IconTicket } from '@tabler/icons-react'

// Verðlaun vörumerkis með kóðum (bíómiðar, máltíðir, gjafabréf). Vörumerkið límir inn kóðana;
// hver kóði fer til eins notanda þegar hann vinnur herferð. Hér sést hve margir eru eftir.
const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const KIND = { code: 'Stafrænn kóði', qr: 'QR-kóði', manual: 'Sótt / sent handvirkt' }

function PrizeForm({ brandId, onDone, onCancel }) {
  const [f, setF] = useState({ title: '', description: '', kind: 'code', expires_at: '' })
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))
  const save = async () => {
    setBusy(true); setErr('')
    try { await store.addPrize({ ...f, brand_id: brandId }); onDone() } catch (e) { setErr('Gat ekki vistað.') } finally { setBusy(false) }
  }
  return (
    <div className="bc-form">
      <input className="dialog-input" autoFocus value={f.title} onChange={set('title')} placeholder="Heiti — t.d. „Bíómiði í Sambíóin“" />
      <input className="dialog-input" value={f.description} onChange={set('description')} placeholder="Leiðbeiningar til notanda — t.d. „Sláðu kóðann inn á sambio.is eða sýndu í miðasölu“" />
      <div className="bc-row">
        <select className="bd-select" value={f.kind} onChange={set('kind')}>
          {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label>Rennur út <input className="dialog-input" type="date" value={f.expires_at} onChange={set('expires_at')} /></label>
      </div>
      {err && <div className="bc-err">{err}</div>}
      <div className="bc-actions">
        <button className="ghost-btn" onClick={onCancel}>Hætta við</button>
        <button className="primary-btn" onClick={save} disabled={!f.title.trim() || busy}>{busy ? 'Vista…' : 'Stofna verðlaun'}</button>
      </div>
    </div>
  )
}

function CodeBox({ prize, onDone }) {
  const [text, setText] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const add = async () => {
    setBusy(true)
    try {
      const r = await store.addPrizeCodes(prize.id, text)
      setMsg(`${num(r.added)} kóðar bættust við${r.duplicates ? `, ${num(r.duplicates)} voru þegar til` : ''}.`); setText(''); onDone()
    } catch (e) { setMsg('Villa við innlestur.') } finally { setBusy(false) }
  }
  const n = text.split(/[\s,;]+/).filter(Boolean).length
  return (
    <div className="bp-codes">
      <textarea className="dialog-input" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder={'Límdu kóða hér — einn í línu eða aðskilda með kommu\nABC123\nDEF456'} />
      <div className="bc-actions">
        <small className="bd-muted">{n ? `${num(n)} kóðar tilbúnir` : 'Kóðar úr Excel eða textaskrá'}</small>
        <button className="primary-btn" onClick={add} disabled={!n || busy}>{busy ? 'Les inn…' : 'Bæta kóðum við'}</button>
      </div>
      {msg && <div className="bd-muted">{msg}</div>}
    </div>
  )
}

export default function BrandPrizes({ brandId, canEdit }) {
  const [list, setList] = useState(null)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const load = () => store.brandPrizes(brandId).then(setList).catch(() => setList([]))
  useEffect(() => { setList(null); if (brandId) load() }, [brandId])
  return (
    <div className="bd-card">
      <div className="bd-card-h"><IconGift size={17} stroke={1.75} className="bd-h-ico" /> Verðlaun og kóðar <span>bíómiðar, máltíðir, gjafabréf — hver kóði fer til eins notanda</span></div>
      {list === null && <div className="bd-muted">Sæki…</div>}
      {list && list.length === 0 && !adding && <div className="bd-muted">Engin verðlaun enn{canEdit ? ' — stofnaðu þau fyrstu og límdu svo kóðana inn.' : '.'}</div>}
      {list && list.map(p => (
        <div key={p.id} className="bc-item">
          <div className="bc-head">
            <div className="bc-title">{p.title}<small>{KIND[p.kind] || p.kind}{p.expires_at ? ` · rennur út ${p.expires_at.split('-').reverse().join('.')}` : ''}{p.description ? ` · ${p.description}` : ''}</small></div>
            <span className={'bc-status ' + (p.codes_free > 0 ? 'live' : 'cap')}>{p.codes_free > 0 ? `${num(p.codes_free)} eftir` : 'Engir kóðar eftir'}</span>
          </div>
          <div className="bc-stats">
            <span><IconTicket size={14} stroke={2} /> <b>{num(p.codes_total)}</b> kóðar alls</span>
            <span><b>{num(p.codes_total - p.codes_free)}</b> úthlutað</span>
            <span><b>{num(p.codes_used)}</b> notaðir</span>
          </div>
          {p.codes_total > 0 && <div className="bd-htrack"><div className={'bd-hfill' + (p.codes_free === 0 ? ' full' : '')} style={{ width: Math.round((p.codes_total - p.codes_free) / p.codes_total * 100) + '%' }} /></div>}
          {canEdit && (
            <div className="bc-tools">
              <button onClick={() => setOpen(open === p.id ? null : p.id)}><IconPlus size={14} stroke={2} /> {open === p.id ? 'Loka' : 'Bæta kóðum við'}</button>
              <button onClick={async () => { await store.updatePrize(p.id, { active: !p.active }); load() }}>{p.active ? 'Gera óvirkt' : 'Virkja'}</button>
            </div>
          )}
          {open === p.id && <CodeBox prize={p} onDone={load} />}
        </div>
      ))}
      {canEdit && !adding && list && <button className="bd-btn ghost" onClick={() => setAdding(true)}><IconPlus size={16} stroke={2} /> Ný verðlaun</button>}
      {adding && <PrizeForm brandId={brandId} onDone={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} />}
      <div className="bd-muted" style={{ marginTop: 10 }}>Þegar kóðar klárast fara nýir vinningar í bið þar til bætt er við. Notandinn fær kóðann í appinu og í tölvupósti.</div>
    </div>
  )
}
