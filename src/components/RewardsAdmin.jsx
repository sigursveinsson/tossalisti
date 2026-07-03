import React, { useState, useEffect, useRef } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import BarcodeScanner from './BarcodeScanner.jsx'

// Býr til leitarorð úr heiti + stærð (t.d. "Pepsi Max" + "330 ml" → pepsi, max, 330).
const STOP = new Set(['ml', 'cl', 'dl', 'og', 'the', 'kg', 'stk'])
function kwFromText(...parts) {
  return [...new Set(
    parts.join(' ').toLowerCase()
      .replace(/[^0-9a-záðéíóúýþæö\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOP.has(w))
  )]
}

const EMPTY = { name: '', barcode: '', size: '', keywords: '', image_url: '', reward_type: 'fixed', reward_value: '' }

// Stjórnborð verðlaunakerfis: skrá vörur formlega (strikamerki, stærð, mynd) og tilboð.
export default function RewardsAdmin({ onClose }) {
  const [data, setData] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [np, setNp] = useState(EMPTY)
  const [kwEdited, setKwEdited] = useState(false)
  const [no, setNo] = useState({ title: '', threshold: '', reward_desc: '' })
  const [scanning, setScanning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [looking, setLooking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  useBackClose(true, onClose)

  const load = () => store.getRewardData().then(setData).catch(() => setData({ brands: [], products: [], offers: [] }))
  useEffect(() => { load(); store.getAppSettings().then(s => setEnabled(s.rewards_enabled === true)).catch(() => {}) }, [])
  const toggleEnabled = async () => { const next = !enabled; setEnabled(next); try { await store.setAppSetting('rewards_enabled', next) } catch {} }

  if (!data) return null
  const brand = data.brands[0]

  // Sjálfvirk leitarorð nema notandi hafi breytt þeim handvirkt.
  const suggested = kwFromText(np.name, np.size).join(', ')
  const kwValue = kwEdited ? np.keywords : suggested

  const setNameOrSize = (patch) => { setNp({ ...np, ...patch }); if (!kwEdited) setMsg('') }

  const onImage = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setUploading(true); setMsg('')
    try { const url = await store.uploadRewardImage(file); setNp(v => ({ ...v, image_url: url })) }
    catch (err) { setMsg('Náði ekki að hlaða upp mynd: ' + (err.message || err)) }
    setUploading(false)
  }

  // Sækir heiti/stærð/mynd úr Open Food Facts eftir strikamerki (fyllir aðeins auða reiti).
  const lookup = async (code) => {
    const bc = (code || '').trim()
    if (!bc) return
    setLooking(true); setMsg('')
    try {
      const info = await store.lookupBarcode(bc)
      if (info && (info.name || info.image_url || info.size)) {
        setNp(v => ({
          ...v,
          name: v.name || info.name || '',
          size: v.size || info.size || '',
          image_url: v.image_url || info.image_url || '',
        }))
        setMsg(info.name ? `Sótt úr Open Food Facts: ${info.name}` : 'Vara fannst (án heitis).')
      } else {
        setMsg('Fannst ekki í Open Food Facts — fylltu inn handvirkt.')
      }
    } catch { setMsg('Náði ekki í Open Food Facts.') }
    setLooking(false)
  }

  const setField = async (p, patch) => { await store.updateRewardProduct(p.id, patch); load() }

  const addProduct = async () => {
    if (!np.name.trim() || !brand) { setMsg('Sláðu inn vöruheiti.'); return }
    const kws = (kwEdited ? np.keywords : suggested).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (!kws.length) { setMsg('Vöru vantar leitarorð til að passa við kvittun.'); return }
    setBusy(true); setMsg('')
    try {
      await store.addRewardProduct({
        brand_id: brand.id, name: np.name, barcode: np.barcode, size: np.size,
        image_url: np.image_url, match_keywords: kws,
        reward_type: np.reward_type, reward_value: np.reward_value,
      })
      setNp(EMPTY); setKwEdited(false); load()
    } catch (err) { setMsg('Villa: ' + (err.message || err)) }
    setBusy(false)
  }

  const addOffer = async () => {
    if (!no.title.trim() || !brand) return
    await store.addRewardOffer({ brand_id: brand.id, title: no.title, threshold: no.threshold, reward_desc: no.reward_desc, kind: 'giftcard' })
    setNo({ title: '', threshold: '', reward_desc: '' }); load()
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal adm-modal" onClick={e => e.stopPropagation()}>
        <h2>🎁 Verðlaunakerfi <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <p className="muted-p">Vörumerki: <b>{brand?.name || '—'}</b>. Skráðu hverja vöru með strikamerki, stærð og mynd svo cashback lendi á réttri vöru — t.d. Pepsi Max 330 ml, ekki bara „Pepsi".</p>

        <div className="adm-ads">
          <div className="adm-ads-txt">
            <b>Verðlaunakerfi virkt</b>
            <small>{enabled ? 'Cashback reiknast þegar kvittun er skönnuð.' : 'Slökkt — kveiktu fyrir pilot/demo.'}</small>
          </div>
          <button className={'adm-ads-switch' + (enabled ? ' on' : '')} onClick={toggleEnabled} aria-label="Kveikja/slökkva" />
        </div>

        <div className="adm-head">Verðlaunavörur</div>
        {data.products.map(p => (
          <div className="rw-prod" key={p.id}>
            <div className="rw-prod-top">
              {p.image_url ? <img className="rw-thumb" src={p.image_url} alt="" /> : <div className="rw-thumb rw-thumb-ph">🛒</div>}
              <div className="rw-prod-id">
                <b>{p.name}</b>
                <small>{[p.size, p.barcode].filter(Boolean).join(' · ') || 'engin stærð/strikamerki'}</small>
              </div>
              <button className="rw-del" onClick={async () => { await store.deleteRewardProduct(p.id); load() }} aria-label="Eyða">×</button>
            </div>
            <div className="rw-prod-row">
              <select value={p.reward_type} onChange={e => setField(p, { reward_type: e.target.value })}>
                <option value="fixed">kr á vöru</option>
                <option value="percent">% af verði</option>
              </select>
              <input type="number" className="rw-val" value={p.reward_value} onChange={e => setField(p, { reward_value: Number(e.target.value) || 0 })} />
              <span className="rw-unit">{p.reward_type === 'percent' ? '%' : 'kr'}</span>
              <label className="rw-active"><input type="checkbox" checked={p.active} onChange={e => setField(p, { active: e.target.checked })} /> virk</label>
            </div>
            {(p.match_keywords || []).length > 0 && <div className="rw-kw">Passar við: {(p.match_keywords || []).join(' + ')}</div>}
          </div>
        ))}

        <div className="rw-add">
          <div className="rw-newhead">Ný vara</div>
          <div className="rw-imgrow">
            {np.image_url ? <img className="rw-thumb" src={np.image_url} alt="" /> : <div className="rw-thumb rw-thumb-ph">🛒</div>}
            <button className="rw-imgbtn" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Hleð…' : (np.image_url ? 'Skipta um mynd' : '📷 Bæta mynd')}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onImage} style={{ display: 'none' }} />
          </div>
          <input placeholder="Vöruheiti (t.d. Pepsi Max)" value={np.name} onChange={e => setNameOrSize({ name: e.target.value })} />
          <div className="rw-add-row">
            <input placeholder="Stærð (t.d. 330 ml)" value={np.size} onChange={e => setNameOrSize({ size: e.target.value })} />
            <input placeholder="Strikamerki (EAN)" value={np.barcode} onChange={e => setNp({ ...np, barcode: e.target.value })} inputMode="numeric" />
          </div>
          <div className="rw-add-row">
            <button className="rw-scanbtn" onClick={() => setScanning(true)}>📷 Skanna</button>
            <button className="rw-scanbtn" onClick={() => lookup(np.barcode)} disabled={looking || !np.barcode}>{looking ? 'Sæki…' : '🔍 Sækja úr Open Food Facts'}</button>
          </div>
          <div className="rw-kwrow">
            <input placeholder="Leitarorð (passa öll við kvittun)" value={kwValue} onChange={e => { setKwEdited(true); setNp({ ...np, keywords: e.target.value }) }} />
            {kwEdited && <button className="rw-reset" onClick={() => setKwEdited(false)} title="Aftur í sjálfvirkt">↺</button>}
          </div>
          <div className="rw-hint">Öll leitarorð verða að finnast í línu kvittunar. Fleiri orð = nákvæmara.</div>
          <div className="rw-add-row">
            <select value={np.reward_type} onChange={e => setNp({ ...np, reward_type: e.target.value })}>
              <option value="fixed">kr</option><option value="percent">%</option>
            </select>
            <input type="number" className="rw-val" placeholder="upphæð" value={np.reward_value} onChange={e => setNp({ ...np, reward_value: e.target.value })} />
            <button className="primary-btn rw-addbtn" onClick={addProduct} disabled={busy}>{busy ? '…' : 'Bæta við'}</button>
          </div>
          {msg && <div className="rw-msg">{msg}</div>}
        </div>

        <div className="adm-head">Tilboð / útleystning</div>
        {data.offers.map(o => (
          <div className="rw-offer" key={o.id}>
            <div className="rw-offer-txt"><b>{o.title}</b><small>Safnaðu {Math.round(o.threshold)} kr → {o.reward_desc || o.kind}</small></div>
            <button className="rw-del" onClick={async () => { await store.deleteRewardOffer(o.id); load() }} aria-label="Eyða">×</button>
          </div>
        ))}
        <div className="rw-add">
          <input placeholder="Titill (t.d. Krónan gjafabréf)" value={no.title} onChange={e => setNo({ ...no, title: e.target.value })} />
          <div className="rw-add-row">
            <input type="number" className="rw-val" placeholder="þröskuldur kr" value={no.threshold} onChange={e => setNo({ ...no, threshold: e.target.value })} />
            <input placeholder="lýsing" value={no.reward_desc} onChange={e => setNo({ ...no, reward_desc: e.target.value })} />
            <button className="primary-btn rw-addbtn" onClick={addOffer}>Bæta við</button>
          </div>
        </div>

        <button className="add-recipe-btn" style={{ marginTop: 14 }} onClick={onClose}>Loka</button>
      </div>

      {scanning && (
        <div onClick={e => e.stopPropagation()}>
          <BarcodeScanner
            onDetect={(code) => { setNp(v => ({ ...v, barcode: code })); setScanning(false); lookup(code) }}
            onClose={() => setScanning(false)}
          />
        </div>
      )}
    </div>
  )
}
