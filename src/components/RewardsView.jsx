import React, { useState, useEffect } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import { IconCheck, IconClock, IconGift, IconShoppingBag, IconX } from '@tabler/icons-react'

// Gríptu stig notandans. Lokað kerfi: stig fyrir staðfest kaup → útleysing (gjafakarfa/gjafabréf) við þröskuld.
// Engin krónuígildi sýnd — stig eru ekki peningar.

const stig = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS')
const rewardText = (p) => p.reward_type === 'percent' ? `${p.reward_value}% í stigum` : `+${stig(p.reward_value)} stig`

export default function RewardsView({ onClose }) {
  const [r, setR] = useState(null)
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState([])
  useBackClose(true, onClose)
  useEffect(() => {
    store.getMyRewards().then(setR).catch(() => setR({ balance: 0, pending: 0, items: [] }))
    store.getRewardData().then(d => {
      setOffers((d.offers || []).filter(o => o.active !== false).sort((a, b) => a.threshold - b.threshold))
      setProducts((d.products || []).filter(p => p.active !== false && (!p.status || p.status === 'approved')))
    }).catch(() => {})
  }, [])
  if (!r) return null
  // Næsta útleysing sem ekki er náð → framvinda. Ef allt er náð: sú hæsta.
  const next = offers.find(o => r.balance < o.threshold) || offers[offers.length - 1] || null
  const pct = next ? Math.min(100, Math.round((r.balance / next.threshold) * 100)) : 0
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2><span className="h2-ico green"><IconGift size={20} stroke={1.75} /></span>Gríptu stig <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        <div className="rv-balance">
          <div className="rv-bal-val">{stig(r.balance)} <small>stig</small></div>
          <div className="rv-bal-lbl">{r.pending > 0 ? `þar af ${stig(r.pending)} í bið eftir staðfestingu` : 'safnað af kvittunum'}</div>
          {next && (
            <div className="rv-progress">
              <div className="rv-ptrack"><div className="rv-pfill" style={{ width: pct + '%' }} /></div>
              <div className="rv-ptxt">
                {r.balance >= next.threshold
                  ? <>Þú hefur náð <b>{next.title}</b>!</>
                  : <><b>{stig(next.threshold - r.balance)} stig</b> í {next.title}</>}
              </div>
            </div>
          )}
        </div>

        {products.length > 0 && (
          <>
            <div className="modal-label">Vörur sem gefa stig</div>
            <div className="rv-catalog">
              {products.map(p => (
                <div className="rv-cat-item" key={p.id}>
                  {p.image_url ? <img className="rv-cat-img" src={p.image_url} alt="" /> : <div className="rv-cat-img rv-cat-ph"><IconShoppingBag size={20} stroke={1.6} /></div>}
                  <div className="rv-cat-txt"><b>{p.name}</b>{p.size && <small>{p.size}</small>}</div>
                  <span className="rv-cat-reward">{rewardText(p)}</span>
                </div>
              ))}
            </div>
            <p className="rv-note">Kauptu þessar vörur í hvaða búð sem er og skannaðu kvittunina — stigin bætast sjálfkrafa við.</p>
          </>
        )}

        {offers.length > 0 && (
          <>
            <div className="modal-label">Útleysingar</div>
            {offers.map(o => (
              <div className="rv-offer" key={o.id}>
                <div className="rv-offer-txt"><b>{o.title}</b>{o.reward_desc && <small>{o.reward_desc}</small>}</div>
                {r.balance >= o.threshold
                  ? <span className="rv-reached"><IconCheck size={14} stroke={2.5} /> Náð</span>
                  : <span className="rv-th">{stig(o.threshold)} stig</span>}
              </div>
            ))}
          </>
        )}

        <div className="modal-label">Áunnið</div>
        {r.items.length === 0 && <p className="empty">Ekkert enn — skannaðu kvittun með vöru sem gefur stig.</p>}
        <div className="rv-list">
          {r.items.map((it, i) => (
            <div className="rv-item" key={i}>
              <span>{it.product_name}</span>
              <span className="rv-item-val">+{stig(it.value)}{it.status === 'pending' ? <IconClock size={14} stroke={2} className="rv-st pending" title="Í bið eftir staðfestingu" /> : it.status === 'approved' ? <IconCheck size={14} stroke={2.5} className="rv-st" /> : null}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
