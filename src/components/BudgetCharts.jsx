import React from 'react'

// Myndrit bókhaldsins: hrein SVG (engin söfn). Allt er smellanlegt — smellur síar yfirlitið.
const krShort = (n) => {
  const v = Math.round(Number(n) || 0)
  if (v >= 1000000) return (v / 1000000).toLocaleString('is-IS', { maximumFractionDigits: 1 }) + ' m.kr'
  if (v >= 10000) return Math.round(v / 1000).toLocaleString('is-IS') + ' þ.kr'
  return v.toLocaleString('is-IS') + ' kr'
}

// Súlurit yfir tíma. buckets: [{ key, label, amt, future? }]. selected: key | null.
export function TimeBars({ buckets, selected, onSelect }) {
  const W = 320, H = 132, PT = 16, PB = 20
  const n = Math.max(1, buckets.length)
  const max = Math.max(1, ...buckets.map(b => b.amt))
  const slot = W / n
  const bw = Math.max(2, Math.min(26, slot * 0.66))
  const every = n <= 12 ? 1 : n <= 16 ? 2 : 5
  return (
    <svg className="bchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Útgjöld yfir tíma">
      <line x1="0" x2={W} y1={H - PB} y2={H - PB} className="bchart-axis" />
      <text x={W} y="10" textAnchor="end" className="bchart-max">{krShort(max)}</text>
      {buckets.map((b, i) => {
        const h = b.amt > 0 ? Math.max(2, (b.amt / max) * (H - PT - PB)) : 0
        const x = i * slot + (slot - bw) / 2
        const on = selected === b.key
        const showLabel = n <= 12 || i % every === 0 || i === n - 1
        return (
          <g key={b.key} onClick={() => onSelect && onSelect(on ? null : b.key)} style={{ cursor: 'pointer' }}>
            <rect x={i * slot} y="0" width={slot} height={H} fill="transparent" />
            <rect x={x} y={H - PB - h} width={bw} height={h} rx={Math.min(4, bw / 2)}
              className={'bchart-bar' + (on ? ' on' : selected ? ' dim' : '') + (b.future ? ' future' : '')} />
            {showLabel && <text x={i * slot + slot / 2} y={H - 6} textAnchor="middle" className={'bchart-lbl' + (on ? ' on' : '')}>{b.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// Línurit: uppsafnað á tímabilinu, með fyrra tímabil sem brotalínu til samanburðar.
export function CumLine({ buckets, prev }) {
  const W = 320, H = 132, PT = 16, PB = 20
  const n = Math.max(2, buckets.length)
  let run = 0
  const cur = []
  buckets.forEach((b, i) => { if (!b.future) { run += b.amt; cur.push([i, run]) } })
  let prun = 0
  const pre = (prev || []).slice(0, n).map((a, i) => { prun += a; return [i, prun] })
  const max = Math.max(1, run, prun)
  const X = (i) => (i / (n - 1)) * (W - 8) + 4
  const Y = (v) => H - PB - (v / max) * (H - PT - PB)
  const path = (pts) => pts.map(([i, v], k) => (k ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ')
  const last = cur[cur.length - 1]
  const every = n <= 12 ? 1 : n <= 16 ? 2 : 5
  return (
    <svg className="bchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Uppsöfnuð útgjöld">
      <line x1="0" x2={W} y1={H - PB} y2={H - PB} className="bchart-axis" />
      <text x={W} y="10" textAnchor="end" className="bchart-max">{krShort(max)}</text>
      {pre.length > 1 && <path d={path(pre)} className="bchart-prev" />}
      {cur.length > 1 && <path d={path(cur) + ` L${X(last[0]).toFixed(1)} ${H - PB} L${X(cur[0][0]).toFixed(1)} ${H - PB} Z`} className="bchart-area" />}
      {cur.length > 1 && <path d={path(cur)} className="bchart-line" />}
      {last && <circle cx={X(last[0])} cy={Y(last[1])} r="3.5" className="bchart-dot" />}
      {buckets.map((b, i) => (n <= 12 || i % every === 0 || i === n - 1)
        ? <text key={b.key} x={X(i)} y={H - 6} textAnchor="middle" className="bchart-lbl">{b.label}</text> : null)}
    </svg>
  )
}

// Kleinuhringur (skífurit). slices: [{ key, label, amt, color }]. Smellur á sneið síar.
export function Donut({ slices, total, selected, onSelect, centerLabel }) {
  const R = 15.915 // ummál = 100
  const sum = Math.max(1, slices.reduce((a, s) => a + s.amt, 0))
  let off = 25 // byrja efst
  const sel = selected ? slices.find(s => s.key === selected) : null
  return (
    <svg className="bdonut" viewBox="0 0 42 42" role="img" aria-label="Skipting útgjalda">
      <circle cx="21" cy="21" r={R} fill="none" stroke="var(--chip)" strokeWidth="6" />
      {slices.map(s => {
        const pct = (s.amt / sum) * 100
        const el = (
          <circle key={s.key} cx="21" cy="21" r={R} fill="none" stroke={s.color} strokeWidth={selected === s.key ? 8 : 6}
            strokeDasharray={`${Math.max(0, pct - 0.6)} ${100 - Math.max(0, pct - 0.6)}`} strokeDashoffset={off}
            opacity={selected && selected !== s.key ? 0.3 : 1} style={{ cursor: s.other ? 'default' : 'pointer' }}
            onClick={() => !s.other && onSelect && onSelect(selected === s.key ? null : s.key)} />
        )
        off -= pct
        return el
      })}
      <text x="21" y="19.6" textAnchor="middle" className="bdonut-lbl">{sel ? sel.label.slice(0, 14) : centerLabel}</text>
      <text x="21" y="25" textAnchor="middle" className="bdonut-val">{krShort(sel ? sel.amt : total)}</text>
    </svg>
  )
}
