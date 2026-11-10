import React from 'react'
import GriptuTab from './GriptuTab.jsx'
import { useBackClose } from '../lib/backstack.js'
import { IconGift, IconX, IconShoppingCart } from '@tabler/icons-react'

// Gríptu opnað af heimaskjá: sama efni og Gríptu-flipinn (stig, herferðir, vinningar, vörur),
// en þar sem enginn listi er opinn velur notandinn hér á hvaða innkaupalista vörurnar fara.
export default function GriptuHome({ lists = [], listId, onPickList, points, onScan, onOpenRewards, onAdd, onList, refreshKey, onClose }) {
  useBackClose(true, onClose)
  const target = lists.find(l => l.id === listId) || lists[0]
  return (
    <div className="gh-bg">
      <div className="gh">
        <div className="gh-head">
          <IconGift size={22} stroke={1.9} />
          <b>Gríptu</b>
          <button className="gh-x" onClick={onClose} aria-label="Loka"><IconX size={22} stroke={1.9} /></button>
        </div>
        <div className="gh-pick">
          <IconShoppingCart size={18} stroke={1.75} />
          {lists.length === 0
            ? <span className="gh-pick-none">Þú átt engan innkaupalista enn — búðu til lista til að setja vörur á.</span>
            : lists.length === 1
              ? <span>Vörur fara á <b>{target.name}</b></span>
              : <>
                  <label htmlFor="gh-list">Setja vörur á</label>
                  <select id="gh-list" className="list-select" value={target ? target.id : ''} onChange={e => onPickList(e.target.value)}>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}{l.shared ? ' (deilt)' : ''}</option>)}
                  </select>
                </>}
        </div>
        <div className="gh-body">
          <GriptuTab refreshKey={refreshKey} points={points} onScan={onScan} onOpenRewards={onOpenRewards}
            onAdd={lists.length ? onAdd : null} onList={onList} />
        </div>
      </div>
    </div>
  )
}
