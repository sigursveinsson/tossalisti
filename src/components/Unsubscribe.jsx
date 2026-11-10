import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { IconCheck, IconX } from '@tabler/icons-react'

// Afskráning af tilboðspósti með einu smelli: /afskra?t=<unsub_token>. Engin innskráning.
// Hefur aðeins áhrif á tilboðs- og herferðapóst — kerfispóstar (vinningar, kvittanir) halda áfram.
export default function Unsubscribe({ token }) {
  const [state, setState] = useState('busy')
  useEffect(() => {
    const ok = /^[0-9a-f-]{36}$/i.test(token || '')
    if (!ok || !supabase) { setState('bad'); return }
    supabase.rpc('unsubscribe_offers', { p_token: token })
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
          <h2>Þú ert afskráð(ur)</h2>
          <p className="cc-note">Þú færð ekki fleiri tölvupósta um tilboð og herferðir. Þú getur skráð þig aftur hvenær sem er undir Áminningum í appinu.</p>
        </>}
        {state === 'bad' && <>
          <div className="cc-big bad"><IconX size={42} stroke={2.5} /></div>
          <h2>Hlekkurinn virkaði ekki</h2>
          <p className="cc-note">Þú getur slökkt á tilboðspósti undir Áminningum í appinu, eða sent okkur línu á tossalisti@tossalisti.is.</p>
        </>}
        <a className="cc-foot" href="https://tossalisti.is">tossalisti.is</a>
      </div>
    </div>
  )
}
