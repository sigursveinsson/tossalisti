import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

// Opnar bakmyndavél og les strikamerki samfellt. Kallar onDetect(code) þegar
// merki finnst, með debounce svo sama merki spammar ekki. children birtist sem
// yfirlag (t.d. straumur af bættum vörum).
export default function BarcodeScanner({ onDetect, onClose, children }) {
  const videoRef = useRef(null)
  const lastRef = useRef({ code: '', t: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    const reader = new BrowserMultiFormatReader(hints)
    reader.timeBetweenScansMillis = 150
    let stopped = false

    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' }],
      },
    }

    reader
      .decodeFromConstraints(
        constraints,
        videoRef.current,
        (result) => {
          if (stopped || !result) return
          const code = result.getText()
          const now = Date.now()
          if (lastRef.current.code === code && now - lastRef.current.t < 2500) return
          lastRef.current = { code, t: now }
          if (navigator.vibrate) { try { navigator.vibrate(60) } catch (e) {} }
          onDetect(code)
        }
      )
      .catch(() => setError('Næ ekki í myndavél. Leyfðu myndavélaraðgang í vafranum og reyndu aftur.'))

    return () => {
      stopped = true
      try { reader.reset() } catch (e) {}
    }
  }, [])

  return (
    <div className="scan-bg">
      <video ref={videoRef} className="scan-video" muted playsInline autoPlay />
      <div className="scan-frame"><div className="scan-line" /></div>
      <button className="scan-close" onClick={onClose} aria-label="Loka">×</button>
      <div className="scan-hint">Beindu myndavélinni að strikamerki</div>
      {error && <div className="scan-error">{error}</div>}
      <div className="scan-panel">{children}</div>
    </div>
  )
}
