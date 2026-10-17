import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { IconShoppingCart, IconChecklist, IconUsers, IconChefHat, IconBolt } from '@tabler/icons-react'

const FEATURES = [
  { Icon: IconShoppingCart, title: 'Snjallir innkaupalistar', text: 'Vörur flokkast sjálfkrafa í búðardeildir — þú gengur búðina í réttri röð.' },
  { Icon: IconChecklist, title: 'Verkefnalistar & sniðmát', text: 'Brúðkaup, útilega, flutningar og fleira — tilbúin sniðmát með einum smelli.' },
  { Icon: IconUsers, title: 'Deildu og úthlutaðu', text: 'Deildu lista með fjölskyldu eða vinum og gerðu fólk ábyrgt fyrir einstökum liðum.' },
  { Icon: IconChefHat, title: 'Uppskriftir → listi', text: 'Settu öll hráefni uppskriftar á listann með einum smelli, með réttu magni.' },
  { Icon: IconBolt, title: 'Rauntíma samstilling', text: 'Hakaðu við í búðinni og hinir á listanum sjá það samstundis.' },
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
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

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
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { setError(ICELANDIC_ERROR(error.message)); return }
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
        <p className="tagline">Eitt app til að muna, versla og deila.</p>
        <p className="lead">Innkaupalistar, verkefnalistar og uppskriftir á íslensku — deilanlegt með fjölskyldu og vinum.</p>
      </div>

      <div className="signin-card">
        <p className="signin-title">{mode === 'signup' ? 'Stofna reikning' : mode === 'forgot' ? 'Gleymt lykilorð' : 'Skráðu þig inn'}</p>
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
          placeholder="Lykilorð"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />}
        <button onClick={submit} disabled={busy}>
          {busy ? '…' : (mode === 'signup' ? 'Stofna reikning' : mode === 'forgot' ? 'Senda hlekk' : 'Skrá inn')}
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

      <p className="features-head">Af hverju Tossalisti?</p>
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

      <p className="landing-foot">Ókeypis · íslenskt · virkar í síma og vafra</p>
    </div>
  )
}
