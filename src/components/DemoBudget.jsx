import React, { useMemo, useState } from 'react'
import BudgetView from './BudgetView.jsx'
import { demoPurchases, DEMO_MEMBERS, DEMO_ME } from '../data/demoBudget.js'

// /syning — sýnir bókhaldið eins og það lítur út eftir heilt ár af kvittunum. Tilbúin gögn, ekkert vistað:
// breytingar (t.d. flokkun) lifa aðeins í minni þar til síðunni er lokað. Enginn aðgangur, engin gögn úr gagnagrunni.
export default function DemoBudget() {
  const initial = useMemo(() => demoPurchases(), [])
  const [purchases, setPurchases] = useState(initial)
  const [customCats, setCustomCats] = useState([])
  const setCats = (ids, cat) => setPurchases(ps => ps.map(p => p.items.some(it => ids.has(it.id)) ? { ...p, items: p.items.map(it => ids.has(it.id) ? { ...it, category: cat } : it) } : p))
  const total = initial.reduce((a, p) => a + p.total, 0)
  return (
    <div className="app demo-app">
      <div className="header demo-head">
        <div className="header-top">
          <img src="/logo.svg" alt="" width="26" height="26" />
          <b>Tossalisti</b>
          <span className="demo-tag">Sýning</span>
          <a className="demo-try" href="/">Prófa sjálf(ur)</a>
        </div>
      </div>
      <div className="body">
        <div className="demo-note">
          <b>Svona lítur bókhaldið út eftir ár af kvittunum.</b> Tilbúið heimili með {initial.length} kvittanir upp á {Math.round(total / 1000).toLocaleString('is-IS')} þúsund krónur. Smelltu á súlur, flokka og verslanir, leitaðu að vöru eða breyttu flokkun — ekkert vistast.
        </div>
        <BudgetView
          purchases={purchases} members={DEMO_MEMBERS} currentUserId={DEMO_ME} customCats={customCats}
          onAddCategory={async (d) => { const c = { id: 'demo-c' + Date.now(), ...d }; setCustomCats(cs => [...cs, c]); return c }}
          onDeleteCategory={async (id) => setCustomCats(cs => cs.filter(c => c.id !== id))}
          onSave={async (data) => setPurchases(ps => [{ id: 'demo-n' + Date.now(), user_id: DEMO_ME, items: [], ...data }, ...ps])}
          onUpdate={async (id, patch) => setPurchases(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))}
          onDelete={async (id) => setPurchases(ps => ps.filter(p => p.id !== id))}
          onSetCategory={async (id, cat) => setPurchases(ps => ps.map(p => p.id === id ? { ...p, category: cat } : p))}
          onSetItemCategory={async (id, cat) => setCats(new Set([id]), cat)}
          onSetItemsCategory={async (list, cat) => setCats(new Set(list.map(x => x.id)), cat)}
        />
        <a className="demo-cta" href="/">Byrjaðu á þínu eigin bókhaldi — skannaðu fyrstu kvittunina</a>
      </div>
    </div>
  )
}
