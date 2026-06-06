import React, { useState, useMemo } from 'react'
import { RECIPES } from '../data/recipes.js'

export default function RecipesView({ onAddRecipe }) {
  const [open, setOpen] = useState(null)
  const [q, setQ] = useState('')

  const terms = q.toLowerCase().split(/[\s,]+/).map(t => t.trim()).filter(Boolean)

  const results = useMemo(() => {
    if (!terms.length) return RECIPES.map(r => ({ r, matches: 0 }))
    return RECIPES
      .map(r => {
        const nameMatch = terms.some(t => r.name.toLowerCase().includes(t))
        const matches = r.ingredients.filter(ing => terms.some(t => ing.includes(t))).length
        return { r, matches, nameMatch }
      })
      .filter(x => x.nameMatch || x.matches > 0)
      .sort((a, b) => b.matches - a.matches)
  }, [q])

  if (open) {
    const r = open
    return (
      <div>
        <button className="back" onClick={() => setOpen(null)}>← Til baka</button>
        <div className="recipe-hero">{r.emoji}</div>
        <h2 className="recipe-h">{r.name}</h2>
        <div className="recipe-sub2">{r.time} · {r.serves} skammtar</div>

        <div className="recipe-section">Hráefni</div>
        <ul className="ing-list">
          {r.ingredients.map(i => <li key={i}>{i}</li>)}
        </ul>

        <div className="recipe-section">Aðferð</div>
        <ol className="steps">
          {r.steps.map((s, idx) => <li key={idx}>{s}</li>)}
        </ol>

        <button className="add-recipe-btn" onClick={() => onAddRecipe(r)}>+ Setja hráefni á lista</button>
      </div>
    )
  }

  return (
    <div>
      <div className="addbar">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Leita eftir nafni eða hráefni…" autoComplete="off" />
      </div>
      <span className="badge">Sláðu inn hráefni (t.d. „nautahakk, tómatar“) til að sjá hvað passar</span>

      {results.length === 0 && <p className="empty">Engin uppskrift fannst</p>}

      {results.map(({ r, matches }) => (
        <div className="recipe" key={r.id} onClick={() => setOpen(r)} style={{ cursor: 'pointer', marginTop: 10 }}>
          <div className="icon">{r.emoji}</div>
          <div className="meta">
            <div className="title">{r.name}</div>
            <div className="sub">{r.time} · {r.serves} skammtar · {r.ingredients.length} hráefni</div>
            {matches > 0 && terms.length > 0 && (
              <div className="match-tag">✓ {matches} {matches === 1 ? 'hráefni passar' : 'hráefni passa'}</div>
            )}
          </div>
          <button className="btn" onClick={(e) => { e.stopPropagation(); onAddRecipe(r) }}>+ Á lista</button>
        </div>
      ))}
    </div>
  )
}
