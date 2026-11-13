import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { IconX } from '@tabler/icons-react'

// Gestur (nafnlaus innskráning) bætir við netfangi og lykilorði. Sami notandi, sama auðkenni — allir
// listar, kvittanir og stig fylgja. Ef Supabase krefst staðfestingar á netfangi sendum við hlekk og
// biðjum um lykilorð þegar notandinn kemur til baka (App.jsx les 'tossa.needPw').
export default function SaveAccount({ onClose, onSaved }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [offers, setOffers] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const save = async () => {
    setError(''); setInfo('')
    const em = email.trim().toLowerCase()
    if (!em.includes('@')) { setError('Sláðu inn netfang.'); return }
    if (pw.length < 6) { setError('Lykilorð þarf að vera a.m.k. 6 stafir.'); return }
    setBusy(true)
    const { data, error } = await supabase.auth.updateUser(
      { email: em, data: { offers_opt_in: !!offers } },
      { emailRedirectTo: window.location.origin + '/' },
    )
    if (error) {
      setBusy(false)
      const m = (error.message || '').toLowerCase()
      setError(m.includes('already') || m.includes('registered') || m.includes('exists')
        ? 'Þetta netfang er þegar skráð. Skráðu þig út og inn með því — athugaðu að listar gestsins fylgja ekki.'
        : (error.message || 'Eitthvað fór úrskeiðis.'))
      return
    }
    if (data?.user?.email === em) {
      const r = await supabase.auth.updateUser({ password: pw })
      setBusy(false)
      if (r.error) { setError(r.error.message || 'Ekki tókst að vista lykilorð.'); return }
      try { localStorage.setItem('tossa.known', '1') } catch {}
      onSaved && onSaved()
      return
    }
    // Staðfesting á netfangi er á: lykilorð valið eftir að hlekkurinn er opnaður.
    setBusy(false)
    try { localStorage.setItem('tossa.needPw', '1'); localStorage.setItem('tossa.known', '1') } catch {}
    setInfo('Við sendum staðfestingarhlekk á ' + em + '. Opnaðu hann í þessum síma og veldu svo lykilorð. Athugaðu ruslpóstinn ef hann skilar sér ekki.')
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal saveacct" onClick={e => e.stopPropagation()}>
        <h2>Vista aðganginn <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="saveacct-lead">Bættu við netfangi og lykilorði svo listarnir þínir og kvittanir glatist ekki og þú getir opnað þá í öðrum tækjum. Alveg ókeypis.</p>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="netfang@daemi.is" type="email" autoComplete="email" autoFocus />
        <input value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Veldu lykilorð (minnst 6 stafir)" type="password" autoComplete="new-password" />
        <label className="signin-optin">
          <input type="checkbox" checked={offers} onChange={e => setOffers(e.target.checked)} />
          <span>Já, sendið mér tölvupóst þegar nýjar herferðir og tilboð byrja (í mesta lagi einu sinni í viku)</span>
        </label>
        <button className="primary-btn" onClick={save} disabled={busy}>{busy ? '…' : 'Vista'}</button>
        {error && <p className="signin-error">{error}</p>}
        {info && <p className="signin-info">{info}</p>}
      </div>
    </div>
  )
}
