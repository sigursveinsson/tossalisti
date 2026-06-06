import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const signIn = async () => {
    if (!email) return
    await supabase.auth.signInWithOtp({ email })
    setSent(true)
  }

  return (
    <div className="auth">
      <div style={{ fontSize: 40 }}>🧺</div>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Körfan</h1>
      {sent ? (
        <p style={{ color: 'var(--muted)' }}>Innskráningarhlekkur sendur á {email}. Athugaðu póstinn.</p>
      ) : (
        <>
          <p style={{ color: 'var(--muted)' }}>Skráðu þig inn til að deila listum.</p>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="netfang@daemi.is" type="email" />
          <button onClick={signIn}>Senda innskráningarhlekk</button>
        </>
      )}
    </div>
  )
}
