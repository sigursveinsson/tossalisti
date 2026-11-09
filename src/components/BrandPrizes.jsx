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
  const [mode, setMode] = useState(prize.own_codes ? 'own' : 'paste')
  const [count, setCount] = useState('100')
  const [pin, setPin] = useState(''); const [hint, setHint] = useState(prize.redeem_hint || '')
  const [text, setText] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const gen = async () => {
    setBusy(true)
    try {
      const r = await store.generatePrizeCodes(prize.id, count)
      let m = `${num(r.generated)} kóðar búnir til.`
      if (pin) { const pr = await store.setPrizePin(prize.id, pin, hint); m += pr.ok ? ' PIN vistað.' : ' PIN þarf að vera 4–6 tölustafir.' }
      else if (hint !== (prize.redeem_hint || '')) { await store.updatePrize(prize.id, { redeem_hint: hint || null }) }
      setMsg(m); onDone()
    } catch (e) { setMsg('Villa.') } finally { setBusy(false) }
  }
  const savePin = async () => {
    setBusy(true)
    try { const pr = await store.setPrizePin(prize.id, pin, hint); setMsg(pr.ok ? 'PIN vistað.' : 'PIN þarf að vera 4–6 tölustafir.'); setPin(''); onDone() } catch { setMsg('Villa.') } finally { setBusy(false) }
  }
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
      <div className="seg-mini">
        <button className={mode === 'paste' ? 'on' : ''} onClick={() => setMode('paste')}>Líma inn kóða frá öðrum</button>
        <button className={mode === 'own' ? 'on' : ''} onClick={() => setMode('own')}>Gríptu býr til kóða</button>
      </div>
      {mode === 'paste' ? (
        <>
          <small className="bd-muted">Fyrir miða með kóða frá kvikmyndahúsi, KFC o.s.frv. Notandinn fær kóðann og notar hjá þeim.</small>
          <textarea className="dialog-input" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder={'Límdu kóða hér — einn í línu eða aðskilda með kommu\nABC123\nDEF456'} />
          <div className="bc-actions">
            <small className="bd-muted">{n ? `${num(n)} kóðar tilbúnir` : 'Kóðar úr Excel eða textaskrá'}</small>
            <button className="primary-btn" onClick={add} disabled={!n || busy}>{busy ? 'Les inn…' : 'Bæta kóðum við'}</button>
          </div>
        </>
      ) : (
        <>
          <small className="bd-muted">Fyrir pappírsmiða og staði án kóðakerfis. Notandinn fær QR-kóða í appinu; starfsmaður skannar hann með símanum, slær inn PIN staðarins og merkir notaðan. Hver kóði virkar einu sinni.</small>
          <div className="bc-row">
            <label>Fjöldi kóða <input className="dialog-input" inputMode="numeric" value={count} onChange={e => setCount(e.target.value.replace(/\D/g, ''))} /></label>
            <label>PIN staðarins (4–6 tölustafir) <input className="dialog-input" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={prize.has_pin ? '•••• (sett)' : 't.d. 4821'} /></label>
          </div>
          <input className="dialog-input" value={hint} onChange={e => setHint(e.target.value)} placeholder="Leiðbeining til notanda — t.d. „Sýndu kóðann í afgreiðslu KFC Hafnarfirði“" />
          <div className="bc-actions">
            {prize.has_pin || pin ? <button className="ghost-btn" onClick={savePin} disabled={busy || pin.length < 4}>Vista PIN</button> : <span />}
            <button className="primary-btn" onClick={gen} disabled={busy || !Number(count)}>{busy ? 'Bý til…' : `Búa til ${num(count)} kóða`}</button>
          </div>
          <small className="bd-muted">Gefðu starfsfólkinu PIN-ið. Án PIN getur hver sem er merkt kóða notaðan — líka notandinn sjálfur fyrir slysni.</small>
        </>
      )}
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
            {p.own_codes && <span className={'bc-status ' + (p.has_pin ? 'live' : 'off')}>{p.has_pin ? 'QR + PIN' : 'QR án PIN'}</span>}
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
