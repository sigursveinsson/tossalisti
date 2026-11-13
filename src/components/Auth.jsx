import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { IconShoppingCart, IconReceipt, IconUsers, IconChefHat, IconChecklist } from '@tabler/icons-react'

const FEATURES = [
  { Icon: IconReceipt, title: 'Skannaðu kvittunina — bókhaldið gerir sig sjálft', text: 'Appið les hverja vöru, flokkar útgjöldin og sýnir hvert peningarnir fara — eftir flokki og verslun.' },
  { Icon: IconShoppingCart, title: 'Innkaupalisti fyrir alla fjölskylduna', text: 'Allir á heimilinu sjá sama listann og hakað er við í rauntíma í búðinni.' },
  { Icon: IconChecklist, title: 'Verkefnalistar og sniðmát', text: 'Heimilisverk, útilega, flutningar — tilbúin sniðmát með einum smelli.' },
  { Icon: IconChefHat, title: 'Uppskriftir beint á listann', text: 'Öll hráefnin á listann með einum smelli, með réttu magni.' },
  { Icon: IconUsers, title: 'Kvittanir og ábyrgðir á einum stað', text: 'Finndu kvittunina á sekúndum og fáðu áminningu áður en skilafrestur rennur út.' },
]

const ICELANDIC_ERROR = (msg) => {
  const m = (msg || '').toLowerCase()
  if (m.includes('invalid login')) return 'Rangt netfang eða lykilorð.'
  if (m.includes('already registered') || m.includes('already exists')) return 'Notandi er þegar til — skráðu þig inn.'
  if (m.includes('at least 6') || m.includes('password should')) return 'Lykilorð þarf að vera a.m.k. 6 stafir.'
  if (m.includes('email') && m.includes('confirm')) return 'Reikningur stofnaður — skráðu þig nú inn.'
  return msg || 'Eitthvað fór úrskeiðis.'
}

