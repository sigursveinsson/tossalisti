import React, { useEffect, useState } from 'react'
import { IconGift } from '@tabler/icons-react'
import { supabase, isCloud } from '../lib/supabaseClient.js'
import { landingEvent } from '../lib/landing.js'

// tossalisti.is/osk/<tákn>: óskalisti sem eigandinn deildi. Gestir skoða og taka frá án skráningar
// (sjálfvirkur gestaaðgangur svo frátektin sé bundin við tækið). Eigandinn sér aldrei hvað er frátekið:
// gögnin koma úr wish_view() sem felur frátektir fyrir honum á netþjóninum.
const price = (n, cur) => Math.round(n).toLocaleString('is-IS') + (!cur || cur === 'ISK' ? ' kr.' : ' ' + cur)
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return 'verslun' } }

export default function WishView({ token }) {
  const [data, setData] = useState(null) // null = sæki, { ok:false } = fannst ekki
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data: d, error } = await supabase.rpc('wish_view', { p_token: token })
    setData(error || !d ? { ok: false } : d)
  }
  useEffect(() => {
    if (!isCloud) { setData({ ok: false }); return }
    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession()
        if (!s || !s.session) {
          const { error } = await supabase.auth.signInAnonymously({ options: { data: { guest: true, auto: true, wish: true } } })
          if (error) { setData({ ok: false, auth: true }); return }
        }
        landingEvent('wish_view')
        await load()
      } catch (e) { setData({ ok: false }) }
    })()
  }, [])
  useEffect(() => { if (data && data.ok) document.title = (data.by ? 'Óskalisti: ' + data.by : data.name) + ' · Tossalisti' }, [data])

  const claim = async (it, on) => {
    if (busy) return
    setBusy(it.id); setMsg('')
    const { data: r, error } = await supabase.rpc('wish_claim', { p_token: token, p_item: it.id, p_on: on })
    if (error || !r || !r.ok) {
      setMsg(r && r.reason === 'taken' ? 'Einhver var á undan þér: þessi gjöf er þegar frátekin.'
        : r && r.reason === 'gone' ? 'Þessi ósk er ekki lengur á listanum.'
        : 'Tókst ekki. Reyndu aftur.')
    } else landingEvent(on ? 'wish_claim' : 'wish_unclaim', { once: false })
    await load()
    setBusy('')
  }

  if (!data) return <div className="wv"><p className="empty">Sæki óskalistann…</p></div>
  if (!data.ok) return (
    <div className="wv">
      <div className="wv-head"><h1>Óskalistinn fannst ekki</h1><p>{data.auth ? 'Ekki tókst að opna listann í þessum vafra. Prófaðu að opna hlekkinn í Safari eða Chrome.' : 'Hlekkurinn er rangur eða listanum hefur verið eytt.'}</p></div>
      <div className="wv-foot"><a href="/">Opna Tossalista</a></div>
    </div>
  )
  const items = data.items || []
  const title = /^óskalistinn minn$/i.test(data.name || '') && data.by ? 'Óskalisti: ' + data.by : (data.name || 'Óskalisti')
  return (
    <div className="wv">
      <div className="wv-head">
        <h1>{title}</h1>
        {data.owner
          ? <p>Þetta er þinn eigin listi. Svona sjá aðrir hann, nema að þú sérð ekki hvað hefur verið tekið frá.</p>
          : <p>Taktu frá það sem þú ætlar að gefa, þá kaupir enginn annar það sama.{data.by ? ' ' + data.by + ' sér ekki hvað er frátekið.' : ' Eigandi listans sér ekki hvað er frátekið.'}</p>}
      </div>
      {msg && <div className="wv-note" role="status">{msg}</div>}
      {items.length === 0 && <p className="empty">Engar óskir á listanum enn.</p>}
      <div className="wv-grid">
        {items.map(it => (
          <div className={'wv-card' + (it.claimed && !it.mine ? ' taken' : '')} key={it.id}>
            <div className="wv-img">{it.image ? <img src={it.image} alt="" loading="lazy" /> : <IconGift size={40} stroke={1.4} />}</div>
            <div className="wv-body">
              <b>{it.name}</b>
              {it.price != null && <span className="wv-price">{price(it.price, it.cur)}</span>}
              {it.url && <a href={it.url} target="_blank" rel="noopener noreferrer">Skoða hjá {host(it.url)} ↗</a>}
              {!data.owner && (it.mine
                ? <button className="mine" disabled={busy === it.id} onClick={() => claim(it, false)}>Þú tókst þetta frá · Hætta við</button>
                : it.claimed
                  ? <button disabled>Frátekið</button>
                  : <button disabled={busy === it.id} onClick={() => claim(it, true)}>{busy === it.id ? 'Augnablik…' : 'Taka frá'}</button>)}
            </div>
          </div>
        ))}
      </div>
      <div className="wv-foot">
        <b>Búðu til þinn eigin óskalista</b>
        <p>Límdu slóð á vöru og Tossalisti sækir mynd og verð. Ókeypis, engin skráning nauðsynleg.</p>
        <a href="/?utm_source=osk">Prófa Tossalista</a>
      </div>
    </div>
  )
}
