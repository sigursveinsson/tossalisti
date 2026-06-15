import React, { useState, useEffect } from 'react'
import { store } from '../lib/store.js'
import { pushSupported, enablePush, disablePush } from '../lib/push.js'
import { useBackClose } from '../lib/backstack.js'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const hh = (h) => String(h).padStart(2, '0') + ':00'

export default function NotifSettings({ onClose }) {
  const [s, setS] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useBackClose(true, onClose)
  useEffect(() => { store.getNotifSettings().then(v => setS(v || {})) }, [])

  const patch = async (p) => { setS(v => ({ ...v, ...p })); try { await store.setNotifSettings(p) } catch {} }

  const toggleMaster = async () => {
    setErr('')
    if (!s) return
    if (s.push_enabled) {
      const sub = await disablePush()
      if (sub) await store.removePushSubscription(sub.endpoint)
      await patch({ push_enabled: false })
    } else {
      if (!pushSupported()) { setErr('Tækið styður ekki tilkynningar. Settu appið á heimaskjáinn og reyndu aftur.'); return }
      setBusy(true)
      try {
        const sub = await enablePush()
        await store.savePushSubscription(sub)
        await patch({ push_enabled: true })
      } catch (e) { setErr(e.message || 'Tókst ekki að kveikja á tilkynningum') }
      finally { setBusy(false) }
    }
  }

  if (!s) return null
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Áminningar <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>
        <p className="ns-intro">Áminningar eru slökktar þar til þú kveikir á þeim. Þú ræður öllu og getur slökkt hvenær sem er.</p>

        <button className={'ns-master' + (s.push_enabled ? ' on' : '')} onClick={toggleMaster} disabled={busy}>
          <span className="ns-master-lbl">{busy ? 'Augnablik…' : (s.push_enabled ? '🔔 Áminningar virkar' : '🔕 Kveikja á áminningum')}</span>
          <span className={'ns-switch' + (s.push_enabled ? ' on' : '')} aria-hidden="true" />
        </button>
        {err && <p className="ns-err">{err}</p>}

        {s.push_enabled && (
          <div className="ns-opts">
            <label className="ns-row">
              <span>Vikulegt uppgjör<small>Stig og kláruð verk, einu sinni í viku</small></span>
              <input type="checkbox" checked={!!s.weekly_summary} onChange={e => patch({ weekly_summary: e.target.checked })} />
            </label>
            <label className="ns-row">
              <span>„Verk dagsins"<small>Dagleg áminning um verk sem bíða</small></span>
              <input type="checkbox" checked={!!s.daily_tasks} onChange={e => patch({ daily_tasks: e.target.checked })} />
            </label>
            {s.daily_tasks && (
              <label className="ns-row sub">
                <span>Tími dagsáminningar</span>
                <select value={s.daily_tasks_hour} onChange={e => patch({ daily_tasks_hour: +e.target.value })}>
                  {HOURS.map(h => <option key={h} value={h}>{hh(h)}</option>)}
                </select>
              </label>
            )}
            <div className="ns-quiet">
              <div className="ns-quiet-h">🌙 Hljóðlátur tími — ekkert sent á þessu bili</div>
              <div className="ns-quiet-row">
                <select value={s.quiet_start} onChange={e => patch({ quiet_start: +e.target.value })}>{HOURS.map(h => <option key={h} value={h}>{hh(h)}</option>)}</select>
                <span>til</span>
                <select value={s.quiet_end} onChange={e => patch({ quiet_end: +e.target.value })}>{HOURS.map(h => <option key={h} value={h}>{hh(h)}</option>)}</select>
              </div>
            </div>
            <p className="ns-hint">Til að fá áminningu um einstök verk á völdum tíma, kveiktu á 🔔 við verkið í listanum.</p>
          </div>
        )}
      </div>
    </div>
  )
}
