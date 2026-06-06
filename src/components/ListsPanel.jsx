import React, { useState } from 'react'

export default function ListsPanel({ lists, currentId, onSwitch, onCreate, onDelete, onShare, onDuplicate, onRename, onClose }) {
  const [name, setName] = useState('')

  const create = () => {
    const v = name.trim()
    if (!v) return
    onCreate(v); setName('')
  }

  const current = lists.filter(l => l.id === currentId)
  const others = lists.filter(l => l.id !== currentId)

  const row = (l) => (
    <div className={'lrow' + (l.id === currentId ? ' active' : '')} key={l.id}>
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSwitch(l.id)}>
        <span className="lname">{l.name}</span>
        {l.shared && <span className="shared-tag">deilt</span>}
        <div className="lcount">{l.items.length} vörur</div>
      </div>
      <button className="ico" onClick={() => onRename(l)} aria-label="Endurnefna" title="Breyta nafni">✎</button>
      <button className="ico" onClick={() => onDuplicate(l)} aria-label="Afrita" title="Afrita lista">⧉</button>
      <button className="ico share" onClick={() => onShare(l)} aria-label="Deila" title="Deila lista">⤴</button>
      <button className="ico" onClick={() => onDelete(l)} aria-label="Eyða" title="Eyða lista">🗑</button>
    </div>
  )

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h2>Listarnir mínir <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        <div className="sheet-label">Núverandi listi</div>
        {current.map(row)}

        {others.length > 0 && <div className="sheet-label">Aðrir listar</div>}
        {others.map(row)}

        <div className="sheet-label">Nýr listi</div>
        <div className="newrow">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            placeholder="t.d. Matarboð…"
          />
          <button onClick={create}>Búa til</button>
        </div>
      </div>
    </div>
  )
}
