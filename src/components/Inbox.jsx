import React, { useState } from 'react'
import { IconX, IconMail, IconTrendingDown } from '@tabler/icons-react'
import { supabase } from '../lib/supabaseClient.js'
import { useBackClose } from '../lib/backstack.js'

// Innhólf: skilaboð frá Tossalista inni í appinu (nýjungar til allra, Verðvakt til eins notanda).
// Kemur í stað tölvupósts fyrir kynningar: enginn sprettigluggi, aðeins umslag með punkti á Heim.
function when(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'rétt í þessu'
  if (mins < 60) return 'fyrir ' + mins + ' mín'
  const h = Math.round(mins / 60)
  if (h < 24) return 'fyrir ' + h + ' klst'
  const d = Math.round(h / 24)
  if (d === 1) return 'í gær'
  if (d < 14) return 'fyrir ' + d + ' d'
  const dt = new Date(iso)
  return dt.getDate() + '.' + (dt.getMonth() + 1) + '.'
}

export default function Inbox({ msgs = [], seen, isAdmin, onClose, onOpenList, onChanged }) {
  useBackClose(true, onClose)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const isNew = (m) => !seen || new Date(m.created_at).getTime() > new Date(seen).getTime()

  const send = async () => {
    if (!title.trim() || busy) return
    if (!window.confirm('Senda þessi skilaboð í innhólf ALLRA notenda?')) return
    setBusy(true); setErr('')
    const { error } = await supabase.from('inbox_messages').insert({ kind: 'news', title: title.trim().slice(0, 120), body: body.trim().slice(0, 600) || null })
    setBusy(false)
    if (error) { setErr('Tókst ekki að senda.'); return }
    setTitle(''); setBody(''); onChanged && onChanged()
  }
  const remove = async (m) => {
    if (!window.confirm(m.user_id ? 'Eyða þessum skilaboðum?' : 'Eyða þessum skilaboðum hjá ÖLLUM notendum?')) return
    await supabase.from('inbox_messages').delete().eq('id', m.id)
    onChanged && onChanged()
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal rc-modal inbox" onClick={e => e.stopPropagation()}>
        <h2>Innhólf <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        {msgs.length === 0 && <p className="empty">Engin skilaboð enn. Hér birtast nýjungar í Tossalista og tilkynningar frá Verðvaktinni.</p>}
        {msgs.map(m => (
          <div className={'inbox-msg' + (isNew(m) ? ' new' : '')} key={m.id}>
            {m.image_url
              ? <img className="inbox-img" src={m.image_url} alt="" loading="lazy" />
              : <span className="inbox-ic">{m.kind === 'price' ? <IconTrendingDown size={20} stroke={1.75} /> : <IconMail size={20} stroke={1.75} />}</span>}
            <div className="inbox-txt">
              <b>{m.title}</b>
              {m.body && <p>{m.body}</p>}
              <div className="inbox-act">
                <span>{when(m.created_at)}</span>
                {m.link && /^https:\/\//.test(m.link) && <a href={m.link} target="_blank" rel="noopener noreferrer">Skoða vöruna ↗</a>}
                {m.list_id && onOpenList && <button onClick={() => { onOpenList(m.list_id); onClose() }}>Opna listann</button>}
                {(m.user_id || isAdmin) && <button className="inbox-del" onClick={() => remove(m)}>Eyða</button>}
              </div>
            </div>
          </div>
        ))}
        {isAdmin && (
          <div className="inbox-compose">
            <div className="modal-label">Senda öllum (aðeins stjórnandi)</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Fyrirsögn" maxLength={120} />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Texti (valfrjálst)" rows={3} maxLength={600} />
            {err && <p className="ns-err">{err}</p>}
            <button className="primary-btn" disabled={!title.trim() || busy} onClick={send}>{busy ? 'Sendi…' : 'Senda í innhólf allra'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
