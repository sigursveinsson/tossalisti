import React, { useEffect, useState } from 'react'
import { IconArrowLeft, IconClock, IconUsers, IconShoppingCart, IconListCheck, IconSearch, IconCheck } from '@tabler/icons-react'
import { supabase } from '../lib/supabaseClient.js'
import KronanCart from './KronanCart.jsx'

// Prufa (aðeins stjórnandi): uppskriftir Krónunnar (Public API). Hvert hráefni er tengt raunverulegri Krónuvöru
// með verði → „kostar um X kr.“, afhaka það sem er til heima, setja á innkaupalista eða beint í Krónukörfuna.
const kr = (n) => Math.round(n || 0).toLocaleString('is-IS') + ' kr.'
const call = async (body) => { const { data, error } = await supabase.functions.invoke('kronan', { body }); if (error) throw error; return data }
const QUICK = ['kjúklingur', 'fiskur', 'pasta', 'súpa', 'vegan', 'bakstur', 'taco', 'lax', 'hakk', 'jól']

export default function KronanRecipes({ shoppingLists = [], defaultListId, onAddToList }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(null)        // { slug, data }
  const [detailLoading, setDetailLoading] = useState(false)
  const [serv, setServ] = useState(4)
  const [skip, setSkip] = useState(() => new Set())
  const [listId, setListId] = useState(defaultListId || (shoppingLists[0] && shoppingLists[0].id) || '')
  const [msg, setMsg] = useState('')
  const [cart, setCart] = useState(null)

  // Leit (350 ms hlé) — tóm leit sýnir nýjustu uppskriftirnar
  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const d = await call({ action: 'recipes_search', q: q.trim(), page })
        const data = (d && d.data) || {}
        if (alive) setRes(prev => page > 1 && prev ? { ...data, recipes: [...prev.recipes, ...(data.recipes || [])] } : data)
      } catch { if (alive) setRes({ recipes: [], count: 0 }) }
      if (alive) setLoading(false)
    }, page > 1 ? 0 : 350)
    return () => { alive = false; clearTimeout(t) }
  }, [q, page])

  const openRecipe = async (r) => {
    setOpen({ slug: r.slug, data: null, base: r }); setDetailLoading(true); setSkip(new Set()); setMsg('')
    try {
      const d = await call({ action: 'recipe', slug: r.slug })
      const data = d && d.data
      setOpen({ slug: r.slug, data, base: r })
      setServ(data && data.servings > 0 ? data.servings : 4)
    } catch { setMsg('Tókst ekki að sækja uppskriftina') }
    setDetailLoading(false)
  }

  if (open) {
    const d = open.data
    const baseServ = d && d.servings > 0 ? d.servings : 4
    const factor = serv / baseServ
    const items = ((d && d.items) || []).filter(it => it.product && it.product.sku)
    const lines = items.map((it, k) => {
      const p = it.product
      const q = Math.max(1, Math.ceil((it.quantity || 1) * factor - 0.01))
      const unit = p.discountedPrice ?? p.price
      return { k, p, q, unit, total: unit * q, sale: p.onSale }
    })
    const picked = lines.filter(l => !skip.has(l.k))
    const total = picked.reduce((a, l) => a + l.total, 0)
    const asItems = picked.map(l => ({ id: 'r' + l.k, name: l.p.name, qty: l.q, ext_sku: l.p.sku, ext_price: l.unit, image_url: l.p.thumbnail, checked: false }))

    return (
      <div className="krr">
        <button className="krr-back" onClick={() => setOpen(null)}><IconArrowLeft size={18} /> Uppskriftir Krónunnar</button>
        {(d || open.base).mainImage?.image && <img className="krr-hero" src={(d || open.base).mainImage.image} alt="" />}
        <h2 className="krr-title">{(d || open.base).displayName || (d || open.base).name}</h2>
        <div className="krr-meta">
          {(d || open.base).totalMinutes > 0 && <span><IconClock size={15} /> {(d || open.base).totalMinutes} mín.</span>}
          <span className="krr-serv"><IconUsers size={15} />
            <button onClick={() => setServ(s => Math.max(1, s - 1))} aria-label="Færri">−</button>{serv}<button onClick={() => setServ(s => s + 1)} aria-label="Fleiri">+</button> skammtar
          </span>
        </div>
        {detailLoading && <p className="empty">Sæki uppskrift…</p>}
        {d && (
          <>
            <div className="krr-sec">Hráefni frá Krónunni <small>afhakaðu það sem þú átt til</small></div>
            <div className="krr-items">
              {lines.map(l => {
                const on = !skip.has(l.k)
                return (
                  <button key={l.k} className={'krr-item' + (on ? ' on' : '')} onClick={() => setSkip(s => { const n = new Set(s); n.has(l.k) ? n.delete(l.k) : n.add(l.k); return n })}>
                    <span className={'krr-check' + (on ? ' on' : '')}>{on && <IconCheck size={14} stroke={3} />}</span>
                    {l.p.thumbnail ? <img src={l.p.thumbnail} alt="" /> : <span className="krr-noimg" />}
                    <span className="krr-name">{l.p.name}<small>{l.q > 1 ? l.q + ' × ' : ''}{kr(l.unit)}{l.sale ? ' · á tilboði' : ''}</small></span>
                    <span className="krr-price">{kr(l.total)}</span>
                  </button>
                )
              })}
            </div>
            {!lines.length && <p className="muted-p">Engar Krónuvörur eru tengdar þessari uppskrift.</p>}
            <div className="krr-total"><span>{picked.length} vörur · kostar um</span><b>{kr(total)}</b></div>

            {shoppingLists.length > 1 && (
              <label className="krr-list">Setja á lista
                <select value={listId} onChange={e => setListId(e.target.value)}>
                  {shoppingLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
            )}
            <div className="krr-actions">
              <button className="krr-tolist" disabled={!picked.length || !listId} onClick={async () => {
                setMsg('')
                try { const n = await onAddToList(listId, picked.map(l => ({ name: l.p.name, image: l.p.thumbnail, sku: l.p.sku, price: l.unit, qty: l.q }))); setMsg((n ?? picked.length) + ' vörur settar á listann ✓') }
                catch { setMsg('Tókst ekki að setja á listann') }
              }}><IconListCheck size={18} /> Á innkaupalistann</button>
              <button className="krr-tocart" disabled={!picked.length} onClick={() => setCart(asItems)}><IconShoppingCart size={18} /> Í Krónukörfuna</button>
            </div>
            {msg && <p className="krr-msg">{msg}</p>}

            {d.ingredients && <><div className="krr-sec">Uppskriftin</div><pre className="krr-text">{d.ingredients}</pre></>}
            {d.directions && <><div className="krr-sec">Aðferð</div><pre className="krr-text">{d.directions}</pre></>}
            <p className="krr-src">Uppskrift og vörur: Krónan</p>
          </>
        )}
        {cart && <KronanCart items={cart} onClose={() => setCart(null)} />}
      </div>
    )
  }

  return (
    <div className="krr">
      <div className="addbar krr-search">
        <div className="add-input with-icon">
          <IconSearch className="add-input-ico" size={18} stroke={1.75} />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Leita í uppskriftum Krónunnar…" autoComplete="off" />
        </div>
      </div>
      <div className="cat-row">
        {QUICK.map(t => <button key={t} className={'cat-chip' + (q === t ? ' on' : '')} onClick={() => { setQ(q === t ? '' : t); setPage(1) }}>{t}</button>)}
      </div>
      {res && <span className="badge">{res.count ?? (res.recipes || []).length} uppskriftir</span>}
      <div className="krr-grid">
        {((res && res.recipes) || []).map(r => (
          <button key={r.slug} className="krr-card" onClick={() => openRecipe(r)}>
            {r.mainImage?.image ? <img src={r.mainImage.image} alt="" loading="lazy" /> : <span className="krr-noimg big" />}
            <span className="krr-card-name">{r.displayName || r.name}</span>
            <span className="krr-card-meta">{r.totalMinutes > 0 ? r.totalMinutes + ' mín.' : ''}{r.servings > 0 ? (r.totalMinutes > 0 ? ' · ' : '') + r.servings + ' skammtar' : ''}</span>
          </button>
        ))}
      </div>
      {loading && <p className="empty">Sæki uppskriftir…</p>}
      {res && res.hasNextPage && !loading && <button className="krr-more" onClick={() => setPage(p => p + 1)}>Sýna fleiri</button>}
      {res && !loading && !(res.recipes || []).length && <p className="empty">Engin uppskrift fannst.</p>}
    </div>
  )
}
