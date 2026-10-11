import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { IconX, IconUserPlus } from '@tabler/icons-react'

// Aðgangur vörumerkja (innskráning heildsala): netfang → vörumerki + hlutverk.
// Þegar viðkomandi skráir sig inn með netfanginu fer hann beint í mælaborð síns vörumerkis.
export default function BrandAccess() {
  const [brands, setBrands] = useState([])
  const [members, setMembers] = useState([])
  const [nm, setNm] = useState({ email: '', brand_id: '', role: 'editor' })
  const [busy, setBusy] = useState(false)
  const load = () => {
    store.getRewardBrands().then(b => { setBrands(b || []); if (!nm.brand_id && b && b[0]) setNm(x => ({ ...x, brand_id: b[0].id })) }).catch(() => {})
    store.getBrandMembers().then(setMembers).catch(() => setMembers([]))
  }
  useEffect(load, [])
  const add = async () => {
    setBusy(true)
    try { await store.addBrandMember(nm.email, nm.brand_id, nm.role); setNm(x => ({ ...x, email: '' })); load() } finally { setBusy(false) }
  }
  const remove = async (m) => { if (window.confirm(`Fjarlægja aðgang ${m.email}?`)) { await store.removeBrandMember(m.email, m.brand_id); load() } }
  const bname = (id) => (brands.find(b => b.id === id) || {}).name || '—'
  return (
    <>
      <div className="adm-head">Aðgangur vörumerkja</div>
      <p className="muted-p">Skráðu netfang hjá heildsala. Þegar viðkomandi skráir sig inn í Gríptu með því netfangi sér hann aðeins mælaborð og herferðir síns vörumerkis — hvorki lista né kvittanir. <b>Ritstjóri</b> má stofna herferðir, <b>áhorfandi</b> aðeins skoða.</p>
      {members.length === 0 && <p className="muted-p">Enginn aðgangur skráður enn.</p>}
      {members.map(m => (
        <div className="rw-offer" key={m.email + m.brand_id}>
          <div className="rw-offer-txt"><b>{m.email}</b><small>{bname(m.brand_id)} · {m.role === 'editor' ? 'ritstjóri' : 'áhorfandi'}</small></div>
          <button className="rw-del" onClick={() => remove(m)} aria-label="Fjarlægja"><IconX size={20} stroke={1.75} /></button>
        </div>
      ))}
      <div className="rw-add">
        <input placeholder="netfang@fyrirtaeki.is" value={nm.email} onChange={e => setNm({ ...nm, email: e.target.value })} inputMode="email" autoComplete="off" />
        <div className="rw-add-row">
          <select className="bd-select" value={nm.brand_id} onChange={e => setNm({ ...nm, brand_id: e.target.value })}>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="bd-select" value={nm.role} onChange={e => setNm({ ...nm, role: e.target.value })}>
            <option value="editor">Ritstjóri</option>
            <option value="viewer">Áhorfandi</option>
          </select>
          <button className="primary-btn rw-addbtn" onClick={add} disabled={busy || !nm.email.includes('@') || !nm.brand_id}><IconUserPlus size={16} stroke={2} /> Bæta við</button>
        </div>
      </div>
    </>
  )
}
