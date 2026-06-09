import React, { useEffect } from 'react'
import { DEPARTMENTS, DEPT_ORDER } from '../data/departments.js'
import { useBackClose } from '../lib/backstack.js'

// Verslunarhamur: einfaldað heilskjás-útlit fyrir notkun inni í búð.
// Stórir reitir, raðað eftir leið um búð, afgreitt færist neðst, skjár helst kveiktur.
export default function ShoppingMode({ items, onToggle, onClose, catalog = {} }) {
  useBackClose(true, onClose)

  useEffect(() => {
    let lock = null
    const acquire = async () => {
      try { if ('wakeLock' in navigator) lock = await navigator.wakeLock.request('screen') } catch (e) {}
    }
    acquire()
    const onVis = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      try { lock && lock.release() } catch (e) {}
    }
  }, [])

  const openItems = items.filter(i => !i.checked)
  const doneItems = items.filter(i => i.checked)
  const groups = DEPARTMENTS
    .map(d => ({ ...d, items: openItems.filter(i => i.dept === d.key) }))
    .filter(g => g.items.length)
    .sort((a, b) => DEPT_ORDER[a.key] - DEPT_ORDER[b.key])

  const imgOf = (it) => it.image_url || catalog[it.name]

  return (
    <div className="shopmode">
      <div className="shopmode-top">
        <button className="shopmode-x" onClick={onClose} aria-label="Loka">×</button>
        <span className="shopmode-title">Versla</span>
        <span className="shopmode-prog">{openItems.length} eftir</span>
      </div>

      <div className="shopmode-body">
        {openItems.length === 0 && <p className="shopmode-empty">Allt komið í körfuna! 🎉</p>}

        {groups.map(g => (
          <div className="shopmode-group" key={g.key}>
            <div className="shopmode-dept" style={{ color: g.color }}>{g.icon} {g.name}</div>
            {g.items.map(it => (
              <button className="shopmode-item" key={it.id} onClick={() => onToggle(it, false)}>
                <span className="shopmode-check" />
                {imgOf(it) && <img className="shopmode-img" src={imgOf(it)} alt="" />}
                <span className="shopmode-name">{it.name}</span>
              </button>
            ))}
          </div>
        ))}

        {doneItems.length > 0 && (
          <div className="shopmode-group">
            <div className="shopmode-dept" style={{ color: 'var(--muted)' }}>Komið í körfu ({doneItems.length})</div>
            {doneItems.map(it => (
              <button className="shopmode-item done" key={it.id} onClick={() => onToggle(it, true)}>
                <span className="shopmode-check on">✓</span>
                <span className="shopmode-name">{it.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
