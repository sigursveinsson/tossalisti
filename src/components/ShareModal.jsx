import React, { useState } from 'react'

export default function ShareModal({ list, inviterName, onInviteLink, onEmail, onClose }) {
  const [email, setEmail] = useState('')
  const [link, setLink] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const who = (() => {
    const base = (inviterName || '').split('@')[0]
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Vinur þinn'
  })()
  const message = `${who} bauð þér á listann „${list.name}“ á Tossalista. Smelltu á hlekkinn til að ganga í hann:`

  const ensureLink = async () => {
    if (link) return link
    setBusy(true)
    const url = await onInviteLink(list)
    setBusy(false)
    if (url) setLink(url)
    return url
  }

  const shareNative = async () => {
    const url = await ensureLink()
    if (!url) return
    if (navigator.share) {
      try { await navigator.share({ title: 'Tossalisti', text: message, url }) } catch (e) { /* notandi hætti við */ }
    } else {
      try { await navigator.clipboard.writeText(message + ' ' + url); setStatus('Skilaboð afrituð — límdu þau í SMS eða spjall.') } catch (e) { setStatus('') }
    }
  }

  const copyLink = async () => {
    const url = await ensureLink()
    if (url) { try { await navigator.clipboard.writeText(message + ' ' + url); setStatus('Skilaboð afrituð.') } catch (e) {} }
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Deila „{list.name}“ <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        <button className="add-recipe-btn" style={{ marginTop: 4 }} onClick={shareNative} disabled={busy}>
          📲 Senda boðshlekk
        </button>
        <button className="ghost-btn" onClick={copyLink} disabled={busy}>🔗 Afrita hlekk</button>

        {link && <p style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 8 }}>{link}</p>}
        {status && <p className="signin-note" style={{ marginTop: 6 }}>{status}</p>}
        <p className="signin-note" style={{ marginTop: 8 }}>Hver sem opnar hlekkinn gengur beint í listann.</p>

        <div className="modal-label">Eða bjóða með netfangi</div>
        <div className="newrow">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="netfang@daemi.is" type="email" />
          <button onClick={() => { onEmail(list, email); setEmail('') }}>Bjóða</button>
        </div>
      </div>
    </div>
  )
}
