import React, { useEffect, useState } from 'react'
import { IconArrowLeft, IconPlus, IconCheck, IconPin, IconPinnedOff, IconEyeOff, IconAlertCircle, IconCamera } from '@tabler/icons-react'
import { store } from '../lib/store.js'
import { imageFor } from '../lib/generic.js'
import { departmentFor } from '../data/products.js'
import { CatIcon } from '../data/icons.jsx'

// „Minn listi“: vörur sem notandinn kaupir oft, lærðar af kvittunum (my_staples).
// „Vantar líklega“ = komið fram yfir venjulegan takt. Einn smellur setur vöru á innkaupalistann.
const dagar = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? ' dag' : ' daga')
const sinceTxt = (d) => d == null ? '' : d === 0 ? 'keypt í dag' : d === 1 ? 'síðast í gær' : 'síðast fyrir ' + dagar(d)

export default function MyListView({ onClose, onAdd, onScan, catalog = {}, genericImgs = {}, onListItems = [] }) {
  const [data, setData] = useState(null)
  const [added, setAdded] = useState({})
  const [newPin, setNewPin] = useState('')
  const onList = new Set(onListItems.map(n => String(n).toLowerCase().trim()))

  const load = () => store.myStaples().then(setData).catch(() => setData({ items: [], receipts: 0 }))
  useEffect(() => { load() }, [])

  const items = data?.items || []
  const due = items.filter(i => i.due)
  const rest = items.filter(i => !i.due)
  const isOn = (i) => added[i.key] || onList.has(String(i.name).toLowerCase().trim())

  const add = async (i) => {
    if (isOn(i)) return
    setAdded(a => ({ ...a, [i.key]: true }))
    try { await onAdd(i.name) } catch { setAdded(a => ({ ...a, [i.key]: false })) }
  }
  const addAllDue = async () => { for (const i of due) if (!isOn(i)) await add(i) }
  const pin = async (i) => { await store.setStaplePref(i.key, i.pinned ? null : 'pin', i.name); load() }
  const hide = async (i) => { await store.setStaplePref(i.key, 'hide', i.name); load() }
  const pinNew = async () => {
    const n = newPin.trim(); if (!n) return
    await store.setStaplePref(n.toLowerCase(), 'pin', n); setNewPin(''); load()
  }

  const row = (i) => {
    const img = imageFor(i.name, catalog, genericImgs)
    return (
      <div className="ml-row" key={i.key}>
        {img ? <img className="ml-img" src={img} alt="" loading="lazy" /> : <CatIcon name={i.name} dept={departmentFor(i.name)} size={44} />}
        <div className="ml-main">
          <div className="ml-name">{i.name}{i.pinned && <IconPin size={13} className="ml-pin-ic" />}</div>
          <div className={'ml-sub' + (i.due ? ' due' : '')}>
            {i.times > 0 ? (i.interval ? '~' + dagar(i.interval) + ' fresti' : i.times + '×') : 'Fest'}
            {i.since != null ? ' · ' + sinceTxt(i.since) : ''}
          </div>
        </div>
        <div className="ml-tools">
          <button className="ml-ghost" onClick={() => pin(i)} aria-label={i.pinned ? 'Losa' : 'Festa'}>{i.pinned ? <IconPinnedOff size={16} /> : <IconPin size={16} />}</button>
          {!i.pinned && <button className="ml-ghost" onClick={() => hide(i)} aria-label="Fela"><IconEyeOff size={16} /></button>}
        </div>
        <button className={'ml-add' + (isOn(i) ? ' on' : '')} onClick={() => add(i)} aria-label={isOn(i) ? 'Komið á listann' : 'Setja á innkaupalistann'}>
          {isOn(i) ? <IconCheck size={18} stroke={2.4} /> : <IconPlus size={18} stroke={2.2} />}
        </button>
      </div>
    )
  }

  return (
    <div className="ml-bg">
      <div className="ml">
        <div className="ml-head">
          <button className="ml-back" onClick={onClose} aria-label="Til baka"><IconArrowLeft size={22} /></button>
          <div>
            <h1>Minn listi</h1>
            <small>{data ? (data.receipts > 0 ? `Byggt á ${data.receipts} ${data.receipts === 1 ? 'kvittun' : 'kvittunum'} · lærir af hverri skönnun` : 'Byggt á innkaupalistunum þínum') : 'Hleð…'}</small>
          </div>
        </div>

        {due.length > 0 && (
          <div className="ml-due">
            <IconAlertCircle size={18} />
            <span>{due.length} {due.length === 1 ? 'vara vantar' : 'vörur vantar'} líklega</span>
            <button onClick={addAllDue}>Setja á listann</button>
          </div>
        )}

        {data && items.length === 0 && (
          <div className="ml-empty">
            <b>Minn listi fyllist sjálfur</b>
            <p>Eftir 2–3 kvittanir veit Tossalisti hvað þú kaupir reglulega og minnir þig á það þegar það er líklega búið.</p>
            {onScan && <button className="ml-scan" onClick={onScan}><IconCamera size={18} /> Skanna kvittun</button>}
          </div>
        )}

        {due.length > 0 && <div className="ml-sec">Vantar líklega</div>}
        {due.map(row)}
        {rest.length > 0 && <div className="ml-sec">Kaupir oft</div>}
        {rest.map(row)}

        <div className="ml-pinrow">
          <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Festa vöru, t.d. kaffi" onKeyDown={e => e.key === 'Enter' && pinNew()} />
          <button onClick={pinNew} aria-label="Festa"><IconPin size={18} /></button>
        </div>
      </div>
    </div>
  )
}
