import React, { useEffect, useRef, useState } from 'react'
import { parseReceipt } from '../lib/receipt.js'
import { store as db } from '../lib/store.js'

// Texti á pörunar-merki: „Nathan · Nutella · +50 stig" (gjafatákn birt í JSX)
const matchLabel = (p) => {
  if (!p) return ''
  const v = Number(p.reward_value) || 0
  // in_campaign === false: varan á herferðir en engin er í gangi í dag → engin vörustig
  const val = p.in_campaign === false || v <= 0 ? 'engin herferð í gangi' : p.reward_type === 'percent' ? `${v}% í stigum` : `+${v} stig á einingu`
  return `${p.brand ? p.brand + ' · ' : ''}${p.name} · ${val}`
}
import { useBackClose } from '../lib/backstack.js'
import CameraCapture from './CameraCapture.jsx'
import { IconAlertTriangle, IconArchive, IconCamera, IconGift, IconShieldCheck, IconX } from '@tabler/icons-react'

const today = () => new Date().toISOString().slice(0, 10)
const sum = (items) => items.reduce((a, b) => a + (Number(b.price) || 0), 0)
// OCR les oft ártal vitlaust. Flöggum ef dagsetning er meira en mánuður frá í dag (aftur í tímann eða fram).
const dateLooksOff = (d) => {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const diff = Math.abs(new Date(d + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime())
  return diff > 31 * 86400000
}
// Ábyrgð: dagsetning + N ár (YYYY-MM-DD). Skilafrestur: dagsetning + N dagar.
const addYears = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCFullYear(x.getUTCFullYear() + n); return x.toISOString().slice(0, 10) }
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
const nextW = (w) => (w === 0 ? 2 : w === 2 ? 5 : 0)
const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('is-IS', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d } }

