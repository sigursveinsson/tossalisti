import React from 'react'
import { useBackClose } from '../lib/backstack.js'

// Fyrsta-skiptis kynning á bókhaldinu — animeruð: kvittun → flokkast → yfirlit.
export default function BudgetIntro({ onScan, onClose }) {
  useBackClose(true, onClose)
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal bintro" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Loka">×</button>

        <div className="bintro-anim">
          <div className="bintro-receipt">
            <span className="bintro-rico">🧾</span>
            <span className="bintro-scanline" />
          </div>
          <div className="bintro-arrow">↓</div>
          <div className="bintro-bars">
            <div className="bintro-bar"><i style={{ '--w': '82%', '--d': '0.5s', background: '#e8954a' }} /><b>Matur</b></div>
            <div className="bintro-bar"><i style={{ '--w': '54%', '--d': '0.8s', background: '#4a6fd0' }} /><b>Heimili</b></div>
            <div className="bintro-bar"><i style={{ '--w': '33%', '--d': '1.1s', background: '#4aa6c8' }} /><b>Ferðalög</b></div>
          </div>
        </div>

        <h2 className="bintro-h">Bókhaldið þitt</h2>
        <p className="bintro-p">Skannaðu kvittun — hún flokkast sjálfkrafa og þú sérð strax hvert peningarnir fara.</p>

        <div className="bintro-steps">
          <div><span>📷</span> Skannaðu eða skráðu kvittun</div>
          <div><span>🏷️</span> Hún flokkast sjálfkrafa eftir flokki</div>
          <div><span>📊</span> Sjáðu yfirlit og hvert peningarnir fara</div>
        </div>

        <button className="onb-cta" onClick={onScan}>📷 Skanna fyrstu kvittun</button>
        <button className="bintro-skip" onClick={onClose}>Skoða fyrst</button>
      </div>
    </div>
  )
}
