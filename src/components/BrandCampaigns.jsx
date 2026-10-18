import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { IconPlus, IconX, IconTarget, IconTrash, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react'

// Herferðir vörumerkis: tímabil + þak + fjárhagsrammi. Vörumerki (editor) stofnar sjálft.
// Allar tölur (innlausnir, eytt) koma úr brand_campaigns() — samanlagðar, engin persónugögn.

const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des']
const fmt = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${Number(m[3])}. ${MONTHS[Number(m[2]) - 1]}` : d }
const todayISO = () => new Date().toISOString().slice(0, 10)
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const STATUS = { live: ['Í gangi', 'live'], upcoming: ['Væntanleg', 'up'], done: ['Lokið', 'done'], capped: ['Þak náð', 'cap'], off: ['Í bið', 'off'] }

function Form({ brandId, products, onDone, onCancel }) {
  const [f, setF] = useState({ title: '', product_id: '', reward_type: 'fixed', reward_value: '', starts_on: todayISO(), ends_on: plusDays(30), max_redemptions: '', budget_kr: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))
  const ok = f.title.trim() && Number(f.reward_value) > 0 && f.starts_on && f.ends_on && f.ends_on >= f.starts_on
  const save = async () => {
    if (!ok) return
    setBusy(true); setErr('')
    try { await store.addCampaign({ ...f, brand_id: brandId }); onDone() }
    catch (e) { setErr('Gat ekki vistað — athugaðu réttindi.') }
    finally { setBusy(false) }
  }
  const est = f.max_redemptions && f.reward_type === 'fixed' ? Number(f.max_redemptions) * Number(f.reward_value || 0) : null
  return (
    <div className="bc-form">
      <input className="dialog-input" autoFocus value={f.title} onChange={set('title')} placeholder="Heiti — t.d. „Sproud: prófaðu í nóvember“" />
      <div className="bc-row">
        <select className="bd-select" value={f.product_id} onChange={set('product_id')}>
          <option value="">Allar vörur vörumerkisins</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="bc-row">
        <select className="bd-select" value={f.reward_type} onChange={set('reward_type')}>
          <option value="fixed">stig per eining</option>
          <option value="percent">% af verði í stigum</option>
        </select>
        <input className="dialog-input" value={f.reward_value} onChange={set('reward_value')} placeholder={f.reward_type === 'fixed' ? 'stig' : '%'} inputMode="decimal" />
      </div>
      <div className="bc-row">
        <label>Frá <input className="dialog-input" type="date" value={f.starts_on} onChange={set('starts_on')} /></label>
        <label>Til <input className="dialog-input" type="date" value={f.ends_on} onChange={set('ends_on')} /></label>
      </div>
      <div className="bd-muted">Stig fást fyrir kaup sem eru <b>dagsett</b> innan tímabilsins — kvittun frá því fyrir „Frá“ gefur engin vörustig þótt hún sé skönnuð eftir það. Veldu fyrri dagsetningu ef eldri kaup eiga að telja.</div>
      <div className="bc-row">
        <label>Þak (innlausnir) <input className="dialog-input" value={f.max_redemptions} onChange={set('max_redemptions')} placeholder="t.d. 500" inputMode="numeric" /></label>
        <label>Hámark stiga alls <input className="dialog-input" value={f.budget_kr} onChange={set('budget_kr')} placeholder="t.d. 50.000" inputMode="numeric" /></label>
      </div>
      {est != null && <div className="bd-muted">Hámarksstig við þakið: <b>{num(est)} stig</b>. Herferðin stöðvast sjálfkrafa þegar þaki eða hámarki er náð.</div>}
      {err && <div className="bc-err">{err}</div>}
      <div className="bc-actions">
        <button className="ghost-btn" onClick={onCancel}>Hætta við</button>
        <button className="primary-btn" onClick={save} disabled={!ok || busy}>{busy ? 'Vista…' : 'Stofna herferð'}</button>
      </div>
    </div>
  )
}

export default function Campaigns({ brandId, brandName, products = [], canEdit }) {
  const [list, setList] = useState(null)
  const [adding, setAdding] = useState(false)
  const load = () => store.brandCampaigns(brandId).then(setList).catch(() => setList([]))
  useEffect(() => { setList(null); if (brandId) load() }, [brandId])

  const toggle = async (c) => { await store.updateCampaign(c.id, { active: !c.active }); load() }
  const del = async (c) => {
    if (!window.confirm(`Eyða herferðinni „${c.title}“? Herferð sem hefur gefið stig má ekki eyða — settu hana í bið í staðinn.`)) return
    try { await store.deleteCampaign(c.id) } catch (e) { window.alert(e.message || 'Ekki tókst að eyða herferðinni.') }
    load()
  }

  return (
    <div className="bd-card">
      <div className="bd-card-h"><IconTarget size={17} stroke={1.75} className="bd-h-ico" /> Herferðir <span>tímabil, þak og hámark stiga — stig aðeins fyrir staðfest kaup</span></div>
      {list === null && <div className="bd-muted">Sæki…</div>}
      {list && list.length === 0 && !adding && <div className="bd-muted">Engin herferð enn{canEdit ? ' — stofnaðu þá fyrstu.' : '.'}</div>}
      {list && list.map(c => {
        const [label, cls] = STATUS[c.status] || STATUS.off
        const cap = c.max_redemptions ? Math.min(1, c.redemptions / c.max_redemptions) : (c.budget_kr ? Math.min(1, c.spent_kr / c.budget_kr) : null)
        return (
          <div key={c.id} className="bc-item">
            <div className="bc-head">
              <div className="bc-title">{c.title}<small>{c.product_name || 'Allar vörur'} · {c.reward_type === 'percent' ? `${num(c.reward_value)}%` : `${num(c.reward_value)} stig`} · {fmt(c.starts_on)}–{fmt(c.ends_on)}</small></div>
              <span className={'bc-status ' + cls}>{label}</span>
            </div>
            <div className="bc-stats">
              <span><b>{num(c.redemptions)}</b> innlausnir{c.max_redemptions ? ` af ${num(c.max_redemptions)}` : ''}</span>
              <span><b>{num(c.spent_kr)} stig</b> veitt{c.budget_kr ? ` af ${num(c.budget_kr)}` : ''}</span>
            </div>
            {cap != null && <div className="bd-htrack"><div className={'bd-hfill' + (cap >= 1 ? ' full' : '')} style={{ width: (cap * 100) + '%' }} /></div>}
            {canEdit && (
              <div className="bc-tools">
                <button onClick={() => toggle(c)}>{c.active ? <><IconPlayerPause size={14} stroke={2} /> Setja í bið</> : <><IconPlayerPlay size={14} stroke={2} /> Virkja</>}</button>
                <button className="danger" onClick={() => del(c)}><IconTrash size={14} stroke={2} /> Eyða</button>
              </div>
            )}
          </div>
        )
      })}
      {canEdit && !adding && list && <button className="bd-btn ghost" onClick={() => setAdding(true)}><IconPlus size={16} stroke={2} /> Ný herferð</button>}
      {adding && <Form brandId={brandId} products={products} onDone={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} />}
    </div>
  )
}
