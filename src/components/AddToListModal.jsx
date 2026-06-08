import React, { useState } from 'react'
import { ingredientLine } from '../data/recipes.js'

export default function AddToListModal({ recipe, servings, lists, defaultListId, onConfirm, onClose }) {
  const factor = servings / recipe.serves
  const lines = recipe.ingredients.map(ing => ingredientLine(ing, factor))
  const [checked, setChecked] = useState(() => lines.map(() => true))
  const [listId, setListId] = useState(defaultListId || (lists[0] && lists[0].id))

  const toggle = (i) => setChecked(c => c.map((v, idx) => (idx === i ? !v : v)))
  const count = checked.filter(Boolean).length
  const confirm = () => onConfirm(listId, lines.filter((_, i) => checked[i]))

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{recipe.emoji} {recipe.name} <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        {lists.length > 1 && (
          <>
            <div className="modal-label">Á hvaða lista?</div>
            <select className="list-select" value={listId} onChange={e => setListId(e.target.value)}>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </>
        )}

        <div className="modal-label">Hráefni ({count} valin)</div>
        <div className="ing-check-list">
          {lines.map((line, i) => (
            <button key={i} className={'ing-check' + (checked[i] ? ' on' : '')} onClick={() => toggle(i)}>
              <span className="box">{checked[i] ? '✓' : ''}</span>
              <span>{line}</span>
            </button>
          ))}
        </div>

        <button className="add-recipe-btn" onClick={confirm} disabled={count === 0}>
          Bæta {count} hráefni á lista
        </button>
      </div>
    </div>
  )
}
