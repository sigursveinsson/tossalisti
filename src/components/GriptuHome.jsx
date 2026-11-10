import React, { useState } from 'react'
import GriptuTab from './GriptuTab.jsx'
import { useBackClose } from '../lib/backstack.js'
import { IconGift, IconX, IconShoppingCart, IconChevronRight, IconCheck } from '@tabler/icons-react'

// Gríptu opnað af heimaskjá: sama efni og Gríptu-flipinn (stig, herferðir, vinningar, vörur).
// Enginn listi er opinn hér, svo þegar notandi ýtir á „Á listann“ og á fleiri en einn innkaupalista
// er spurt Á HVAÐA LISTA varan á að fara. Valið er munað (og sýnt efst) en alltaf hægt að breyta.
const open = (l) => l.items.filter(i => !i.checked).length

export default function GriptuHome({ lists = [], listId, onPickList, points, onScan, onOpenRewards, onAdd, onList, refreshKey, onClose }) {
  const [pending, setPending] = useState(null)   // { name, image } — vara sem bíður eftir listavali
  const [picking, setPicking] = useState(false)  // listaval opnað af stikunni efst (engin vara í bið)
  const [chosen, setChosen] = useState(false)    // hefur notandinn valið lista í þessari lotu?
  useBackClose(true, onClose)
  const target = lists.find(l => l.id === listId) || lists[0]
  const many = lists.length > 1

  const add = (name, image) => {
    if (many && !chosen) { setPending({ name, image }); return }   // fyrsta vara: spyrja hvert hún á að fara
    onAdd(name, image, target && target.id)
  }
  const pick = (id) => {
    onPickList(id); setChosen(true); setPicking(false)
    if (pending) { onAdd(pending.name, pending.image, id); setPending(null) }
  }
  const closePick = () => { setPending(null); setPicking(false) }

  return (
    <div className="gh-bg">
      <div className="gh">
        <div className="gh-head">
          <IconGift size={22} stroke={1.9} />
          <b>Gríptu</b>
          <button className="gh-x" onClick={onClose} aria-label="Loka"><IconX size={22} stroke={1.9} /></button>
        </div>
        {lists.length === 0
          ? <div className="gh-pick"><IconShoppingCart size={18} stroke={1.75} /><span className="gh-pick-none">Þú átt engan innkaupalista enn — búðu til lista til að setja vörur á.</span></div>
          : many
            ? <button className="gh-pick gh-pick-btn" onClick={() => setPicking(true)}>
                <IconShoppingCart size={18} stroke={1.75} />
                <span>Vörur fara á <b>{target.name}</b></span>
                <span className="gh-change">Breyta <IconChevronRight size={16} stroke={2} /></span>
              </button>
            : <div className="gh-pick"><IconShoppingCart size={18} stroke={1.75} /><span>Vörur fara á <b>{target.name}</b></span></div>}
        <div className="gh-body">
          <GriptuTab refreshKey={refreshKey} points={points} onScan={onScan} onOpenRewards={onOpenRewards}
            onAdd={lists.length ? add : null} onList={onList} />
        </div>
      </div>

      {(pending || picking) && (
        <div className="sheet-bg center" onClick={closePick}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Á hvaða lista? <button className="x" onClick={closePick} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
            {pending && <p className="gh-pending">„{pending.name}“ fer á listann sem þú velur. Næstu vörur fara á sama lista.</p>}
            {lists.map(l => (
              <button key={l.id} className={'action-row gh-listrow' + (target && l.id === target.id ? ' on' : '')} onClick={() => pick(l.id)}>
                <IconShoppingCart size={18} stroke={1.75} />
                <span className="gh-listname">{l.name}{l.shared ? <small> · deilt</small> : null}</span>
                <small className="gh-listcount">{open(l)} {open(l) === 1 ? 'vara' : 'vörur'}</small>
                {target && l.id === target.id && chosen && <IconCheck size={16} stroke={2.5} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
