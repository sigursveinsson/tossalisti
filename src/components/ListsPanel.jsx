import React, { useState } from 'react'

const TYPE_ICON = { shopping: '🛒', task: '✅' }

export default function ListsPanel({ lists, currentId, onSwitch, onCreate, onDelete, onShare, onDuplicate, onRename, templates = [], onCreateFromTemplate, userEmail, onSignOut, onClose }) {
  const [name, setName] = useState('')
  const [newType, setNewType] = useState('shopping')

  const create = () => {
    const v = name.trim()
    if (!v) return
    onCreate(v, newType); setName('')
  }

  const current = lists.filter(l => l.id === currentId)
  const others = lists.filter(l => l.id !== currentId)

  const row = (l) => (
    <div className={'lrow' + (l.id === currentId ? ' active' : '')} key={l.id}>
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSwitch(l.id)}>
        <span className="lname">{TYPE_ICON[l.type] || '🛒'} {l.name}</span>
        {l.shared && <span className="shared-tag">deilt</span>}
        <div className="lcount">{l.items.length} {l.type === 'task' ? 'verk' : 'vörur'}</div>
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
        <div className="seg" style={{ marginBottom: 8 }}>
          <button className={newType === 'shopping' ? 'on' : ''} onClick={() => setNewType('shopping')}>🛒 Innkaup</button>
          <button className={newType === 'task' ? 'on' : ''} onClick={() => setNewType('task')}>✅ Verkefni</button>
        </div>
        <div className="newrow">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            placeholder={newType === 'task' ? 't.d. Brúðkaup…' : 't.d. Matarboð…'}
          />
          <button onClick={create}>Búa til</button>
        </div>

        {templates.length > 0 && (
          <>
            <div className="sheet-label">Eða byrjaðu með sniðmáti</div>
            <div className="tpl-grid">
              {templates.map(t => (
                <button className="tpl-card" key={t.id} onClick={() => onCreateFromTemplate(t)}>
                  <span className="tpl-emoji">{t.emoji}</span>
                  <span className="tpl-name">{t.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {onSignOut && (
          <div className="sheet-footer">
            {userEmail && <span className="sheet-user">{userEmail}</span>}
            <button className="signout-btn" onClick={onSignOut}>Skrá út</button>
          </div>
        )}
      </div>
    </div>
  )
}
