import React, { useEffect, useRef, useState } from 'react'
import { IconX, IconCamera, IconPhoto, IconBolt, IconBoltOff } from '@tabler/icons-react'

// Lifandi myndataka kvittana. Tekur rammann beint úr myndstraumnum í stýrðri stærð (hámark MAX_W á lengri hlið)
// svo 12–48 MP mynd úr myndavélarforritinu verður ALDREI til í minni símans — það var það sem felldi Chrome á Android.
// Skilar JPEG-Blob um 150–400 KB. Myndavélarforritið (file-input) er áfram varaleið, t.d. ef aðgangur að myndavél er bannaður.

const MAX_W = 1600

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
        // Biðjum um hóflega upplausn: nóg til að lesa kvittun, lítið í minni.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
        })
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const v = videoRef.current
        if (v) { v.srcObject = stream; await v.play().catch(() => {}) }
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities ? track.getCapabilities() : {}
        setTorchOk(!!caps.torch)
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

  const snap = async () => {
    const v = videoRef.current
    if (!v || !v.videoWidth || busy) return
    setBusy(true)
    try {
      // Kvittanir eru háar og mjóar: skalað svo LENGRI hliðin sé MAX_W.
      const long = Math.max(v.videoWidth, v.videoHeight)
      const scale = long > MAX_W ? MAX_W / long : 1
      const w = Math.round(v.videoWidth * scale), h = Math.round(v.videoHeight * scale)
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(v, 0, 0, w, h)
      const blob = await new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.82))
      if (!blob) throw new Error('no_blob')
      const file = new File([blob], 'kvittun.jpg', { type: 'image/jpeg' })
      onCapture(file)
    } catch (e) {
      setErr('unavailable')
    } finally { setBusy(false) }
  }

  return (
    <div className="cam-wrap" onClick={e => e.stopPropagation()}>
      <div className="cam-top">
        <span>Taktu mynd af allri kvittuninni</span>
        <button className="cam-x" onClick={onClose} aria-label="Loka"><IconX size={22} stroke={1.9} /></button>
      </div>
      {!err && (
        <div className="cam-view">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="cam-guide" />
          {!ready && <div className="cam-wait">Opna myndavél…</div>}
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
