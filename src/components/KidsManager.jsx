import React, { useState } from 'react'
import { resizeImageFile } from '../lib/img.js'

const COLORS = ['#e8615a', '#e8954a', '#e8c84a', '#5a9e5a', '#4aa6c8', '#4a6fd0', '#9a5ad0', '#d05a9a']

const initials = (name) => (name || '?').trim().slice(0, 2).toUpperCase()

function KidForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [avatar, setAvatar] = useState(initial?.avatar_url || null)
  const [busy, setBusy] = useState(false)

  const pickPhoto = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setBusy(true)
    try { setAvatar(await resizeImageFile(f, 256)) } catch (err) {} finally { setBusy(false) }
  }
  const save = () => { if (name.trim()) onSave({ name: name.trim(), color, avatar_url: avatar }) }

  return (
    <div className="kid-form">
      <div className="kid-form-top">
        <label className="kid-avatar-pick" style={{ background: color }}>
          {avatar ? <img src={avatar} alt="" /> : <span>{initials(name)}</span>}
          <span className="kid-cam">📷</span>
          <input type="file" accept="image/*" capture="user" hidden onChange={pickPhoto} />
        </label>
        <input className="dialog-input" autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()} placeholder="Nafn krakka" />
      </div>
      <div className="kid-colors">
        {COLORS.map(c => (
          <button key={c} className={'kid-color' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} aria-label="Litur" />
        ))}
      </div>
      <div className="kid-form-actions">
        {onCancel && <button className="kid-cancel" onClick={onCancel}>Hætta við</button>}
        <button className="add-recipe-btn" style={{ flex: 1 }} disabled={!name.trim() || busy} onClick={save}>
          {busy ? 'Hleð mynd…' : 'Vista'}
        </button>
      </div>
    </div>
  )
}

export default function KidsManager({ kids = [], onCreate, onUpdate, onDelete, onClose }) {
  const [adding, setAdding] = useState(kids.length === 0)
  const [editId, setEditId] = useState(null)

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Krakkar <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
          Stofnaðu prófíl fyrir barn án netfangs. Mynd gerir skemað skemmtilegra og hjálpar þeim sem ekki lesa.
        </p>

        {kids.map(k => (
          editId === k.id ? (
            <KidForm key={k.id} initial={k}
              onSave={async (data) => { await onUpdate(k.id, data); setEditId(null) }}
              onCancel={() => setEditId(null)} />
          ) : (
            <div className="kid-row" key={k.id}>
              <span className="assign-chip has-avatar" style={{ pointerEvents: 'none', background: k.color || undefined }}>
                {k.avatar_url ? <img src={k.avatar_url} alt="" /> : initials(k.name)}
              </span>
              <span className="kid-row-name">{k.name}</span>
              <button className="kid-edit" onClick={() => setEditId(k.id)} aria-label="Breyta">✏️</button>
              <button className="del" onClick={() => onDelete(k.id)} aria-label="Eyða">×</button>
            </div>
          )
        ))}

        {adding ? (
          <KidForm
            onSave={async (data) => { await onCreate(data); setAdding(false) }}
            onCancel={kids.length ? () => setAdding(false) : null} />
        ) : (
          <button className="primary-btn" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>+ Stofna krakka</button>
        )}
      </div>
    </div>
  )
}
