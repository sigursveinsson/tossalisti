import React, { useState } from 'react'

// Fyrsta-skiptis persónuvernd / samþykki. Heiðarlegt orðalag: nafnleysi bundið við
// samanteknu gögnin, ekki hráu kvittunina (sem er persónuupplýsing meðan hún er á reikningi).
export default function ConsentNotice({ onAccept }) {
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const accept = async () => { setBusy(true); try { await onAccept() } finally { setBusy(false) } }

  return (
    <div className="consent-bg">
      <div className="consent-card">
        <div className="consent-ico">🔒</div>
        <h2 className="consent-h">Um gögnin þín</h2>
        <p className="consent-p">
          Tossalisti vistar kvittanirnar þínar til að gefa þér yfirlit yfir útgjöld.
          Í framtíðinni viljum við nota gögn — í samanteknu og nafnlausu formi — til að
          hjálpa þér að finna besta verðið á því sem þú kaupir.
          Við seljum aldrei persónuupplýsingarnar þínar. Þú getur slökkt á þessu hvenær sem er.
        </p>

        <button className="consent-more" onClick={() => setMore(m => !m)}>
          {more ? 'Fela nánari upplýsingar' : 'Nánari upplýsingar'} {more ? '▴' : '▾'}
        </button>

        {more && (
          <div className="consent-detail">
            <p><b>Hvað við geymum:</b> listana þína, heimilisverk og kvittanir/útgjöld sem þú skráir eða skannar. Þessi gögn eru bundin við reikninginn þinn og sýnileg þér (og þeim sem þú deilir lista með).</p>
            <p><b>Hvernig við notum þau í dag:</b> eingöngu til að keyra appið fyrir þig — listar, verk, stig og útgjaldayfirlit.</p>
            <p><b>Framtíðar-notkun:</b> við viljum nota <i>samanteknar og nafnlausar</i> upplýsingar (t.d. „mjólk kostar að meðaltali X í þessari verslun") til að benda þér á betra verð. Þá fær sú notkun sína eigin tilkynningu og þú getur valið hana frá.</p>
            <p><b>Þú ræður:</b> þú getur slökkt á þessu, hlaðið niður gögnunum þínum eða eytt reikningnum hvenær sem er. Við seljum aldrei persónuupplýsingar.</p>
          </div>
        )}

        <button className="consent-ok" onClick={accept} disabled={busy}>{busy ? 'Augnablik…' : 'Ég skil — halda áfram'}</button>
      </div>
    </div>
  )
}
