import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

// Opnar bakmyndavél og les strikamerki. Notar innbyggðan BarcodeDetector vafrans
// þegar hann er til (Android/Chrome — áreiðanlegri og hraðari), annars zxing
// (t.d. iPhone/Safari). Kallar onDetect(code) með debounce.
export default function BarcodeScanner({ onDetect, onClose, children }) {
  const videoRef = useRef(null)
  const lastRef = useRef({ code: '', t: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    let stopped = false
    let stream = null
    let zxingReader = null
    let timer = null

    const handle = (code) => {
      if (stopped || !code) return
      const now = Date.now()
      if (lastRef.current.code === code && now - lastRef.current.t < 2500) return
      lastRef.current = { code, t: now }
      if (navigator.vibrate) { try { navigator.vibrate(60) } catch (e) {} }
      onDetect(code)
    }

    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' }],
      },
    }

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (stopped) return
        const v = videoRef.current
        v.srcObject = stream
        v.setAttribute('playsinline', 'true')
        await v.play().catch(() => {})

        const NATIVE = typeof window !== 'undefined' && 'BarcodeDetector' in window
        if (NATIVE) {
          const want = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
          let detector
          try {
            const supported = await window.BarcodeDetector.getSupportedFormats?.()
            const fmts = supported ? want.filter(f => supported.includes(f)) : want
            detector = new window.BarcodeDetector(fmts.length ? { formats: fmts } : undefined)
          } catch (e) {
            detector = new window.BarcodeDetector()
          }
          const loop = async () => {
            if (stopped) return
            try {
              const codes = await detector.detect(v)
              if (codes && codes.length) handle(codes[0].rawValue)
            } catch (e) {}
            timer = setTimeout(loop, 200)
          }
          loop()
        } else {
          const hints = new Map()
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
          ])
          hints.set(DecodeHintType.TRY_HARDER, true)
          zxingReader = new BrowserMultiFormatReader(hints)
          zxingReader.timeBetweenScansMillis = 150
          zxingReader.decodeFromStream(stream, v, (result) => { if (result) handle(result.getText()) }).catch(() => {})
        }
      } catch (e) {
        setError('Næ ekki í myndavél. Leyfðu myndavélaraðgang í vafranum og reyndu aftur.')
      }
    }
    start()

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      try { zxingReader && zxingReader.reset() } catch (e) {}
      try { stream && stream.getTracks().forEach(t => t.stop()) } catch (e) {}
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
