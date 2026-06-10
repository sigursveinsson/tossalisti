import React, { useState } from 'react'

const TREATS = ['🍦', '🍫', '🍕', '🍿', '🧁', '🎮', '📺', '🎬', '🎢', '🏊', '🎨', '🧸', '📱', '🚲', '⚽', '🎁', '💰', '🐾', '🛌', '🌙']
const COST_PRESETS = [20, 50, 100, 150, 250]

function RewardForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [emoji, setEmoji] = useState(initial?.emoji || '🎁')
  const [cost, setCost] = useState(initial?.cost ?? 50)
  const save = () => { if (title.trim()) onSave({ title: title.trim(), emoji, cost: Math.max(0, parseInt(cost, 10) || 0) }) }

  return (
    <div className="reward-form">
      <div className="reward-form-top">
        <span className="reward-emoji big">{emoji}</span>
        <input className="dialog-input" autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()} placeholder="t.d. 30 mín skjátími" />
      </div>
      <div className="emoji-pick">
        {TREATS.map(e => (
          <button key={e} className={'emoji-opt' + (e === emoji ? ' on' : '')} onClick={() => setEmoji(e)}>{e}</button>
        ))}
      </div>
      <div className="modal-label">Kostnaður í stigum</div>
      <div className="cost-row">
        {COST_PRESETS.map(c => (
          <button key={c} className={'points-opt' + (Number(cost) === c ? ' on' : '')} onClick={() => setCost(c)}>{c}</button>
        ))}
      </div>
      <input className="dialog-input" type="number" inputMode="numeric" value={cost}
        onChange={e => setCost(e.target.value)} placeholder="stig" style={{ marginTop: 8 }} />
      <div className="kid-form-actions">
        {onCancel && <button className="kid-cancel" onClick={onCancel}>Hætta við</button>}
        <button className="add-recipe-btn" style={{ flex: 1 }} disabled={!title.trim()} onClick={save}>Vista</button>
      </div>
    </div>
  )
}

export default function RewardsManager({ rewards = [], onCreate, onUpdate, onDelete, onClose }) {
  const [adding, setAdding] = useState(rewards.length === 0)
  const [editId, setEditId] = useState(null)

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Verðlaun <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
          Búðu til umbun sem krakkar geta leyst út fyrir stig. Aflað stig haldast — aðeins ráðstöfunarstig (buddan) lækka.
        </p>

        {rewards.map(r => (
          editId === r.id ? (
            <RewardForm key={r.id} initial={r}
              onSave={async (data) => { await onUpdate(r.id, data); setEditId(null) }}
              onCancel={() => setEditId(null)} />
          ) : (
            <div className="reward-row" key={r.id}>
              <span className="reward-emoji">{r.emoji || '🎁'}</span>
              <span className="reward-title">{r.title}</span>
              <span className="reward-cost">{r.cost} 🪙</span>
              <button className="kid-edit" onClick={() => setEditId(r.id)} aria-label="Breyta">✏️</button>
              <button className="del" onClick={() => onDelete(r.id)} aria-label="Eyða">×</button>
            </div>
          )
        ))}

        {adding ? (
          <RewardForm
            onSave={async (data) => { await onCreate(data); setAdding(false) }}
            onCancel={rewards.length ? () => setAdding(false) : null} />
        ) : (
          <button className="primary-btn" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>+ Nýtt verðlaun</button>
        )}
      </div>
    </div>
  )
}
