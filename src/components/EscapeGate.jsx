import React, { useEffect, useState } from 'react'
import { IconExternalLink, IconCopy, IconDots } from '@tabler/icons-react'
import { landingEvent, androidIntentUrl, escapeTarget } from '../lib/landing.js'

// Gestur kom úr Facebook/Instagram-vafranum. Android: flutt sjálfkrafa í Chrome.
// iPhone: Apple leyfir það ekki, svo við sýnum leiðbeiningar og „Afrita hlekk“. Alltaf hægt að halda áfram hér.
export default function EscapeGate({ platform, onStay }) {
  const [tried, setTried] = useState(platform !== 'android')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    landingEvent('escape_shown_' + platform)
    if (platform !== 'android') return
    landingEvent('escape_android_auto')
    window.location.href = androidIntentUrl()
    // Ef síðan er enn sýnileg eftir 1,8 s tókst flutningurinn ekki → sýna valkosti.
    const t = setTimeout(() => { if (document.visibilityState === 'visible') setTried(true) }, 1800)
    return () => clearTimeout(t)
  }, [platform])

  const openAgain = () => {
    landingEvent('escape_click')
    window.location.href = androidIntentUrl()
  }
  const copy = async () => {
    landingEvent('escape_copy')
    const url = escapeTarget('1').toString()
    try { await navigator.clipboard.writeText(url); setCopied(true) }
    catch { window.prompt('Afritaðu hlekkinn og opnaðu hann í Safari:', url) }
  }
  const stay = () => { landingEvent('escape_stay'); try { sessionStorage.setItem('tossa.stay', '1') } catch {} ; onStay() }

  if (!tried) return <div className="empty">Opna Tossalista í Chrome…</div>

  return (
    <div className="wg-bg">
      <div className="wg esc">
        <img className="wg-logo" src="/logo.svg" alt="" width="56" height="56" />
        <h1 className="wg-h">Opnaðu Tossalista í {platform === 'ios' ? 'Safari' : 'vafranum'}</h1>
        <p className="wg-sub">Þá geymast listarnir þínir og þú getur sett appið á heimaskjáinn. Í Facebook-glugganum týnist allt þegar þú lokar.</p>

        {platform === 'ios' ? (
          <ol className="esc-steps">
            <li>Ýttu á <span className="esc-dots"><IconDots size={18} stroke={2.4} /></span> efst í horninu</li>
            <li>Veldu <b>„Opna í ytri vafra“</b> (eða „Open in Safari“)</li>
          </ol>
        ) : (
          <button className="wg-btn primary" onClick={openAgain}>
            <span className="wg-ic"><IconExternalLink size={24} stroke={1.9} /></span>
            <span className="wg-txt"><b>Opna í Chrome</b><small>Tekur eina sekúndu</small></span>
          </button>
        )}

        <button className="wg-btn" onClick={copy}>
          <span className="wg-ic"><IconCopy size={24} stroke={1.9} /></span>
          <span className="wg-txt"><b>{copied ? 'Hlekkur afritaður' : 'Afrita hlekk'}</b><small>{copied ? `Límdu hann í ${platform === 'ios' ? 'Safari' : 'vafrann'}` : 'Og límdu hann í vafrann'}</small></span>
        </button>

        <button className="wg-skip" onClick={stay}>Halda áfram hér</button>
      </div>
    </div>
  )
}
