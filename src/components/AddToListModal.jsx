import React from 'react'

export default function AddToListModal({ recipe, lists, onPick, onClose }) {
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Bæta „{recipe.name}“ á lista <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        {lists.map(l => (
          <button className="pick-row" key={l.id} onClick={() => onPick(l.id)}>
            <span>{l.name}</span>
            <span className="lcount">{l.items.length} vörur</span>
          </button>
        ))}
      </div>
    </div>
  )
}
