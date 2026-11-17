import React, { useMemo, useState } from 'react'
import { IconBarcode, IconCamera, IconCheck, IconArrowLeft, IconPhotoOff } from '@tabler/icons-react'
import BarcodeScanner from './BarcodeScanner.jsx'
import OffSearchPanel from './OffSearchPanel.jsx'
import { store } from '../lib/store.js'
import { resizeImageFile } from '../lib/img.js'
import { GENERIC_TARGETS, genericKey } from '../lib/generic.js'
import { departmentFor } from '../data/products.js'

// Tól stjórnanda (/vorumyndir): skanna strikamerki → sjá mynd úr Open Food Facts → nota hana eða taka eigin mynd
// → vista í vörubanka (product_catalog) og, ef valið, sem sjálfgefna mynd almenns heitis („mjólk“).
const OFF_FIELDS = 'product_name_is,product_name,generic_name_is,brands,quantity,image_front_url,image_front_small_url,image_url'

async function offLookup(code) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`)
    if (!r.ok) return null
    const d = await r.json()
    if (d.status !== 1 || !d.product) return null
    const p = d.product
    return {
      name: (p.product_name_is || p.generic_name_is || p.product_name || '').trim(),
      brand: (p.brands || '').split(',')[0].trim(),
      quantity: (p.quantity || '').trim(),
      image: p.image_front_url || p.image_url || p.image_front_small_url || null,
    }
  } catch { return null }
}

export default function ProductImageTool({ onClose }) {
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [off, setOff] = useState(null)       // niðurstaða Open Food Facts
  const [ours, setOurs] = useState(null)     // það sem er nú þegar í vörubankanum
  const [name, setName] = useState('')
  const [generic, setGeneric] = useState('')
  const [img, setImg] = useState(null)       // valin mynd: { url } eða { blob, preview }
  const [msg, setMsg] = useState('')
  const [saved, setSaved] = useState([])
  const [mode, setMode] = useState('scan') // scan | search

  const reset = () => { setCode(''); setOff(null); setOurs(null); setName(''); setGeneric(''); setImg(null); setMsg('') }

  const lookup = async (c) => {
    const clean = String(c || '').replace(/\D/g, '')
    if (!clean) return
    reset(); setCode(clean); setLoading(true)
    const [o, mine] = await Promise.all([offLookup(clean), store.lookupCatalogBarcode(clean).catch(() => null)])
    setOff(o); setOurs(mine)
    const n = (mine && mine.name) || (o && [o.brand && !o.name.toLowerCase().includes(o.brand.toLowerCase()) ? o.brand : '', o.name, o.quantity].filter(Boolean).join(' ')) || ''
    setName(n)
    const g = genericKey(n)
    setGeneric(GENERIC_TARGETS.find(t => g.includes(t)) || '')
    setImg(mine && mine.image ? { url: mine.image, src: 'Vörubanki' } : o && o.image ? { url: o.image, src: 'Open Food Facts' } : null)
    setLoading(false)
  }

  const takePhoto = async (file) => {
    if (!file) return
    try {
      const dataUrl = await resizeImageFile(file, 400, 0.82)
      const blob = await (await fetch(dataUrl)).blob()
      setImg({ blob, preview: dataUrl, src: 'Þín mynd' })
    } catch { setMsg('Tókst ekki að lesa myndina') }
  }

  const save = async () => {
    if (!code || !name.trim()) { setMsg('Vantar heiti'); return }
    setLoading(true); setMsg('')
    try {
      let url = img && img.url ? img.url : null
      if (img && img.blob) url = await store.uploadProductPhoto(code, img.blob)
      await store.upsertCatalog({ barcode: code, name: name.trim(), image: url, dept: departmentFor(name) })
      const g = genericKey(generic)
      if (g && url) await store.setGenericImage(g, url)
      setSaved(s => [{ code, name: name.trim(), url, generic: g }, ...s].slice(0, 30))
      reset()
      setMsg('Vistað ✓ ' + (g && url ? '— líka sem mynd fyrir „' + g + '“' : ''))
    } catch (e) { setMsg('Villa: ' + (e.message || e)) }
    setLoading(false)
  }

  const previewSrc = img ? (img.preview || img.url) : null
  const suggestions = useMemo(() => GENERIC_TARGETS, [])

  return (
    <div className="pit">
      <div className="pit-head">
        <button className="pit-back" onClick={onClose} aria-label="Til baka"><IconArrowLeft size={22} /></button>
        <h1>Vörumyndir</h1>
        <span className="pit-count">{saved.length ? saved.length + ' vistaðar' : ''}</span>
      </div>

      <div className="lv-tabs">
        <button className={mode === 'scan' ? 'on' : ''} onClick={() => setMode('scan')}>Skanna í búð</button>
        <button className={mode === 'search' ? 'on' : ''} onClick={() => setMode('search')}>Leita í Open Food Facts</button>
      </div>
      {mode === 'search' && <OffSearchPanel />}

      {mode === 'scan' && !code && (
        <div className="pit-start">
          <button className="pit-scan" onClick={() => setScanning(true)}><IconBarcode size={28} /> Skanna strikamerki</button>
          <div className="pit-manual">
            <input inputMode="numeric" placeholder="…eða sláðu inn strikamerki" onKeyDown={e => e.key === 'Enter' && lookup(e.currentTarget.value)} />
          </div>
          {msg && <p className="pit-msg">{msg}</p>}
        </div>
      )}

      {mode === 'scan' && code && (
        <div className="pit-card">
          <div className="pit-code">{code}{loading && ' · leita…'}</div>
          <div className="pit-imgwrap">
            {previewSrc ? <img src={previewSrc} alt="" /> : <div className="pit-noimg"><IconPhotoOff size={34} /> Engin mynd</div>}
            {img && <span className="pit-src">{img.src}</span>}
          </div>
          <div className="pit-imgbtns">
            {off && off.image && img?.src !== 'Open Food Facts' && <button onClick={() => setImg({ url: off.image, src: 'Open Food Facts' })}>Nota mynd frá Open Food Facts</button>}
            <label className="pit-photo"><IconCamera size={18} /> {img ? 'Taka nýja mynd' : 'Taka mynd'}
              <input type="file" accept="image/*" capture="environment" hidden onChange={e => takePhoto(e.target.files && e.target.files[0])} />
            </label>
          </div>
          {!off && !loading && <p className="pit-hint">Varan er ekki í Open Food Facts.</p>}

          <label className="pit-label">Heiti vöru</label>
          <input className="pit-input" value={name} onChange={e => setName(e.target.value)} placeholder="t.d. Arna nýmjólk 1 l" />

          <label className="pit-label">Sjálfgefin mynd fyrir almennt heiti <small>(valfrjálst)</small></label>
          <input className="pit-input" list="pit-generic" value={generic} onChange={e => setGeneric(e.target.value)} placeholder="t.d. nýmjólk" />
          <datalist id="pit-generic">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
          <p className="pit-hint">Ef fyllt út fá allir sem skrifa „{genericKey(generic) || '…'}“ á listann þessa mynd.</p>

          <div className="pit-actions">
            <button className="pit-cancel" onClick={reset}>Hætta við</button>
            <button className="pit-save" onClick={save} disabled={loading}><IconCheck size={18} /> Vista</button>
          </div>
          {msg && <p className="pit-msg">{msg}</p>}
        </div>
      )}

      {saved.length > 0 && (
        <div className="pit-saved">
          {saved.map((s, i) => (
            <div key={s.code + i} className="pit-saved-row">
              {s.url ? <img src={s.url} alt="" /> : <span className="pit-saved-noimg" />}
              <div><b>{s.name}</b>{s.generic && <small>→ {s.generic}</small>}</div>
            </div>
          ))}
        </div>
      )}

      {scanning && <BarcodeScanner onDetect={(c) => { setScanning(false); lookup(c) }} onClose={() => setScanning(false)} />}
      <p className="pit-credit">Myndir að hluta frá Open Food Facts (CC BY-SA).</p>
    </div>
  )
}
