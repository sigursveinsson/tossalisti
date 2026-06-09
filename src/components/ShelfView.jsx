import React, { useState, useMemo } from 'react'
import { PRODUCTS, PRODUCT_NAMES } from '../data/products.js'
import { DEPARTMENTS } from '../data/departments.js'
import { CATEGORY_SPONSORS } from '../data/sponsors.js'
import { useBackClose } from '../lib/backstack.js'

const norm = s => (s || '').toLowerCase().trim()
const initials = (n) => (n.replace(/[^a-záéíóúýþæðö ]/gi, '').trim().slice(0, 2) || '?').toUpperCase()

// Vöruhilla: flettu/leitaðu, veldu margar vörur, þær flytjast á listann.
// Kostaðar vörur (Ölgerðin) fá heiðurssæti efst — sterkt fyrir product placement.
export default function ShelfView({ onCommit, onClose, existing = [] }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(() => new Set())
  useBackClose(true, onClose)

  const have = useMemo(() => new Set(existing.map(norm)), [existing])
  const query = norm(q)

  const toggle = (name) => setSel(prev => {
    const n = new Set(prev); const k = norm(name)
    n.has(k) ? n.delete(k) : n.add(k)
    return n
  })

  const sponsor = CATEGORY_SPONSORS.beverages
  const sponList = sponsor.products.filter(p => !query || p.name.toLowerCase().includes(query))

  const sections = DEPARTMENTS.map(d => ({
    dept: d,
    items: PRODUCT_NAMES.filter(n => PRODUCTS[n] === d.key && (!query || n.includes(query))),
  })).filter(s => s.items.length)

  const commit = async () => {
    const sponByName = Object.fromEntries(sponsor.products.map(p => [norm(p.name), p]))
    const picks = [...sel].map(name => ({ name, image: (sponByName[name] && sponByName[name].image) || null }))
    if (picks.length) await onCommit(picks)
    onClose()
  }

  const card = (name, color, opts = {}) => {
    const k = norm(name)
    const on = sel.has(k)
    return (
      <button key={(opts.key || '') + name} className={'shelf-card' + (on ? ' on' : '') + (opts.spon ? ' spon' : '')} onClick={() => toggle(name)}>
        {opts.spon && <span className="shelf-badge">Kostað</span>}
        {on && <span className="shelf-check">✓</span>}
        <span className="shelf-img" style={{ background: color }}>
          {opts.image ? <img src={opts.image} alt="" /> : initials(name)}
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

        <div className="shelf-body">
          {sponList.length > 0 && (
            <>
              <div className="shelf-head">Kostað · {sponsor.brand}</div>
              <div className="shelf-grid">{sponList.map(p => card(p.name, p.color, { spon: true, image: p.image, key: 'sp' }))}</div>
            </>
          )}
          {sections.map(s => (
            <React.Fragment key={s.dept.key}>
              <div className="shelf-head">{s.dept.icon} {s.dept.name}</div>
              <div className="shelf-grid">{s.items.map(n => card(n, s.dept.color))}</div>
            </React.Fragment>
          ))}
          {sponList.length === 0 && sections.length === 0 && <p className="empty">Engin vara fannst.</p>}
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
