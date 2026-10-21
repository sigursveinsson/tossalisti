import React from 'react'
import GriptuOffers from './GriptuOffers.jsx'
import { IconGift, IconReceipt, IconChevronRight } from '@tabler/icons-react'

// Gríptu-flipinn á innkaupalistanum — aðeins sýnilegur notendum í tryggðarkerfinu (boðshópur).
// Efst: stigastaða + skanna kvittun. Svo allar vörur sem gefa stig núna; „Á listann“ setur vöruna beint á listann.
const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export default function GriptuTab({ points = 0, threshold = 800, onScan, onOpenRewards, onAdd, onList }) {
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
      <button className="add-recipe-btn gt-scan" onClick={onScan}><IconReceipt size={19} stroke={1.9} /> Skanna kvittun og safna stigum</button>
      <h3 className="gt-h">Vörur sem gefa stig núna</h3>
      <GriptuOffers onAdd={onAdd} onList={onList} />
    </div>
  )
}
