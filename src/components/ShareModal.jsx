import React, { useState } from 'react'

export default function ShareModal({ list, onInviteLink, onEmail, onClose }) {
  const [email, setEmail] = useState('')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)

  const makeLink = async () => {
    setBusy(true)
    const url = await onInviteLink(list)
    setBusy(false)
    if (url) setLink(url)
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Deila „{list.name}“ <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        <button className="add-recipe-btn" style={{ marginTop: 4 }} onClick={makeLink} disabled={busy}>
          🔗 Afrita boðshlekk
        </button>
        {link && (
          <p style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 8 }}>
            {link}
          </p>
        )}
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