// Nýtt lykilorð eftir „Gleymt lykilorð?“-hlekk (App.jsx sýnir þennan skjá við PASSWORD_RECOVERY).
export function ResetPassword({ onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setError('')
    if (pw.length < 6) { setError('Lykilorð þarf að vera a.m.k. 6 stafir.'); return }
    if (pw !== pw2) { setError('Lykilorðin eru ekki eins.'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) { setError(ICELANDIC_ERROR(error.message)); return }
    onDone && onDone()
  }
  return (
    <div className="landing">
      <div className="hero">
        <img className="hero-logo" src="/logo.svg" alt="Tossalisti" width="76" height="76" />
        <h1>Tossa<span style={{ color: '#f5a623' }}>listi</span></h1>
      </div>
      <div className="signin-card">
        <p className="signin-title">Veldu nýtt lykilorð</p>
        <input value={pw} onChange={e => setPw(e.target.value)} placeholder="Nýtt lykilorð" type="password" autoComplete="new-password" autoFocus />
        <input value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Endurtaktu lykilorðið" type="password" autoComplete="new-password" />
        <button onClick={save} disabled={busy}>{busy ? '…' : 'Vista og halda áfram'}</button>
        {error && <p className="signin-error">{error}</p>}
      </div>
    </div>
  )
}

export default function Auth() {
  // Nýir gestir (t.d. úr auglýsingu) sjá nýskráningu fyrst; tæki sem hefur áður skráð sig inn sér innskráningu.
  const [mode, setMode] = useState(() => { try { return localStorage.getItem('tossa.known') ? 'signin' : 'signup' } catch { return 'signup' } }) // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [offers, setOffers] = useState(false) // tilboðspóstur — aldrei sjálfgefið á

  const forgot = async () => {
    setError(''); setInfo('')
    if (!email.includes('@')) { setError('Sláðu inn netfangið þitt.'); return }
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/?reset' })
    setBusy(false)
    if (error) { setError(ICELANDIC_ERROR(error.message)); return }
    setInfo('Við sendum þér hlekk á ' + email.trim() + '. Opnaðu hann til að velja nýtt lykilorð — athugaðu ruslpóstinn ef hann skilar sér ekki.')
  }

  const submit = async () => {
    if (mode === 'forgot') return forgot()
    setError(''); setInfo('')
    if (!email || !password) { setError('Sláðu inn netfang og lykilorð.'); return }
    setBusy(true)
    const { data, error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { offers_opt_in: !!offers } } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { setError(ICELANDIC_ERROR(error.message)); return }
    try { localStorage.setItem('tossa.known', '1') } catch {}
    if (mode === 'signup' && !data.session) {
      // Tölvupóststaðfesting er enn á — láta notanda vita
      setError('Reikningur stofnaður. Skráðu þig nú inn.')
      setMode('signin')
    }
    // Ef session kemur, sér App.jsx um að hleypa þér inn (onAuthStateChange)
  }

  return (
    <div className="landing">
      <div className="hero">
        <img className="hero-logo" src="/logo.svg" alt="Tossalisti" width="76" height="76" />
        <h1>Tossa<span style={{ color: '#f5a623' }}>listi</span></h1>
        <p className="tagline">Heimilisbókhald sem sér um sig sjálft.</p>
        <p className="lead">Skannaðu kvittunina og sjáðu hvert peningarnir fara. Innkaupalisti sem öll fjölskyldan deilir. Íslenskt og alveg ókeypis.</p>
      </div>

      <div className="signin-card">
        <p className="signin-title">{mode === 'signup' ? 'Alveg ókeypis — byrjaðu strax' : mode === 'forgot' ? 'Gleymt lykilorð' : 'Skráðu þig inn'}</p>
        {mode === 'forgot' && <p className="signin-help">Sláðu inn netfangið þitt og við sendum þér hlekk til að velja nýtt lykilorð.</p>}
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => mode === 'forgot' && e.key === 'Enter' && submit()}
          placeholder="netfang@daemi.is"
          type="email"
          autoComplete="email"
        />
        {mode !== 'forgot' && <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={mode === 'signup' ? 'Veldu lykilorð (minnst 6 stafir)' : 'Lykilorð'}
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />}
        {mode === 'signup' && (
          <label className="signin-optin">
            <input type="checkbox" checked={offers} onChange={e => setOffers(e.target.checked)} />
            <span>Já, sendið mér tölvupóst þegar nýjar herferðir og tilboð byrja (í mesta lagi einu sinni í viku)</span>
          </label>
        )}
        <button onClick={submit} disabled={busy}>
          {busy ? '…' : (mode === 'signup' ? 'Byrja núna' : mode === 'forgot' ? 'Senda hlekk' : 'Skrá inn')}
        </button>
        {error && <p className="signin-error">{error}</p>}
        {info && <p className="signin-info">{info}</p>}
        {mode === 'signin' && (
          <p className="signin-note">
            <button className="link-btn" onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>Gleymt lykilorð?</button>
          </p>
        )}
        <p className="signin-note">
          {mode === 'signin' ? 'Ekki með reikning? ' : 'Ertu með reikning? '}
          <button className="link-btn" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}>
            {mode === 'signin' ? 'Nýskráning' : 'Skrá inn'}
          </button>
        </p>
      </div>

      <p className="features-head">Það sem þú færð</p>
      <div className="features">
        {FEATURES.map((f, i) => (
          <div className="feature" key={i}>
            <div className="feature-ico"><f.Icon size={22} stroke={1.75} /></div>
            <div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-text">{f.text}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="landing-foot">Ókeypis · engar kortaupplýsingar · íslenskt · virkar í síma og vafra</p>
      <p className="landing-legal">Tossalisti er rekinn af Wonder ehf., kt. 471119-1560 · <a href="/personuvernd.html" target="_blank" rel="noopener">Persónuvernd</a></p>
    </div>
  )
}
