import React, { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { PRODUCTS, PRODUCT_NAMES } from '../data/products.js'
import { DEPARTMENTS } from '../data/departments.js'
import { CATEGORY_SPONSORS } from '../data/sponsors.js'
import { CatIcon, DeptIcon } from '../data/icons.jsx'
import { useBackClose } from '../lib/backstack.js'
import { IconCheck, IconX } from '@tabler/icons-react'

const norm = s => (s || '').toLowerCase().trim()

// Vöruhilla: flettu/leitaðu, veldu margar vörur, þær flytjast á listann.
// Kostaðar vörur (Ölgerðin) fá heiðurssæti efst — sterkt fyrir product placement.
export default function ShelfView({ onCommit, onClose, existing = [], catalog = {}, adsEnabled, kronan = false, initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery || '')
  // Krónan-hilla (prufa, aðeins stjórnandi): vöruflokkar Krónunnar → vörur með mynd og verði
  const [mode, setMode] = useState(kronan ? 'kronan' : 'tossa')
  const [krCats, setKrCats] = useState(null)
  const [krTop, setKrTop] = useState(null)
  const [krLeaf, setKrLeaf] = useState(null)
  const [krProds, setKrProds] = useState(null)
  const [krLoading, setKrLoading] = useState(false)
  const [krSel, setKrSel] = useState(() => new Map())
  const krCall = async (body) => { const { data } = await supabase.functions.invoke('kronan', { body }); return data }
  useEffect(() => {
    if (mode !== 'kronan' || krCats) return
    krCall({ action: 'categories' }).then(d => {
      const tops = ((d && d.data) || []).filter(c => !/oskilgreint/.test(c.slug))
      setKrCats(tops)
      if (tops.length) setKrTop('__sale')
    }).catch(() => setKrCats([]))
  }, [mode])
  const leaves = useMemo(() => {
    const t = (krCats || []).find(c => c.slug === krTop)
    if (!t) return []
    const out = []
    for (const c of t.children || []) { if (c.children && c.children.length) c.children.forEach(l => out.push(l)); else out.push(c) }
    return out
  }, [krCats, krTop])
  useEffect(() => { if (krTop && krTop !== '__sale') setKrLeaf(leaves[0] ? leaves[0].slug : null) }, [krTop, leaves])
  useEffect(() => {
    if (mode !== 'kronan') return
    const qq = q.trim()
    let alive = true
    const run = async () => {
      setKrLoading(true)
      try {
        let list = []
        if (qq.length >= 2) {
          const d = await krCall({ action: 'search', q: qq, pageSize: 48 })
          list = ((d && d.hits) || []).map(h => ({ sku: h.sku, name: h.name, price: h.price, image: h.image, info: h.priceInfo }))
        } else if (krTop === '__sale') {
          const d = await krCall({ action: 'on_sale', limit: 60 })
          list = (((d && d.data) || {}).results || []).map(h => ({ sku: h.sku, name: h.name, price: h.discountedPrice ?? h.price, was: h.onSale ? h.price : null, pct: h.discountPercent, image: h.thumbnail, info: h.priceInfo }))
        } else if (krLeaf) {
          const d = await krCall({ action: 'category_products', slug: krLeaf, pageSize: 60 })
          list = (((d && d.data) || {}).products || []).map(h => ({ sku: h.sku, name: h.name, price: h.discountedPrice ?? h.price, was: h.onSale ? h.price : null, pct: h.discountPercent, image: h.thumbnail, info: h.priceInfo }))
        }
        if (alive) setKrProds(list)
      } catch { if (alive) setKrProds([]) }
      if (alive) setKrLoading(false)
    }
    const t = setTimeout(run, qq.length >= 2 ? 350 : 0)
    return () => { alive = false; clearTimeout(t) }
  }, [mode, krTop, krLeaf, q])
  const krToggle = (p) => setKrSel(prev => { const n = new Map(prev); n.has(p.sku) ? n.delete(p.sku) : n.set(p.sku, p); return n })
  const krKr = (n) => Math.round(n || 0).toLocaleString('is-IS') + ' kr.'
  const [sel, setSel] = useState(() => new Set())
  const [deptFilter, setDeptFilter] = useState(null)
  useBackClose(true, onClose)

  const have = useMemo(() => new Set(existing.map(norm)), [existing])
  const query = norm(q)

  const toggle = (name) => setSel(prev => {
    const n = new Set(prev); const k = norm(name)
    n.has(k) ? n.delete(k) : n.add(k)
    return n
  })

  const sponsor = CATEGORY_SPONSORS.beverages
  const sponList = adsEnabled ? sponsor.products.filter(p => !query || p.name.toLowerCase().includes(query)) : []

  const sections = DEPARTMENTS.map(d => ({
    dept: d,
    items: PRODUCT_NAMES.filter(n => PRODUCTS[n] === d.key && (!query || n.includes(query))),
  })).filter(s => s.items.length)

  // Skannaðar vörur úr vörubankanum (sem eru ekki í föstu orðabókinni)
  const catMatches = query.length >= 2
    ? Object.keys(catalog).filter(n => catalog[n] && !PRODUCTS[n] && n.includes(query)).slice(0, 12)
    : []

  const commit = async () => {
    const sponByName = Object.fromEntries(sponsor.products.map(p => [norm(p.name), p]))
    const picks = [...sel].map(name => ({ name, image: (sponByName[name] && sponByName[name].image) || null }))
      .concat([...krSel.values()].map(p => ({ name: p.name, image: p.image || null, sku: p.sku, price: p.price })))
    if (picks.length) await onCommit(picks)
    onClose()
  }

  const card = (name, color, opts = {}) => {
    const k = norm(name)
    const on = sel.has(k)
    const img = opts.image || catalog[k]
    return (
      <button key={(opts.key || '') + name} className={'shelf-card' + (on ? ' on' : '') + (opts.spon ? ' spon' : '')} onClick={() => toggle(name)}>
        {opts.spon && <span className="shelf-badge">Kostað</span>}
        {on && <span className="shelf-check"><IconCheck size={14} stroke={3} /></span>}
        <span className="shelf-img" style={{ background: img ? '#fff' : 'transparent' }}>
          {img ? <img src={img} alt="" /> : <CatIcon name={name} dept={opts.dept} fill className="shelf-cat" />}
        </span>
        <span className="shelf-name">{name}</span>
        {have.has(k) && <span className="shelf-have">á lista</span>}
      </button>
    )
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="shelf" onClick={e => e.stopPropagation()}>
        <div className="shelf-top">
          <input className="shelf-search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={mode === 'kronan' ? 'Leita í vöruúrvali Krónunnar…' : 'Leita í vöruhillunni…'} />
          <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button>
        </div>

        {kronan && (
          <div className="lv-tabs shelf-tabs">
            <button className={mode === 'kronan' ? 'on' : ''} onClick={() => setMode('kronan')}>Krónan</button>
            <button className={mode === 'tossa' ? 'on' : ''} onClick={() => setMode('tossa')}>Almennar vörur</button>
          </div>
        )}
        {mode === 'kronan' && (
          <>
            <div className="shelf-filters">
              <button className={krTop === '__sale' ? 'on' : ''} onClick={() => setKrTop('__sale')}>🏷️ Tilboð</button>
              {(krCats || []).map(c => (
                <button key={c.slug} className={krTop === c.slug ? 'on' : ''} onClick={() => setKrTop(c.slug)}>
                  {c.icon ? <img className="kr-cat-ic" src={c.icon} alt="" /> : null} {c.name}
                </button>
              ))}
            </div>
            {krTop !== '__sale' && leaves.length > 1 && !q.trim() && (
              <div className="shelf-filters sub">
                {leaves.map(l => <button key={l.slug} className={krLeaf === l.slug ? 'on' : ''} onClick={() => setKrLeaf(l.slug)}>{l.name}</button>)}
              </div>
            )}
            <div className="shelf-body">
              {krLoading && !krProds && <p className="empty">Sæki vörur frá Krónunni…</p>}
              {krProds && krProds.length === 0 && !krLoading && <p className="empty">Engar vörur fundust.</p>}
              <div className={'shelf-grid' + (krLoading ? ' kr-dim' : '')}>
                {(krProds || []).map(p => {
                  const on = krSel.has(p.sku)
                  return (
                    <button key={p.sku} className={'shelf-card kr-card' + (on ? ' on' : '')} onClick={() => krToggle(p)}>
                      {p.pct ? <span className="shelf-badge kr-sale">-{p.pct}%</span> : null}
                      {on && <span className="shelf-check"><IconCheck size={14} stroke={3} /></span>}
                      <span className="shelf-img" style={{ background: '#fff' }}>{p.image ? <img src={p.image} alt="" loading="lazy" /> : <CatIcon name={p.name} fill className="shelf-cat" />}</span>
                      <span className="shelf-name">{p.name}</span>
                      <span className="kr-card-price">{krKr(p.price)}{p.was ? <s>{krKr(p.was)}</s> : null}</span>
                      {have.has(norm(p.name)) && <span className="shelf-have">á lista</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
        {mode === 'tossa' && <>
        <div className="shelf-filters">
          <button className={!deptFilter ? 'on' : ''} onClick={() => setDeptFilter(null)}>Allt</button>
          {sections.map(s => (
            <button key={s.dept.key} className={deptFilter === s.dept.key ? 'on' : ''}
              onClick={() => setDeptFilter(deptFilter === s.dept.key ? null : s.dept.key)}>
              <DeptIcon dept={s.dept.key} size={14} /> {s.dept.name}
            </button>
          ))}
        </div>

        <div className="shelf-body">
          {sponList.length > 0 && (!deptFilter || deptFilter === 'beverages') && (
            <>
              <div className="shelf-head">Kostað · {sponsor.brand}</div>
              <div className="shelf-grid">{sponList.map(p => card(p.name, p.color, { spon: true, image: p.image, key: 'sp', dept: 'beverages' }))}</div>
            </>
          )}
          {catMatches.length > 0 && (
            <>
              <div className="shelf-head">Úr vörubankanum</div>
              <div className="shelf-grid">{catMatches.map(n => card(n, '#888', { dept: 'other', key: 'cat' }))}</div>
            </>
          )}
          {sections.filter(s => !deptFilter || s.dept.key === deptFilter).map(s => (
            <React.Fragment key={s.dept.key}>
              <div className="shelf-head"><DeptIcon dept={s.dept.key} /> {s.dept.name}</div>
              <div className="shelf-grid">{s.items.map(n => card(n, s.dept.color, { dept: s.dept.key }))}</div>
            </React.Fragment>
          ))}
          {sponList.length === 0 && sections.length === 0 && catMatches.length === 0 && <p className="empty">Engin vara fannst.</p>}
        </div>

        </>}

        <div className="shelf-foot">
          <button className="shelf-add" disabled={sel.size + krSel.size === 0} onClick={commit}>
            {sel.size + krSel.size ? `Bæta við ${sel.size + krSel.size} á listann` : 'Veldu vörur'}
          </button>
        </div>
      </div>
    </div>
  )
}
