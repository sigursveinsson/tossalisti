import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { IconCheck, IconX, IconTicket, IconClock, IconLock } from '@tabler/icons-react'

// Staðfestingarsíða fyrir verðlaunakóða — griptu.is/k/<kóði> eða tossalisti.is/k/<kóði>.
// Opin öllum (engin innskráning): starfsmaður veitingastaðar/verslunar skannar QR-kóðann úr síma notanda,
// sér hvað hann gildir fyrir og merkir hann notaðan með PIN sem vörumerkið gaf staðnum.
// Sýnir engin persónugögn — aðeins verðlaunin, vörumerkið og stöðu kóðans.

const fmt = (d) => { try { return new Date(d).toLocaleString('is-IS', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) } catch { return d } }
const fmtD = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${Number(m[3])}.${Number(m[2])}.${m[1]}` : '' }
const REASON = { not_found: 'Kóðinn fannst ekki.', not_assigned: 'Þessi kóði hefur ekki verið veittur neinum.', already_used: 'Þessi kóði er þegar notaður.', expired: 'Kóðinn er útrunninn.', bad_pin: 'Rangt PIN.', too_many_attempts: 'Of margar tilraunir — reyndu aftur eftir klukkutíma.' }

export default function CodeCheck({ code }) {
  const [info, setInfo] = useState(null)
  const [pin, setPin] = useState(() => { try { return sessionStorage.getItem('griptu.pin') || '' } catch { return '' } })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const load = () => supabase.rpc('lookup_code', { p_code: code }).then(({ data }) => setInfo(data || { found: false })).catch(() => setInfo({ found: false }))
  useEffect(() => { load() }, [code])
  const redeem = async () => {
    setBusy(true); setResult(null)
    try {
      const { data, error } = await supabase.rpc('redeem_code', { p_code: code, p_pin: pin || null })
      if (error) throw error
      setResult(data)
      if (data && data.ok) { try { sessionStorage.setItem('griptu.pin', pin) } catch {} ; load() }
    } catch (e) { setResult({ ok: false, reason: 'error' }) } finally { setBusy(false) }
  }
  if (!info) return <div className="cc"><div className="cc-card"><div className="bd-muted">Fletti upp…</div></div></div>
  const usable = info.found && info.valid
  return (
    <div className="cc">
      <div className="cc-card">
        <div className="cc-brand">GRÍPTU</div>
        {!info.found && <><div className="cc-big bad"><IconX size={42} stroke={2.5} /></div><h2>Kóðinn fannst ekki</h2><p className="cc-code">{code}</p></>}
        {info.found && (
          <>
            <div className={'cc-big ' + (info.used_at ? 'used' : usable ? 'ok' : 'bad')}>
              {info.used_at ? <IconClock size={42} stroke={2.5} /> : usable ? <IconCheck size={42} stroke={2.5} /> : <IconX size={42} stroke={2.5} />}
            </div>
            <h2>{info.used_at ? 'Þegar notaður' : usable ? 'Gildur kóði' : info.expired ? 'Útrunninn' : 'Ógildur'}</h2>
            <div className="cc-prize"><IconTicket size={18} stroke={2} /> <b>{info.prize}</b><span>{info.brand}</span></div>
            <p className="cc-code">{code}</p>
            {info.used_at && <p className="cc-note">Notaður {fmt(info.used_at)}.</p>}
            {info.expires_at && !info.used_at && <p className="cc-note">Gildir til {fmtD(info.expires_at)}.</p>}
            {info.hint && usable && <p className="cc-note">{info.hint}</p>}
            {usable && (
              <div className="cc-redeem">
                {info.needs_pin && <label><IconLock size={14} stroke={2} /> PIN staðarins <input className="dialog-input" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••" /></label>}
                <button className="primary-btn cc-btn" onClick={redeem} disabled={busy || (info.needs_pin && pin.length < 4)}>{busy ? 'Augnablik…' : 'Merkja notaðan'}</button>
                <small>Starfsmaður ýtir hér þegar verðlaunin eru afhent. Kóðinn virkar aðeins einu sinni.</small>
              </div>
            )}
            {result && !result.ok && <div className="cc-err">{REASON[result.reason] || 'Tókst ekki, reyndu aftur.'}</div>}
            {result && result.ok && <div className="cc-done"><IconCheck size={16} stroke={2.5} /> Merkt notað. Takk!</div>}
          </>
        )}
        <a className="cc-foot" href="https://tossalisti.is">tossalisti.is · griptu.is</a>
      </div>
    </div>
  )
}
