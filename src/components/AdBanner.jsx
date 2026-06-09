import React, { useState, useEffect } from 'react'
import { DEMO_ADS } from '../data/ads.js'

// Rúllandi auglýsingabanner. Skiptir á milli auglýsinga með jöfnu millibili.
// (Demo — raunveruleg útgáfa myndi sækja virkar auglýsingar úr Supabase og
//  telja birtingar/smelli.)
export default function AdBanner({ ads = DEMO_ADS, interval = 4000 }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (ads.length <= 1) return
    const t = setInterval(() => setI(p => (p + 1) % ads.length), interval)
    return () => clearInterval(t)
  }, [ads.length, interval])

  if (!ads.length) return null
  const ad = ads[i]
  const next = () => setI(p => (p + 1) % ads.length)

  return (
    <div className="ad-wrap">
      <div className="ad-label">Kostað</div>
      {ad.image ? (
        // Alvöru auglýsing: heil mynd frá auglýsanda
        <button key={ad.id} className="ad-banner ad-image" onClick={next} aria-label={ad.brand}>
          <img src={ad.image} alt={ad.brand} />
        </button>
      ) : (
        // Stílað sýnishorn (þar til alvöru myndefni kemur)
        <button key={ad.id} className="ad-banner" style={{ background: ad.bg, color: ad.fg }} onClick={next}>
          <span className="ad-mark" style={{ background: ad.accent }}>{ad.brand.charAt(0)}</span>
          <span className="ad-body">
            <span className="ad-brand">{ad.brand}</span>
            <span className="ad-text">{ad.text}</span>
          </span>
          <span className="ad-cta" style={{ borderColor: ad.fg }}>{ad.cta}</span>
        </button>
      )}
      <div className="ad-dots">{ads.map((a, idx) => <span key={a.id} className={idx === i ? 'on' : ''} />)}</div>
    </div>
  )
}
