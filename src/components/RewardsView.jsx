import React, { useState, useEffect } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import { IconCheck, IconClock, IconGift, IconShoppingBag, IconX, IconTruckDelivery, IconBuildingStore, IconCircleX } from '@tabler/icons-react'

const RSTATUS = { pending: ['Í yfirferð', 'pend', IconClock], approved: ['Samþykkt — í afhendingu', 'ok', IconCheck], delivered: ['Afhent', 'ok', IconCheck], rejected: ['Hafnað', 'no', IconCircleX] }

// Beiðni um útleysingu: nafn, sími, sækja eða heimsending. Nafn og sími fara til vörumerkisins — og hvergi annars.
function RedeemForm({ offer, onDone, onCancel }) {
  const [f, setF] = useState({ name: '', phone: '', delivery: 'pickup', address: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))
  const ok = f.name.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 7 && (f.delivery === 'pickup' || f.address.trim().length >= 5)
  const send = async () => {
    if (!ok || busy) return
    setBusy(true); setErr('')
    try {
      const r = await store.requestRedemption(offer.id, f)
      if (r && r.ok) onDone()
      else setErr(r && r.reason === 'not_enough' ? `Þú átt ${Math.round(r.available)} stig tiltæk, það þarf ${Math.round(r.needed)}.` : 'Beiðnin komst ekki í gegn, reyndu aftur.')
    } catch { setErr('Náði ekki sambandi.') }
    setBusy(false)
  }
  return (
    <div className="bc-form rv-redeem">
      <b>Leysa út: {offer.title}</b>
      {offer.reward_desc && <small className="rv-redeem-desc">{offer.reward_desc}</small>}
      <input className="dialog-input" autoFocus value={f.name} onChange={set('name')} placeholder="Fullt nafn" autoComplete="name" />
      <input className="dialog-input" value={f.phone} onChange={set('phone')} placeholder="Símanúmer" inputMode="tel" autoComplete="tel" />
      <div className="rv-delivery">
        <button className={f.delivery === 'pickup' ? 'on' : ''} onClick={() => setF(x => ({ ...x, delivery: 'pickup' }))}><IconBuildingStore size={16} stroke={2} /> Sæki</button>
        <button className={f.delivery === 'home' ? 'on' : ''} onClick={() => setF(x => ({ ...x, delivery: 'home' }))}><IconTruckDelivery size={16} stroke={2} /> Heimsending</button>
      </div>
      {f.delivery === 'home' && <input className="dialog-input" value={f.address} onChange={set('address')} placeholder="Heimilisfang og póstnúmer" autoComplete="street-address" />}
      <small className="rv-redeem-note">Gríptu fer yfir kvittanirnar þínar og samþykkir. Nafn og sími fara þá til {offer.brand || 'vörumerkisins'} sem afhendir innan 10 virkra daga. {Math.round(offer.threshold)} stig dragast frá við samþykkt.</small>
      {err && <div className="bc-err">{err}</div>}
      <div className="bc-actions">
        <button className="ghost-btn" onClick={onCancel}>Hætta við</button>
        <button className="primary-btn" onClick={send} disabled={!ok || busy}>{busy ? 'Sendi…' : 'Senda beiðni'}</button>
      </div>
    </div>
  )
}

// Gríptu stig notandans. Lokað kerfi: stig fyrir staðfest kaup → útleysing (gjafakarfa/gjafabréf) við þröskuld.
// Engin krónuígildi sýnd — stig eru ekki peningar.

const stig = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS')
const rewardText = (p) => p.reward_type === 'percent' ? `${p.reward_value}% í stigum` : `+${stig(p.reward_value)} stig`

