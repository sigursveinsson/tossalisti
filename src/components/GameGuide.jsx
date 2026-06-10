import React from 'react'
import { useBackClose } from '../lib/backstack.js'

// Stutt leiðsögn fyrir foreldra sem sjá verk/skema + spilun í fyrsta sinn.
const POINTS = [
  ['🧒', 'Stofnaðu krakka', 'Búðu til prófíl fyrir barn án netfangs — nafn, litur og mynd. Ýttu á „🧒 Krakkar“. Svo úthlutarðu verkum á þau.'],
  ['⭐', 'Verk gefa stig', 'Hvert verk hefur stigagildi (sjálfvirk tillaga eftir heiti). Ýttu á „stig“-takkann á verki til að breyta. Þegar barn klárar verkið sitt fær það stigin — með konfetti og hljóði.'],
  ['🏆', 'Borð og stigatafla', 'Stig safnast upp í borð: Byrjandi → Hjálparhella → … → Goðsögn. Smelltu á krakka í stigatöflunni til að opna prófíl með framvindu, röð og merkjum.'],
  ['🔥', 'Raðir og merki', 'Að klára verk marga daga í röð byggir upp röð 🔥. Níu merki vinnast smátt og smátt (fyrsta verk, 100 stig, vikuröð, morgunhani o.fl.) — sýnileg markmið fyrir krakka.'],
  ['🎁', 'Verðlaun', 'Ýttu á „🎁 Verðlaun“ og búðu til umbun sem kostar stig (t.d. „30 mín skjátími = 50 stig“). Barnið leysir út úr „buddunni“ sinni. Aflað stig á stigatöflu haldast — bara ráðstöfunarstig lækka.'],
  ['🎯', 'Áskorun vikunnar', 'Efst er sameiginlegt fjölskyldumarkmið sem fyllist eftir því sem öll klára verk. Ýttu á töluna til að breyta markmiðinu.'],
]

export default function GameGuide({ onClose }) {
  useBackClose(true, onClose)
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal guide" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Loka">×</button>
        <div className="guide-emoji">🌟</div>
        <h2 className="guide-h">Verk og verðlaun</h2>
        <p className="guide-lead">Gerðu heimilisverkin að leik. Svona virkar það:</p>

        <div className="guide-list">
          {POINTS.map(([icon, title, text]) => (
            <div className="guide-row" key={title}>
              <span className="guide-ico">{icon}</span>
              <div>
                <div className="guide-title">{title}</div>
                <div className="guide-text">{text}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="onb-cta" onClick={onClose}>Ég er til!</button>
        <p className="guide-foot">Þú getur opnað þetta aftur með „?“ takkanum.</p>
      </div>
    </div>
  )
}
