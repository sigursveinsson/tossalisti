import React, { useEffect, useState } from 'react'
import { IconMailForward, IconCopy, IconCheck, IconFileTypePdf, IconMail, IconPhoto } from '@tabler/icons-react'
import { store } from '../lib/store.js'
import { landingEvent } from '../lib/landing.js'

// Áframsendar kvittanir: netfang notandans + kvittanir sem bíða þess að vera lesnar inn.
// Notandinn áframsendir t.d. PDF-reikning frá ELKO á <tóki>@kvittun.tossalisti.is; hér opnar hann hana
// og staðfestir eins og skannaða kvittun. Ekkert birtist fyrr en lénið er skráð í app_settings ('inbound_domain').
let _domain = null
const getDomain = () => (_domain ? Promise.resolve(_domain) : store.inboundDomain().then(d => (_domain = d || '')).catch(() => ''))

const when = (iso) => { try { const d = new Date(iso); return d.getDate() + '.' + (d.getMonth() + 1) + '.' } catch { return '' } }
const clean = (s) => String(s || '').replace(/^\s*((fwd?|fw|áfram|tr|wg)\s*:\s*)+/i, '').trim()

export default function MailReceipts({ onRead, isGuest = false, compact = false }) {
  const [token, setToken] = useState(null)
  const [pending, setPending] = useState([])
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const [editing, setEditing] = useState(false)
  const [alias, setAlias] = useState('')
  const [show, setShow] = useState(false) // sýna afgreiðslufólki

  const [domain, setDomain] = useState(_domain || '')
  const load = () => store.listMailReceipts().then(setPending).catch(() => {})
  useEffect(() => {
    let alive = true
    getDomain().then(d => {
      if (!alive || !d) return
      setDomain(d)
      if (isGuest) return
      load()
      store.myReceiptMail().then(t => { if (alive) setToken(t) }).catch(() => {})
    })
    return () => { alive = false }
  }, [isGuest])

  if (!domain) return null
  const addr = token ? token + '@' + domain : ''

  const copy = async () => {
    if (!addr) return
    try { await navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 1800); landingEvent('mail_addr_copy', { once: false }) } catch { window.prompt('Afritaðu netfangið:', addr) }
  }
  const read = async (m) => {
    setBusy(m.id)
    try { const f = await store.getMailReceiptFile(m); onRead && onRead(f, m) }
    catch { alert('Tókst ekki að sækja kvittunina. Reyndu aftur.') }
    finally { setBusy(null) }
  }
  const drop = async (m) => {
    if (!window.confirm('Henda þessari kvittun? Hún fer ekki í bókhaldið.')) return
    await store.finishMailReceipt(m, 'dismissed')
    load()
  }
  const reset = async () => {
    if (!window.confirm('Búa til nýtt netfang? Það gamla hættir að virka, t.d. ef þú færð ruslpóst á það.')) return
    try { setToken(await store.myReceiptMail(true)) } catch {}
  }
  // Gælunafn: fyrri hlutinn af netfanginu (t.d. „sigga“ í sigga-k7p@…). Nýtt gælunafn = nýtt netfang.
  const saveAlias = async () => {
    const a = alias.trim()
    if (a.length < 2) return
    if (token && !window.confirm('Nýtt netfang verður til. Það gamla hættir að virka. Halda áfram?')) return
    try { setToken(await store.myReceiptMail(true, a)); setEditing(false); landingEvent('mail_alias_set', { once: false }) } catch { alert('Tókst ekki. Reyndu aftur.') }
  }

  // Stórt á skjá til að sýna afgreiðslufólki (eða lesa upp)
  if (show && addr) {
    const [name, rest] = [addr.split('@')[0], '@' + addr.split('@')[1]]
    return (
      <div className="mailrc-show" onClick={() => setShow(false)}>
        <small>Kvittun í tölvupósti á:</small>
        <b>{name}</b>
        <span>{rest}</span>
        <em>Ýttu hvar sem er til að loka</em>
      </div>
    )
  }

  return (
    <div className="mailrc">
      {pending.length > 0 && (<>
        <div className="modal-label">Bíða úr tölvupósti</div>
        {pending.map(m => (
          <div className="rc-row mailrc-row" key={m.id}>
            <span className="rc-ico">{(m.mime || '').includes('pdf') ? <IconFileTypePdf size={19} stroke={1.75} /> : (m.mime || '').startsWith('image/') ? <IconPhoto size={19} stroke={1.75} /> : <IconMail size={19} stroke={1.75} />}</span>
            <span className="rc-main"><b>{clean(m.subject) || m.filename || 'Kvittun'}</b><small>{when(m.created_at)}{m.filename && clean(m.subject) ? ' · ' + m.filename : ''}</small></span>
            <button className="mailrc-read" onClick={() => read(m)} disabled={busy === m.id}>{busy === m.id ? 'Sæki…' : 'Lesa inn'}</button>
            <button className="mailrc-drop" onClick={() => drop(m)} aria-label="Henda">✕</button>
          </div>
        ))}
      </>)}

      {isGuest ? (
        !compact && <div className="mailrc-box"><IconMailForward size={20} stroke={1.75} /><span>Skráðu þig inn til að fá þitt eigið netfang og geta áframsent rafrænar kvittanir í Tossalista.</span></div>
      ) : (
        <div className="mailrc-box">
          <IconMailForward size={20} stroke={1.75} />
          <div className="mailrc-txt">
            <b>Kvittanir í tölvupósti beint í Tossalista</b>
            <span>Gefðu þetta netfang upp í búðinni þegar þú færð kvittun í pósti, eða áframsendu kvittanir sem þú hefur fengið.</span>
            {addr
              ? <button className="mailrc-addr" onClick={copy}>{addr} {copied ? <IconCheck size={15} stroke={2} /> : <IconCopy size={15} stroke={1.75} />}</button>
              : <span className="mailrc-wait">Sæki netfang…</span>}
            {addr && !editing && (
              <span className="mailrc-actions">
                <button className="mailrc-more" onClick={() => { setShow(true); landingEvent('mail_addr_show', { once: false }) }}>Sýna í búðinni</button>
                <button className="mailrc-more" onClick={() => { setAlias(token.split('-')[0] || ''); setEditing(true) }}>Breyta nafni</button>
                <button className="mailrc-more" onClick={() => setOpen(o => !o)}>{open ? 'Fela' : 'Hvernig virkar þetta?'}</button>
              </span>
            )}
            {editing && (
              <span className="mailrc-alias">
                <input value={alias} onChange={e => setAlias(e.target.value.toLowerCase().replace(/[^a-záðéíóúýþæö0-9]/g, '').slice(0, 14))} placeholder="t.d. sigga" maxLength={14} autoFocus />
                <button className="mailrc-read" onClick={saveAlias} disabled={alias.trim().length < 2}>Vista</button>
                <button className="mailrc-drop" onClick={() => setEditing(false)} aria-label="Hætta við">✕</button>
              </span>
            )}
            {open && (
              <div className="mailrc-help">
                <p><b>Í búðinni:</b> þegar þú ert spurð(ur) hvort þú viljir kvittunina í tölvupósti (t.d. í ELKO), gefðu upp þetta netfang. Kvittunin kemur beint hingað.</p>
                <p><b>Heima:</b> áframsendu PDF-reikninga og kvittanir úr netverslunum á netfangið. Vistaðu það sem tengilið, t.d. „Tossalisti kvittanir“.</p>
                <p>Stafirnir þrír aftast gera netfangið þitt einstakt. Aðeins þú sérð það sem berst. Fáirðu ruslpóst á það geturðu <button className="linklike" onClick={reset}>búið til nýtt netfang</button>.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
