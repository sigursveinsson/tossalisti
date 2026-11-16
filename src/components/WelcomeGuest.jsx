import React from 'react'
import { IconCamera, IconPlayerPlay, IconShoppingCart } from '@tabler/icons-react'
import { landingEvent } from '../lib/landing.js'

// Fyrsta sýn gesta úr auglýsingu: segir það sama og auglýsingin og býður þrjá skýra valkosti.
// Birtist einu sinni (localStorage 'tossa.welcomed'). Mælt í landing_events (welcome_*).
export default function WelcomeGuest({ onScan, onDemo, onList, onSkip }) {
  const pick = (ev, fn) => () => {
    landingEvent(ev)
    try { localStorage.setItem('tossa.welcomed', '1') } catch {}
    fn && fn()
  }
  return (
    <div className="wg-bg">
      <div className="wg">
        <img className="wg-logo" src="/logo.svg" alt="" width="56" height="56" />
        <h1 className="wg-h">Heimilisbókhald sem sér um sig sjálft</h1>
        <p className="wg-sub">Hvað viltu prófa fyrst?</p>

        <button className="wg-btn primary" onClick={pick('welcome_scan', onScan)}>
          <span className="wg-ic"><IconCamera size={26} stroke={1.9} /></span>
          <span className="wg-txt"><b>Skanna kvittun</b><small>Taktu mynd — appið les vörurnar og flokkar útgjöldin</small></span>
        </button>

        <button className="wg-btn" onClick={pick('welcome_demo', onDemo)}>
          <span className="wg-ic"><IconPlayerPlay size={24} stroke={1.9} /></span>
          <span className="wg-txt"><b>Sjá dæmi</b><small>Engin kvittun við höndina? Tekur 10 sekúndur</small></span>
        </button>

        <button className="wg-btn" onClick={pick('welcome_list', onList)}>
          <span className="wg-ic"><IconShoppingCart size={24} stroke={1.9} /></span>
          <span className="wg-txt"><b>Sameiginlegur innkaupalisti</b><small>Búðu til lista og deildu honum með fjölskyldunni</small></span>
        </button>

        <button className="wg-skip" onClick={pick('welcome_skip', onSkip)}>Skoða appið fyrst</button>
        <p className="wg-legal">Ókeypis, engin skráning. Með því að nota appið samþykkir þú <a href="/personuvernd.html" target="_blank" rel="noopener">persónuverndarstefnuna</a>.</p>
      </div>
    </div>
  )
}
