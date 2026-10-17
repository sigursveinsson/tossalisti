import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { IconGift, IconCheck, IconTruckDelivery, IconBuildingStore, IconPhone } from '@tabler/icons-react'

// Útleysingar vörumerkis: samþykktar beiðnir sem bíða afhendingar, og þær sem eru afhentar.
// Nafn og sími þátttakanda birtast hér — eina staðinn þar sem vörumerkið sér persónugögn, með samþykki hans í beiðninni.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des']
const fmt = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${Number(m[3])}. ${MONTHS[Number(m[2]) - 1]}` : '' }
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)

export default function BrandRedemptions({ brandId, canEdit }) {
  const [list, setList] = useState(null)
  const load = () => store.brandRedemptions(brandId).then(setList).catch(() => setList([]))
  useEffect(() => { setList(null); if (brandId) load() }, [brandId])
  const deliver = async (r) => {
    if (!window.confirm(`Merkja körfu til ${r.name} sem afhenta?`)) return
    try { await store.markDelivered(r.id); load() } catch (e) { window.alert('Tókst ekki: ' + (e.message || e)) }
  }
  const open = (list || []).filter(r => r.status === 'approved')
  const done = (list || []).filter(r => r.status === 'delivered')
  const Row = ({ r }) => {
    const late = r.status === 'approved' && daysSince(r.reviewed_at) > 10
    return (
      <div className={'br-item' + (late ? ' late' : '')}>
        <div className="br-who">
          <b>{r.name}</b>
          <small><IconPhone size={12} stroke={2} /> <a href={`tel:${(r.phone || '').replace(/\s/g, '')}`}>{r.phone}</a></small>
          <small>{r.delivery === 'home' ? <><IconTruckDelivery size={12} stroke={2} /> {r.address}</> : <><IconBuildingStore size={12} stroke={2} /> Sækir hjá ykkur</>}</small>
        </div>
        <div className="br-what">
          <span>{r.offer_title}</span>
          <small>{r.status === 'delivered' ? `Afhent ${fmt(r.delivered_at)}` : `Samþykkt ${fmt(r.reviewed_at)}${late ? ' · komið yfir 10 virka daga' : ''}`}</small>
        </div>
        {r.status === 'approved'
          ? (canEdit ? <button className="primary-btn br-btn" onClick={() => deliver(r)}><IconCheck size={15} stroke={2.2} /> Merkja afhent</button> : <span className="bc-status pend">Bíður afhendingar</span>)
          : <span className="bc-status ok"><IconCheck size={13} stroke={2.2} /> Afhent</span>}
      </div>
    )
  }
  return (
    <div className="bd-card">
      <div className="bd-card-h"><IconGift size={17} stroke={1.75} className="bd-h-ico" /> Útleysingar <span>þátttakendur sem hafa náð körfu — Gríptu hefur farið yfir kvittanirnar, þið afhendið</span></div>
      {list === null && <div className="bd-muted">Sæki…</div>}
      {list && list.length === 0 && <div className="bd-muted">Enginn hefur náð körfu enn.</div>}
      {open.length > 0 && <div className="br-head">Bíða afhendingar <b>{open.length}</b></div>}
      {open.map(r => <Row key={r.id} r={r} />)}
      {done.length > 0 && <div className="br-head">Afhentar <b>{done.length}</b></div>}
      {done.map(r => <Row key={r.id} r={r} />)}
      {list && list.length > 0 && <div className="bd-muted br-note">Afhending innan 10 virkra daga frá samþykkt. Þátttakandinn sér stöðuna í appinu og fær staðfestingu þegar þið merkið afhent.</div>}
    </div>
  )
}
