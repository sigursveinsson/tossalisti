import React, { useState } from 'react'
import { DEPARTMENTS, DEPT_ORDER, DEPT_BY_KEY } from '../data/departments.js'
import { suggest } from '../data/products.js'

export default function ListView({ items, onAdd, onToggle, onRemove }) {
  const [text, setText] = useState('')
  const sugg = suggest(text)

  const add = (name) => {
    const v = (name ?? text).trim()
    if (!v) return
    onAdd(v); setText('')
  }

  const open = items.filter(i => !i.checked).length

  // Raða deildum í verslunarröð, sleppa tómum.
  const groups = DEPARTMENTS
    .map(d => ({ ...d, items: items.filter(i => i.dept === d.key) }))
    .filter(g => g.items.length)
    .sort((a, b) => DEPT_ORDER[a.key] - DEPT_ORDER[b.key])

  return (
    <div>
      <div className="addbar">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Bættu við vöru…"
          autoComplete="off"
        />
        <button className="add" onClick={() => add()} aria-label="Bæta við">+</button>
        {sugg.length > 0 && (
          <div className="suggest">
            {sugg.map(s => <div key={s} onClick={() => add(s)}>{s}</div>)}
          </div>
        )}
      </div>
      <span className="badge">{open} vörur eftir</span>

      {groups.length === 0 && <p className="empty">Listinn er tómur — bættu við vöru að ofan.</p>}

      {groups.map(g => (
        <div className="group" key={g.key}>
          <div className="group-head">
            <span className="emoji">{g.icon}</span>
            <span className="name" style={{ color: g.color }}>{g.name}</span>
          </div>
          {g.items.map(it => (
            <div className={'item' + (it.checked ? ' done' : '')} key={it.id}>
              <div
                className="check"
                style={{ background: it.checked ? g.color : 'transparent', borderColor: it.checked ? g.color : undefined }}
                onClick={() => onToggle(it)}
              >{it.checked ? '✓' : ''}</div>
              <span className="label" onClick={() => onToggle(it)}>{it.name}</span>
              <button className="del" onClick={() => onRemove(it)} aria-label="Eyða">×</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
