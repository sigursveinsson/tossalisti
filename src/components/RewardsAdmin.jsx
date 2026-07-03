import React, { useState, useEffect } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'

// Stjórnborð verðlaunakerfis: skilgreina vörur (föst upphæð / hlutfall) og tilboð (þröskuld → gjafabréf).
export default function RewardsAdmin({ onClose }) {
  const [data, setData] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [np, setNp] = useState({ name: '', keywords: '', reward_type: 'fixed', reward_value: '' })
  const [no, setNo] = useState({ title: '', threshold: '', reward_desc: '' })
  useBackClose(true, onClose)

  const load = () => store.getRewardData().then(setData).catch(() => setData({ brands: [], products: [], offers: [] }))
  useEffect(() => { load(); store.getAppSettings().then(s => setEnabled(s.rewards_enabled === true)).catch(() => {}) }, [])
  const toggleEnabled = async () => { const next = !enabled; setEnabled(next); try { await store.setAppSetting('rewards_enabled', next) } catch {} }

  if (!data) return null
  const brand = data.brands[0]

  const setField = async (p, patch) => { await store.updateRewardProduct(p.id, patch); load() }
  const addProduct = async () => {
    if (!np.name.trim() || !brand) return
    await store.addRewardProduct({
      brand_id: brand.id, name: np.name,
      match_keywords: np.keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      reward_type: np.reward_type, reward_value: np.reward_value,
    })
    setNp({ name: '', keywords: '', reward_type: 'fixed', reward_value: '' }); load()
  }
  const addOffer = async () => {
    if (!no.title.trim() || !brand) return
    await store.addRewardOffer({ brand_id: brand.id, title: no.title, threshold: no.threshold, reward_desc: no.reward_desc, kind: 'giftcard' })
    setNo({ title: '', threshold: '', reward_desc: '' }); load()
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal adm-modal" onClick={e => e.stopPropagation()}>
        <h2>🎁 Verðlaunakerfi <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <p className="muted-p">Vörumerki: <b>{brand?.name || '—'}</b>. Skilgreindu verðlaun per vöru (föst upphæð eða hlutfall) og tilboð þegar safnað er ákveðinni upphæð.</p>

        <div className="adm-ads">
          <div className="adm-ads-txt">
            <b>Verðlaunakerfi virkt</b>
            <small>{enabled ? 'Cashback reiknast þegar kvittun er skönnuð.' : 'Slökkt — kveiktu fyrir pilot/demo.'}</small>
          </div>
          <button className={'adm-ads-switch' + (enabled ? ' on' : '')} onClick={toggleEnabled} aria-label="Kveikja/slökkva" />
        </div>

        <div className="adm-head">Verðlaunavörur</div>
        {data.products.map(p => (
          <div className="rw-prod" key={p.id}>
            <div className="rw-prod-top">
              <b>{p.name}</b>
              <button className="rw-del" onClick={async () => { await store.deleteRewardProduct(p.id); load() }} aria-label="Eyða">×</button>
            </div>
            <div className="rw-prod-row">
              <select value={p.reward_type} onChange={e => setField(p, { reward_type: e.target.value })}>
                <option value="fixed">kr á vöru</option>
                <option value="percent">% af verði</option>
              </select>
              <input type="number" className="rw-val" value={p.reward_value} onChange={e => setField(p, { reward_value: Number(e.target.value) || 0 })} />
              <span className="rw-unit">{p.reward_type === 'percent' ? '%' : 'kr'}</span>
              <label className="rw-active"><input type="checkbox" checked={p.active} onChange={e => setField(p, { active: e.target.checked })} /> virk</label>
            </div>
            {(p.match_keywords || []).length > 0 && <div className="rw-kw">Leitarorð: {(p.match_keywords || []).join(', ')}</div>}
          </div>
        ))}
        <div className="rw-add">
          <input placeholder="Vöruheiti (t.d. Egils Gull)" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} />
          <input placeholder="Leitarorð, aðskilin með kommu" value={np.keywords} onChange={e => setNp({ ...np, keywords: e.target.value })} />
          <div className="rw-add-row">
            <select value={np.reward_type} onChange={e => setNp({ ...np, reward_type: e.target.value })}>
              <option value="fixed">kr</option><option value="percent">%</option>
            </select>
            <input type="number" className="rw-val" placeholder="upphæð" value={np.reward_value} onChange={e => setNp({ ...np, reward_value: e.target.value })} />
            <button className="primary-btn rw-addbtn" onClick={addProduct}>Bæta við</button>
          </div>
        </div>

        <div className="adm-head">Tilboð / útleystning</div>
        {data.offers.map(o => (
          <div className="rw-offer" key={o.id}>
            <div className="rw-offer-txt"><b>{o.title}</b><small>Safnaðu {Math.round(o.threshold)} kr → {o.reward_desc || o.kind}</small></div>
            <button className="rw-del" onClick={async () => { await store.deleteRewardOffer(o.id); load() }} aria-label="Eyða">×</button>
          </div>
        ))}
        <div className="rw-add">
          <input placeholder="Titill (t.d. Krónan gjafabréf)" value={no.title} onChange={e => setNo({ ...no, title: e.target.value })} />
          <div className="rw-add-row">
            <input type="number" className="rw-val" placeholder="þröskuldur kr" value={no.threshold} onChange={e => setNo({ ...no, threshold: e.target.value })} />
            <input placeholder="lýsing" value={no.reward_desc} onChange={e => setNo({ ...no, reward_desc: e.target.value })} />
            <button className="primary-btn rw-addbtn" onClick={addOffer}>Bæta við</button>
          </div>
        </div>

        <button className="add-recipe-btn" style={{ marginTop: 14 }} onClick={onClose}>Loka</button>
      </div>
    </div>
  )
}
