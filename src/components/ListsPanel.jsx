import React, { useState } from 'react'

const TYPE = {
  shopping: { icon: '🛒', tint: '#eef3fb' },
  task: { icon: '✅', tint: '#e1f5ee' },
  schedule: { icon: '📅', tint: '#faeeda' },
}

export default function ListsPanel({ lists, currentId, onSwitch, onCreate, onDelete, onShare, onDuplicate, onRename, templates = [], onCreateFromTemplate, userEmail, onSignOut, onClose }) {
  const [name, setName] = useState('')
  const [newType, setNewType] = useState('shopping')
  const [creating, setCreating] = useState(false)
  const [actionList, setActionList] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const create = () => {
    const v = name.trim()
    if (!v) return
    onCreate(v, newType); setName(''); setCreating(false)
  }

  const tellFriend = async () => {
    const url = 'https://tossalisti.is'
    const text = 'Ég nota Tossalista — íslenskt app fyrir innkaupa- og verkefnalista, deilanlegt með fjölskyldu og vinum. Prófaðu:'
    if (navigator.share) {
      try { await navigator.share({ title: 'Tossalisti', text, url }) } catch (e) { /* hætt við */ }
    } else {
      try { await navigator.clipboard.writeText(text + ' ' + url) } catch (e) { /* clipboard læst */ }
    }
  }
  const tp = (l) => TYPE[l.type] || TYPE.shopping

  const row = (l) => (
    <div className={'lrow2' + (l.id === currentId ? ' active' : '')} key={l.id}>
      <span className="ltype" style={{ background: tp(l).tint }}>{tp(l).icon}</span>
      <div className="linfo" onClick={() => onSwitch(l.id)}>
        <div className="lname">{l.name}{l.shared && <span className="shared-tag">deilt</span>}</div>
        <div className="lcount">{l.items.length} {l.type === 'task' ? 'verk' : 'vörur'}</div>
      </div>
      <button className="ico" onClick={() => setActionList(l)} aria-label="Aðgerðir">⋯</button>
    </div>
  )

  return (
    <>
      <div className="sheet-bg" onClick={onClose}>
        <div className="sheet" onClick={e => e.stopPropagation()}>
          <h2>Listarnir mínir <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

          {!creating ? (
            <button className="primary-btn" onClick={() => setCreating(true)}>+ Nýr listi</button>
          ) : (
            <div className="create-box">
              <div className="seg seg3" style={{ marginBottom: 8 }}>
                <button className={newType === 'shopping' ? 'on' : ''} onClick={() => setNewType('shopping')}>🛒 Innkaup</button>
                <button className={newType === 'task' ? 'on' : ''} onClick={() => setNewType('task')}>✅ Verk</button>
                <button className={newType === 'schedule' ? 'on' : ''} onClick={() => setNewType('schedule')}>📅 Skema</button>
              </div>
              <div className="newrow">
                <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} placeholder={newType === 'schedule' ? 't.d. Heimilisskema…' : newType === 'task' ? 't.d. Brúðkaup…' : 't.d. Matarboð…'} />
                <button onClick={create}>Búa til</button>
              </div>
            </div>
          )}

          <div className="sheet-label">Mínir listar</div>
          {lists.map(row)}

          <button className="tpl-link" onClick={() => setShowTemplates(s => !s)}>
            <span>📋 Sniðmát</span>
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{showTemplates ? '▾' : '›'}</span>
          </button>
          {showTemplates && (
            <div className="tpl-grid">
              {templates.map(t => (
                <button className="tpl-card" key={t.id} onClick={() => onCreateFromTemplate(t)}>
                  <span className="tpl-emoji">{t.emoji}</span>
                  <span className="tpl-name">{t.name}</span>
                </button>
              ))}
            </div>
          )}

          <button className="tellfriend-btn" onClick={tellFriend}>📲 Segðu vini frá Tossalista</button>

          {onSignOut && (
            <div className="sheet-footer">
              {userEmail && <span className="sheet-user">{userEmail}</span>}
              <button className="signout-btn" onClick={onSignOut}>Skrá út</button>
            </div>
          )}
        </div>
      </div>

      {actionList && (
        <div className="sheet-bg center" onClick={() => setActionList(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ textTransform: 'capitalize' }}>{actionList.name} <button className="x" onClick={() => setActionList(null)} aria-label="Loka">×</button></h2>
            <button className="action-row" onClick={() => { onRename(actionList); setActionList(null) }}>✎ Endurnefna</button>
            <button className="action-row" onClick={() => { onDuplicate(actionList); setActionList(null) }}>⧉ Afrita</button>
            <button className="action-row" onClick={() => { onShare(actionList); setActionList(null) }}>⤴ Deila</button>
            <button className="action-row danger" onClick={() => { onDelete(actionList); setActionList(null) }}>🗑 Eyða</button>
          </div>
        </div>
      )}
    </>
  )
}
