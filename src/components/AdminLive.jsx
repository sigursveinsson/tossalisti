import React, { useEffect, useRef, useState } from 'react'
import { store } from '../lib/store.js'

// Stjórnborð → „Í beinni“: dagurinn í dag í hnotskurn. Uppfærist sjálft á 20 sek. fresti meðan það er sýnilegt.
// Gögn: RPC admin_live() (aðeins stjórnandi). Einn gestur = ein lína (ekki ein lína á hverja síðuflettingu).
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('is-IS'))
const kr = (n) => Math.round(Number(n) || 0).toLocaleString('is-IS') + ' kr'
const p2 = (n) => String(n).padStart(2, '0')
// 24 stunda klukka, óháð tungumálastillingu vafrans (sumir vafrar sýna annars „12:06 AM“)
const hm = (iso) => { try { const d = new Date(iso); return p2(d.getHours()) + ':' + p2(d.getMinutes()) } catch { return '' } }
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'rétt í þessu'
  if (m < 60) return 'fyrir ' + m + ' mín'
  return 'fyrir ' + Math.round(m / 60) + ' klst'
}
const dur = (s) => { s = Number(s) || 0; return s < 60 ? s + ' sek' : Math.floor(s / 60) + ' mín' + (s % 60 >= 30 && s < 600 ? ' ½' : '') }
const WD = ['sun', 'mán', 'þri', 'mið', 'fim', 'fös', 'lau']

// Atvik gests → stutt íslenskt merki. kind: ok (árangur) | bad (klikkaði) | '' (hlutlaust)
const EV = {
  welcome_scan: ['Valdi Skanna'], welcome_demo: ['Valdi sýnikvittun'], welcome_voice: ['Valdi Rödd'], welcome_list: ['Valdi Lista'],
  welcome_skip: ['Skoða fyrst', 'dim'], qs_text: ['Skrifaði lista'], qs_example: ['Skrifaði lista'],
  voice_start: ['Tók upp'], voice_auto: ['Vörur á lista', 'ok'], voice_err_denied: ['Hljóðnema hafnað', 'bad'], voice_empty: ['Ekkert heyrðist', 'bad'],
  scan_open: ['Opnaði skanna'], scan_photo: ['Tók mynd'], scan_read_fail: ['Lestur mistókst', 'bad'], scan_saved: ['Kvittun vistuð', 'ok'],
  scan_demo_result: ['Sá sýnikvittun'], scan_demo_to_real: ['Sýnidæmi → eigin kvittun', 'ok'],
  escape_click: ['Opnaði í vafra'], click_signup: ['Smellti á skráningu'], signup_ok: ['Skráði sig', 'ok'],
}
const SRC = { facebook: ['F', '#1877F2', 'Facebook'], instagram: ['I', '#E1306C', 'Instagram'], google: ['G', '#4285F4', 'Google'], tossalisti: ['T', '#15315e', 'Boð'], other: ['↗', '#6b7a93', 'Annað'], direct: ['B', '#9aa6ba', 'Beint'] }

function Tile({ label, value, sub, prev, prevLabel = 'í gær á sama tíma', money }) {
  const d = prev == null ? null : Number(value) - Number(prev)
  return (
    <div className="live-tile">
      <div className="live-tile-val">{money ? kr(value) : num(value)}</div>
      <div className="live-tile-label">{label}</div>
      {sub && <div className="live-tile-sub">{sub}</div>}
      {prev != null && (
        <div className={'live-tile-prev' + (d > 0 ? ' up' : d < 0 ? ' down' : '')}>
          {d > 0 ? '▲' : d < 0 ? '▼' : '='} {prevLabel}: {money ? kr(prev) : num(prev)}
        </div>
      )}
    </div>
  )
}

