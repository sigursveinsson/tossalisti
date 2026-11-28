import React, { useState } from 'react'
import { IconX, IconCheck, IconPlugConnected } from '@tabler/icons-react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'

// Tengja eigin Krónu-aðgang (lokuð prófun). Notandinn límir sjálfur inn Krónu-lykilinn sinn. Lykillinn er sendur
// beint á netþjóninn, prófaður gegn Krónunni og geymdur dulkóðaður þar — hann er aldrei geymdur í vafranum og
// kemur aldrei til baka. Appið gengur aldrei frá pöntun; notandinn greiðir sjálfur hjá Krónunni.
const ERR = {
  format: 'Þetta lítur ekki út eins og lykill. Afritaðu hann í heilu lagi, án bila.',
  rejected: 'Krónan hafnaði lyklinum. Athugaðu að hann sé rétt afritaður og enn virkur.',
  store: 'Tókst ekki að vista lykilinn. Reyndu aftur.',
}

export default function KronanConnect({ status, onChanged, onClose }) {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState('')
  useBackClose(true, onClose)
  const connected = !!(status && status.has_token)

  const save = async () => {
    const t = token.trim()
    if (t.length < 8) { setMsg(ERR.format); return }
    setBusy(true); setMsg(''); setOk('')
    const r = await store.kronanSetToken(t)
    setToken('') // lykillinn á ekki að sitja í reitnum
    setBusy(false)
    if (r && r.ok) { setOk(r.name ? 'Tengt við Krónu-aðgang: ' + r.name : 'Krónu-aðgangurinn er tengdur.'); onChanged && onChanged(); return }
    setMsg(ERR[r && r.error] || 'Tókst ekki að tengja. Reyndu aftur eftir smástund.')
  }
  const disconnect = async () => {
    if (!window.confirm('Aftengja Krónu-aðganginn? Lyklinum er eytt af netþjóninum.')) return
    setBusy(true); setMsg(''); setOk('')
    const r = await store.kronanClearToken()
    setBusy(false)
    if (r && r.ok) { setOk('Aftengt. Lyklinum hefur verið eytt.'); onChanged && onChanged() } else setMsg('Tókst ekki að aftengja. Reyndu aftur.')
  }

  return (
    <div className="sheet-bg center" onClick={busy ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Tengja Krónuna <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="signin-note" style={{ marginTop: 0 }}>Lokuð prófun. Með þínum eigin Krónu-lykli geturðu leitað í vöruúrvali Krónunnar, sótt uppskriftir og sent vörur af listanum á innkaupamiðann þinn eða í körfuna. Appið gengur aldrei frá pöntun.</p>

        {connected && (
          <p className="signin-note" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}><IconCheck size={18} stroke={2} /> Krónu-aðgangur er tengdur.</p>
        )}

        <div className="modal-label">{connected ? 'Skipta um lykil' : 'Krónu-lykillinn þinn'}</div>
        <input className="dialog-input" type="password" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save() }}
          placeholder="Límdu lykilinn hér" />
        <p className="signin-note" style={{ marginTop: 8 }}>Lykillinn er geymdur dulkóðaður á netþjóni Tossalista og aðeins notaður fyrir þínar eigin fyrirspurnir. Hann sést aldrei aftur hér. Deildu honum ekki með öðrum.</p>

        {msg && <p className="signin-note" style={{ color: '#b42318' }}>{msg}</p>}
        {ok && <p className="signin-note" style={{ color: 'var(--text)' }}>{ok}</p>}

        <button className="add-recipe-btn" style={{ marginTop: 10 }} onClick={save} disabled={busy || token.trim().length < 8}>
          <IconPlugConnected size={18} stroke={1.9} /> {busy ? 'Prófa lykilinn…' : connected ? 'Vista nýjan lykil' : 'Tengja'}
        </button>
        {connected && <button className="ghost-btn" onClick={disconnect} disabled={busy}>Aftengja og eyða lyklinum</button>}
      </div>
    </div>
  )
}
