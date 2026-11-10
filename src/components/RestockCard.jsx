import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { IconRefresh, IconX, IconPlus, IconGift, IconChevronRight } from '@tabler/icons-react'

// „Líklega að klárast“: vörur sem notandinn kaupir reglulega og eru líklega að klárast, reiknað á netþjóni
// (my_restock) úr hans eigin kvittunum. Birtist aðeins ef gögnin standa undir því — annars ekkert.
// compact = ein lína á heimaskjá sem opnar innkaupalistann.

const when = (r) => {
  const ago = r.days_since === 0 ? 'í dag' : r.days_since === 1 ? 'í gær' : `fyrir ${r.days_since} dögum`
  const every = `Á ${r.every} daga fresti`
  return r.due_in > 0 ? `${every} · eftir ${r.due_in} ${r.due_in === 1 ? 'dag' : 'daga'}` : `${every} · síðast ${ago}`
}

export function useRestock(refreshKey) {
  const [items, setItems] = useState([])
  useEffect(() => {
    let alive = true
    store.myRestock().then(d => { if (alive) setItems(d) }).catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [refreshKey])
  return [items, setItems]
}

export default function RestockCard({ refreshKey, onAdd, rewardFor, compact = false, onOpen }) {
  const [items, setItems] = useRestock(refreshKey)
  const [busy, setBusy] = useState(false)
  if (!items.length) return null

  if (compact) {
    const names = items.slice(0, 3).map(r => r.label)
    return (
      <button className="home-invite home-restock" onClick={() => onOpen && onOpen()}>
        <span className="home-invite-ic"><IconRefresh size={22} stroke={1.75} /></span>
        <span className="home-invite-txt">
          <b>{items.length} {items.length === 1 ? 'vara líklega að klárast' : 'vörur líklega að klárast'}</b>
          <small>{names.join(', ')}{items.length > 3 ? ' …' : ''}</small>
        </span>
        <span className="home-row-go"><IconChevronRight size={18} stroke={1.75} /></span>
      </button>
    )
  }

  const drop = (canon) => setItems(xs => xs.filter(x => x.canon !== canon))
  const add = async (r) => { drop(r.canon); try { await onAdd(r.label) } catch {} }
  const dismiss = async (r) => { drop(r.canon); try { await store.dismissRestock(r.canon) } catch {} }
  const addAll = async () => {
    setBusy(true)
    const list = items.slice(); setItems([])
    for (const r of list) { try { await onAdd(r.label) } catch {} }
    setBusy(false)
  }

  return (
    <div className="rs">
      <div className="rs-h"><IconRefresh size={16} stroke={2} /><b>Líklega að klárast</b><span>úr kvittunum þínum</span></div>
      {items.map(r => {
        const rp = rewardFor ? rewardFor(r.label) : null
        return (
          <div className="rs-row" key={r.canon}>
            <div className="rs-txt">
              <b>{r.label}</b>
              <small>{when(r)}</small>
              {rp && <span className="rs-pts"><IconGift size={12} stroke={2} /> {rp.reward_type === 'percent' ? `${rp.reward_value}%` : `+${rp.reward_value} stig`}</span>}
            </div>
            <button className="rs-add" onClick={() => add(r)}><IconPlus size={15} stroke={2.25} /> Á listann</button>
            <button className="rs-x" onClick={() => dismiss(r)} aria-label={'Fela ' + r.label} title="Ekki núna"><IconX size={17} stroke={1.9} /></button>
          </div>
        )
      })}
      {items.length > 1 && <button className="rs-all" onClick={addAll} disabled={busy}>Setja allar á listann</button>}
    </div>
  )
}
