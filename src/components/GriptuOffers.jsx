import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { CatIcon } from '../data/icons.jsx'
import { departmentFor } from '../data/products.js'
import { IconGift, IconPlus, IconSearch, IconCheck } from '@tabler/icons-react'

// Gríptu-tilboðin fyrir neytendur: allar vörur sem gefa stig NÚNA, lifandi úr gagnagrunninum.
// Opið öllum (engin innskráning). Herferð í gangi ræður upphæð; vara án herferðar sýnir eigin verðlaun.
// „Setja á lista" opnar Tossalista með vöruna (?add=…) — þar lendir hún á innkaupalistanum.

const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const todayISO = () => new Date().toISOString().slice(0, 10)
export const APP_URL = 'https://tossalisti.is'

// Stig, ekki krónur: lokað kerfi (stig → gjafakarfa við þröskuld). 'percent' = stig sem hlutfall af verði.
export function rewardLabel(p) { return p.reward_type === 'percent' ? `${num(p.reward_value)}% í stigum` : `+${num(p.reward_value)} stig` }

export async function fetchOffers() {
  if (!supabase) return []
  const [{ data: prods }, { data: brands }, { data: camps }] = await Promise.all([
    supabase.from('reward_products').select('id,name,size,image_url,brand_id,reward_type,reward_value,active').eq('active', true).eq('status', 'approved').order('name'),
    supabase.from('reward_brands').select('id,name').eq('active', true),
    supabase.from('reward_campaigns_public').select('id,brand_id,product_id,title,reward_type,reward_value,starts_on,ends_on'), // aðeins herferðir í gildi
  ])
  const t = todayISO()
  const bn = new Map((brands || []).map(b => [b.id, b.name]))
  const all = camps || []
  const out = []
  for (const p of prods || []) {
    const live = all.filter(c => c.brand_id === p.brand_id && (!c.product_id || c.product_id === p.id))
      .sort((a, b) => (a.product_id ? 0 : 1) - (b.product_id ? 0 : 1))[0]
    if (!live && !(Number(p.reward_value) > 0)) continue // engin herferð í gangi og engin grunnstig → ekkert tilboð núna
    out.push({ ...p, brand: bn.get(p.brand_id) || '', ...(live ? { reward_type: live.reward_type, reward_value: live.reward_value, campaign: live.title, ends_on: live.ends_on } : {}) })
  }
  return out
}

// onAdd(name): inni í appinu — setur vöruna beint á núverandi innkaupalista (í stað tengils á tossalisti.is).
// onList(name): satt ef varan er þegar á listanum (sýnt sem „Á listanum“).
export default function GriptuOffers({ limit, onCount, onAdd, onList }) {
  const [offers, setOffers] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { fetchOffers().then(o => { setOffers(o); onCount && onCount(o.length) }).catch(() => setOffers([])) }, [])
  const shown = useMemo(() => {
    const s = q.toLowerCase().trim()
    const f = (offers || []).filter(o => !s || o.name.toLowerCase().includes(s) || o.brand.toLowerCase().includes(s))
    return limit ? f.slice(0, limit) : f
  }, [offers, q, limit])
  const byBrand = useMemo(() => {
    const m = new Map()
    for (const o of shown) (m.get(o.brand) || m.set(o.brand, []).get(o.brand)).push(o)
    return [...m.entries()]
  }, [shown])

  if (offers === null) return <div className="go-empty">Sæki tilboð…</div>
  if (offers.length === 0) return <div className="go-empty">Engin tilboð í gangi akkúrat núna — kíktu aftur fljótlega.</div>
  return (
    <div className="go">
      {!limit && (
        <div className="go-search"><IconSearch size={17} stroke={1.75} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Leita að vöru eða vörumerki…" /></div>
      )}
      {byBrand.map(([brand, items]) => (
        <div className="go-brand" key={brand}>
          <div className="go-brand-h">{brand}<span>{items.length} {items.length === 1 ? 'vara' : 'vörur'}</span></div>
          <div className="go-grid">
            {items.map(o => (
              <div className="go-card" key={o.id}>
                <div className="go-img">{o.image_url ? <img src={o.image_url} alt="" loading="lazy" /> : <CatIcon name={o.name} dept={departmentFor(o.name)} size={64} />}</div>
                <div className="go-name">{o.name}{o.size ? <small> · {o.size}</small> : null}</div>
                <div className="go-reward"><IconGift size={14} stroke={2} /> {rewardLabel(o)}</div>
                {o.ends_on && <div className="go-until">til {o.ends_on.split('-').reverse().slice(0, 2).join('.')}</div>}
                {onAdd
                  ? (onList && onList(o.name)
                      ? <span className="go-add go-added"><IconCheck size={15} stroke={2.25} /> Á listanum</span>
                      : <button className="go-add" onClick={() => onAdd(o.name)}><IconPlus size={15} stroke={2.25} /> Á listann</button>)
                  : <a className="go-add" href={`${APP_URL}/?add=${encodeURIComponent(o.name)}`}><IconPlus size={15} stroke={2.25} /> Á listann</a>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {shown.length === 0 && <div className="go-empty">Ekkert fannst.</div>}
    </div>
  )
}
