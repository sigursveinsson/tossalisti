import React, { useEffect, useState } from 'react'
import { IconScan, IconCheck } from '@tabler/icons-react'
import { supabase } from '../lib/supabaseClient.js'
import { landingEvent, startLandingTracking, isInAppBrowser } from '../lib/landing.js'
import GoogleButton from './GoogleButton.jsx'
import { DEMO_IMG, DEMO_TOTAL } from '../data/demoReceipt.js'

// /kvittun — lendingarsíða fyrir auglýsingar. Þrír skjáir:
//  1) Mynd af kvittun og einn hnappur „Skanna kvittun“
//  2) Biðgluggi í 1 sek („Les kvittunina…“)
//  3) Niðurstaðan: mánuður af kvittunum (útgjöld eftir dögum + verslanir í lista) og skráning fyrir neðan
// Ekkert vistast og enginn gagnagrunnur fyrr en notandinn skráir sig. Tölurnar eru sýnidæmi.
const kr = (n) => Math.round(n).toLocaleString('is-IS').replace(/,/g, '.') + ' kr'
const ERR = (m) => {
  const s = String(m || '').toLowerCase()
  if (s.includes('already') || s.includes('registered') || s.includes('exists')) return 'already'
  if (s.includes('password')) return 'Lykilorð þarf að vera a.m.k. 6 stafir.'
  if (s.includes('email')) return 'Athugaðu netfangið.'
  return m || 'Eitthvað fór úrskeiðis. Reyndu aftur.'
}
// Appið opnar skannann strax eftir skráningu (App.jsx les merkið einu sinni)
const goApp = (scan) => {
  try { if (scan) localStorage.setItem('tossa.openScan', '1'); localStorage.setItem('tossa.welcomed', '1') } catch {}
  window.location.href = '/'
}

// Sýnimánuður: fjögurra manna heimili, nóvember. Hver kvittun: [verslun, [dagur, upphæð], …]
const VISITS = [
  ['Bónus', [[2, 6121], [5, 8450], [8, 11230], [11, 7980], [14, 9340], [17, 6890], [21, 10450], [24, 8120], [28, 9819]]],
  ['Krónan', [[3, 5420], [9, 8910], [13, 6230], [19, 9870], [23, 7340], [27, 8430]]],
  ['Costco', [[15, 31900]]],
  ['Orkan', [[6, 7400], [20, 7400]]],
  ['Hagkaup', [[12, 5900], [26, 6400]]],
  ['Lyfja', [[7, 3900], [22, 5900]]],
  ["Domino's", [[10, 4800], [25, 4800]]],
  ['Vínbúðin', [[27, 8400]]],
]
const DAYS = Array.from({ length: 30 }, () => 0)
for (const [, vs] of VISITS) for (const [d, a] of vs) DAYS[d - 1] += a
const DAY_MAX = Math.max(...DAYS)
const STORES = VISITS.map(([name, vs]) => ({ name, n: vs.length, total: vs.reduce((a, [, x]) => a + x, 0) })).sort((a, b) => b.total - a.total)
const MONTH_TOTAL = STORES.reduce((a, s) => a + s.total, 0)
const RECEIPTS = STORES.reduce((a, s) => a + s.n, 0)

