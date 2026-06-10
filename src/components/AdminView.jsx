import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'

const kr = (n) => (n == null ? '—' : Math.round(Number(n)).toLocaleString('is-IS') + ' kr')
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('is-IS'))

export default function AdminView({ onClose }) {
  const [stats, setStats] = useState(null)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(true)
  useBackClose(true, onClose)

  const load = () => {
    setLoading(true); setErr(false)
    store.adminStats().then(s => { setStats(s); setLoading(false) }).catch(() => { setErr(true); setLoading(false) })
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
        <h2>📊 Stjórnborð <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        {loading && <p className="muted-p">Sæki tölfræði…</p>}
        {err && <p className="muted-p">Næ ekki í tölfræði (ertu skráð(ur) inn sem stjórnandi?).</p>}

        {stats && (
          <>
            <div className="adm-grid">
              {metric('Notendur alls', num(stats.users_total))}
              {metric('Virkir í dag', num(stats.users_active_today))}
              {metric('Virkir 7 daga', num(stats.users_active_7d))}
              {metric('Nýir í dag', num(stats.users_new_today))}
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
              {metric('Útgjöld (mánuður)', kr(stats.spend_month))}
              {metric('Útgjöld alls', kr(stats.spend_total))}
            </div>
            <button className="adm-refresh" onClick={load}>↻ Uppfæra</button>
          </>
        )}
      </div>
    </div>
  )
}
