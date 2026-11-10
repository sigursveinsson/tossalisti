import React, { useEffect, useState } from 'react'
import { IconX } from '@tabler/icons-react'

// Smámynd sem stækkar þegar smellt er á hana (stjórnborð: vörumyndir og kvittanamyndir).
// Open Food Facts-myndir (…​.400.jpg) eru sóttar í fullri stærð í stækkuninni; ef hún er ekki til er smámyndin notuð.
const fullSrc = (src) => /images\.openfoodfacts\.org\/.*\.\d+\.jpg$/.test(src || '') ? src.replace(/\.\d+\.jpg$/, '.full.jpg') : src

export default function ZoomImg({ src, alt = '', className, caption }) {
  const [open, setOpen] = useState(false)
  const [big, setBig] = useState(null)
  useEffect(() => {
    if (!open) return
    setBig(fullSrc(src))
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, src])
  return (
    <>
      <img className={(className ? className + ' ' : '') + 'zoomable'} src={src} alt={alt} title="Smelltu til að stækka"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }} />
      {open && (
        <div className="zoom-bg" onClick={() => setOpen(false)} role="dialog" aria-label={caption || alt || 'Mynd'}>
          <button className="zoom-x" onClick={() => setOpen(false)} aria-label="Loka"><IconX size={22} stroke={2} /></button>
          <img className="zoom-img" src={big || src} alt={alt} onError={() => { if (big !== src) setBig(src) }} onClick={(e) => e.stopPropagation()} />
          {caption && <div className="zoom-cap">{caption}</div>}
        </div>
      )}
    </>
  )
}
