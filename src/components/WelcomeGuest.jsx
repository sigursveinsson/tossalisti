import React from 'react'
import { IconCamera, IconMicrophone, IconListCheck } from '@tabler/icons-react'
import { landingEvent } from '../lib/landing.js'

// Lendingarskjár gesta: beint í að prófa eitt af þrennu — skanna kvittun (eða lánskvittun), tala inn lista, búa til lista.
// Birtist einu sinni (localStorage 'tossa.welcomed'). Mælt í landing_events (welcome_*).
export default function WelcomeGuest({ onScan, onDemo, onList, onVoice, onSkip }) {
  const pick = (ev, fn) => (e) => {
    if (e) e.stopPropagation()
    landingEvent(ev)
    try { localStorage.setItem('tossa.welcomed', '1') } catch {}
    fn && fn()
  }
  return (
    <div className="wg-bg">
      <div className="wg">
        <img className="wg-logo" src="/logo.svg" alt="" width="56" height="56" />
        <h1 className="wg-h">Prófaðu strax — engin skráning</h1>
        <p className="wg-sub">Veldu eitt:</p>

        <div className="wg-btn primary wg-scan" role="button" tabIndex={0} onClick={pick('welcome_scan', onScan)}>
          <span className="wg-ic"><IconCamera size={26} stroke={1.9} /></span>
          <span className="wg-txt"><b>Skanna kvittun</b><small>Appið les vörurnar og flokkar útgjöldin</small>
            <button className="wg-demo" onClick={pick('welcome_demo', onDemo)}>Engin kvittun við höndina? Fáðu lánaða →</button>
          </span>
        </div>

        <button className="wg-btn" onClick={pick('welcome_voice', onVoice)}>
          <span className="wg-ic"><IconMicrophone size={24} stroke={1.9} /></span>
          <span className="wg-txt"><b>Segðu hvað vantar</b><small>„Mjólk, egg og brauð“ — listinn verður til sjálfur</small></span>
        </button>

        <button className="wg-btn" onClick={pick('welcome_list', onList)}>
          <span className="wg-ic"><IconListCheck size={24} stroke={1.9} /></span>
          <span className="wg-txt"><b>Búa til innkaupalista</b><small>Skrifaðu vörurnar — deildu með fjölskyldunni</small></span>
        </button>

        <button className="wg-skip" onClick={pick('welcome_skip', onSkip)}>Skoða appið fyrst</button>
        <p className="wg-legal">Ókeypis. Með því að nota appið samþykkir þú <a href="/personuvernd.html" target="_blank" rel="noopener">persónuverndarstefnuna</a>.</p>
      </div>
    </div>
  )
}