export default function ScanLanding() {
  const [phase, setPhase] = useState('start') // start | reading | result
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [offers, setOffers] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => { landingEvent('lp_view'); return startLandingTracking() }, [])
  useEffect(() => {
    document.title = 'Skannaðu kvittun | Tossalisti'
    // Auglýsingasíða: ekki í leitarvélum (efnissíðurnar sjá um það)
    try { const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m) } catch {}
  }, [])

  const scan = () => {
    landingEvent('lp_scan')
    setPhase('reading')
    setTimeout(() => { setPhase('result'); landingEvent('lp_result'); try { window.scrollTo(0, 0) } catch {} }, 1000)
  }

  const signup = async () => {
    setErr(''); setInfo('')
    const em = email.trim().toLowerCase()
    if (!em.includes('@')) { setErr('Sláðu inn netfang.'); return }
    if (pw.length < 6) { setErr('Lykilorð þarf að vera a.m.k. 6 stafir.'); return }
    setBusy(true); landingEvent('lp_signup_click')
    try { localStorage.setItem('tossa.known', '1') } catch {}
    const { data, error } = await supabase.auth.signUp({ email: em, password: pw, options: { data: { offers_opt_in: !!offers, via: 'lp_kvittun' } } })
    setBusy(false)
    if (error) { landingEvent('lp_signup_err'); setErr(ERR(error.message)); return }
    landingEvent('signup_ok'); landingEvent('lp_signup_ok')
    if (data && data.session) { goApp(true); return }
    setInfo('Aðgangurinn er stofnaður. Við sendum staðfestingarhlekk á ' + em + ' — opnaðu hann og þú ert komin(n) inn.')
  }

  const inApp = isInAppBrowser()
  const google = async () => {
    setErr(''); setBusy(true); landingEvent('lp_google')
    try { localStorage.setItem('tossa.known', '1'); localStorage.setItem('tossa.openScan', '1'); localStorage.setItem('tossa.welcomed', '1') } catch {}
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } })
    if (error) {
      setBusy(false); landingEvent('lp_google_err')
      try { localStorage.removeItem('tossa.openScan') } catch {}
      setErr('Ekki tókst að opna Google. Notaðu netfang hér fyrir neðan.')
    }
    // annars fer vafrinn til Google og kemur til baka innskráður → appið opnar skannann
  }

  // 1) Mynd af kvittun + hnappur  ·  2) biðgluggi
  if (phase !== 'result') return (
    <div className="lp lp-start">
      <div className="lp-receipt">
        <img src={DEMO_IMG} alt="Kvittun úr Bónus" />
      </div>
      <button className="lp-btn" onClick={scan} disabled={phase === 'reading'}><IconScan size={22} stroke={2} /> Skanna kvittun</button>
      {phase === 'reading' && (
        <div className="lp-wait" role="status">
          <div className="lp-wait-box"><span className="lp-spin" /> Les kvittunina…</div>
        </div>
      )}
    </div>
  )

  // 3) Niðurstaðan: mánuðurinn í grafi + skráning
  return (
    <div className="lp lp-res">
      <div className="lp-done"><span className="lp-ok"><IconCheck size={18} stroke={2.6} /></span> Kvittun lesin: Bónus · {kr(DEMO_TOTAL)} · 11 vörur flokkaðar</div>

      <h1 className="lp-h1">Svona lítur mánuðurinn út</h1>
      <p className="lp-sub">Eftir mánuð af kvittunum sérðu nákvæmlega hvert peningarnir fóru.</p>

      <div className="lp-chart-card">
        <div className="lp-chart-top">
          <div><small>Nóvember · {RECEIPTS} kvittanir</small><b>{kr(MONTH_TOTAL)}</b></div>
        </div>
        <div className="lp-days" aria-label="Útgjöld eftir dögum mánaðarins">
          {DAYS.map((v, i) => (
            <div className="lp-day" key={i} title={(i + 1) + '. nóv: ' + kr(v)}>
              {v === DAY_MAX && <span className="lp-day-top">{Math.round(v / 1000)} þ.</span>}
              <i style={{ height: v ? Math.max(3, Math.round(v / DAY_MAX * 100)) + '%' : '2px', animationDelay: (i * 0.015) + 's' }} className={v ? '' : 'zero'} />
            </div>
          ))}
        </div>
        <div className="lp-days-x"><span>1. nóv</span><span>15.</span><span>30.</span></div>
        <div className="lp-stores">
          {STORES.map(s => (
            <div className="lp-store" key={s.name}>
              <span className="lp-store-n"><b>{s.name}</b><small>{s.n} {s.n === 1 ? 'kvittun' : 'kvittanir'}</small></span>
              <span className="lp-store-bar"><em style={{ width: Math.max(4, Math.round(s.total / STORES[0].total * 100)) + '%' }} /></span>
              <b className="lp-store-v">{kr(s.total)}</b>
            </div>
          ))}
        </div>
        <p className="lp-note">Sýnidæmi: fjögurra manna heimili.</p>
      </div>

      <div className="lp-signup">
        <h2>Fáðu þetta yfirlit fyrir þitt heimili</h2>
        <p>Taktu mynd af kvittunum og Tossalisti sér um rest. Ókeypis og íslenskt.</p>
        {info ? <p className="lp-info">{info}</p> : (<>
          {/* Google bannar innskráningu inni í Facebook/Instagram-vafranum — hnappurinn birtist aðeins í venjulegum vafra */}
          {!inApp && (<>
            <GoogleButton onClick={google} disabled={busy}>Halda áfram með Google</GoogleButton>
            <div className="signin-or"><span>eða með netfangi</span></div>
          </>)}
          <input value={email} onChange={e => setEmail(e.target.value)} onFocus={() => landingEvent('lp_focus_email')} placeholder="netfang@daemi.is" type="email" autoComplete="email" inputMode="email" />
          <input value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && signup()} placeholder="Veldu lykilorð (minnst 6 stafir)" type="password" autoComplete="new-password" />
          <label className="lp-optin"><input type="checkbox" checked={offers} onChange={e => setOffers(e.target.checked)} /> <span>Sendið mér fréttir af nýjungum (í mesta lagi einu sinni í viku)</span></label>
          <button className="lp-btn" onClick={signup} disabled={busy}>{busy ? 'Augnablik…' : 'Byrja — ókeypis'}</button>
          {err === 'already'
            ? <p className="lp-err">Þetta netfang er þegar skráð. <a href="/" onClick={() => { try { localStorage.setItem('tossa.noAuto', '1') } catch {} }}>Skráðu þig inn hér</a>.</p>
            : err && <p className="lp-err">{err}</p>}
        </>)}
        <button className="lp-later" onClick={() => { landingEvent('lp_try_guest'); goApp(true) }}>Prófa með minni kvittun án skráningar</button>
        <p className="lp-legal">Með skráningu samþykkir þú <a href="/personuvernd.html" target="_blank" rel="noopener">persónuverndarstefnuna</a>.</p>
      </div>
    </div>
  )
}
