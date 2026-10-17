import React, { useState, useEffect, useRef } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import BarcodeScanner from './BarcodeScanner.jsx'
import { IconBarcode, IconCamera, IconCheck, IconGift, IconSearch, IconShoppingBag, IconX } from '@tabler/icons-react'

// Býr til leitarorð úr heiti + stærð (t.d. "Pepsi Max" + "330 ml" → pepsi, max, 330).
const STOP = new Set(['ml', 'cl', 'dl', 'og', 'the', 'kg', 'gr', 'stk', 'dos', 'dós', 'box', 'pk', 'pakki'])
const isSize = (w) => /^\d+([.,]\d+)?(ml|cl|dl|l|g|gr|kg|stk|x)?$/.test(w)
function kwFromText(...parts) {
  return [...new Set(
    parts.join(' ').toLowerCase()
      .replace(/[^0-9a-záðéíóúýþæö\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOP.has(w) && !isSize(w))
  )]
}
// Breytir raunverulegri kvittanalínu í hrein leitarorð.
const cleanReceiptTokens = (line) => kwFromText(line)

const EMPTY = { name: '', barcode: '', size: '', keywords: '', image_url: '', reward_type: 'fixed', reward_value: '' }

// Stjórnborð verðlaunakerfis: skrá vörur formlega (strikamerki, stærð, mynd) og tilboð.
export default function RewardsAdmin({ onClose }) {
  const [data, setData] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [pts, setPts] = useState({ receipt_points: 20, trial_bonus: 100 }) // kvittanastig / prufubónus (app_settings)
  const [pilotOnly, setPilotOnly] = useState(true)
  const [invites, setInvites] = useState([])
  const [ni, setNi] = useState({ code: '', label: '', max_uses: '' })
  const loadInvites = () => store.pilotOverview().then(setInvites).catch(() => setInvites([]))
  const addInvite = async () => {
    if (!ni.code.trim()) return
    try { await store.addPilotInvite(ni.code, ni.label, ni.max_uses); setNi({ code: '', label: '', max_uses: '' }); loadInvites() }
    catch (e) { setMsg('Gat ekki stofnað kóða — er hann þegar til?') }
  }
  const togglePilotOnly = async () => { const next = !pilotOnly; setPilotOnly(next); try { await store.setAppSetting('pilot_only', next) } catch {} }
  const [np, setNp] = useState(EMPTY)
  const [kwEdited, setKwEdited] = useState(false)
  const [no, setNo] = useState({ title: '', threshold: '', reward_desc: '' })
  const [scanning, setScanning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [looking, setLooking] = useState(false)
  const [rcptQ, setRcptQ] = useState('')
  const [rcptTerms, setRcptTerms] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  useBackClose(true, onClose)

  const load = () => store.getRewardData().then(setData).catch(() => setData({ brands: [], products: [], offers: [] }))
  useEffect(() => { load(); loadInvites(); store.getAppSettings().then(s => { setEnabled(s.rewards_enabled === true); setPilotOnly(s.pilot_only !== false); setPts({ receipt_points: Number(s.receipt_points ?? 20), trial_bonus: Number(s.trial_bonus ?? 100) }) }).catch(() => {}) }, [])
  const savePts = async (key, v) => { const n = Math.max(0, Number(v) || 0); setPts(p => ({ ...p, [key]: n })); try { await store.setAppSetting(key, n) } catch {} }
  // Leitarorð: fylgir fyrsta orði vöruheitis; sækir kvittanalínur sem passa.
  useEffect(() => { setRcptQ((np.name || '').trim().split(/\s+/)[0] || '') }, [np.name])
  useEffect(() => {
    let live = true
    store.getReceiptTerms(rcptQ).then(r => { if (live) setRcptTerms(r || []) }).catch(() => { if (live) setRcptTerms([]) })
    return () => { live = false }
  }, [rcptQ])
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

  // Notar raunverulega kvittanalínu sem leitarorð (hreinsuð).
  const applyReceiptTerm = (line) => { setKwEdited(true); setNp(v => ({ ...v, keywords: cleanReceiptTokens(line).join(', ') })) }

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
    <div className="sheet-bg center" onClick={e => { e.stopPropagation(); onClose() }}>
      <div className="modal adm-modal" onClick={e => e.stopPropagation()}>
        <h2><span className="h2-ico"><IconGift size={20} stroke={1.75} /></span>Verðlaunakerfi <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="muted-p">Vörumerki: <b>{brand?.name || '—'}</b>. Skráðu hverja vöru með strikamerki, stærð og mynd svo stigin lendi á réttri vöru — t.d. Pepsi Max 330 ml, ekki bara „Pepsi".</p>

        <div className="adm-ads">
          <div className="adm-ads-txt">
            <b>Verðlaunakerfi virkt</b>
            <small>{enabled ? 'Stig reiknast þegar kvittun er skönnuð.' : 'Slökkt — kveiktu fyrir pilot/demo.'}</small>
          </div>
          <button className={'adm-ads-switch' + (enabled ? ' on' : '')} onClick={toggleEnabled} aria-label="Kveikja/slökkva" />
        </div>

        <div className="adm-head">Boðshópur</div>
        <div className="adm-ads">
          <div className="adm-ads-txt">
            <b>Aðeins boðshópur safnar stigum</b>
            <small>{pilotOnly ? 'Kveikt — notendur þurfa boðskóða (Gríptu stig → „Taka þátt“). Starfsfólk heildsala og þú teljið alltaf með.' : 'Slökkt — allir notendur safna stigum.'}</small>
          </div>
          <button className={'adm-ads-switch' + (pilotOnly ? ' on' : '')} onClick={togglePilotOnly} aria-label="Kveikja/slökkva" />
        </div>
        {invites.map(i => (
          <div className="pv-item" key={i.code}>
            <div><span className="pv-code">{i.code}</span>{i.label && <small>{i.label}</small>}</div>
            <span className="pv-n">{i.members}{i.max_uses ? ` / ${i.max_uses}` : ''} {i.members === 1 ? 'þátttakandi' : 'þátttakendur'}</span>
            <label className="rw-active"><input type="checkbox" checked={i.active} onChange={async e => { await store.setPilotInviteActive(i.code, e.target.checked); loadInvites() }} /> virkur</label>
          </div>
        ))}
        <div className="pv-add">
          <input className="dialog-input" placeholder="KÓÐI" value={ni.code} onChange={e => setNi({ ...ni, code: e.target.value.toUpperCase() })} autoCapitalize="characters" />
          <input className="dialog-input" placeholder="Lýsing — t.d. Nathan-pilot" value={ni.label} onChange={e => setNi({ ...ni, label: e.target.value })} />
          <input className="dialog-input" placeholder="Hámark" inputMode="numeric" value={ni.max_uses} onChange={e => setNi({ ...ni, max_uses: e.target.value })} />
          <button className="primary-btn" onClick={addInvite} disabled={!ni.code.trim()}>Stofna</button>
        </div>
        <p className="muted-p" style={{ marginTop: 8 }}>Sami kóði fyrir allan hópinn er einfaldast (t.d. NATHAN26 með hámarki 100). Notandi slær hann inn einu sinni í Gríptu stig-skjánum.</p>

        <div className="adm-head">Grunnstig</div>
        <p className="muted-p">Stig sem allir fá, óháð vörum — fólk er ekki þvingað til að kaupa neitt til að safna. Vörustig heildsala bætast ofan á.</p>
        <div className="rw-ptsgrid">
          <label className="rw-pts">
            <b>Kvittun skönnuð</b>
            <small>stig fyrir hverja skannaða kvittun, hámark ein á dag · 0 = slökkt</small>
            <input type="number" min="0" value={pts.receipt_points} onChange={e => setPts(p => ({ ...p, receipt_points: e.target.value }))} onBlur={e => savePts('receipt_points', e.target.value)} />
          </label>
          <label className="rw-pts">
            <b>Prufubónus</b>
            <small>aukastig í fyrsta sinn sem notandi kaupir hverja vöru · 0 = slökkt</small>
            <input type="number" min="0" value={pts.trial_bonus} onChange={e => setPts(p => ({ ...p, trial_bonus: e.target.value }))} onBlur={e => savePts('trial_bonus', e.target.value)} />
          </label>
        </div>

        {data.products.some(p => p.status === 'pending') && (
          <>
            <div className="adm-head">Bíða samþykkis <small className="rw-pendcount">{data.products.filter(p => p.status === 'pending').length}</small></div>
            <p className="muted-p">Vörur sem heildsali skráði sjálfur. Yfirfarðu leitarorðin — þau ráða hvaða kvittanalínur gefa stig.</p>
            <div className="rw-prodlist">
            {data.products.filter(p => p.status === 'pending').map(p => (
              <div className="rw-prod rw-pending" key={p.id}>
                <div className="rw-prod-top">
                  {p.image_url ? <img className="rw-thumb" src={p.image_url} alt="" /> : <div className="rw-thumb rw-thumb-ph"><IconShoppingBag size={18} stroke={1.6} /></div>}
                  <div className="rw-prod-id">
                    <b>{p.name}</b>
                    <small>{[p.size, p.barcode].filter(Boolean).join(' · ') || 'engin stærð/strikamerki'}{p.submitted_by ? ` · frá ${p.submitted_by}` : ''}</small>
                  </div>
                </div>
                <div className="rw-kwedit-row">
                  <span className="rw-kwlbl">Passar við</span>
                  <input className="rw-kwedit" defaultValue={(p.match_keywords || []).join(', ')}
                    onBlur={e => { const kws = e.target.value.split(',').map(s => s.trim()).filter(Boolean); if (kws.join('|') !== (p.match_keywords || []).join('|')) setField(p, { match_keywords: kws }) }} />
                </div>
                <div className="rw-prod-row">
                  <span className="rw-unit">{p.reward_type === 'percent' ? `${p.reward_value}% af verði` : `${p.reward_value} stig per eining`}</span>
                  <button className="primary-btn rw-approve" onClick={async () => { await store.reviewRewardProduct(p.id, 'approved'); load() }}><IconCheck size={15} stroke={2.2} /> Samþykkja</button>
                  <button className="ghost-btn" onClick={async () => { const note = window.prompt('Athugasemd til heildsalans (valfrjálst):', ''); if (note === null) return; await store.reviewRewardProduct(p.id, 'rejected', note); load() }}>Hafna</button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}

        <div className="adm-head">Verðlaunavörur</div>
        <div className="rw-prodlist">
        {data.products.filter(p => p.status !== 'pending').map(p => (
          <div className="rw-prod" key={p.id}>
            <div className="rw-prod-top">
              {p.image_url ? <img className="rw-thumb" src={p.image_url} alt="" /> : <div className="rw-thumb rw-thumb-ph"><IconShoppingBag size={18} stroke={1.6} /></div>}
              <div className="rw-prod-id">
                <b>{p.name}</b>
                <small>{[p.size, p.barcode].filter(Boolean).join(' · ') || 'engin stærð/strikamerki'}</small>
              </div>
              <button className="rw-del" onClick={async () => { await store.deleteRewardProduct(p.id); load() }} aria-label="Eyða"><IconX size={20} stroke={1.75} /></button>
            </div>
            <div className="rw-prod-row">
              <select value={p.reward_type} onChange={e => setField(p, { reward_type: e.target.value })}>
                <option value="fixed">stig á vöru</option>
                <option value="percent">% af verði í stigum</option>
              </select>
              <input type="number" className="rw-val" value={p.reward_value} onChange={e => setField(p, { reward_value: Number(e.target.value) || 0 })} />
              <span className="rw-unit">{p.reward_type === 'percent' ? '%' : 'stig'}</span>
              <label className="rw-active"><input type="checkbox" checked={p.active} onChange={e => setField(p, { active: e.target.checked })} /> virk</label>
            </div>
            <div className="rw-kwedit-row">
              <span className="rw-kwlbl">Passar við</span>
              <input className="rw-kwedit" defaultValue={(p.match_keywords || []).join(', ')}
                onBlur={e => { const kws = e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean); setField(p, { match_keywords: kws }) }}
                placeholder="orð eins og þau standa á kvittun (t.d. ritz)" />
            </div>
          </div>
        ))}
        </div>

        <div className="rw-add">
          <div className="rw-newhead">Ný vara</div>
          <div className="rw-imgrow">
            {np.image_url ? <img className="rw-thumb" src={np.image_url} alt="" /> : <div className="rw-thumb rw-thumb-ph"><IconShoppingBag size={18} stroke={1.6} /></div>}
            <button className="rw-imgbtn" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Hleð…' : (np.image_url ? 'Skipta um mynd' : <><IconCamera size={16} stroke={1.75} /> Bæta mynd</>)}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onImage} style={{ display: 'none' }} />
          </div>
          <input placeholder="Vöruheiti (t.d. Pepsi Max)" value={np.name} onChange={e => setNameOrSize({ name: e.target.value })} />
          <div className="rw-add-row">
            <input placeholder="Stærð (t.d. 330 ml)" value={np.size} onChange={e => setNameOrSize({ size: e.target.value })} />
            <input placeholder="Strikamerki (EAN)" value={np.barcode} onChange={e => setNp({ ...np, barcode: e.target.value })} inputMode="numeric" />
          </div>
          <div className="rw-add-row">
            <button className="rw-scanbtn" onClick={() => setScanning(true)}><IconBarcode size={16} stroke={1.75} /> Skanna</button>
            <button className="rw-scanbtn" onClick={() => lookup(np.barcode)} disabled={looking || !np.barcode}>{looking ? 'Sæki…' : <><IconSearch size={16} stroke={1.75} /> Sækja úr Open Food Facts</>}</button>
          </div>
          <div className="rw-kwrow">
            <input placeholder="Leitarorð (passa öll við kvittun)" value={kwValue} onChange={e => { setKwEdited(true); setNp({ ...np, keywords: e.target.value }) }} />
            {kwEdited && <button className="rw-reset" onClick={() => setKwEdited(false)} title="Aftur í sjálfvirkt">↺</button>}
          </div>
          <div className="rw-hint">Öll leitarorð verða að finnast í línu kvittunar. Færri orð = víðtækara (nær yfir fleiri búðir).</div>
          {rcptTerms.length > 0 && (
            <div className="rw-rcpt">
              <div className="rw-rcpt-lbl">Úr kvittunum — smelltu til að nota eins og varan birtist á strimli:</div>
              <div className="rw-chips">
                {rcptTerms.map(t => (
                  <button key={t.name} type="button" className="rw-chip" onClick={() => applyReceiptTerm(t.name)}>
                    {t.name}{t.count > 1 ? <small> ·{t.count}</small> : null}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            <button className="rw-del" onClick={async () => { await store.deleteRewardOffer(o.id); load() }} aria-label="Eyða"><IconX size={20} stroke={1.75} /></button>
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
