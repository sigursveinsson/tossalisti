import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import RewardsAdmin from './RewardsAdmin.jsx'
import BrandDashboard from './BrandDashboard.jsx'
import { IconChartBar, IconGift, IconTrendingUp, IconX } from '@tabler/icons-react'

const kr = (n) => (n == null ? '—' : Math.round(Number(n)).toLocaleString('is-IS') + ' kr')
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('is-IS'))

const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString()
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })
}
const sinceText = (iso) => {
  if (!iso) return 'aldrei'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'rétt í þessu'
  if (mins < 60) return 'fyrir ' + mins + ' mín'
  const h = Math.round(mins / 60)
  if (h < 24) return 'fyrir ' + h + ' klst'
  return 'fyrir ' + Math.round(h / 24) + ' d'
}
// Stutt virkni-samantekt fyrir notanda
const activitySummary = (u) => {
  const parts = []
  if (u.lists_owned > 0) parts.push(u.lists_owned + ' lista' + (u.lists_owned === 1 ? '' : ''))
  if (u.items > 0) parts.push(u.items + ' vörur/verk')
  if (u.completions > 0) parts.push(u.completions + ' verk')
  if (u.purchases > 0) parts.push(u.purchases + ' kvitt.')
  if (u.scans > 0) parts.push(u.scans + ' skannanir')
  if (u.kids > 0) parts.push(u.kids + ' börn')
  if (u.memberships > u.lists_owned) parts.push('gekk í ' + (u.memberships - u.lists_owned) + ' deilda')
  return parts.length ? parts.join(' · ') : 'skráði sig, engin virkni enn'
}
// Uppruna-merki: hvaðan notandinn kom inn í kerfið
const SRC = {
  tossalisti: { letter: 'T', label: 'Tossalisti (boð frá notanda)', color: '#15315e' },
  facebook: { letter: 'F', label: 'Facebook', color: '#1877F2' },
  instagram: { letter: 'I', label: 'Instagram', color: '#E1306C' },
  google: { letter: 'G', label: 'Google', color: '#4285F4' },
  other: { letter: '↗', label: 'Annað', color: '#6b7a93' },
  direct: { letter: 'B', label: 'Beint', color: '#9aa6ba' },
}
const SRC_LABEL = { facebook: 'Facebook', instagram: 'Instagram', google: 'Google', tossalisti: 'Boð frá notanda', direct: 'Beint', beint: 'Beint', other: 'Annað' }
const srcBadge = (u) => {
  const s = SRC[u.source] || SRC.direct
  return { ...s, title: s.label + (u.utm_campaign ? ' · ' + u.utm_campaign : '') }
}

