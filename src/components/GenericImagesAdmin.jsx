import React, { useEffect, useState } from 'react'
import { IconCamera, IconX, IconTrash, IconPlus } from '@tabler/icons-react'
import { store } from '../lib/store.js'
import { resizeImageFile } from '../lib/img.js'
import { GENERIC_TARGETS, genericKey } from '../lib/generic.js'

// Stjórnandi: taka myndir af algengustu vörunum í búðinni. Myndin verður sjálfgefin fyrir alla sem skrifa
// t.d. „mjólk“ eða „nautahakk 500 g“ á listann. Ferningsmynd 400×400, vistuð í opinberu fötunni product-images.
export default function GenericImagesAdmin({ onClose, onChanged }) {
  const [imgs, setImgs] = useState({})
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [extra, setExtra] = useState('')
  const [names, setNames] = useState(GENERIC_TARGETS)

  const load = () => store.getGenericImages().then(rows => {
    const m = {}
    for (const r of rows) m[r.name_norm] = r.image_url
    setImgs(m)
    setNames(prev => [...new Set([...prev, ...Object.keys(m)])])
  }).catch(() => {})
  useEffect(() => { load() }, [])

  const upload = async (name, file) => {
    if (!file) return
    setBusy(name); setErr('')
    try {
      const dataUrl = await resizeImageFile(file, 400, 0.82)
      const blob = await (await fetch(dataUrl)).blob()
      const url = await store.setGenericImage(name, blob)
      setImgs(m => ({ ...m, [name]: url }))
      onChanged && onChanged()
    } catch (e) { setErr('Tókst ekki að vista mynd fyrir „' + name + '“: ' + (e.message || e)) }
    setBusy('')
  }
  const remove = async (name) => {
    setBusy(name)
    try { await store.setGenericImage(name, null); setImgs(m => { const n = { ...m }; delete n[name]; return n }); onChanged && onChanged() } catch {}
    setBusy('')
  }
  const addName = () => {
    const k = genericKey(extra)
    if (k && !names.includes(k)) setNames([k, ...names])
    setExtra('')
  }

  const done = names.filter(n => imgs[n]).length
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal gi-modal" onClick={e => e.stopPropagation()}>
        <h2>Vörumyndir <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="ns-intro">Taktu mynd af vörunni í búðinni (helst framhliðin, beint á móti). Hún birtist hjá öllum sem skrifa heitið á listann. {done} af {names.length} komnar.</p>
        <div className="gi-add">
          <input value={extra} onChange={e => setExtra(e.target.value)} placeholder="Bæta við heiti, t.d. grjónagrautur" onKeyDown={e => e.key === 'Enter' && addName()} />
          <button onClick={addName} aria-label="Bæta við"><IconPlus size={18} /></button>
        </div>
        {err && <p className="ns-err">{err}</p>}
        <div className="gi-grid">
          {names.map(n => (
            <div key={n} className={'gi-cell' + (imgs[n] ? ' has' : '')}>
              <label className="gi-img">
                {imgs[n] ? <img src={imgs[n]} alt="" /> : <IconCamera size={26} stroke={1.6} />}
                {busy === n && <span className="gi-busy">…</span>}
                <input type="file" accept="image/*" capture="environment" hidden onChange={ev => upload(n, ev.target.files && ev.target.files[0])} />
              </label>
              <div className="gi-name">{n}</div>
              {imgs[n] && <button className="gi-del" onClick={() => remove(n)} aria-label="Fjarlægja"><IconTrash size={14} /></button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
