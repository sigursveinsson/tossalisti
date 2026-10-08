import React, { useState } from 'react'
import { useBackClose } from '../lib/backstack.js'
import { IconBarcode, IconDeviceMobile, IconPencil, IconReceipt, IconShare, IconUsers } from '@tabler/icons-react'

// Stutt leiðsögn fyrir nýja notendur: velkomin → bjóða fjölskyldu → heimaskjár.
export default function Onboarding({ onClose, onInvite }) {
  const [step, setStep] = useState(0)
  useBackClose(true, onClose)

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div className="sheet-bg center">
      <div className="modal onb-modal" onClick={e => e.stopPropagation()}>
        <button className="onb-skip" onClick={onClose}>Sleppa</button>

        {step === 0 && (
          <div className="onb-step">
            <div className="onb-logo">
              <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
                <rect x="6" y="6" width="52" height="52" rx="14" fill="#15315e" />
                <polyline points="20,33 29,42 45,24" fill="none" stroke="#f5a623" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="onb-h">Velkomin í Tossalista!</h2>
            <p className="onb-p">Íslenskt app fyrir innkaup og heimilið:</p>
            <ul className="onb-list">
              <li><IconPencil size={18} stroke={1.75} /> Skrifaðu innkaupa- og verkefnalista</li>
              <li><IconBarcode size={18} stroke={1.75} /> Skannaðu vörur — birtast með mynd</li>
              <li><IconUsers size={18} stroke={1.75} /> Deildu með fjölskyldunni í rauntíma</li>
              <li><IconReceipt size={18} stroke={1.75} /> Skannaðu kvittanir og fylgstu með útgjöldum</li>
            </ul>
            <button className="onb-cta" onClick={() => setStep(1)}>Áfram</button>
          </div>
        )}

        {step === 1 && (
          <div className="onb-step">
            <div className="onb-emoji"><IconUsers size={44} stroke={1.5} /></div>
            <h2 className="onb-h">Tossalisti er bestur með fjölskyldunni</h2>
            <p className="onb-p">Bjóddu maka eða fjölskyldu á listann — þá sjáið þið hann öll, og þegar einn merkir „mjólk keypt" sjá það allir strax.</p>
            <button className="onb-cta" onClick={() => { onClose(); onInvite && onInvite() }}><IconShare size={19} stroke={1.9} /> Bjóða á listann</button>
            <button className="onb-later" onClick={() => setStep(2)}>Seinna</button>
          </div>
        )}

        {step === 2 && (
          <div className="onb-step">
            <div className="onb-emoji"><IconDeviceMobile size={44} stroke={1.5} /></div>
            <h2 className="onb-h">Settu Tossalista á heimaskjáinn</h2>
            <p className="onb-p">Þá finnurðu hann eins og venjulegt app:</p>
            {ios ? (
              <p className="onb-howto">Í Safari: ýttu á <strong>Deila</strong>-táknið neðst → <strong>„Bæta á heimaskjá"</strong>.</p>
            ) : (
              <p className="onb-howto">Í Chrome: ýttu á <strong>⋮</strong> valmyndina → <strong>„Setja upp app"</strong> / „Bæta á heimaskjá".</p>
            )}
            <button className="onb-cta" onClick={onClose}>Byrja að nota Tossalista</button>
          </div>
        )}

        <div className="onb-dots">
          {[0, 1, 2].map(i => <span key={i} className={i === step ? 'on' : ''} />)}
        </div>
      </div>
    </div>
  )
}
