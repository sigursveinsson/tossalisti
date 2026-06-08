import React, { useState, useEffect, useMemo } from 'react'
import { RECIPES, fmtQty, RECIPE_CATEGORIES } from '../data/recipes.js'
import { store } from '../lib/store.js'
import RecipeForm from './RecipeForm.jsx'
import Dialog from './Dialog.jsx'

function StarRow({ value, count }) {
  if (!value) return <span className="stars muted">Engin einkunn enn</span>
  const full = Math.round(value)
  return (
    <span className="stars">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span className="stars-num">{value.toFixed(1)}{count ? ` (${count})` : ''}</span>
    </span>
  )
}

export default function RecipesView({ onAddRecipe, authorName }) {
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const [servings, setServings] = useState(4)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const [custom, setCustom] = useState([])
  const [confirmDel, setConfirmDel] = useState(null)
  const [stats, setStats] = useState({ uses: {}, popular: {}, avg: {}, mine: {} })

  const loadRecipes = async () => { try { setCustom(await store.getRecipes()) } catch (e) {} }
  const loadStats = async () => {
    try {
      const [uses, popular, ratingStats, myRatings] = await Promise.all([
        store.getMyRecipeUses(), store.getPopular(), store.getRatingStats(), store.getMyRatings(),
      ])
      setStats({
        uses: Object.fromEntries(uses.map(x => [x.recipe_id, Number(x.uses)])),
        popular: Object.fromEntries(popular.map(x => [x.recipe_id, Number(x.total)])),
        avg: Object.fromEntries(ratingStats.map(x => [x.recipe_id, { avg: Number(x.avg_stars), num: Number(x.num) }])),
        mine: Object.fromEntries(myRatings.map(x => [x.recipe_id, x.stars])),
      })
    } catch (e) {}
  }
  useEffect(() => { loadStats(); loadRecipes() }, [])

  const all = useMemo(() => [...custom, ...RECIPES], [custom])

  const rate = async (recipeId, stars) => { await store.rateRecipe(recipeId, stars); loadStats() }
  const openRecipe = (r) => { setOpen(r); setServings(r.serves) }
  const saveRecipe = async (data) => {
    await store.createRecipe(data)
    setCreating(false)
    await loadRecipes()
  }
  const removeRecipe = (r) => setConfirmDel(r)

  const terms = q.toLowerCase().split(/[\s,]+/).map(t => t.trim()).filter(Boolean)
  const results = useMemo(() => {
    const base = cat ? all.filter(r => (r.tags || []).includes(cat)) : all
    if (!terms.length) return base.map(r => ({ r, matches: 0 }))
    return base
      .map(r => {
        const nameMatch = terms.some(t => r.name.toLowerCase().includes(t))
        const matches = r.ingredients.filter(ing => terms.some(t => ing.name.includes(t))).length
        return { r, matches, nameMatch }
      })
      .filter(x => x.nameMatch || x.matches > 0)
      .sort((a, b) => b.matches - a.matches)
  }, [q, all, cat])

  const mine = all.filter(r => stats.uses[r.id]).sort((a, b) => stats.uses[b.id] - stats.uses[a.id]).slice(0, 8)
  const popular = all.filter(r => stats.popular[r.id]).sort((a, b) => stats.popular[b.id] - stats.popular[a.id]).slice(0, 8)

  if (creating) {
    return <RecipeForm defaultAuthor={authorName} onSubmit={saveRecipe} onClose={() => setCreating(false)} />
  }

  if (open) {
    const r = open
    const factor = servings / r.serves
    const a = stats.avg[r.id]
    return (
      <div>
        <button className="back" onClick={() => setOpen(null)}>← Til baka</button>
        <div className="recipe-hero">{r.emoji}</div>
        <h2 className="recipe-h">{r.name}</h2>
        <div className="recipe-sub2">{r.time}</div>
        {r.authorType && (
          <div className="recipe-author">
            {r.authorType === 'web'
              ? <>Af vefnum: <a href={r.sourceUrl} target="_blank" rel="noreferrer">{r.authorName || r.sourceUrl}</a></>
              : <>Höfundur: {r.authorName || 'Notandi'}</>}
            {r.isPublic === false ? ' · 🔒 einka' : ''}
          </div>
        )}
        <div style={{ margin: '6px 0 2px' }}><StarRow value={a?.avg} count={a?.num} /></div>

        <div className="serv">
          <span className="serv-label">Skammtar</span>
          <div className="stepper">
            <button onClick={() => setServings(s => Math.max(1, s - 1))} aria-label="Færri">−</button>
            <span className="serv-num">{servings}</span>
            <button onClick={() => setServings(s => s + 1)} aria-label="Fleiri">+</button>
          </div>
        </div>

        <div className="recipe-section">Hráefni</div>
        <ul className="ing-list">
          {r.ingredients.map(ing => (
            <li key={ing.name}>
              <span className="ing-name">{ing.name}</span>
              <span className="ing-qty">{fmtQty(ing.qty, ing.unit, factor)}</span>
            </li>
          ))}
        </ul>

        {r.steps.length > 0 && <>
          <div className="recipe-section">Aðferð</div>
          <ol className="steps">
            {r.steps.map((s, idx) => <li key={idx}>{s}</li>)}
          </ol>
        </>}

        <div className="recipe-section">Þín einkunn</div>
        <div className="rate">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} className={'star-btn' + (n <= (stats.mine[r.id] || 0) ? ' on' : '')} onClick={() => rate(r.id, n)} aria-label={n + ' stjörnur'}>★</button>
          ))}
        </div>

        <button className="add-recipe-btn" onClick={() => onAddRecipe(r, servings)}>+ Setja hráefni á lista</button>
        {r.mine && <button className="ghost-btn danger" onClick={() => removeRecipe(r)}>Eyða uppskrift</button>}
        {confirmDel && (
          <Dialog
            title="Eyða uppskrift?"
            message={'Eyða „' + confirmDel.name + '"?'}
            danger
            confirmLabel="Eyða"
            onConfirm={async () => { await store.deleteRecipe(confirmDel.id); setConfirmDel(null); setOpen(null); await loadRecipes() }}
            onClose={() => setConfirmDel(null)}
          />
        )}
      </div>
    )
  }

  const card = (r, extra) => (
    <div className="recipe" key={r.id} onClick={() => openRecipe(r)} style={{ cursor: 'pointer', marginTop: 10 }}>
      <div className="icon">{r.emoji}</div>
      <div className="meta">
        <div className="title">{r.name}{r.isPublic === false ? ' 🔒' : ''}</div>
        <div className="sub">{r.time ? r.time + ' · ' : ''}{r.serves} skammtar · {r.ingredients.length} hráefni</div>
        <StarRow value={stats.avg[r.id]?.avg} count={stats.avg[r.id]?.num} />
        {extra}
      </div>
      <button className="btn" onClick={(e) => { e.stopPropagation(); onAddRecipe(r, r.serves) }}>+ Á lista</button>
    </div>
  )

  const reel = (items) => (
    <div className="reel">
      {items.map(r => (
        <button className="reel-card" key={r.id} onClick={() => openRecipe(r)}>
          <span className="reel-emoji">{r.emoji}</span>
          <span className="reel-name">{r.name}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <button className="add-recipe-btn" style={{ marginTop: 4 }} onClick={() => setCreating(true)}>+ Ný uppskrift</button>

      <div className="addbar" style={{ marginTop: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Leita eftir nafni eða hráefni…" autoComplete="off" />
      </div>

      <div className="cat-row">
        <button className={'cat-chip' + (!cat ? ' on' : '')} onClick={() => setCat(null)}>Allar</button>
        {RECIPE_CATEGORIES.map(c => (
          <button key={c} className={'cat-chip' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
        ))}
      </div>

      {!cat && terms.length === 0 && (
        <>
          {mine.length > 0 && <><div className="recipe-section">Mínar uppskriftir</div>{reel(mine)}</>}
          {popular.length > 0 && <><div className="recipe-section">Vinsælar</div>{reel(popular)}</>}
          <div className="recipe-section">Allar uppskriftir</div>
        </>
      )}
      {(cat || terms.length > 0) && <span className="badge">{results.length} uppskriftir</span>}

      {results.length === 0 && <p className="empty">Engin uppskrift fannst</p>}
      {results.map(({ r, matches }) => card(
        r,
        matches > 0 && terms.length > 0
          ? <div className="match-tag">✓ {matches} {matches === 1 ? 'hráefni passar' : 'hráefni passa'}</div>
          : null,
      ))}
    </div>
  )
}