// Gestir eftir klukkustund: í dag (súlur) og í gær (ljósar súlur á bak við)
function Hours({ hours }) {
  const W = 336, H = 110, PB = 16
  const max = Math.max(1, ...hours.map(h => Math.max(h.today, h.yday)))
  const slot = W / 24, nowH = new Date().getHours()
  return (
    <svg className="live-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gestir eftir klukkustund">
      <line x1="0" x2={W} y1={H - PB} y2={H - PB} stroke="var(--line)" />
      {hours.map(h => {
        const yh = (h.yday / max) * (H - PB - 8), th = (h.today / max) * (H - PB - 8)
        return (
          <g key={h.h}>
            <title>{`kl. ${h.h}: ${h.today} í dag, ${h.yday} í gær`}</title>
            <rect x={h.h * slot + 1} y={H - PB - yh} width={slot - 2} height={yh} rx="2" className="live-bar-y" />
            {h.h <= nowH && <rect x={h.h * slot + 3.5} y={H - PB - th} width={slot - 7} height={th} rx="2" className={'live-bar-t' + (h.h === nowH ? ' now' : '')} />}
            {h.h % 3 === 0 && <text x={h.h * slot + slot / 2} y={H - 4} textAnchor="middle" className="live-lbl">{h.h}</text>}
          </g>
        )
      })}
      <text x={W} y="9" textAnchor="end" className="live-lbl">mest {max}</text>
    </svg>
  )
}

