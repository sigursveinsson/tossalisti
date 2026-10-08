import React, { useState, useEffect } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import { IconCheck, IconClock, IconGift, IconShoppingBag, IconX } from '@tabler/icons-react'

const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'

const rewardText = (p) => p.reward_type === 'percent' ? `${p.reward_value}%` : `+${kr(p.reward_value)}`

export default function RewardsView({ onClose }) {
  const [r, setR] = useState(null)
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState([])
  useBackClose(true, onClose)
  useEffect(() => {
    store.getMyRewards().then(setR).catch(() => setR({ balance: 0, pending: 0, items: [] }))
    store.getRewardData().then(d => {
      setOffers(d.offers || [])
      setProducts((d.products || []).filter(p => p.active !== false))
    }).catch(() => {})
  }, [])
  if (!r) return null
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2><span className="h2-ico green"><IconGift size={20} stroke={1.75} /></span>Cashback <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        <div className="rv-balance">
          <div className="rv-bal-val">{kr(r.balance)}</div>
          <div className="rv-bal-lbl">safnað cashback{r.pending > 0 ? ` · ${kr(r.pending)} í bið` : ''}</div>
        </div>

        {products.length > 0 && (
          <>
            <div className="modal-label">Vörur sem gefa cashback</div>
            <div className="rv-catalog">
              {products.map(p => (
                <div className="rv-cat-item" key={p.id}>
                  {p.image_url ? <img className="rv-cat-img" src={p.image_url} alt="" /> : <div className="rv-cat-img rv-cat-ph"><IconShoppingBag size={20} stroke={1.6} /></div>}
                  <div className="rv-cat-txt"><b>{p.name}</b>{p.size && <small>{p.size}</small>}</div>
                  <span className="rv-cat-reward">{rewardText(p)}</span>
                </div>
              ))}
            </div>
            <p className="rv-note">Kauptu þessar vörur og skannaðu kvittunina — cashback bætist sjálfkrafa við.</p>
          </>
        )}

        {offers.length > 0 && (
          <>
            <div className="modal-label">Leystu út</div>
            {offers.map(o => (
              <div className="rv-offer" key={o.id}>
                <div className="rv-offer-txt"><b>{o.title}</b>{o.reward_desc && <small>{o.reward_desc}</small>}</div>
                {r.balance >= o.threshold
                  ? <span className="rv-reached"><IconCheck size={14} stroke={2.5} /> Náð</span>
                  : <span className="rv-th">{kr(o.threshold)}</span>}
              </div>
            ))}
          </>
        )}

        <div className="modal-label">Áunnið</div>
        {r.items.length === 0 && <p className="empty">Ekkert enn — skannaðu kvittun með vöru sem gefur cashback.</p>}
        <div className="rv-list">
          {r.items.map((it, i) => (
            <div className="rv-item" key={i}>
              <span>{it.product_name}</span>
              <span className="rv-item-val">+{kr(it.value)}{it.status === 'pending' ? <IconClock size={14} stroke={2} className="rv-st pending" /> : it.status === 'approved' ? <IconCheck size={14} stroke={2.5} className="rv-st" /> : null}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
