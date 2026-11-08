import React, { useEffect, useState } from 'react'
import GriptuOffers from './GriptuOffers.jsx'
import { store } from '../lib/store.js'
import { IconGift, IconReceipt, IconChevronRight, IconTicket, IconCopy, IconCheck, IconClock } from '@tabler/icons-react'

// Gríptu-flipinn á innkaupalistanum — aðeins sýnilegur notendum í tryggðarkerfinu (boðshópur).
// Efst: stigastaða + skanna kvittun. Svo herferðir (skyndiherferðir með teljara, stimpilkort),
// vinningar notandans (kóðar), og allar vörur sem gefa stig núna.
const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const fmtD = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${Number(m[3])}.${Number(m[2])}.` : '' }

function Campaign({ c }) {
  const won = Number(c.won) > 0
  return (
    <div className={'gc' + (won ? ' gc-won' : '')}>
      <div className="gc-top">
        <span className="gc-brand">{c.brand}</span>
        {c.kind === 'instant' && c.remaining != null && <span className={'gc-rem' + (c.remaining === 0 ? ' out' : '')}>{c.remaining === 0 ? 'Uppselt' : `${num(c.remaining)} eftir`}</span>}
        <span className="gc-until"><IconClock size={12} stroke={2} /> til {fmtD(c.ends_on)}</span>
      </div>
      <div className="gc-title">{c.title}</div>
      {c.description && <div className="gc-desc">{c.description}</div>}
      <div className="gc-prize"><IconGift size={14} stroke={2} /> {c.prize}</div>
      {c.kind === 'stamps' && (
        <div className="gc-stamps" aria-label={`${c.stamps} af ${c.stamps_required} stimplum`}>
          {Array.from({ length: c.stamps_required }).map((_, i) => <span key={i} className={'gc-stamp' + (i < c.stamps ? ' on' : '')}>{i < c.stamps ? <IconCheck size={14} stroke={2.5} /> : i + 1}</span>)}
          <small>{won ? 'Þú vannst! Nýtt kort byrjað.' : c.stamps === 0 ? 'Skannaðu kvittun með vörum ' + c.brand : `${c.stamps} af ${c.stamps_required} · einn stimpill á dag`}</small>
        </div>
      )}
      {c.kind === 'instant' && won && <div className="gc-wonlabel"><IconCheck size={14} stroke={2.5} /> Þú ert búin(n) að vinna í þessari herferð</div>}
    </div>
  )
}

function Award({ a }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(a.code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }
  return (
    <div className={'ga ga-' + a.status}>
      <div className="ga-head"><IconTicket size={16} stroke={2} /><b>{a.prize}</b><small>{a.brand} · {a.campaign}</small></div>
      {a.status === 'awarded' && a.code && (
        <div className="ga-code"><code>{a.code}</code><button onClick={copy} aria-label="Afrita">{copied ? <IconCheck size={16} stroke={2} /> : <IconCopy size={16} stroke={2} />}</button></div>
      )}
      {a.status === 'awarded' && !a.code && <div className="ga-note">Verðlaunin eru skráð á þig. {a.description || 'Þú færð upplýsingar um afhendingu.'}</div>}
      {a.status === 'awarded' && a.code && a.description && <div className="ga-note">{a.description}</div>}
      {a.status === 'awarded' && a.expires_at && <div className="ga-note">Gildir til {fmtD(a.expires_at)}</div>}
      {a.status === 'pending_review' && <div className="ga-note ga-pend"><IconClock size={14} stroke={2} /> Kvittunin er í yfirferð. Þú færð kóðann í appinu og í tölvupósti þegar hún hefur verið staðfest, yfirleitt innan dags.</div>}
      {a.status === 'rejected' && <div className="ga-note">Þessi vinningur var ekki staðfestur{a.review_note ? `: ${a.review_note}` : '.'}</div>}
    </div>
  )
}

export default function GriptuTab({ points = 0, threshold = 800, onScan, onOpenRewards, onAdd, onList, refreshKey }) {
  const [camps, setCamps] = useState(null)
  const [awards, setAwards] = useState([])
  useEffect(() => {
    store.myCampaigns().then(setCamps).catch(() => setCamps([]))
    store.myAwards().then(setAwards).catch(() => setAwards([]))
  }, [refreshKey])
  const pct = Math.max(0, Math.min(100, Math.round((Number(points) || 0) / threshold * 100)))
  return (
    <div className="gt">
      <button className="gt-hero" onClick={onOpenRewards}>
        <div className="gt-hero-top">
          <IconGift size={20} stroke={1.9} />
          <span className="gt-pts"><b>{num(points)}</b> stig</span>
          <span className="gt-goal">af {num(threshold)} í gjafakörfu</span>
          <IconChevronRight size={18} stroke={2} className="gt-chev" />
        </div>
        <div className="gt-bar"><div style={{ width: pct + '%' }} /></div>
      </button>
      <button className="add-recipe-btn gt-scan" onClick={onScan}><IconReceipt size={19} stroke={1.9} /> Skanna kvittun og safna</button>

      {camps && camps.length > 0 && (
        <>
          <h3 className="gt-h">Herferðir í gangi</h3>
          <div className="gc-list">{camps.map(c => <Campaign key={c.id} c={c} />)}</div>
        </>
      )}
      {awards.length > 0 && (
        <>
          <h3 className="gt-h">Vinningarnir þínir</h3>
          <div className="ga-list">{awards.map(a => <Award key={a.id} a={a} />)}</div>
        </>
      )}

      <h3 className="gt-h">Vörur sem gefa stig núna</h3>
      <GriptuOffers onAdd={onAdd} onList={onList} />
    </div>
  )
}
