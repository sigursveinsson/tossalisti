import React, { useState, useMemo } from 'react'
import { PRODUCTS, PRODUCT_NAMES } from '../data/products.js'
import { DEPARTMENTS } from '../data/departments.js'
import { CATEGORY_SPONSORS } from '../data/sponsors.js'
import { CatIcon } from '../data/icons.jsx'
import { useBackClose } from '../lib/backstack.js'

const norm = s => (s || '').toLowerCase().trim()

// Vöruhilla: flettu/leitaðu, veldu margar vörur, þær flytjast á listann.
// Kostaðar vörur (Ölgerðin) fá heiðurssæti efst — sterkt fyrir product placement.
export default function ShelfView({ onCommit, onClose, existing = [], catalog = {}, adsEnabled }) {
  const [q, setQ] = useState('')
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
        {on && <span className="shelf-check">✓</span>}
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
          <input className="shelf-search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Leita í vöruhillunni…" />
          <button className="x" onClick={onClose} aria-label="Loka">×</button>
        </div>

        <div className="shelf-filters">
          <button className={!deptFilter ? 'on' : ''} onClick={() => setDeptFilter(null)}>Allt</button>
          {sections.map(s => (
            <button key={s.dept.key} className={deptFilter === s.dept.key ? 'on' : ''}
              style={deptFilter === s.dept.key ? { borderColor: s.dept.color, color: s.dept.color } : undefined}
              onClick={() => setDeptFilter(deptFilter === s.dept.key ? null : s.dept.key)}>
              {s.dept.icon} {s.dept.name}
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
              <div className="shelf-head">{s.dept.icon} {s.dept.name}</div>
              <div className="shelf-grid">{s.items.map(n => card(n, s.dept.color, { dept: s.dept.key }))}</div>
            </React.Fragment>
          ))}
          {sponList.length === 0 && sections.length === 0 && catMatches.length === 0 && <p className="empty">Engin vara fannst.</p>}
        </div>

        <div className="shelf-foot">
          <button className="shelf-add" disabled={sel.size === 0} onClick={commit}>
            {sel.size ? `Bæta við ${sel.size} á listann` : 'Veldu vörur'}
          </button>
        </div>
      </div>
    </div>
  )
}