export default function RewardsView({ onClose }) {
  const [r, setR] = useState(null)
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState([])
  const [pts, setPts] = useState({ receipt: 0, trial: 0 })
  const [pilot, setPilot] = useState(null) // { member, label, pilot_only }
  const [code, setCode] = useState('')
  const [joinMsg, setJoinMsg] = useState('')
  const [joining, setJoining] = useState(false)
  const [avail, setAvail] = useState(null)       // tiltæk stig (frátekin í opnum beiðnum dregin frá)
  const [mine, setMine] = useState([])           // mínar beiðnir
  const [redeeming, setRedeeming] = useState(null) // offer sem verið er að leysa út
  const [brands, setBrands] = useState([])
  const loadRedeem = () => { store.pointsAvailable().then(setAvail).catch(() => setAvail(0)); store.myRedemptions().then(setMine).catch(() => setMine([])) }
  useBackClose(true, onClose)
  const join = async () => {
    if (!code.trim() || joining) return
    setJoining(true); setJoinMsg('')
    try {
      const res = await store.joinPilot(code)
      if (res && res.ok) { setPilot(p => ({ ...(p || {}), member: true, label: res.label || null })); setJoinMsg('') }
      else setJoinMsg(res && res.reason === 'full' ? 'Þessi kóði er fullnýttur.' : 'Kóðinn fannst ekki — athugaðu stafsetninguna.')
    } catch { setJoinMsg('Náði ekki sambandi, reyndu aftur.') }
    setJoining(false)
  }
  useEffect(() => {
    store.myPilot().then(setPilot).catch(() => setPilot({ member: false, pilot_only: true }))
    store.getMyRewards().then(setR).catch(() => setR({ balance: 0, pending: 0, items: [] }))
    store.getRewardBrands().then(setBrands).catch(() => {})
    loadRedeem()
    store.getAppSettings().then(s => setPts({ receipt: Number(s.receipt_points) || 0, trial: Number(s.trial_bonus) || 0 })).catch(() => {})
    store.getRewardData().then(d => {
      setOffers((d.offers || []).filter(o => o.active !== false).sort((a, b) => a.threshold - b.threshold))
    }).catch(() => {})
    // Vörur með GILDANDI stigum í dag (herferð yfirskrifar grunnstig; vörur án stiga í dag faldar)
    store.getRewardCatalog().then(setProducts).catch(() => {})
  }, [])
  if (!r) return null
  // Tiltæk stig = staða mínus það sem er frátekið í beiðnum í yfirferð. Framvindan miðast við þau.
  const bal = avail == null ? r.balance : avail
  const next = offers.find(o => bal < o.threshold) || offers[offers.length - 1] || null
  const pct = next ? Math.min(100, Math.round((bal / next.threshold) * 100)) : 0
  const brandName = (id) => (brands.find(b => b.id === id) || {}).name || ''
  const openRedeem = (o) => setRedeeming({ ...o, brand: brandName(o.brand_id) })
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2><span className="h2-ico green"><IconGift size={20} stroke={1.75} /></span>Gríptu stig <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        {pilot && pilot.pilot_only && !pilot.member && (
          <div className="rv-invite">
            <b>Gríptu er í lokaðri prufu</b>
            <p>Ertu með boðskóða? Sláðu hann inn og þú byrjar að safna stigum af kvittunum þínum.</p>
            <div className="rv-invite-row">
              <input className="dialog-input" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && join()} placeholder="BOÐSKÓÐI" autoCapitalize="characters" autoComplete="off" />
              <button className="primary-btn" onClick={join} disabled={joining || !code.trim()}>{joining ? '…' : 'Taka þátt'}</button>
            </div>
            {joinMsg && <div className="bc-err">{joinMsg}</div>}
          </div>
        )}
        {pilot && pilot.member && pilot.label && <div className="rv-pilot-tag"><IconCheck size={13} stroke={2.5} /> {pilot.label}</div>}

        <div className="rv-balance">
          <div className="rv-bal-val">{stig(bal)} <small>stig</small></div>
          <div className="rv-bal-lbl">{avail != null && avail < r.balance ? `${stig(r.balance - avail)} frátekin í beiðni í yfirferð` : r.pending > 0 ? `þar af ${stig(r.pending)} í bið eftir staðfestingu` : 'safnað af kvittunum'}</div>
          {next && (
            <div className="rv-progress">
              <div className="rv-ptrack"><div className="rv-pfill" style={{ width: pct + '%' }} /></div>
              <div className="rv-ptxt">
                {bal >= next.threshold
                  ? <>Þú hefur náð <b>{next.title}</b>!</>
                  : <><b>{stig(next.threshold - bal)} stig</b> í {next.title}</>}
              </div>
            </div>
          )}
        </div>

        {(pts.receipt > 0 || pts.trial > 0) && (
          <div className="rv-how">
            <div className="modal-label">Svona safnarðu</div>
            {pts.receipt > 0 && <div className="rv-how-row"><span className="rv-how-pts">+{pts.receipt}</span><span>fyrir hverja skannaða kvittun, úr hvaða búð sem er (ein á dag)</span></div>}
            {products.length > 0 && <div className="rv-how-row"><span className="rv-how-pts">+stig</span><span>fyrir vörurnar hér fyrir neðan, ofan á kvittanastigin</span></div>}
            {pts.trial > 0 && products.length > 0 && <div className="rv-how-row"><span className="rv-how-pts">+{pts.trial}</span><span>í fyrsta sinn sem þú kaupir hverja þeirra</span></div>}
          </div>
        )}

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
                {bal >= o.threshold
                  ? <button className="primary-btn rv-redeem-btn" onClick={() => openRedeem(o)} disabled={!!redeeming}><IconGift size={15} stroke={2} /> Leysa út</button>
                  : <span className="rv-th">{stig(o.threshold)} stig</span>}
              </div>
            ))}
            {redeeming && <RedeemForm offer={redeeming} onDone={() => { setRedeeming(null); loadRedeem() }} onCancel={() => setRedeeming(null)} />}
          </>
        )}

        {mine.length > 0 && (
          <>
            <div className="modal-label">Beiðnirnar mínar</div>
            {mine.map(m => {
              const [label, cls, Ico] = RSTATUS[m.status] || RSTATUS.pending
              return (
                <div className="rv-offer" key={m.id}>
                  <div className="rv-offer-txt"><b>{m.offer_title}</b><small>{m.delivery === 'home' ? 'Heimsending' : 'Sótt'} · {stig(m.points)} stig{m.status === 'rejected' && m.review_note ? ` · ${m.review_note}` : ''}</small></div>
                  <span className={'bc-status ' + cls}><Ico size={13} stroke={2.2} /> {label}</span>
                </div>
              )
            })}
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
