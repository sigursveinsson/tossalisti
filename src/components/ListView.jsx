import React, { useState } from 'react'
import { DEPARTMENTS, DEPT_ORDER } from '../data/departments.js'
import { suggest } from '../data/products.js'

const initials = (email) => email ? email.split('@')[0].slice(0, 2).toUpperCase() : '?'

export default function ListView({ items, listType = 'shopping', members = [], currentUserId, onAdd, onToggle, onRemove, onAssign }) {
  const isTask = listType === 'task'
  const [text, setText] = useState('')
  const [assigning, setAssigning] = useState(null) // liður sem verið er að úthluta
  const sugg = isTask ? [] : suggest(text)

  const canAssign = members.length > 1 && typeof onAssign === 'function'
  const emailOf = (uid) => (members.find(m => m.user_id === uid) || {}).email

  const add = (name) => {
    const v = (name ?? text).trim()
    if (!v) return
    onAdd(v); setText('')
  }

  const open = items.filter(i => !i.checked).length

  const assignBtn = (it) => {
    if (!canAssign) return null
    return it.assignee
      ? <button className="assign-chip" onClick={() => setAssigning(it)} title={emailOf(it.assignee) || ''}>{initials(emailOf(it.assignee))}</button>
      : <button className="assign-add" onClick={() => setAssigning(it)} aria-label="Úthluta">＋</button>
  }

  const itemRow = (it, color) => (
    <div className={'item' + (it.checked ? ' done' : '')} key={it.id}>
      <div
        className="check"
        style={{ background: it.checked ? color : 'transparent', borderColor: it.checked ? color : undefined }}
        onClick={() => onToggle(it)}
      >{it.checked ? '✓' : ''}</div>
      <span className="label" onClick={() => onToggle(it)}>{it.name}</span>
      {assignBtn(it)}
      <button className="del" onClick={() => onRemove(it)} aria-label="Eyða">×</button>
    </div>
  )

  const addBar = (
    <div className="addbar">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && add()}
        placeholder={isTask ? 'Bættu við verki…' : 'Bættu við vöru…'}
        autoComplete="off"
      />
      <button className="add" onClick={() => add()} aria-label="Bæta við">+</button>
      {sugg.length > 0 && (
        <div className="suggest">
          {sugg.map(s => <div key={s} onClick={() => add(s)}>{s}</div>)}
        </div>
      )}
    </div>
  )

  const assignModal = assigning && (
    <div className="sheet-bg center" onClick={() => setAssigning(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Hver ber ábyrgð? <button className="x" onClick={() => setAssigning(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 10 }}>{assigning.name}</div>
        {members.map(m => (
          <button className="pick-row" key={m.user_id} onClick={() => { onAssign(assigning, m.user_id); setAssigning(null) }}>
            <span>{m.email}{m.user_id === currentUserId ? ' (þú)' : ''}</span>
            <span className="assign-chip" style={{ pointerEvents: 'none' }}>{initials(m.email)}</span>
          </button>
        ))}
        <button className="pick-row" onClick={() => { onAssign(assigning, null); setAssigning(null) }}>
          <span>Enginn</span>
        </button>
      </div>
    </div>
  )

  // VERKEFNALISTI: einfaldur gátlisti í röð, óhökuð fyrst
  if (isTask) {
    const ordered = [...items].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
    return (
      <div>
        {addBar}
        <span className="badge">{open} eftir</span>
        {items.length === 0 && <p className="empty">Listinn er tómur — bættu við verki að ofan.</p>}
        <div className="group">
          {ordered.map(it => itemRow(it, 'var(--accent)'))}
        </div>
        {assignModal}
      </div>
    )
  }

  // INNKAUPALISTI: flokkað eftir búðardeildum
  const groups = DEPARTMENTS
    .map(d => ({ ...d, items: items.filter(i => i.dept === d.key) }))
    .filter(g => g.items.length)
    .sort((a, b) => DEPT_ORDER[a.key] - DEPT_ORDER[b.key])

  return (
    <div>
      {addBar}
      <span className="badge">{open} vörur eftir</span>

      {groups.length === 0 && <p className="empty">Listinn er tómur — bættu við vöru að ofan.</p>}

      {groups.map(g => (
        <div className="group" key={g.key}>
          <div className="group-head">
            <span className="emoji">{g.icon}</span>
            <span className="name" style={{ color: g.color }}>{g.name}</span>
          </div>
          {g.items.map(it => itemRow(it, g.color))}
        </div>
      ))}
      {assignModal}
    </div>
  )
}
