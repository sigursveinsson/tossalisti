import React, { useEffect, useState } from 'react'
import { IconX, IconShoppingCart, IconNotes, IconCheck, IconAlertTriangle, IconExternalLink } from '@tabler/icons-react'
import { supabase } from '../lib/supabaseClient.js'

// Prufa (aðeins stjórnandi): innkaupalisti → karfa í Snjallverslun Krónunnar.
// 1) Hver óhökuð vara fær Krónuvöru: valin vara (ext_sku) eða efsta leitarniðurstaða (↺ flettir, „Sleppa“).
// 2) Forskoðun hjá Krónunni: staða hverrar línu og áætluð upphæð.
// 3) „Setja í körfu“ bætir við körfuna (replace:false). Pöntun er ALDREI kláruð hér — notandinn greiðir hjá Krónunni.
const kr = (n) => Math.round(n || 0).toLocaleString('is-IS') + ' kr.'
const call = async (body) => {
  const { data, error } = await supabase.functions.invoke('kronan', { body })
  if (error) throw new Error(error.message || 'villa')
  return data
}

export default function KronanCart({ items, onClose }) {
  const open = items.filter(i => !i.checked)
  const [rows, setRows] = useState(() => open.map(i => ({
    key: i.id, label: i.name, qty: Math.max(1, i.qty || 1),
    opts: i.ext_sku ? [{ sku: i.ext_sku, name: i.name, price: i.ext_price, image: i.image_url }] : null,
    idx: 0, loading: !i.ext_sku,
  })))
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [err, setErr] = useState('')

  // Finna Krónuvöru fyrir vörur sem eru bara texti
  useEffect(() => {
    let alive = true
    rows.forEach((r, k) => {
      if (!r.loading) return
      call({ action: 'search', q: r.label, pageSize: 4 }).then(d => {
        if (!alive) return
        setRows(rs => rs.map((x, j) => j === k ? { ...x, opts: (d && d.hits) || [], idx: (d && d.hits && d.hits.length) ? 0 : -1, loading: false } : x))
      }).catch(() => alive && setRows(rs => rs.map((x, j) => j === k ? { ...x, opts: [], idx: -1, loading: false } : x)))
    })
    return () => { alive = false }
  }, [])

  const chosen = rows.filter(r => !r.loading && r.opts && r.idx >= 0 && r.opts[r.idx])
  const lines = chosen.map(r => ({ sku: r.opts[r.idx].sku, quantity: r.qty }))
  const allLoaded = rows.every(r => !r.loading)
  const sig = JSON.stringify(lines)

  // Forskoðun hjá Krónunni í hvert sinn sem valið breytist
  useEffect(() => {
    if (!allLoaded || !lines.length) { setPreview(null); return }
    let alive = true
    call({ action: 'cart_preview', lines }).then(d => alive && setPreview(d && d.data)).catch(() => alive && setPreview(null))
    return () => { alive = false }
  }, [sig, allLoaded])

  const cycle = (k) => setRows(rs => rs.map((x, j) => {
    if (j !== k || !x.opts) return x
    const n = x.idx + 1
    return { ...x, idx: n >= x.opts.length ? -1 : n }
  }))
  const lineStatus = (sku) => preview && (preview.lines || []).find(l => l.sku === sku)

  const toCart = async () => {
    setBusy(true); setErr('')
    try {
      const okLines = preview ? lines.filter(l => ((lineStatus(l.sku) || {}).status || 'ok') === 'ok') : lines
      if (!okLines.length) throw new Error('engin vara er fáanleg')
      const d = await call({ action: 'cart_add', lines: okLines })
      if (!d || d.status >= 300) throw new Error(JSON.stringify((d && d.result) || d).slice(0, 160))
      setDone({ kind: 'cart', cart: d.cart })
    } catch (e) { setErr('Tókst ekki: ' + String(e.message || e)) }
    setBusy(false)
  }
  const toNote = async () => {
    setBusy(true); setErr('')
    try {
      const noteLines = rows.map(r => (r.opts && r.idx >= 0 && r.opts[r.idx]) ? { sku: r.opts[r.idx].sku, quantity: r.qty } : { text: r.label, quantity: r.qty })
      const d = await call({ action: 'note_add', lines: noteLines })
      if (!d || (d.status && d.status >= 300)) throw new Error('villa')
      setDone({ kind: 'note', added: d.added ?? noteLines.length })
    } catch (e) { setErr('Tókst ekki: ' + String(e.message || e)) }
    setBusy(false)
  }

  if (done) {
    const c = done.cart || {}
    return (
      <div className="sheet-bg center" onClick={onClose}>
        <div className="modal kc" onClick={e => e.stopPropagation()}>
          <div className="kc-done-ic"><IconCheck size={34} stroke={2.6} /></div>
          {done.kind === 'cart' ? (
            <>
              <h2 className="kc-done-h">Komið í körfuna hjá Krónunni</h2>
              <div className="kc-sum">
                <div><span>Vörur í körfu</span><b>{(c.lines || []).length}</b></div>
                <div><span>Vörur</span><b>{kr(c.subtotal)}</b></div>
                {c.baggingFee ? <div><span>Pokagjald</span><b>{kr(c.baggingFee)}</b></div> : null}
                <div className="kc-total"><span>Samtals</span><b>{kr(c.total)}</b></div>
              </div>
              <p className="kc-note">Þú velur afhendingu og greiðir í Snjallverslun Krónunnar. Ekkert er pantað fyrr en þú gengur frá því þar.</p>
              <a className="kc-go" href="https://kronan.is/snjallverslun" target="_blank" rel="noopener"><IconExternalLink size={18} /> Opna Snjallverslun</a>
            </>
          ) : (
            <>
              <h2 className="kc-done-h">{done.added ? `${done.added} ${done.added === 1 ? 'vara send' : 'vörur sendar'} á innkaupamiðann` : 'Allt er þegar á innkaupamiðanum'}</h2>
              <p className="kc-note">Miðinn er í Krónuappinu (Skannað og skundað).</p>
            </>
          )}
          <button className="kc-close" onClick={onClose}>Loka</button>
        </div>
      </div>
    )
  }

  return (
    <div className="sheet-bg center" onClick={busy ? undefined : onClose}>
      <div className="modal kc" onClick={e => e.stopPropagation()}>
        <h2><span className="kc-logo">Krónan</span> Setja í körfu <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        {!open.length && <p className="muted-p">Ekkert óhakað á listanum.</p>}
        <div className="kc-rows">
          {rows.map((r, k) => {
            const h = r.opts && r.idx >= 0 ? r.opts[r.idx] : null
            const st = h ? lineStatus(h.sku) : null
            return (
              <div key={r.key} className={'kc-row' + (h ? '' : ' skip')}>
                <div className="kc-label">{r.label}{r.qty > 1 ? <span className="kc-qty">×{r.qty}</span> : null}</div>
                {r.loading ? <div className="kc-match loading">Leita í Krónunni…</div> : (
                  <button className="kc-match" onClick={() => cycle(k)} title="Ýttu til að velja aðra vöru">
                    {h ? <>
                      {h.image ? <img src={h.image} alt="" /> : <span className="kc-noimg" />}
                      <span className="kc-name">{h.name}<small>{kr((st && st.price) || h.price)}{st && st.status !== 'ok' ? ' · ' + (st.status === 'temporary_shortage' ? 'tímabundinn skortur' : 'ekki fáanleg') : ''}</small></span>
                    </> : <span className="kc-name">{r.opts && r.opts.length ? 'Sleppt' : 'Fannst ekki hjá Krónunni'}<small>{r.opts && r.opts.length ? 'ýttu til að velja vöru' : ''}</small></span>}
                    {r.opts && r.opts.length > 0 && <span className="kc-swap">↺</span>}
                    {st && st.status !== 'ok' && <IconAlertTriangle size={16} className="kc-warn" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="kc-foot">
          <div className="kc-est">
            <span>Áætlað hjá Krónunni</span>
            <b>{!allLoaded ? '…' : preview ? kr(preview.estimatedSubtotal) : lines.length ? '…' : kr(0)}</b>
            {preview && preview.issueCount > 0 && <small>{preview.issueCount} {preview.issueCount === 1 ? 'vara er' : 'vörur eru'} ekki fáanlegar og fara ekki í körfuna</small>}
          </div>
          {err && <p className="ns-err">{err}</p>}
          <button className="kc-cart" disabled={busy || !allLoaded || !lines.length} onClick={toCart}><IconShoppingCart size={20} /> {busy ? 'Augnablik…' : `Setja ${preview ? preview.okCount : lines.length} ${(preview ? preview.okCount : lines.length) === 1 ? 'vöru' : 'vörur'} í körfu`}</button>
          <button className="kc-notebtn" disabled={busy || !allLoaded} onClick={toNote}><IconNotes size={18} /> Senda frekar á innkaupamiða</button>
          <p className="kc-note">Bætist við það sem er fyrir í körfunni. Ekkert er pantað — þú klárar og greiðir hjá Krónunni.</p>
        </div>
      </div>
    </div>
  )
}