export default function AdminView({ onClose, adsEnabled, onToggleAds }) {
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState(null)
  const [pv, setPv] = useState(null)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showRewards, setShowRewards] = useState(false)
  const [showBrand, setShowBrand] = useState(false)
  const [tab, setTab] = useState('stats') // stats | brands
  const [scan, setScan] = useState(null) // mæling á kvittanaskönnun (scan_stats)
  const [scanDays, setScanDays] = useState(7)
  useEffect(() => { store.scanStats(scanDays).then(setScan).catch(() => setScan(null)) }, [scanDays])
  useBackClose(true, onClose)

  const load = () => {
    setLoading(true); setErr(false)
    store.adminStats().then(s => { setStats(s); setLoading(false) }).catch(() => { setErr(true); setLoading(false) })
    store.adminActivity().then(setActivity).catch(() => setActivity([]))
    store.adminPageviews().then(setPv).catch(() => setPv(null))
  }
  useEffect(load, [])

  const metric = (label, value, sub) => (
    <div className="adm-card">
      <div className="adm-val">{value}</div>
      <div className="adm-label">{label}</div>
      {sub && <div className="adm-sub">{sub}</div>}
    </div>
  )

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal adm-modal" onClick={e => e.stopPropagation()}>
        <h2><span className="h2-ico"><IconChartBar size={20} stroke={1.75} /></span>Stjórnborð <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>

        <div className="adm-tabs">
          <button className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}>Tölfræði</button>
          <button className={tab === 'brands' ? 'on' : ''} onClick={() => setTab('brands')}>Vörumerki</button>
        </div>

        {tab === 'brands' && (
          <>
            <button className="adm-rewards-btn" onClick={() => setShowRewards(true)}><IconGift size={18} stroke={1.75} /> Verðlaunakerfi (vörur, verðlaun, tilboð)</button>
            <button className="adm-rewards-btn adm-brand-btn" onClick={() => setShowBrand(true)}><IconTrendingUp size={18} stroke={1.75} /> Vörumerkja-mælaborð, herferðir og aðgangur</button>
            <p className="muted-p">Aðgangur heildsala (netföng) er skráður neðst í vörumerkja-mælaborðinu.</p>
          </>
        )}

        {tab === 'stats' && onToggleAds && (
          <div className="adm-ads">
            <div className="adm-ads-txt">
              <b>Kostaðar auglýsingar</b>
              <small>Auglýsingaborði, kostaðar vörutillögur og „Kostað"-hilla (Ölgerðin). {adsEnabled ? 'Sýnilegt notendum núna.' : 'Falið — kveiktu fyrir kynningu.'}</small>
            </div>
            <button className={'adm-ads-switch' + (adsEnabled ? ' on' : '')} onClick={onToggleAds} aria-label="Kveikja/slökkva á auglýsingum" />
          </div>
        )}

        {tab === 'stats' && loading && <p className="muted-p">Sæki tölfræði…</p>}
        {tab === 'stats' && err && <p className="muted-p">Næ ekki í tölfræði (ertu skráð(ur) inn sem stjórnandi?).</p>}

        {tab === 'stats' && (
          <>
            <div className="adm-head adm-head-row">Kvittanaskönnun
              <span className="adm-seg">{[1, 7, 30].map(d => <button key={d} className={scanDays === d ? 'on' : ''} onClick={() => setScanDays(d)}>{d === 1 ? '24 klst' : d + ' dagar'}</button>)}</span>
            </div>
            {!scan && <p className="muted-p">Engar mælingar enn — hver skönnun í appinu skráist hér frá og með næstu útgáfu.</p>}
            {scan && scan.total === 0 && <p className="muted-p">Engin skönnun á tímabilinu.</p>}
            {scan && scan.total > 0 && (() => {
              const rate = Math.round(scan.ok / scan.total * 100)
              const bo = scan.by_outcome || {}
              const OUT = { empty: 'Lásust ekki', network: 'Náðist ekki í netþjón', decode: 'Myndin opnaðist ekki', crash: 'Hrun í síma' }
              return (
                <>
                  <div className="adm-grid">
                    {metric('Tilraunir', num(scan.total))}
                    {metric('Tókust', rate + '%', rate < 85 ? 'undir 85% — skoða' : null)}
                    {metric('Meðaltími', scan.avg_ms_ok ? (scan.avg_ms_ok / 1000).toFixed(1) + ' s' : '—', 'þegar tekst')}
                    {metric('Notendur með villu', num(scan.users_failing))}
                  </div>
                  <div className={'adm-scanbar' + (rate < 85 ? ' bad' : '')}><div style={{ width: rate + '%' }} /></div>
                  {Object.keys(bo).filter(k => k !== 'ok').length > 0 && (
                    <div className="adm-src-rows">
                      {Object.entries(bo).filter(([k]) => k !== 'ok').sort((a, b) => b[1] - a[1]).map(([k, n]) => <div className="adm-src-row" key={k}><span>{OUT[k] || k}</span><b>{num(n)}</b></div>)}
                    </div>
                  )}
                  {scan.by_device && scan.by_device.length > 1 && (
                    <div className="adm-src-rows">
                      {scan.by_device.map(d => <div className="adm-src-row" key={d.device}><span>{d.device}</span><b>{Math.round(d.ok / d.total * 100)}% af {num(d.total)}</b></div>)}
                    </div>
                  )}
                  {scan.recent_failures && scan.recent_failures.length > 0 && (
                    <details className="adm-fail">
                      <summary>Síðustu villur ({scan.recent_failures.length})</summary>
                      {scan.recent_failures.map((f, i) => (
                        <div className="adm-fail-row" key={i}>
                          <b>{OUT[f.outcome] || f.outcome}</b> · {f.stage || '—'} · {f.ms ? Math.round(f.ms / 1000) + ' s' : ''} · {f.kb ? f.kb + ' KB' : ''} {f.type || ''} · {f.decoded ? 'minnkuð' : 'ekki minnkuð'} · {f.mem ? f.mem + ' GB' : 'minni óþekkt'}
                          <small>{f.email || ''} · {new Date(f.at).toLocaleString('is-IS')} · {f.ua}{f.error ? ' · ' + f.error : ''}</small>
                        </div>
                      ))}
                    </details>
                  )}
                </>
              )
            })()}
          </>
        )}

        {tab === 'stats' && pv && (
          <>
            <div className="adm-head">Umferð (gestir á síðuna)</div>
            <div className="adm-grid">
              {metric('Heimsóknir í dag', num(pv.views_24h))}
              {metric('Heimsóknir 7 daga', num(pv.views_7d))}
              {metric('Einstakir gestir 7d', num(pv.visitors_7d))}
              {metric('Skráningar 7d', num(pv.signups_7d), (pv.visitors_7d >= pv.signups_7d && pv.visitors_7d > 0) ? Math.round(pv.signups_7d / pv.visitors_7d * 100) + '% breyting' : null)}
            </div>
            {pv.by_source && pv.by_source.length > 0 && (
              <div className="adm-src-rows">
                {pv.by_source.map(r => (
                  <div className="adm-src-row" key={r.source}><span>{SRC_LABEL[r.source] || r.source}</span><b>{num(r.n)}</b></div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'stats' && stats && (
          <>
            <div className="adm-grid">
              {metric('Notendur alls', num(stats.users_total))}
              {metric('Virkir í dag', num(stats.users_active_today))}
              {metric('Virkir 7 daga', num(stats.users_active_7d))}
              {metric('Nýir í dag', num(stats.users_new_today), stats.users_new_7d != null ? num(stats.users_new_7d) + ' síðustu 7 daga' : undefined)}
            </div>
            <div className="adm-head">Notkun</div>
            <div className="adm-grid">
              {metric('Listar', num(stats.lists_total))}
              {metric('Vörur á listum', num(stats.items_total), '+' + num(stats.items_today) + ' í dag')}
              {metric('Vörur í banka', num(stats.catalog_total), '+' + num(stats.catalog_today) + ' í dag')}
            </div>
            <div className="adm-head">Kvittanir & útgjöld</div>
            <div className="adm-grid">
              {metric('Kvittanir', num(stats.receipts_total), '+' + num(stats.receipts_today) + ' í dag')}
              {stats.scans_total != null && metric('Skannanir', num(stats.scans_total), '+' + num(stats.scans_today) + ' í dag')}
              {metric('Útgjöld (mánuður)', kr(stats.spend_month))}
              {metric('Útgjöld alls', kr(stats.spend_total))}
            </div>
            <button className="adm-refresh" onClick={load}>↻ Uppfæra</button>
          </>
        )}

        {tab === 'stats' && activity && activity.length > 0 && (
          <>
            <div className="adm-head">Notendur — virkni ({activity.length})</div>
            <div className="adm-users">
              {activity.map((u, i) => (
                <div className={'adm-user' + (isToday(u.created_at) ? ' new' : '')} key={u.email + i}>
                  <span className="adm-user-ava">{(u.name || u.email).slice(0, 2).toUpperCase()}</span>
                  <div className="adm-user-main">
                    <div className="adm-user-top">
                      {(() => { const b = srcBadge(u); return <span className="adm-user-src" style={{ background: b.color }} title={b.title}>{b.letter}</span> })()}
                      <span className="adm-user-name">{u.name || u.email.split('@')[0]}</span>
                      {isToday(u.created_at) && <span className="adm-user-new">NÝR</span>}
                    </div>
                    <div className="adm-user-email">{u.email}</div>
                    <div className="adm-user-act">{activitySummary(u)}</div>
                  </div>
                  <div className="adm-user-time">
                    <div title={'Skráði sig ' + fmtDate(u.created_at)}>{fmtDate(u.created_at)}</div>
                    <div className="adm-user-seen">virkur {sinceText(u.last_activity)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="adm-refresh" onClick={load}>↻ Uppfæra</button>
          </>
        )}
      </div>
      {showRewards && <RewardsAdmin onClose={() => setShowRewards(false)} />}
      {showBrand && <BrandDashboard onClose={() => setShowBrand(false)} />}
    </div>
  )
}
