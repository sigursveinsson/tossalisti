import React, { useEffect, useRef, useState } from 'react'
import { parseReceipt } from '../lib/receipt.js'
import { store as db } from '../lib/store.js'
import { CAT_BY_KEY } from '../data/categories.js'

// Texti á pörunar-merki: „Nathan · Nutella · +50 stig" (gjafatákn birt í JSX)
const matchLabel = (p) => {
  if (!p) return ''
  const v = Number(p.reward_value) || 0
  // in_campaign === false: varan á herferðir en engin er í gangi í dag → engin vörustig
  const val = p.in_campaign === false || v <= 0 ? 'engin herferð í gangi' : p.reward_type === 'percent' ? `${v}% í stigum` : `+${v} stig á einingu`
  return `${p.brand ? p.brand + ' · ' : ''}${p.name} · ${val}`
}
import { useBackClose } from '../lib/backstack.js'
import { landingEvent } from '../lib/landing.js'
import CameraCapture from './CameraCapture.jsx'
import { hasDocumentScanner, scanDocuments } from '../lib/native.js'
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
// Dæmakvittun fyrir nýja notendur: sýnir lesturinn og bókhaldið án þess að vera með kvittun við höndina.
// Raunveruleg kvittun (Bónus Fiskislóð 2.11.2026, frá Sverri) — línurnar eins og appið las þær.
const DEMO_STORE = 'Bónus Fiskislóð (dæmi)'
const DEMO_DATE = '2026-11-02'
const DEMO_IMG = '/postur/demo-kvittun.jpg'
const DEMO_ITEMS = [
  ['Starbucks 10 stk', 1, 769, 'drykkir'], ['EF hamborgarasósa 400 ml', 1, 487, 'matur'], ['OS Rjómaostur 400 g', 1, 998, 'matur'], ['Lambhaga salat box', 1, 525, 'matur'],
  ['HP kleinur 7 stk', 1, 559, 'matur'], ['OS Góðostur 26% biti', 1, 1313, 'matur'], ['SFG agúrka', 1, 275, 'matur'], ['ES frosin bláber', 1, 459, 'matur'],
  ['DJ döðlur', 1, 369, 'matur'], ['MCV Hob Nobs 262 g', 1, 314, 'snakk'], ['Bónus poki', 1, 53, 'heimili'],
]
// Sýnidæmið er ALDREI vistað (þetta er ekki kvittun gestsins): það sýnir bara lesturinn og flokkunina.
const DEMO_TOTAL = DEMO_ITEMS.reduce((a, [, , pr]) => a + pr, 0)
const DEMO_CATS = (() => {
  const m = {}
  for (const [, , pr, c] of DEMO_ITEMS) m[c] = (m[c] || 0) + pr
  return Object.entries(m).map(([key, amount]) => ({ key, amount, ...(CAT_BY_KEY[key] || { name: 'Annað', color: '#6b7a93', icon: '•' }) })).sort((a, b) => b.amount - a.amount)
})()
export default function ReceiptScanner({ onSave, onClose, onCheckDuplicate, onRealScan, requireImage = false, demo = false }) {
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
  // Yfirferð: fyrst stutt samantekt (verslun, samtala, línur) með „Vista“ — ritillinn opnast með „Breyta“.
  const [edit, setEdit] = useState(false)
  useEffect(() => { landingEvent(demo ? 'scan_open_demo' : 'scan_open') }, [])
  useEffect(() => { if (phase === 'review') landingEvent(items.length ? 'scan_read_ok' : failed === 'nolines' ? 'scan_read_nolines' : 'scan_read_fail') }, [phase])
  // Beint í myndavélina (enginn leiðbeiningaskjár á milli). Ef vafrinn leyfir það ekki stendur skjárinn eftir sem varaleið.
  const autoOpened = useRef(false)
  useEffect(() => {
    if (demo || autoOpened.current) return
    // Aðeins í síma/spjaldtölvu: þar opnast myndavélin. Í tölvu opnaðist skráaval, sem enginn bað um.
    const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.maxTouchPoints > 1 && window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    if (!isPhone && !hasDocumentScanner()) return
    autoOpened.current = true
    const t = setTimeout(() => { try { openCamera() } catch {} }, 60)
    // Ef vafrinn hleypti myndavélinni ekki af stað (síðan fór aldrei í bakgrunn): hreinsa „skönnun í gangi“-merkið
    // svo það sé ekki túlkað sem að síminn hafi drepið vafrann.
    let hid = document.visibilityState !== 'visible'
    const onVis = () => { if (document.visibilityState !== 'visible') hid = true }
    document.addEventListener('visibilitychange', onVis)
    const t2 = setTimeout(() => { document.removeEventListener('visibilitychange', onVis); if (!hid && !gotFileRef.current) clearPending() }, 1800)
    return () => { clearTimeout(t); clearTimeout(t2); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // Dæmi: „les“ kvittunina á ~1,5 sek og fyllir inn tilbúnar línur.
  useEffect(() => {
    if (!demo) return
    setPhase('reading'); setProgress(0)
    let p = 0
    const t = setInterval(() => {
      p = Math.min(1, p + 0.12); setProgress(p)
      if (p >= 1) {
        clearInterval(t)
        landingEvent('scan_demo_result')
        setPhase('demo')
      }
    }, 140)
    return () => clearInterval(t)
  }, [demo])

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
  // Í iOS/Android-appinu: innbyggður skjalaskanni (ML Kit / VisionKit) — finnur brúnir, réttir og skerpir sjálfur.
  // Löng kvittun → allt að 4 síður í einni lotu, lesnar saman. Ef notandi hættir við er ekkert gert.
  const openNativeScanner = async (maxPages) => {
    try {
      const files = await scanDocuments({ maxPages })
      if (!files || files.length === 0) return
      setMulti(false); setParts([])
      handleFile(files.length === 1 ? files[0] : files)
    } catch { setFailed('decode') }
  }
  const openCamera = () => hasDocumentScanner() ? openNativeScanner(1) : (mode === 'live' && canCamera) ? setCamera(true) : openAppCamera()
  const startMulti = () => {
    if (hasDocumentScanner()) { setFailed(null); setPhase('capture'); openNativeScanner(4); return }
    setMulti(true); setParts([]); setFailed(null); setPhase('capture'); openCamera()
  }

  const onFile = (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ''; if (file) { gotFileRef.current = true; landingEvent('scan_photo'); onShot(file) } else clearPending() }
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
      landingEvent(demo ? 'scan_saved_demo' : 'scan_saved')
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
    <div className="sheet-bg center" onClick={phase === 'capture' || phase === 'demo' ? onClose : undefined}>
      <div className="modal receipt-modal" onClick={e => e.stopPropagation()}>
        <h2>Skrá kvittun <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        <input ref={galleryRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        {camera && <CameraCapture title={multi ? `Hluti ${parts.length + 1} af kvittuninni` : undefined}
          onCapture={onShot} onPickFile={() => { setCamera(false); setTimeout(() => galleryRef.current && galleryRef.current.click(), 50) }} onClose={() => setCamera(false)} />}

        {phase === 'capture' && (
          <>
            <button className="add-recipe-btn" onClick={() => { setMulti(false); openCamera() }}><IconCamera size={19} stroke={1.9} /> Taka mynd af kvittun</button>
            <div className="receipt-tip"><b>Kvittunin á að fylla breidd myndarinnar.</b> Flöt, í góðri birtu og án skugga.</div>
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
            <p>{progress > 0 && progress < 1 ? `Les kvittun… ${Math.round(progress * 100)}%` : 'Les kvittunina…'}</p>
            <div className={'progress-bar' + (progress > 0 ? '' : ' indet')}><div style={progress > 0 ? { width: Math.round(progress * 100) + '%' } : undefined} /></div>
            <p className="muted-p">Finn verslun, vörur og verð — tekur nokkrar sekúndur.</p>
          </div>
        )}

        {phase === 'demo' && (
          <div className="rc-demo">
            <div className="rc-demo-head">
              <img src={DEMO_IMG} alt="Kvittun úr Bónus" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <div>
                <b>Bónus Fiskislóð</b>
                <small>{fmtDate(DEMO_DATE)} · {DEMO_ITEMS.length} vörur</small>
                <div className="rc-sum-total">{DEMO_TOTAL.toLocaleString('is-IS')} kr</div>
              </div>
            </div>
            <div className="rc-demo-h">Svona flokkar appið kvittunina</div>
            <div className="rc-demo-cats">
              {DEMO_CATS.map(c => (
                <div key={c.key} className="rc-demo-cat">
                  <span className="rc-demo-ic">{c.icon}</span>
                  <span className="rc-demo-name">{c.name}<i><em style={{ width: Math.max(6, Math.round(c.amount / DEMO_CATS[0].amount * 100)) + '%', background: c.color }} /></i></span>
                  <b>{c.amount.toLocaleString('is-IS')} kr</b>
                </div>
              ))}
            </div>
            <details className="rc-demo-lines">
              <summary>Sjá allar {DEMO_ITEMS.length} línurnar sem appið las</summary>
              <div className="rc-sum-items">
                {DEMO_ITEMS.map(([name, , price], i) => <div key={i}><span>{name}</span><span>{price.toLocaleString('is-IS')}</span></div>)}
              </div>
            </details>
            <div className="rc-demo-cta"><b>Ertu með kvittun í vasanum eða veskinu?</b> Prófaðu með henni — það tekur hálfa mínútu.</div>
            <button className="add-recipe-btn" onClick={() => { landingEvent('scan_demo_to_real'); onRealScan && onRealScan(); setMulti(false); setPhase('capture'); openCamera() }}><IconCamera size={19} stroke={1.9} /> Skanna mína kvittun</button>
            <button className="ghost-btn receipt-alt" onClick={onClose}>Loka</button>
            <p className="muted-p rc-demo-foot">Sýnidæmið vistast ekki.</p>
          </div>
        )}

        {phase === 'review' && (
          <>
            {demo && <img className="receipt-demo-img" src={DEMO_IMG} alt="Kvittun úr Bónus" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
            {demo && <div className="receipt-demo-note"><b>Raunveruleg kvittun úr Bónus.</b> Svona las appið hana. Ýttu á <b>Vista</b> til að sjá bókhaldið. Þú getur eytt dæminu hvenær sem er.</div>}
            {!edit && items.length > 0 && (
              <div className="rc-sum">
                <div className="rc-sum-top">
                  <div><b>{store || 'Verslun óþekkt'}</b><small>{fmtDate(date)} · {items.length} {items.length === 1 ? 'vara' : 'vörur'}</small></div>
                  <div className="rc-sum-total">{(total === '' ? sum(items) : Number(total) || 0).toLocaleString('is-IS')} kr</div>
                </div>
                <div className="rc-sum-items">
                  {items.map(it => <div key={it.id}><span>{Number(it.qty) > 1 ? it.qty + ' × ' : ''}{it.name}</span><span>{it.price === '' || it.price == null ? '' : Number(it.price).toLocaleString('is-IS')}</span></div>)}
                </div>
                <button className="rc-sum-edit" onClick={() => { landingEvent('scan_edit'); setEdit(true) }}>Breyta línum, dagsetningu, ábyrgð eða skilafresti</button>
              </div>
            )}
            {(edit || items.length === 0) && <>
            <div className="receipt-meta">
              <input className="dialog-input" value={store} onChange={e => setStore(e.target.value)} placeholder="Verslun (t.d. Bónus)" />
              <input className="dialog-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            </>}
            {dateLooksOff(date) && (
              <div className="receipt-datewarn"><IconAlertTriangle size={16} stroke={2} /> <span>Dagsetningin les sem <b>{fmtDate(date)}</b> — meira en mánuður frá í dag. Er ártalið örugglega rétt? Skönnun les ártal oft vitlaust. Leiðréttu með „Breyta“ ef þarf.</span></div>
            )}
            {items.length === 0 && failed === 'ai_down' && <div className="receipt-fail"><b>Kvittanalesturinn liggur niðri í augnablikinu.</b> Þetta er ekki myndin þín. Við höfum fengið tilkynningu og erum að laga þetta. Reyndu aftur eftir smá stund með sömu mynd, eða skráðu kvittunina síðar.</div>}
            {items.length === 0 && (failed === 'ai_down' || failed === 'network') && lastInputRef.current && (
              <button className="add-recipe-btn" onClick={() => handleFile(lastInputRef.current)}>Reyna aftur með sömu mynd</button>
            )}
            {items.length === 0 && failed === 'network' && <div className="receipt-fail"><b>Náði ekki sambandi við kvittanalesarann.</b> Athugaðu netið og reyndu aftur með „Skanna aftur“, eða skráðu línurnar handvirkt.</div>}
            {items.length === 0 && failed === 'decode' && <div className="receipt-fail"><b>Náði ekki að opna myndina.</b> Prófaðu að taka myndina beint með myndavélinni í stað þess að velja úr myndasafni.</div>}
            {items.length === 0 && failed === 'blurry' && <div className="receipt-fail"><b>Appið gat ekki lesið kvittunina af þessari mynd.</b> Leggðu kvittunina á borð, komdu nær svo hún fylli breidd myndarinnar, í góðri birtu og án skugga. Ef hún er löng, taktu hana í hlutum.</div>}
            {items.length === 0 && failed === 'empty' && <div className="receipt-fail"><b>Kvittanalesarinn fann engar vörur á myndinni.</b> Er myndin skýr og kvittunin öll í ramma? Reyndu aftur eða skráðu handvirkt.</div>}
            {items.length === 0 && failed === 'nolines' && <div className="receipt-demo-note"><b>Engar vörulínur eru á þessari kvittun</b>, bara upphæðin (t.d. posakvittun). Verslun, dagsetning og upphæð eru skráð hér að ofan — lagaðu ef þarf og ýttu á <b>Vista kvittun</b>.</div>}
            {items.length === 0 && !failed && <p className="muted-p">Engar línur lásust — bættu þeim við handvirkt.</p>}
            {items.length === 0 && failed !== 'nolines' && <button className={['blurry', 'empty', 'decode'].includes(failed) ? 'add-recipe-btn' : 'ghost-btn receipt-rescan'} onClick={() => { setFailed(null); setMulti(false); setPhase('capture'); openCamera() }}><IconCamera size={16} stroke={1.9} /> {['blurry', 'empty', 'decode'].includes(failed) ? 'Taka nýja mynd' : 'Skanna aftur'}</button>}
            {items.length === 0 && failed === 'nolines' && <button className="ghost-btn receipt-rescan" onClick={() => { setFailed(null); setMulti(false); setPhase('capture'); openCamera() }}><IconCamera size={16} stroke={1.9} /> Taka aðra mynd (ef vörulínur eiga að sjást)</button>}
            {failed !== 'nolines' && (failed === 'blurry' || (scanCheck && scanCheck.ok === false)) && <button className="ghost-btn receipt-rescan" onClick={startMulti}>Taka kvittunina í hlutum (betra fyrir langar kvittanir)</button>}
            {(edit || items.length === 0) && <>
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
            </>}
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
            <button className="add-recipe-btn rc-save" onClick={save} disabled={saving}>{saving ? 'Vista…' : (dup ? 'Vista samt' : 'Vista kvittun')}</button>
          </>
        )}
      </div>
    </div>
  )
}
