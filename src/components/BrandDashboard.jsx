import React, { useEffect, useMemo, useState } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'
import { demoDashboard } from '../lib/brandDemo.js'

// Vörumerkja-mælaborð (Gríptu fyrir heildsala). Allar tölur koma úr gagnagrunninum
// (brand_dashboard, k-nafnleysi). Gervigreindin útskýrir aðeins tölurnar.
// „Sýnidæmi" = tilbúin gögn til kynningar — alltaf merkt skýrt.

// Íslensk þúsundaskil (punktur) óháð stillingum vafrans.
const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const kr = (n) => num(n) + ' kr'
const pct = (x) => (x == null ? '—' : Math.round(Number(x) * 100) + '%')
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des']
const wkLabel = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${Number(m[3])}. ${MONTHS[Number(m[2]) - 1]}` : d }
const PERIODS = [[30, '30 dagar'], [90, '90 dagar'], [365, '12 mánuðir']]
const QUESTIONS = [
  'Hvaða vara hefur bestu endurkaupin?',
  'Í hvaða keðju ættum við að auka sókn?',
  'Hvaða samtilboð mælirðu með út frá körfunni?',
  'Hvernig hefur þróunin verið síðustu vikur?',
]

export default function BrandDashboard({ onClose }) {
  useBackClose(true, onClose)
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [brandId, setBrandId] = useState('')
  const [days, setDays] = useState(90)
  const [mode, setMode] = useState(() => { try { return localStorage.getItem('korfan.bd.mode') || 'real' } catch { return 'real' } })
  const [real, setReal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [q, setQ] = useState('')
  const [qa, setQa] = useState([])
  const [asking, setAsking] = useState(false)

  const setModeP = (m) => { setMode(m); try { localStorage.setItem('korfan.bd.mode', m) } catch (e) {} }
  const isDemo = mode === 'demo'

  useEffect(() => {
    Promise.all([store.getRewardBrands(), store.getRewardMatchList()]).then(([b, p]) => {
      setBrands(b || []); setProducts(p || [])
      const nathan = (b || []).find(x => /nathan/i.test(x.name))
      setBrandId((nathan || (b || [])[0] || {}).id || '')
    }).catch(() => setErr('Gat ekki sótt vörumerki.'))
  }, [])

  // Raungögn úr gagnagrunninum
  useEffect(() => {
    if (!brandId || isDemo) return
    setLoading(true); setErr(''); setReal(null)
    store.brandDashboard(brandId, days, 5)
      .then(d => setReal(d))
      .catch(() => setErr('Gat ekki sótt gögn (aðeins stjórnandi hefur aðgang).'))
      .finally(() => setLoading(false))
  }, [brandId, days, isDemo])

  const brand = brands.find(b => b.id === brandId)
  const brandProducts = useMemo(() => products.filter(p => p.brand_id === brandId).map(p => p.name), [products, brandId])
  const data = isDemo ? (brand ? demoDashboard(brand.name, brandProducts, days) : null) : real
  const ready = data && !data.insufficient

  // AI-innsýn þegar gögn breytast
  const dataKey = data ? `${brandId}|${days}|${mode}|${data.totals?.lines}` : ''
  useEffect(() => {
    setAi(null); setQa([])
    if (!ready) return
    let alive = true
    setAiLoading(true)
    store.brandInsights(data, { demo: isDemo })
      .then(r => { if (alive) setAi(r) })
      .catch(() => { if (alive) setAi({ error: true }) })
      .finally(() => { if (alive) setAiLoading(false) })
    return () => { alive = false }
  }, [dataKey])

  const ask = async (question) => {
    const text = (question ?? q).trim()
    if (!text || !ready || asking) return
    setAsking(true); setQ('')
    try {
      const r = await store.brandInsights(data, { demo: isDemo, question: text })
      setQa(list => [{ q: text, a: r.answer || '—' }, ...list].slice(0, 4))
    } catch (e) {
      setQa(list => [{ q: text, a: 'Náði ekki að svara núna — reyndu aftur.' }, ...list].slice(0, 4))
    } finally { setAsking(false) }
  }

  const t = data && data.totals ? data.totals : {}
  const roi = t.cashback > 0 ? (t.revenue / t.cashback) : null
  const maxWeek = ready ? Math.max(1, ...data.by_week.map(w => w.lines || 0)) : 1
  const chainTotal = ready ? data.by_chain.reduce((s, c) => s + (c.lines || 0), 0) || 1 : 1
  const maxProd = ready ? Math.max(1, ...data.by_product.map(p => p.lines || 0)) : 1
  const periodLabel = (PERIODS.find(p => p[0] === days) || [0, days + ' dagar'])[1].toLowerCase()

  return (
    <div className="bd-wrap">
      <div className="bd-inner">
        <div className="bd-top">
          <button className="bd-back" onClick={onClose}>← Stjórnborð</button>
          <div className="bd-title">📈 Vörumerkja-mælaborð <span>Gríptu fyrir heildsala</span></div>
        </div>

        <div className="bd-controls">
          <select className="bd-select" value={brandId} onChange={e => setBrandId(e.target.value)}>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div className="bd-seg">
            {PERIODS.map(([d, l]) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{l}</button>)}
          </div>
          <div className="bd-seg">
            <button className={!isDemo ? 'on' : ''} onClick={() => setModeP('real')}>Raungögn</button>
            <button className={isDemo ? 'on demo' : ''} onClick={() => setModeP('demo')}>🧪 Sýnidæmi</button>
          </div>
        </div>

        {isDemo && (
          <div className="bd-demo-banner">
            🧪 <b>SÝNIDÆMI</b> — tilbúin gögn sem sýna hvernig mælaborðið lítur út með nokkur hundruð kaupendum. <b>Ekki raunveruleg sala.</b>
          </div>
        )}

        {loading && <div className="bd-empty">Sæki gögn…</div>}
        {err && <div className="bd-empty">{err}</div>}

        {data && data.insufficient && !isDemo && (
          <div className="bd-empty">
            <div className="bd-empty-big">Of fá gögn enn fyrir {data.brand || 'vörumerkið'}</div>
            <p>{num(t.lines)} staðfest kaup frá {num(t.buyers)} {t.buyers === 1 ? 'kaupanda' : 'kaupendum'} á tímabilinu. Mælaborðið birtir tölur þegar a.m.k. <b>{data.min_group} kaupendur</b> hafa keypt — svo enginn einstaklingur verði greinanlegur.</p>
            <button className="bd-btn" onClick={() => setModeP('demo')}>🧪 Sjá sýnidæmi</button>
          </div>
        )}

        {ready && (
          <>
            <div className="bd-hero">
              <b>{data.brand}</b> · staðfest kaup af kassakvittunum <b>þvert á allar verslanakeðjur</b> · síðustu {periodLabel}
            </div>

            <div className="bd-kpis">
              <div className="bd-kpi"><div className="v">{num(t.lines)}</div><div className="l">Staðfest kaup</div><div className="s">á {num(t.receipts)} kvittunum</div></div>
              <div className="bd-kpi"><div className="v">{num(t.buyers)}</div><div className="l">Kaupendur</div><div className="s">einstakir, nafnlausir</div></div>
              <div className="bd-kpi good"><div className="v">{pct(t.repeat_rate)}</div><div className="l">Endurkaup</div><div className="s">{num(t.repeat_buyers)} keyptu aftur</div></div>
              <div className="bd-kpi good"><div className="v">{pct(t.new_rate)}</div><div className="l">Nýir kaupendur</div><div className="s">{num(t.new_buyers)} í fyrsta sinn</div></div>
              <div className="bd-kpi"><div className="v">{kr(t.revenue)}</div><div className="l">Sala af kvittunum</div><div className="s">{num(t.units)} einingar</div></div>
              <div className="bd-kpi gold"><div className="v">{kr(t.cashback)}</div><div className="l">Cashback greitt</div><div className="s">{roi ? `${num(roi)} kr sala per greidda krónu` : 'ekkert greitt enn'}</div></div>
            </div>

            <div className="bd-card bd-ai">
              <div className="bd-card-h">✨ Helstu innsýn <span>gervigreind útskýrir tölurnar — býr ekki til nýjar</span></div>
              {aiLoading && <div className="bd-ai-load"><span className="bd-goose">🪿</span> Gríptu greinir gögnin…</div>}
              {ai && !ai.error && (
                <>
                  <ul className="bd-ai-list">{(ai.bullets || []).map((b, i) => <li key={i}>{b}</li>)}</ul>
                  {ai.action && <div className="bd-ai-action"><b>💡 Tillaga:</b> {ai.action}</div>}
                </>
              )}
              {ai && ai.error && <div className="bd-muted">Náði ekki að sækja innsýn núna.</div>}
              <div className="bd-ask">
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Spurðu gögnin… t.d. „hvar seljum við mest?“" />
                <button onClick={() => ask()} disabled={asking || !q.trim()}>{asking ? '…' : 'Spyrja'}</button>
              </div>
              <div className="bd-chips">{QUESTIONS.map(x => <button key={x} onClick={() => ask(x)} disabled={asking}>{x}</button>)}</div>
              {qa.map((x, i) => (
                <div key={i} className="bd-qa"><div className="bd-qa-q">{x.q}</div><div className="bd-qa-a">{x.a}</div></div>
              ))}
            </div>

            <div className="bd-grid">
              <div className="bd-card">
                <div className="bd-card-h">Vikuleg þróun <span>staðfest kaup á viku</span></div>
                <div className="bd-bars">
                  {data.by_week.map((w, i) => (
                    <div key={w.week} className="bd-bar-col" title={`Vika ${wkLabel(w.week)}: ${w.lines == null ? 'falið' : num(w.lines) + ' kaup'}`}>
                      <div className="bd-bar" style={{ height: ((w.lines || 0) / maxWeek * 100) + '%' }} />
                      <div className="bd-bar-x">{(i % Math.max(1, Math.ceil(data.by_week.length / 6)) === 0) ? wkLabel(w.week) : ''}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bd-card">
                <div className="bd-card-h">Eftir verslanakeðju <span>engin ein verslun sér þessa heildarmynd</span></div>
                {data.by_chain.map(c => (
                  <div key={c.chain} className="bd-hrow">
                    <div className="bd-hlabel">{c.chain}</div>
                    <div className="bd-htrack"><div className="bd-hfill" style={{ width: (c.lines / chainTotal * 100) + '%' }} /></div>
                    <div className="bd-hval">{pct(c.lines / chainTotal)}</div>
                  </div>
                ))}
                {data.by_chain.length === 0 && <div className="bd-muted">Of fáir kaupendur á hverja keðju til að sýna.</div>}
              </div>
            </div>

            <div className="bd-card">
              <div className="bd-card-h">Eftir vöru</div>
              <div className="bd-table">
                <div className="bd-tr bd-th"><span>Vara</span><span>Kaup</span><span>Kaupendur</span><span>Endurkaup</span></div>
                {data.by_product.map(p => (
                  <div key={p.name} className="bd-tr">
                    <span className="bd-pname">
                      {p.name}
                      {!p.suppressed && <i className="bd-pbar" style={{ width: (p.lines / maxProd * 100) + '%' }} />}
                    </span>
                    {p.suppressed
                      ? <><span className="bd-muted">falið</span><span className="bd-muted">&lt;{data.min_group}</span><span className="bd-muted">—</span></>
                      : <><span>{num(p.lines)}</span><span>{num(p.buyers)}</span><span className="bd-rep">{pct(p.repeat_rate)}</span></>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bd-card">
              <div className="bd-card-h">Keypt í sömu körfu <span>hugmyndir að samtilboðum</span></div>
              <div className="bd-basket">
                {data.basket.map(b => <span key={b.label} className="bd-bchip">{b.label} <b>{pct(b.share)}</b></span>)}
                {data.basket.length === 0 && <span className="bd-muted">Of fá gögn til að sýna körfu.</span>}
              </div>
            </div>
          </>
        )}

        <div className="bd-foot">
          🔒 Vörumerki sjá aðeins samanteknar, nafnlausar tölur. Hópum með færri en {data ? data.min_group : 5} kaupendum er sleppt eða þeir sameinaðir. Gervigreindin fær aðeins þessar samanteknu tölur.
        </div>
      </div>
    </div>
  )
}
