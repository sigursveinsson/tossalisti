import React, { useEffect, useState } from 'react'
import { store } from '../lib/store.js'
import { useBackClose } from '../lib/backstack.js'

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
  if (u.completions > 0) parts.push('✓ ' + u.completions)
  if (u.purchases > 0) parts.push('🧾 ' + u.purchases)
  if (u.kids > 0) parts.push('🧒 ' + u.kids)
  if (u.memberships > u.lists_owned) parts.push('gekk í ' + (u.memberships - u.lists_owned) + ' deilda')
  return parts.length ? parts.join(' · ') : 'skráði sig, engin virkni enn'
}

export default function AdminView({ onClose }) {
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState(null)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(true)
  useBackClose(true, onClose)

  const load = () => {
    setLoading(true); setErr(false)
    store.adminStats().then(s => { setStats(s); setLoading(false) }).catch(() => { setErr(true); setLoading(false) })
    store.adminActivity().then(setActivity).catch(() => setActivity([]))
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

        {activity && activity.length > 0 && (
          <>
            <div className="adm-head">Notendur — virkni ({activity.length})</div>
            <div className="adm-users">
              {activity.map((u, i) => (
                <div className={'adm-user' + (isToday(u.created_at) ? ' new' : '')} key={u.email + i}>
                  <span className="adm-user-ava">{(u.name || u.email).slice(0, 2).toUpperCase()}</span>
                  <div className="adm-user-main">
                    <div className="adm-user-top">
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
    </div>
  )
}
