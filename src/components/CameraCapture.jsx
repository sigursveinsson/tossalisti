import React, { useEffect, useRef, useState } from 'react'
import { IconX, IconCamera, IconPhoto, IconBolt, IconBoltOff } from '@tabler/icons-react'

// Lifandi myndataka kvittana.
// 1) Þar sem það er stutt (Chrome á Android): ALVÖRU LJÓSMYND úr myndavélarstraumnum (ImageCapture.takePhoto)
//    með sjálfvirkum fókus og myndvinnslu símans — miklu skarpari en rammi úr myndbandi. Beðið um hóflega
//    upplausn (~2560 px) svo 12–48 MP mynd verður aldrei til í minni (það felldi Chrome á Android áður).
// 2) Annars (iPhone/Safari): rammi úr myndstraumnum í hæstu upplausn sem straumurinn býður.
// Niðurstaðan er skölluð svo LENGRI hliðin sé TARGET_LONG og skilað sem JPEG.
// Skráarheitið segir hvernig myndin varð til (kvittun-cam-photo-WxH.jpg / kvittun-cam-frame-WxH.jpg) — mælt í scan_events.

const TARGET_LONG = 2400
const PHOTO_W = 2560

function pickInRange(range, want) {
  if (!range || !range.max) return undefined
  let v = Math.min(range.max, Math.max(range.min || 0, want))
  if (range.step) v = Math.round((v - (range.min || 0)) / range.step) * range.step + (range.min || 0)
  return v
}

async function toJpegFile(source, srcW, srcH, rotate, kind) {
  // rotate: sný 90° réttsælis (ljósmynd í skynjarastefnu en síminn á hlið kvittunar)
  const outW0 = rotate ? srcH : srcW, outH0 = rotate ? srcW : srcH
  const long = Math.max(outW0, outH0)
  const scale = long > TARGET_LONG ? TARGET_LONG / long : 1
  const w = Math.round(outW0 * scale), h = Math.round(outH0 * scale)
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  if (rotate) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(source, 0, 0, h, w) }
  else ctx.drawImage(source, 0, 0, w, h)
  const blob = await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.86))
  c.width = c.height = 0
  if (!blob) throw new Error('no_blob')
  return new File([blob], `kvittun-cam-${kind}-${w}x${h}.jpg`, { type: 'image/jpeg' })
}

export default function CameraCapture({ onCapture, onPickFile, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [err, setErr] = useState('')
  const [ready, setReady] = useState(false)
  const [torch, setTorch] = useState(false)
  const [torchOk, setTorchOk] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    const start = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no_camera_api')
        // Hæsta upplausn sem straumurinn býður (iPhone notar rammann beint; Android tekur ljósmynd).
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } }, audio: false,
        })
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const v = videoRef.current
        if (v) { v.srcObject = stream; await v.play().catch(() => {}) }
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities ? track.getCapabilities() : {}
        setTorchOk(!!caps.torch)
        // Samfelldur sjálfvirkur fókus ef stutt (sumir Android-símar læsa fókus annars á óendanlegt).
        if (caps.focusMode && caps.focusMode.includes('continuous')) {
          try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }) } catch {}
        }
        setReady(true)
      } catch (e) {
        setErr(e && e.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      }
    }
    start()
    return () => { alive = false; const s = streamRef.current; if (s) s.getTracks().forEach(t => t.stop()) }
  }, [])

  const toggleTorch = async () => {
    const track = streamRef.current && streamRef.current.getVideoTracks()[0]
    if (!track) return
    try { await track.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(t => !t) } catch {}
  }

  // Alvöru ljósmynd (Chrome Android). Skilar null ef ekki stutt eða ef eitthvað bregst — þá er rammi notaður.
  const takeRealPhoto = async (track, v) => {
    if (typeof window === 'undefined' || !('ImageCapture' in window) || torch) return null
    try {
      const ic = new window.ImageCapture(track)
      const pc = await ic.getPhotoCapabilities().catch(() => null)
      const settings = {}
      const iw = pc && pickInRange(pc.imageWidth, PHOTO_W)
      if (iw) settings.imageWidth = iw
      const photo = await Promise.race([
        ic.takePhoto(settings),
        new Promise((_, rej) => setTimeout(() => rej(new Error('photo_timeout')), 6000)),
      ])
      if (!photo || !photo.size) return null
      const bmp = await createImageBitmap(photo, { imageOrientation: 'from-image' })
      // Ljósmyndin kemur stundum í skynjarastefnu (landslag) þótt síminn sé uppréttur: snúa ef stefna er önnur en í forsýn.
      const portraitView = v.videoHeight > v.videoWidth
      const portraitPhoto = bmp.height > bmp.width
      const file = await toJpegFile(bmp, bmp.width, bmp.height, portraitView !== portraitPhoto, 'photo')
      if (bmp.close) bmp.close()
      return file
    } catch (e) {
      return null
    }
  }

  const snap = async () => {
    const v = videoRef.current
    if (!v || !v.videoWidth || busy) return
    setBusy(true)
    try {
      const track = streamRef.current && streamRef.current.getVideoTracks()[0]
      let file = track ? await takeRealPhoto(track, v) : null
      if (!file) file = await toJpegFile(v, v.videoWidth, v.videoHeight, false, 'frame')
      onCapture(file)
    } catch (e) {
      setErr('unavailable')
    } finally { setBusy(false) }
  }

  return (
    <div className="cam-wrap" onClick={e => e.stopPropagation()}>
      <div className="cam-top">
        <span>Komdu nær: kvittunin á að fylla rammann</span>
        <button className="cam-x" onClick={onClose} aria-label="Loka"><IconX size={22} stroke={1.9} /></button>
      </div>
      {!err && (
        <div className="cam-view">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="cam-guide" />
          {!ready && <div className="cam-wait">Opna myndavél…</div>}
          {ready && !busy && <div className="cam-hint">Flöt kvittun · góð birta · enginn skuggi</div>}
          {busy && <div className="cam-wait">Tek mynd… haltu kyrru</div>}
        </div>
      )}
      {err && (
        <div className="cam-err">
          <p>{err === 'denied' ? 'Appið fékk ekki aðgang að myndavélinni. Þú getur leyft hann í stillingum vafrans, eða notað myndavélarforritið.' : 'Myndavélin er ekki tiltæk hér. Notaðu myndavélarforritið í staðinn.'}</p>
        </div>
      )}
      <div className="cam-bar">
        <button className="cam-side" onClick={onPickFile} title="Nota myndavélarforrit eða myndasafn"><IconPhoto size={22} stroke={1.8} /><small>Myndasafn</small></button>
        <button className="cam-shutter" onClick={snap} disabled={!ready || busy} aria-label="Taka mynd"><IconCamera size={28} stroke={1.9} /></button>
        {torchOk
          ? <button className={'cam-side' + (torch ? ' on' : '')} onClick={toggleTorch} title="Ljós">{torch ? <IconBolt size={22} stroke={1.8} /> : <IconBoltOff size={22} stroke={1.8} />}<small>Ljós</small></button>
          : <span className="cam-side" />}
      </div>
    </div>
  )
}
