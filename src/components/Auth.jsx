import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const FEATURES = [
  { icon: '🛒', title: 'Snjallir innkaupalistar', text: 'Vörur flokkast sjálfkrafa í búðardeildir — þú gengur búðina í réttri röð.' },
  { icon: '✅', title: 'Verkefnalistar & sniðmát', text: 'Brúðkaup, útilega, flutningar og fleira — tilbúin sniðmát með einum smelli.' },
  { icon: '👥', title: 'Deildu og úthlutaðu', text: 'Deildu lista með fjölskyldu eða vinum og gerðu fólk ábyrgt fyrir einstökum liðum.' },
  { icon: '🍳', title: 'Uppskriftir → listi', text: 'Settu öll hráefni uppskriftar á listann með einum smelli, með réttu magni.' },
  { icon: '⚡', title: 'Rauntíma samstilling', text: 'Hakaðu við í búðinni og hinir á listanum sjá það samstundis.' },
]

const ICELANDIC_ERROR = (msg) => {
  const m = (msg || '').toLowerCase()
  if (m.includes('invalid login')) return 'Rangt netfang eða lykilorð.'
  if (m.includes('already registered') || m.includes('already exists')) return 'Notandi er þegar til — skráðu þig inn.'
  if (m.includes('at least 6') || m.includes('password should')) return 'Lykilorð þarf að vera a.m.k. 6 stafir.'
  if (m.includes('email') && m.includes('confirm')) return 'Reikningur stofnaður — skráðu þig nú inn.'
  return msg || 'Eitthvað fór úrskeiðis.'
}

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
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
        <div className="hero-logo">🧺</div>
        <h1>Tossalisti</h1>
        <p className="tagline">Eitt app til að muna, versla og deila.</p>
        <p className="lead">Innkaupalistar, verkefnalistar og uppskriftir á íslensku — deilanlegt með fjölskyldu og vinum.</p>
      </div>

      <div className="signin-card">
        <p className="signin-title">{mode === 'signup' ? 'Stofna reikning' : 'Skráðu þig inn'}</p>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="netfang@daemi.is"
          type="email"
          autoComplete="email"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Lykilorð"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
        <button onClick={submit} disabled={busy}>
          {busy ? '…' : (mode === 'signup' ? 'Stofna reikning' : 'Skrá inn')}
        </button>
        {error && <p className="signin-error">{error}</p>}
        <p className="signin-note">
          {mode === 'signup' ? 'Ertu með reikning? ' : 'Ekki með reikning? '}
          <button className="link-btn" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}>
            {mode === 'signup' ? 'Skrá inn' : 'Nýskráning'}
          </button>
        </p>
      </div>

      <p className="features-head">Af hverju Tossalisti?</p>
      <div className="features">
        {FEATURES.map((f, i) => (
          <div className="feature" key={i}>
            <div className="feature-ico">{f.icon}</div>
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
