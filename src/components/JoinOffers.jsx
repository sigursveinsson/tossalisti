import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { IconCheck, IconX } from '@tabler/icons-react'

// Skráning á póstlista með einum smelli úr velkomupósti: /postlisti?t=<tóki>. Engin innskráning.
export default function JoinOffers({ token }) {
  const [state, setState] = useState('busy')
  useEffect(() => {
    const ok = /^[0-9a-f-]{36}$/i.test(token || '')
    if (!ok || !supabase) { setState('bad'); return }
    supabase.rpc('join_offers', { p_token: token })
      .then(({ data, error }) => setState(!error && data ? 'done' : 'bad'))
      .catch(() => setState('bad'))
  }, [token])
  return (
    <div className="cc">
      <div className="cc-card">
        <div className="cc-brand">TOSSALISTI</div>
        {state === 'busy' && <div className="bd-muted">Augnablik…</div>}
        {state === 'done' && <>
          <div className="cc-big ok"><IconCheck size={42} stroke={2.5} /></div>
          <h2>Þú ert komin(n) á póstlistann</h2>
          <p className="cc-note">Við látum þig vita af nýjungum og tilboðum — í mesta lagi einu sinni í viku. Þú getur afskráð þig neðst í hverjum pósti eða undir Áminningum í appinu.</p>
        </>}
        {state === 'bad' && <>
          <div className="cc-big bad"><IconX size={42} stroke={2.5} /></div>
          <h2>Hlekkurinn virkaði ekki</h2>
          <p className="cc-note">Þú getur kveikt á tilboðspósti undir Áminningum í appinu, eða sent okkur línu á tossalisti@tossalisti.is.</p>
        </>}
        <a className="cc-foot" href="https://tossalisti.is">Opna Tossalista</a>
      </div>
    </div>
  )
}
