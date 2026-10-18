import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, HTMLCanvasElementLuminanceSource, HybridBinarizer, BinaryBitmap } from '@zxing/library'
import { IconCamera, IconX } from '@tabler/icons-react'

const FORMATS_NATIVE = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
const FORMATS_ZXING = [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
]

function zxingReaderWithHints() {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS_ZXING)
  hints.set(DecodeHintType.TRY_HARDER, true)
  return new BrowserMultiFormatReader(hints)
}

// Les strikamerki úr kyrri mynd (úr myndavélaforriti símans — fullur fókus/makró).
async function decodeStill(file) {
  const url = URL.createObjectURL(file)
  try {
    if ('BarcodeDetector' in window) {
      try {
        const bmp = await createImageBitmap(file)
        const det = new window.BarcodeDetector({ formats: FORMATS_NATIVE })
        const codes = await det.detect(bmp)
        if (bmp.close) bmp.close()
        if (codes && codes.length) return codes[0].rawValue
      } catch (e) {}
    }
    const res = await zxingReaderWithHints().decodeFromImageUrl(url)
    return res ? res.getText() : null
  } catch (e) {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Beinn skanni (BarcodeDetector ef til staðar, annars zxing) + „taka mynd" varaleið.
export default function BarcodeScanner({ onDetect, onClose, children }) {
  const videoRef = useRef(null)
  const fileRef = useRef(null)
  const lastRef = useRef({ code: '', t: 0 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handle = (code) => {
    if (!code) return
    const now = Date.now()
    if (lastRef.current.code === code && now - lastRef.current.t < 2500) return
    lastRef.current = { code, t: now }
    if (navigator.vibrate) { try { navigator.vibrate(60) } catch (e) {} }
    onDetect(code)
  }
  const handleRef = useRef(handle)
  handleRef.current = handle

  useEffect(() => {
    let stopped = false
    let stream = null
    let zxingReader = null
    let timer = null

    // Hærri upplausn skiptir öllu fyrir zxing á iPhone (Safari hefur ekki BarcodeDetector): strikamerkið er
    // lítill hluti rammans og 720p dugar ekki. 1080p + miðjuklipping hér fyrir neðan = „aðdráttur“ á merkið.
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
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

        if ('BarcodeDetector' in window) {
          let detector
          try {
            const supported = await window.BarcodeDetector.getSupportedFormats?.()
            const fmts = supported ? FORMATS_NATIVE.filter(f => supported.includes(f)) : FORMATS_NATIVE
            detector = new window.BarcodeDetector(fmts.length ? { formats: fmts } : undefined)
          } catch (e) {
            detector = new window.BarcodeDetector()
          }
          const loop = async () => {
            if (stopped) return
            try {
              const codes = await detector.detect(v)
              if (codes && codes.length) handleRef.current(codes[0].rawValue)
            } catch (e) {}
            timer = setTimeout(loop, 200)
          }
          loop()
        } else {
          // Aðdráttur ef myndavélin styður (iOS 17+ gerir það): merkið fyllir meira af rammanum.
          try {
            const track = stream.getVideoTracks()[0]
            const caps = track.getCapabilities ? track.getCapabilities() : {}
            if (caps.zoom && caps.zoom.max >= 1.5) await track.applyConstraints({ advanced: [{ zoom: Math.min(2, caps.zoom.max) }] })
          } catch (e) {}
          // zxing á miðjuklipptum ramma: 80% breidd × 40% hæð um miðjuna (sama svæði og leiðbeiningarramminn),
          // skalað svo klippan sé ~1000 px breið. Mun betri lestur en decodeFromStream á öllum rammanum.
          zxingReader = zxingReaderWithHints()
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          const loop = async () => {
            if (stopped) return
            try {
              if (v.videoWidth) {
                const cw = v.videoWidth * 0.8, ch = v.videoHeight * 0.4
                const cx = (v.videoWidth - cw) / 2, cy = (v.videoHeight - ch) / 2
                const scale = cw > 1000 ? 1000 / cw : 1
                canvas.width = Math.round(cw * scale); canvas.height = Math.round(ch * scale)
                ctx.drawImage(v, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height)
                try {
                  const bitmap = new BinaryBitmap(new HybridBinarizer(new HTMLCanvasElementLuminanceSource(canvas)))
                  const res = zxingReader.decodeBitmap(bitmap)
                  if (res) handleRef.current(res.getText())
                } catch (e) { /* NotFound í þessum ramma — eðlilegt */ }
              }
            } catch (e) {}
            timer = setTimeout(loop, 120)
          }
          loop()
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

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setBusy(true)
    const code = await decodeStill(file)
    setBusy(false)
    if (code) handle(code)
    else setError('Ekkert strikamerki fannst á myndinni — reyndu aftur, vel lýst og í fókus.')
  }

  return (
    <div className="scan-bg">
      <video ref={videoRef} className="scan-video" muted playsInline autoPlay />
      <div className="scan-frame"><div className="scan-line" /></div>
      <button className="scan-close" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button>
      <div className="scan-hint">Beindu myndavélinni að strikamerki</div>
      {error && <div className="scan-error">{error}</div>}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
      <div className="scan-panel">
        {children}
        <button className="scan-photo" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
          {busy ? 'Les mynd…' : <><IconCamera size={17} stroke={1.9} /> Les ekki? Taktu mynd af strikamerkinu</>}
        </button>
      </div>
    </div>
  )
}
