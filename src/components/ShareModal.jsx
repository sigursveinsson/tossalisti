import React, { useState } from 'react'
import { IconLink, IconShare, IconX } from '@tabler/icons-react'

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

  // Bjóða með netfangi: Tossalisti sendir viðtakandanum póst með boðshlekk (App.emailInvite → invite-email).
  // Áður gerðist ekkert sýnilegt og enginn póstur fór nema viðtakandinn væri þegar með aðgang.
  const inviteEmail = async () => {
    const em = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setStatus('Sláðu inn gilt netfang.'); return }
    setStatus(''); setBusy(true)
    const r = await onEmail(list, em)
    if (r === 'shared') return // boð sent — glugginn lokast í App
    setBusy(false)
    setStatus(r === 'guest' ? 'Stofnaðu aðgang til að senda boð í tölvupósti. Þangað til geturðu notað „Senda boðshlekk“ hér fyrir ofan.'
      : r === 'rate' ? 'Þú hefur sent mörg boð í dag. Notaðu „Senda boðshlekk“ hér fyrir ofan eða reyndu aftur á morgun.'
      : r === 'self' ? 'Þetta er þitt eigið netfang.'
      : 'Tókst ekki að senda boðið. Reyndu aftur eða notaðu „Senda boðshlekk“ hér fyrir ofan.')
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Deila „{list.name}“ <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        <button className="add-recipe-btn" style={{ marginTop: 4 }} onClick={shareNative} disabled={busy}>
          <IconShare size={18} stroke={1.9} /> Senda boðshlekk
        </button>
        <button className="ghost-btn" onClick={copyLink} disabled={busy}><IconLink size={18} stroke={1.75} /> Afrita hlekk</button>

        {link && <p style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 8 }}>{link}</p>}
        <p className="signin-note" style={{ marginTop: 8 }}>Hver sem opnar hlekkinn gengur beint í listann.</p>

        <div className="modal-label">Eða bjóða með netfangi</div>
        <div className="newrow">
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') inviteEmail() }} placeholder="netfang@daemi.is" type="email" />
          <button onClick={inviteEmail} disabled={busy}>{busy ? 'Sendi…' : 'Senda boð'}</button>
        </div>
        {status && <p className="signin-note" style={{ marginTop: 8 }}>{status}</p>}
      </div>
    </div>
  )
}
