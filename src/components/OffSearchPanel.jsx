import React, { useEffect, useState } from 'react'
import { IconSearch, IconCheck } from '@tabler/icons-react'
import { store } from '../lib/store.js'
import { supabase } from '../lib/supabaseClient.js'
import { GENERIC_TARGETS, genericKey } from '../lib/generic.js'

// Tól stjórnanda: leita að algengri vöru eftir heiti í Open Food Facts og velja bestu myndina.
// Valin mynd verður sjálfgefin mynd almenna heitisins („mjólk“) og varan fer í vörubankann (strikamerki).
// OFF takmarkar leitir (~10 á mín.), því er aðeins leitað þegar ýtt er á heiti.
async function offSearch(term, iceland) {
  // Fer í gegnum edge-fallið off-search (vafrinn má ekki kalla beint á leitarþjónustu OFF)
  const { data, error } = await supabase.functions.invoke('off-search', { body: { q: term, iceland } })
  if (error) throw new Error('Leit tókst ekki (' + (error.message || error) + ')')
  return (data && data.products) || []
}

export default function OffSearchPanel() {
  const [imgs, setImgs] = useState({})
  const [active, setActive] = useState('')
  const [term, setTerm] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [onlyIs, setOnlyIs] = useState(true)
  const [savedKey, setSavedKey] = useState('')

  useEffect(() => {
    store.getGenericImages().then(rows => { const m = {}; for (const r of rows) m[r.name_norm] = r.image_url; setImgs(m) }).catch(() => {})
  }, [])

  const search = async (name, q, iceland = onlyIs) => {
    setActive(name); setTerm(q ?? name); setResults(null); setErr(''); setLoading(true)
    try {
      let res = await offSearch(q ?? name, iceland)
      if (!res.length && iceland) { res = await offSearch(q ?? name, false); if (res.length) setErr('Ekkert íslenskt fannst — sýni niðurstöður frá öllum löndum.') }
      setResults(res)
    } catch (e) { setErr(e.message || String(e)); setResults([]) }
    setLoading(false)
  }

  const pick = async (p) => {
    const url = p.image || p.small
    const key = genericKey(active)
    try {
      await store.setGenericImage(key, url)
      const nm = [p.brand && !String(p.name || '').toLowerCase().includes(String(p.brand).toLowerCase()) ? p.brand : '', p.name, p.quantity].filter(Boolean).join(' ').trim()
      if (p.code && nm) await store.upsertCatalog({ barcode: p.code, name: nm, image: url })
      setImgs(m => ({ ...m, [key]: url })); setSavedKey(key)
      setTimeout(() => setSavedKey(''), 1500)
    } catch (e) { setErr('Tókst ekki að vista: ' + (e.message || e)) }
  }

  const missing = GENERIC_TARGETS.filter(n => !imgs[n])
  const have = GENERIC_TARGETS.filter(n => imgs[n])

  return (
    <div className="ofs">
      <p className="pit-hint">Veldu vöru → sjáðu myndir úr Open Food Facts → ýttu á þá bestu. {have.length} af {GENERIC_TARGETS.length} komnar.</p>
      <label className="ofs-is"><input type="checkbox" checked={onlyIs} onChange={e => setOnlyIs(e.target.checked)} /> Aðeins vörur seldar á Íslandi</label>
      <div className="ofs-chips">
        {missing.map(n => <button key={n} className={'ofs-chip' + (active === n ? ' on' : '')} onClick={() => search(n)}>{n}</button>)}
        {have.map(n => <button key={n} className={'ofs-chip has' + (active === n ? ' on' : '')} onClick={() => search(n)}><img src={imgs[n]} alt="" />{n}</button>)}
      </div>

      {active && (
        <div className="ofs-res">
          <div className="ofs-search">
            <input value={term} onChange={e => setTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && search(active, term)} placeholder="Leitarorð, t.d. nýmjólk eða milk" />
            <button onClick={() => search(active, term)} aria-label="Leita"><IconSearch size={18} /></button>
          </div>
          <div className="pit-hint">Mynd fyrir „{genericKey(active)}“{savedKey === genericKey(active) ? ' — vistað ✓' : ''}</div>
          {loading && <p className="pit-hint">Leita…</p>}
          {err && <p className="pit-hint">{err}</p>}
          {results && !loading && results.length === 0 && <p className="pit-hint">Engar myndir fundust. Prófaðu annað leitarorð (t.d. á ensku) eða taktu mynd sjálfur.</p>}
          <div className="ofs-grid">
            {(results || []).map(p => {
              const url = p.image || p.small
              const chosen = imgs[genericKey(active)] === url
              return (
                <button key={p.code} className={'ofs-cell' + (chosen ? ' chosen' : '')} onClick={() => pick(p)}>
                  <img src={p.small || url} alt="" loading="lazy" />
                  <span>{[p.brand, p.name].filter(Boolean).join(' · ') || p.code}</span>
                  {chosen && <i className="ofs-ok"><IconCheck size={14} stroke={3} /></i>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
