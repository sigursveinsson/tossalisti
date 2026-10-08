import React from 'react'
import { useBackClose } from '../lib/backstack.js'
import { IconArrowDown, IconCamera, IconChartBar, IconReceipt, IconTag, IconX } from '@tabler/icons-react'

// Fyrsta-skiptis kynning á bókhaldinu — animeruð: kvittun → flokkast → yfirlit.
export default function BudgetIntro({ onScan, onClose }) {
  useBackClose(true, onClose)
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal bintro" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button>

        <div className="bintro-anim">
          <div className="bintro-receipt">
            <span className="bintro-rico"><IconReceipt size={34} stroke={1.5} /></span>
            <span className="bintro-scanline" />
          </div>
          <div className="bintro-arrow"><IconArrowDown size={20} stroke={1.75} /></div>
          <div className="bintro-bars">
            <div className="bintro-bar"><i style={{ '--w': '82%', '--d': '0.5s' }} /><b>Matur</b></div>
            <div className="bintro-bar"><i style={{ '--w': '54%', '--d': '0.8s' }} /><b>Heimili</b></div>
            <div className="bintro-bar"><i style={{ '--w': '33%', '--d': '1.1s' }} /><b>Ferðalög</b></div>
          </div>
        </div>

        <h2 className="bintro-h">Bókhaldið þitt</h2>
        <p className="bintro-p">Skannaðu kvittun — hún flokkast sjálfkrafa og þú sérð strax hvert peningarnir fara.</p>

        <div className="bintro-steps">
          <div><span><IconCamera size={18} stroke={1.75} /></span> Skannaðu eða skráðu kvittun</div>
          <div><span><IconTag size={18} stroke={1.75} /></span> Hún flokkast sjálfkrafa eftir flokki</div>
          <div><span><IconChartBar size={18} stroke={1.75} /></span> Sjáðu yfirlit og hvert peningarnir fara</div>
        </div>

        <button className="onb-cta" onClick={onScan}><IconCamera size={19} stroke={1.9} /> Skanna fyrstu kvittun</button>
        <button className="bintro-skip" onClick={onClose}>Skoða fyrst</button>
      </div>
    </div>
  )
}
