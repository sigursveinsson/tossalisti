import React, { useState } from 'react'

const COLORS = ['#15315e', '#2563eb', '#1d9e75', '#d85a30', '#a83b66', '#9a6512', '#5b4bd1', '#0f8a6a']

export default function ProfileSetup({ initial, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setBusy(true)
    await onSave(name.trim(), color)
    setBusy(false)
  }

  const initials = (name.trim().slice(0, 2) || '?').toUpperCase()

  return (
    <div className="landing">
      <div className="hero">
        <div className="hero-logo">🧺</div>
        <h1>Velkomin!</h1>
        <p className="lead">Hvað heitir þú? Þá sjá aðrir hver þú ert á sameiginlegum listum.</p>
      </div>

      <div className="signin-card">
        <div className="profile-avatar" style={{ background: color }}>{initials}</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Nafnið þitt"
          style={{ marginTop: 12 }}
        />
        <div className="modal-label" style={{ textAlign: 'left' }}>Veldu lit</div>
        <div className="color-row">
          {COLORS.map(c => (
            <button
              key={c}
              className={'color-dot' + (color === c ? ' on' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label="Litur"
            />
          ))}
        </div>
        <button onClick={save} disabled={busy || !name.trim()}>Áfram</button>
      </div>
    </div>
  )
}