function Days({ days, field, color }) {
  const W = 336, H = 84, PB = 16
  const max = Math.max(1, ...days.map(d => d[field]))
  const slot = W / days.length
  return (
    <svg className="live-chart" viewBox={`0 0 ${W} ${H}`} role="img">
      <line x1="0" x2={W} y1={H - PB} y2={H - PB} stroke="var(--line)" />
      {days.map((d, i) => {
        const h = (d[field] / max) * (H - PB - 12), dt = new Date(d.d + 'T00:00:00'), last = i === days.length - 1
        return (
          <g key={d.d}>
            <title>{`${d.d}: ${d[field]}`}</title>
            <rect x={i * slot + 3} y={H - PB - h} width={slot - 6} height={h} rx="3" fill={last ? 'var(--cta)' : color} />
            {d[field] > 0 && <text x={i * slot + slot / 2} y={H - PB - h - 3} textAnchor="middle" className="live-lbl">{d[field]}</text>}
            <text x={i * slot + slot / 2} y={H - 4} textAnchor="middle" className={'live-lbl' + (last ? ' on' : '')}>{WD[dt.getDay()].slice(0, 2)}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminLive() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)
  const [at, setAt] = useState(null)
  const [fresh, setFresh] = useState({})          // gestir sem bættust við í síðustu uppfærslu → blikka
  const seen = useRef(null)
  const load = async () => {
    try {
      const d = await store.adminLive()
      if (!d) { setErr(true); return }
      const ids = new Set((d.feed || []).map(f => f.v))
      if (seen.current) { const nu = {}; ids.forEach(id => { if (!seen.current.has(id)) nu[id] = true }); setFresh(nu) }
      seen.current = ids
      setData(d); setErr(false); setAt(new Date())
    } catch { setErr(true) }
  }
  useEffect(() => {
    load()
    const t = setInterval(() => { if (document.visibilityState === 'visible') load() }, 20000)
    return () => clearInterval(t)
  }, [])

  if (!data) return <p className="empty">{err ? 'Tókst ekki að sækja gögnin.' : 'Sæki…'}</p>
  const t = data.today || {}, y = data.yday_same || {}, f = data.funnel || {}
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) + '%' : '—')
  const steps = [['Komu inn', f.arrived], ['Stoppuðu í 10 sek. eða lengur', f.stayed], ['Prófuðu eitthvað', f.tried], ['Fengu niðurstöðu', f.success], ['Skráðu sig', f.signup]]
  const fmax = Math.max(1, f.arrived || 0)

  return (
    <div className="live">
      <div className="live-head">
        <span className="live-dot" /> <b>Í beinni</b>
        <span className="live-now">{num(data.active_30m)} {data.active_30m === 1 ? 'gestur' : 'gestir'} síðustu 30 mín.</span>
        <button className="live-refresh" onClick={load}>↻ {at ? hm(at) + ':' + p2(at.getSeconds()) : ''}</button>
      </div>

      <div className="live-tiles">
        <Tile label="Gestir í dag" value={t.visitors} sub={num(t.ad) + ' úr auglýsingum'} prev={y.visitors} />
        <Tile label="Prófuðu eitthvað" value={t.tried} sub={pct(t.tried, t.visitors) + ' gesta'} prev={y.tried} />
        <Tile label="Nýskráðir" value={t.signups} prev={y.signups} />
        <Tile label="Kvittanir skannaðar" value={t.receipts} sub={num(t.scanners) + ' ' + (t.scanners === 1 ? 'notandi' : 'notendur')} prev={y.receipts} />
        <Tile label="Í gegnum appið í dag" value={t.kr} prev={y.kr} money />
        <Tile label="Vörur settar á lista" value={t.items} prev={y.items} />
      </div>

      <div className="live-card">
        <div className="live-card-h"><b>Gestir eftir klukkustund</b><small><i className="live-leg t" /> í dag <i className="live-leg y" /> í gær</small></div>
        <Hours hours={data.hours || []} />
      </div>

      <div className="live-card">
        <div className="live-card-h"><b>Trektin í dag</b><small>hlutfall af þeim sem komu inn</small></div>
        {steps.map(([label, n]) => (
          <div className="live-step" key={label}>
            <span className="live-step-l">{label}</span>
            <span className="live-step-bar"><i style={{ width: Math.max(2, Math.round(((n || 0) / fmax) * 100)) + '%' }} /></span>
            <span className="live-step-n">{num(n)} <small>{pct(n, f.arrived)}</small></span>
          </div>
        ))}
      </div>

      <div className="live-two">
        <div className="live-card"><div className="live-card-h"><b>Kvittanir á dag</b><small>14 dagar</small></div><Days days={data.days || []} field="receipts" color="var(--navy)" /></div>
        <div className="live-card"><div className="live-card-h"><b>Gestir á dag</b><small>14 dagar</small></div><Days days={data.days || []} field="visitors" color="#9db4d6" /></div>
      </div>

      <div className="live-card">
        <div className="live-card-h"><b>Skráðir notendur í dag</b><small>{(data.users || []).length}</small></div>
        {(data.users || []).length === 0 && <p className="empty">Enginn skráður notandi hefur opnað appið í dag.</p>}
        {(data.users || []).map(u => {
          const parts = []
          if (u.receipts > 0) parts.push(u.receipts + (u.receipts === 1 ? ' kvittun' : ' kvittanir') + (u.stores ? ' (' + u.stores + ')' : '') + ' · ' + kr(u.kr))
          if (u.items > 0) parts.push(u.items + (u.items === 1 ? ' vara á lista' : ' vörur á lista'))
          return (
            <div className="live-user" key={u.em + u.reg}>
              <span className="live-user-em">{u.em}…{u.is_new && <i className="live-badge new">NÝR</i>}{u.receipts_all >= 5 && <i className="live-badge star">{u.receipts_all} kvitt.</i>}</span>
              <span className="live-user-what">{parts.length ? parts.join(' · ') : (u.is_new ? 'Skráði sig, ekkert gert enn' : 'Opnaði appið' + (u.opens > 1 ? ' ' + u.opens + '×' : ''))}</span>
              <span className="live-user-t">{ago(u.last_at)}</span>
            </div>
          )
        })}
      </div>

      <div className="live-card">
        <div className="live-card-h"><b>Gestir í dag</b><small>ein lína á gest · nýjustu efst</small></div>
        {(data.feed || []).map(g => {
          const s = SRC[g.src] || SRC.direct
          const chips = [...new Set((g.evs || []).map(e => EV[e]).filter(Boolean).map(x => x.join('|')))].map(x => x.split('|'))
          return (
            <div className={'live-row' + (fresh[g.v] ? ' fresh' : '') + (g.signup ? ' win' : '')} key={g.v}>
              <span className="live-row-t">{hm(g.t0)}</span>
              <span className="live-src" style={{ background: s[1] }} title={s[2] + (g.ad ? ' · auglýsing' : '')}>{s[0]}</span>
              <span className="live-row-main">
                {g.is_back && <i className="live-badge back">Kom aftur</i>}
                {chips.length
                  ? chips.map(([label, kind]) => <i key={label} className={'live-chip' + (kind ? ' ' + kind : '')}>{label}</i>)
                  : <span className="live-row-none">{g.secs < 10 ? 'Fór strax' : 'Skoðaði, gerði ekkert'}</span>}
              </span>
              <span className="live-row-d">{dur(g.secs)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
