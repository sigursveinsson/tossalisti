import React, { useState, useEffect } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'

const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'

export default function RewardsView({ onClose }) {
  const [r, setR] = useState(null)
  const [offers, setOffers] = useState([])
  useBackClose(true, onClose)
  useEffect(() => {
    store.getMyRewards().then(setR).catch(() => setR({ balance: 0, pending: 0, items: [] }))
    store.getRewardData().then(d => setOffers(d.offers || [])).catch(() => {})
  }, [])
  if (!r) return null
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>🎁 Cashback <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        <div className="rv-balance">
          <div className="rv-bal-val">{kr(r.balance)}</div>
          <div className="rv-bal-lbl">safnað cashback{r.pending > 0 ? ` · ${kr(r.pending)} í bið` : ''}</div>
        </div>

        {offers.length > 0 && (
          <>
            <div className="modal-label">Leystu út</div>
            {offers.map(o => (
              <div className="rv-offer" key={o.id}>
                <div className="rv-offer-txt"><b>{o.title}</b>{o.reward_desc && <small>{o.reward_desc}</small>}</div>
                {r.balance >= o.threshold
                  ? <span className="rv-reached">✓ Náð</span>
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
              <span className="rv-item-val">+{kr(it.value)}{it.status === 'pending' ? ' ⏳' : it.status === 'approved' ? ' ✓' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
