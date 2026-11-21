import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// Stjórnborð → „Yfirferð“: kvittanir sem lásust illa þegar STJÓRNANDINN skannaði sjálfur (tafla scan_reviews,
// einkageymsla scan-review). Myndin við hliðina á því sem gervigreindin las, til að finna hvað klikkar.
// Kvittanir annarra notenda eru aldrei vistaðar hér.
const kr = (n) => (n == null ? '—' : Math.round(Number(n)).toLocaleString('is-IS') + ' kr')
const REASON = {
  blurry: 'Ólæsileg mynd', nolines: 'Engar vörulínur', empty: 'Engar vörur fundust', decode: 'Mynd opnaðist ekki',
  network: 'Náði ekki sambandi', ai_down: 'Lesari niðri', unverified: 'Stemmdi ekki við samtölu (netþjónn)', mismatch: 'Línur stemma ekki við samtölu',
}
const when = (iso) => { const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return d.getDate() + '.' + (d.getMonth() + 1) + '. kl. ' + p(d.getHours()) + ':' + p(d.getMinutes()) }

export default function ScanReview() {
  const [rows, setRows] = useState(null)
  const [urls, setUrls] = useState({})
  const [err, setErr] = useState('')
  const load = async () => {
    setErr('')
    const { data, error } = await supabase.from('scan_reviews').select('*').order('created_at', { ascending: false }).limit(40)
    if (error) { setErr('Tókst ekki að sækja listann.'); setRows([]); return }
    setRows(data || [])
    const paths = (data || []).map(r => r.path).filter(Boolean)
    if (paths.length) {
      const { data: signed } = await supabase.storage.from('scan-review').createSignedUrls(paths, 3600)
      const m = {}; for (const s of (signed || [])) if (s && s.signedUrl) m[s.path] = s.signedUrl
      setUrls(m)
    }
  }
  useEffect(() => { load() }, [])
  const remove = async (r) => {
    if (!window.confirm('Eyða þessari kvittun úr yfirferð? Myndinni er eytt og það er ekki hægt að afturkalla.')) return
    if (r.path) await supabase.storage.from('scan-review').remove([r.path])
    await supabase.from('scan_reviews').delete().eq('id', r.id)
    load()
  }

  if (!rows) return <p className="empty">Sæki…</p>
  return (
    <div className="srv">
      <p className="muted-p">Hér safnast kvittanir sem lásust illa þegar þú skannaðir sjálfur: myndin og það sem appið las. Kvittanir annarra notenda eru ekki vistaðar hér.</p>
      {err && <p className="ns-err">{err}</p>}
      {rows.length === 0 && !err && <p className="empty">Ekkert til yfirferðar enn. Skannaðu kvittanir — þær sem klikka birtast hér.</p>}
      {rows.map(r => {
        const items = r.items || []
        const sum = items.reduce((a, i) => a + (Number(i.price) || 0), 0)
        const c = r.check || {}
        return (
          <div className="srv-card" key={r.id}>
            <div className="srv-head">
              <b>{REASON[r.reason] || r.reason}</b>
              <span>{when(r.created_at)}</span>
              <button onClick={() => remove(r)}>Eyða</button>
            </div>
            <div className="srv-body">
              {r.path && urls[r.path]
                ? <a href={urls[r.path]} target="_blank" rel="noopener"><img src={urls[r.path]} alt="Kvittun" loading="lazy" /></a>
                : <div className="srv-noimg">Engin mynd</div>}
              <div className="srv-read">
                <div className="srv-meta">{r.store || 'Verslun óþekkt'} · {r.purchased_at || 'dagsetning óþekkt'}</div>
                <div className="srv-meta">Samtala: <b>{kr(r.total)}</b> · línur: <b>{kr(sum)}</b>{r.total != null && items.length ? <> · munur: <b>{kr(sum - Number(r.total))}</b></> : null}</div>
                {(c.legible === false || c.sum_ok === false || c.vat_ok === false) && (
                  <div className="srv-meta">Netþjónn: {c.legible === false ? 'ólæsilegt · ' : ''}{c.sum_ok === false ? 'summa stemmir ekki · ' : ''}{c.vat_ok === false ? 'VSK ótrúverðugur · ' : ''}{c.model || ''}</div>
                )}
                <div className="srv-items">
                  {items.map((i, k) => <div key={k}><span>{Number(i.qty) > 1 ? i.qty + ' × ' : ''}{i.name}</span><span>{i.price == null ? '' : Number(i.price).toLocaleString('is-IS')}</span></div>)}
                  {!items.length && <div><span>Engar línur lesnar</span><span /></div>}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
