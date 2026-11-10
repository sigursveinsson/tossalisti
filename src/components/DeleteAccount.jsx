import React, { useState } from 'react'
import { store } from '../lib/store.js'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'

// Eyða eigin reikningi — krafa App Store/Google Play og persónuverndarlaga. Tveggja skrefa: notandi skrifar EYÐA.
// Eyðir listum notanda, kvittunum og myndum, stigum og vinningum. Deildir listar í eigu notanda hverfa líka hjá hinum.
export default function DeleteAccount({ onClose, onDone }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const go = async () => {
    setBusy(true); setErr('')
    try {
      const r = await store.deleteMyAccount(text.trim())
      if (!r || !r.ok) throw new Error(r && r.reason === 'confirm' ? 'Skrifaðu EYÐA til að staðfesta.' : 'Tókst ekki. Reyndu aftur.')
      onDone && onDone()
    } catch (e) { setErr(e.message || 'Tókst ekki. Reyndu aftur.'); setBusy(false) }
  }
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Eyða reikningi <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="da-warn"><IconAlertTriangle size={18} stroke={2} /> Þetta er ekki hægt að afturkalla.</p>
        <p className="da-text">Öllu sem tilheyrir þér verður eytt: listum (líka þeim sem þú deilir með öðrum), uppskriftum, bókhaldi, kvittunum og kvittanamyndum, Gríptu-stigum og vinningum sem ekki hafa verið sóttir. Listar annarra sem þú átt aðild að haldast hjá þeim.</p>
        <label className="da-label">Skrifaðu <b>EYÐA</b> til að staðfesta
          <input className="dialog-input" value={text} onChange={e => setText(e.target.value.toUpperCase())} autoCapitalize="characters" autoComplete="off" />
        </label>
        {err && <div className="bc-err">{err}</div>}
        <div className="bc-actions">
          <button className="ghost-btn" onClick={onClose} disabled={busy}>Hætta við</button>
          <button className="primary-btn danger-btn" onClick={go} disabled={busy || text.trim() !== 'EYÐA'}>{busy ? 'Eyði…' : 'Eyða reikningnum mínum'}</button>
        </div>
      </div>
    </div>
  )
}