// Flæði: taka mynd → lesa (Tesseract) → staðfesta/laga → vista.
// requireImage: boðshópur Gríptu — myndin er geymd alltaf (skoðuð áður en karfa er afhent), ekki hægt að afhaka.
export default function ReceiptScanner({ onSave, onClose, onCheckDuplicate, requireImage = false }) {
  const fileRef = useRef(null)
  const [phase, setPhase] = useState('capture') // capture | reading | review
  const [progress, setProgress] = useState(0)
  const [store, setStore] = useState('')
  const [date, setDate] = useState(today())
  const [items, setItems] = useState([])
  const [total, setTotal] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(null)     // vistun klikkaði — sýnt notanda í stað þess að gleypa villuna
  const [dup, setDup] = useState(null)
  const [archive, setArchive] = useState(null)   // mynd af kvittun til geymslu
  const [ident, setIdent] = useState({})          // auðkenni af kvittun: receipt_no, register, time, vat_total (svikavörn)
  const [failed, setFailed] = useState(null)       // 'network' | 'decode' | 'empty' | 'blurry' | null — af hverju lesturinn skilaði engu
  const [scanCheck, setScanCheck] = useState(null) // sannprófun netþjóns: {sum,total,diff,ok,…}
  const [camera, setCamera] = useState(false)      // lifandi myndataka í appinu (fyrir síma sem slökkva á vafranum)
  const canCamera = typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  // Myndataka: 'app' = myndavél símans (bestu gæðin, sjálfgefið) | 'live' = innbyggð myndavél í appinu.
  // Ef síminn slekkur á vafranum á meðan myndavél símans er opin (lítið minni) skiptir App.jsx varanlega í 'live'.
  const [mode, setMode] = useState(() => { try { return localStorage.getItem('korfan.camMode') || 'app' } catch { return 'app' } })
  const setModeP = (m) => { setMode(m); try { localStorage.setItem('korfan.camMode', m) } catch {} }
  const galleryRef = useRef(null)
  const gotFileRef = useRef(false)
  // Löng kvittun: teknar 2–4 myndir ofan frá og niður, lesnar saman.
  const [multi, setMulti] = useState(false)
  const [parts, setParts] = useState([])
  const [keepImage, setKeepImage] = useState(true)
  const [returnDays, setReturnDays] = useState(0) // 0 = enginn skilafrestur skráður
  const [scannedOnce, setScannedOnce] = useState(() => { try { return localStorage.getItem('korfan.scannedOnce') === '1' } catch { return false } })

  useBackClose(true, onClose)

  // Tilboðsvörur fyrir AI-pörun — sóttar strax þegar glugginn opnast (tilbúnar áður en mynd er tekin).
  const matchRef = useRef(null)
  if (!matchRef.current) {
    matchRef.current = (db.getRewardMatchList ? db.getRewardMatchList() : Promise.resolve([])).catch(() => [])
  }
  const [matchList, setMatchList] = useState([])
  useEffect(() => { matchRef.current.then(l => setMatchList(l || [])) }, [])
  const prodById = (id) => (id ? matchList.find(p => p.id === id) : null)

  const clearPending = () => { try { localStorage.removeItem('korfan.scanPending') } catch {} }
  // Myndavél símans: merkt „skönnun í gangi“ áður en hún opnast. Lifi síðan af (verður sýnileg aftur) er merkið
  // fjarlægt; ef síminn slökkti á vafranum sér App.jsx merkið við endurræsingu og skiptir í innbyggða myndavél.
  const openAppCamera = () => {
    gotFileRef.current = false
    try { localStorage.setItem('korfan.scanPending', String(Date.now())) } catch {}
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      document.removeEventListener('visibilitychange', onVis)
      setTimeout(() => { if (!gotFileRef.current) clearPending() }, 3000)
    }
    document.addEventListener('visibilitychange', onVis)
    fileRef.current && fileRef.current.click()
  }
  const openCamera = () => (mode === 'live' && canCamera) ? setCamera(true) : openAppCamera()
  const startMulti = () => { setMulti(true); setParts([]); setFailed(null); setPhase('capture'); openCamera() }

  const onFile = (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ''; if (file) { gotFileRef.current = true; onShot(file) } else clearPending() }
  const onShot = (file) => {
    setCamera(false)
    if (multi) { setParts(p => [...p, file].slice(0, 4)); setPhase('parts'); clearPending() }
    else handleFile(file)
  }
  const lastInputRef = useRef(null) // síðasta mynd(ir) — til að reyna aftur án nýrrar myndatöku
  const handleFile = async (input) => {
    lastInputRef.current = input
    setCamera(false)
    setPhase('reading'); setProgress(0)
    try {
      const prods = await matchRef.current
      const res = await parseReceipt(input, setProgress, prods)
      setStore(res.store || '')
      if (res.date && /^\d{4}-\d{2}-\d{2}$/.test(res.date)) setDate(res.date)
      setItems((res.items || []).map((x, i) => ({ id: i + '_' + Date.now(), name: x.name, qty: x.qty && x.qty !== 1 ? x.qty : 1, price: x.price ?? '', reward_product_id: x.reward_product_id || null, w: x.warranty_years || 0 }))
      )
      setArchive(res.archive || null)
      setFailed(res.failed || null)
      setScanCheck(res.check || null)
      setIdent({ receipt_no: res.receipt_no || null, register: res.register || null, receipt_time: res.time || null, vat_total: res.vat_total ?? null, scan_id: res.scan_id || null })
      setTotal(res.total != null ? String(res.total) : '')
      try { localStorage.setItem('korfan.scannedOnce', '1') } catch {}
      setScannedOnce(true)
    } catch (err) {
      setItems([]); setFailed('network')
    }
    clearPending()
    setMulti(false); setParts([])
    setPhase('review')
  }

  const setItem = (id, field, val) => setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it))
  const delItem = (id) => setItems(items.filter(it => it.id !== id))
  const addRow = () => setItems([...items, { id: 'n_' + Date.now(), name: '', qty: 1, price: '', w: 0 }])

  const save = async () => {
    const clean = items
      .map(it => ({ name: (it.name || '').trim(), qty: Number(it.qty) > 0 ? Number(it.qty) : 1, price: it.price === '' ? null : Number(it.price), reward_product_id: it.reward_product_id || null, warranty_until: it.w ? addYears(date, it.w) : null }))
      .filter(it => it.name)
    const payload = {
      store: store.trim(),
      purchased_at: date,
      total: total === '' ? sum(clean) : Number(total),
      items: clean,
      return_until: returnDays ? addDays(date, returnDays) : null,
      archive: (keepImage || requireImage) ? archive : null,
      ...ident,
    }
    setSaving(true); setSaveErr(null)
    try {
      if (!dup && onCheckDuplicate) {
        const existing = await onCheckDuplicate(payload)
        if (existing) { setDup(existing); setSaving(false); return }
      }
      await onSave(payload)
      onClose()
    } catch (e) {
      setSaving(false)
      const m = String((e && e.message) || e || '')
      setSaveErr(/Failed to fetch|NetworkError|Load failed|network/i.test(m)
        ? 'Ekki náðist samband. Kvittunin er ekki vistuð — athugaðu netið og ýttu aftur á „Vista kvittun“.'
        : m || 'Ekki tókst að vista kvittunina. Reyndu aftur.')
    }
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal receipt-modal" onClick={e => e.stopPropagation()}>
        <h2>Skrá kvittun <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        <input ref={galleryRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        {camera && <CameraCapture title={multi ? `Hluti ${parts.length + 1} af kvittuninni` : undefined}
          onCapture={onShot} onPickFile={() => { setCamera(false); setTimeout(() => galleryRef.current && galleryRef.current.click(), 50) }} onClose={() => setCamera(false)} />}

        {phase === 'capture' && (
          <>
            <p className="muted-p">Taktu mynd af kassakvittuninni. Appið les vörur og verð — þú getur lagað áður en þú vistar.</p>
            <div className="receipt-tip"><b>Kvittunin á að fylla breidd myndarinnar.</b> Flöt, í góðri birtu og án skugga. Ef hún er of löng til að komast öll fyrir þannig, taktu hana í hlutum.</div>
            <button className="add-recipe-btn" onClick={() => { setMulti(false); openCamera() }}><IconCamera size={19} stroke={1.9} /> Taka mynd af kvittun</button>
            <button className="ghost-btn receipt-alt" onClick={startMulti}>Löng kvittun? Taka í hlutum</button>
            <button className="ghost-btn receipt-alt" onClick={() => { setMulti(false); galleryRef.current && galleryRef.current.click() }}>Velja mynd úr myndasafni</button>
            {canCamera && (
              <button className="receipt-modelink" onClick={() => setModeP(mode === 'live' ? 'app' : 'live')}>
                {mode === 'live' ? 'Nota myndavél símans (betri myndgæði)' : 'Myndavél símans lokar appinu? Nota innbyggða myndavél'}
              </button>
            )}
          </>
        )}

        {phase === 'parts' && (
          <div className="receipt-parts">
            <p><b>{parts.length} {parts.length === 1 ? 'hluti kominn' : 'hlutar komnir'}.</b> {parts.length < 4 ? 'Taktu næsta hluta neðar á kvittuninni. Láttu síðustu línurnar af fyrri mynd sjást aftur efst, svo ekkert detti út.' : 'Hámark 4 hlutar.'}</p>
            <div className="receipt-parts-dots">{parts.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
            {parts.length < 4 && <button className="add-recipe-btn" onClick={openCamera}><IconCamera size={19} stroke={1.9} /> Taka hluta {parts.length + 1}</button>}
            <button className={parts.length >= 2 ? 'add-recipe-btn' : 'ghost-btn receipt-alt'} onClick={() => handleFile(parts)} disabled={!parts.length}>Búið, lesa kvittunina ({parts.length} {parts.length === 1 ? 'mynd' : 'myndir'})</button>
            <button className="receipt-modelink" onClick={() => { setParts([]); setMulti(false); setPhase('capture') }}>Byrja upp á nýtt</button>
          </div>
        )}

        {phase === 'reading' && (
          <div className="receipt-reading">
            <p>Les kvittun… {Math.round(progress * 100)}%</p>
            <div className="progress-bar"><div style={{ width: Math.round(progress * 100) + '%' }} /></div>
            {!scannedOnce && <p className="muted-p">Fyrsta skipti tekur lengri tíma (sækir íslenskt málgagn).</p>}
          </div>
        )}

        {phase === 'review' && (
          <>
            <div className="receipt-meta">
              <input className="dialog-input" value={store} onChange={e => setStore(e.target.value)} placeholder="Verslun (t.d. Bónus)" />
              <input className="dialog-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {dateLooksOff(date) && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Dagsetningin les sem <b>{fmtDate(date)}</b> — meira en mánuður frá í dag. Er ártalið örugglega rétt? Skönnun les ártal oft vitlaust. Leiðréttu hér að ofan ef þarf.</span></div>
            )}
            {items.length === 0 && failed === 'ai_down' && <div className="receipt-fail"><b>Kvittanalesturinn liggur niðri í augnablikinu.</b> Þetta er ekki myndin þín. Við höfum fengið tilkynningu og erum að laga þetta. Reyndu aftur eftir smá stund með sömu mynd, eða skráðu kvittunina síðar.</div>}
            {items.length === 0 && (failed === 'ai_down' || failed === 'network') && lastInputRef.current && (
              <button className="add-recipe-btn" onClick={() => handleFile(lastInputRef.current)}>Reyna aftur með sömu mynd</button>
            )}
            {items.length === 0 && failed === 'network' && <div className="receipt-fail"><b>Náði ekki sambandi við kvittanalesarann.</b> Athugaðu netið og reyndu aftur með „Skanna aftur“, eða skráðu línurnar handvirkt.</div>}
            {items.length === 0 && failed === 'decode' && <div className="receipt-fail"><b>Náði ekki að opna myndina.</b> Prófaðu að taka myndina beint með myndavélinni í stað þess að velja úr myndasafni.</div>}
            {items.length === 0 && failed === 'blurry' && <div className="receipt-fail"><b>Myndin er ekki nógu skýr til að lesa línurnar.</b> Komdu nær svo kvittunin fylli breidd myndarinnar, í góðri birtu og án skugga. Ef hún er löng, taktu hana í hlutum.</div>}
            {items.length === 0 && failed === 'empty' && <div className="receipt-fail"><b>Kvittanalesarinn fann engar vörur á myndinni.</b> Er myndin skýr og kvittunin öll í ramma? Reyndu aftur eða skráðu handvirkt.</div>}
            {items.length === 0 && !failed && <p className="muted-p">Engar línur lásust — bættu þeim við handvirkt.</p>}
            {items.length === 0 && <button className="ghost-btn receipt-rescan" onClick={() => { setFailed(null); setMulti(false); setPhase('capture'); openCamera() }}><IconCamera size={16} stroke={1.9} /> Skanna aftur</button>}
            {(failed === 'blurry' || (scanCheck && scanCheck.ok === false)) && <button className="ghost-btn receipt-rescan" onClick={startMulti}>Taka kvittunina í hlutum (betra fyrir langar kvittanir)</button>}
            <div className="receipt-items">
              {items.map(it => {
                const mp = prodById(it.reward_product_id)
                return (
                  <React.Fragment key={it.id}>
                    <div className={'receipt-row' + (mp ? ' is-match' : '')}>
                      <input className="receipt-qty" value={it.qty ?? 1} onChange={e => setItem(it.id, 'qty', e.target.value.replace(',', '.'))} inputMode="decimal" aria-label="Magn" title="Magn" />
                      <input value={it.name} onChange={e => setItem(it.id, 'name', e.target.value)} placeholder="Vara" />
                      <input className="receipt-price" value={it.price} onChange={e => setItem(it.id, 'price', e.target.value)} placeholder="kr" inputMode="decimal" />
                      <button className={'receipt-warr' + (it.w ? ' on' : '')} onClick={() => setItem(it.id, 'w', nextW(it.w || 0))} title="Ábyrgð: ýttu til að skipta (engin / 2 ár / 5 ár)" aria-label="Ábyrgð">
                        <IconShieldCheck size={16} stroke={1.75} />{it.w ? <span>{it.w} ár</span> : null}
                      </button>
                      <button className="receipt-del" onClick={() => delItem(it.id)} aria-label="Eyða"><IconX size={16} stroke={1.75} /></button>
                    </div>
                    {mp && <div className="receipt-match"><IconGift size={13} stroke={2} />{matchLabel(mp)}</div>}
                  </React.Fragment>
                )
              })}
            </div>
            <button className="receipt-addrow" onClick={addRow}>+ Bæta við línu</button>
            {items.some(i => i.w) && <p className="receipt-hint"><IconShieldCheck size={14} stroke={1.9} /> Gervigreindin merkti vörur með ábyrgð. Þú færð áminningu mánuði áður en hún rennur út.</p>}
            <div className="receipt-return">
              <span>Skilafrestur</span>
              <div className="seg-mini">
                {[0, 14, 30].map(d => <button key={d} className={returnDays === d ? 'on' : ''} onClick={() => setReturnDays(d)}>{d ? d + ' dagar' : 'Enginn'}</button>)}
              </div>
            </div>
            {archive && requireImage && (
              <label className="receipt-keep locked"><input type="checkbox" checked readOnly disabled /> <IconArchive size={16} stroke={1.75} /> Mynd af kvittun er geymd — Gríptu skoðar hana áður en karfa er afhent. Aðeins þú, heimilið og Gríptu sjáið hana.</label>
            )}
            {archive && !requireImage && (
              <label className="receipt-keep"><input type="checkbox" checked={keepImage} onChange={e => setKeepImage(e.target.checked)} /> <IconArchive size={16} stroke={1.75} /> Geyma mynd af kvittun (aðeins þú og heimilið sjáið hana)</label>
            )}
            <div className="receipt-total">
              <span>Samtals</span>
              <input value={total} onChange={e => setTotal(e.target.value)} placeholder={String(sum(items.map(i => ({ price: i.price }))))} inputMode="decimal" />
              <span>kr</span>
            </div>
            {(() => {
              const t = Number(String(total).replace(/\./g, '').replace(',', '.'))
              const sm = items.reduce((a, it) => a + (Number(it.price) || 0), 0)
              if (!items.length || !(t > 0)) return null
              const d = Math.round(sm - t)
              if (Math.abs(d) <= Math.max(5, t * 0.002)) return null
              return <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Línurnar summast í <b>{sm.toLocaleString('is-IS')} kr</b> en samtala kvittunar er <b>{t.toLocaleString('is-IS')} kr</b> ({d > 0 ? '+' : ''}{d.toLocaleString('is-IS')} kr). Athugaðu hvort lína vantar eða er tvítalin.</span></div>
            })()}
            {requireImage && ident.scan_id && scanCheck && scanCheck.ok === false && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Lesturinn stemmdi ekki alveg við samtöluna, svo þessi kvittun gefur kvittanastig en ekki vörustig. Viltu vörustigin? Skannaðu aftur nær, eða taktu kvittunina í hlutum.</span></div>
            )}
            {requireImage && !archive && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Engin mynd fylgir — stig fást aðeins fyrir kvittanir sem eru skannaðar með myndavélinni. Kvittunin vistast í bókhaldið þitt.</span></div>
            )}
            {requireImage && archive && !ident.scan_id && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Lesturinn tókst ekki, svo þessi kvittun gefur engin stig þótt þú skráir línurnar handvirkt. Prófaðu „Skanna aftur“ í betri birtu ef þú vilt stigin.</span></div>
            )}
            {saveErr && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>{saveErr}</span></div>
            )}
            {dup && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Þessi kvittun virðist þegar skráð{dup.purchased_at ? ' (' + dup.store + ', ' + fmtDate(dup.purchased_at) + ')' : ''}. Ef hún er ný, ýttu aftur á „Vista samt".</span></div>
            )}
            <button className="add-recipe-btn" onClick={save} disabled={saving}>{saving ? 'Vista…' : (dup ? 'Vista samt' : 'Vista kvittun')}</button>
          </>
        )}
      </div>
    </div>
  )
}
