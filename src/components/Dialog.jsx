import React, { useState } from 'react'

export default function Dialog({ title, message, input, defaultValue, confirmLabel = 'Í lagi', danger, onConfirm, onClose }) {
  const [val, setVal] = useState(defaultValue || '')

  const confirm = () => onConfirm(input ? val : true)

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{title} <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        {message && <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 14px' }}>{message}</p>}
        {input && (
          <input
            className="dialog-input"
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirm()}
          />
        )}
        <div className="dialog-actions">
          <button className="dialog-cancel" onClick={onClose}>Hætta við</button>
          <button className={'dialog-ok' + (danger ? ' danger' : '')} onClick={confirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
