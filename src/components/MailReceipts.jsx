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
            <b>Fékkstu kvittunina í tölvupósti?</b>
            <span>Áframsendu hana á netfangið þitt og hún birtist hér, tilbúin í bókhaldið.</span>
            {addr
              ? <button className="mailrc-addr" onClick={copy}>{addr} {copied ? <IconCheck size={15} stroke={2} /> : <IconCopy size={15} stroke={1.75} />}</button>
              : <span className="mailrc-wait">Sæki netfang…</span>}
            {addr && <button className="mailrc-more" onClick={() => setOpen(o => !o)}>{open ? 'Fela' : 'Hvernig virkar þetta?'}</button>}
            {open && (
              <div className="mailrc-help">
                <p>Virkar með PDF-reikningum (t.d. ELKO, Húsasmiðjan, netverslanir), myndum af kvittunum og kvittunum sem eru í sjálfum póstinum.</p>
                <p>Ráð: vistaðu netfangið sem tengilið, t.d. „Tossalisti kvittanir“, svo það sé fljótlegt að áframsenda.</p>
                <p>Aðeins þú sérð það sem berst á netfangið. Fáirðu ruslpóst á það geturðu <button className="linklike" onClick={reset}>búið til nýtt netfang</button>.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
