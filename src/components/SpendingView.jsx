import React, { useState } from 'react'
import ReceiptScanner from './ReceiptScanner.jsx'

const kr = (n) => (n == null ? '—' : Math.round(Number(n)).toLocaleString('is-IS') + ' kr')
const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('is-IS', { day: 'numeric', month: 'short' }) } catch { return d }
}
const monthKey = (d) => (d || '').slice(0, 7)

export default function SpendingView({ purchases = [], onSave }) {
  const [scanning, setScanning] = useState(false)
  const [open, setOpen] = useState(null)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = purchases
    .filter(p => monthKey(p.purchased_at) === thisMonth)
    .reduce((a, p) => a + (Number(p.total) || 0), 0)

  return (
    <div>
      <button className="primary-btn" onClick={() => setScanning(true)}>📸 Skrá kvittun</button>

      <div className="spend-summary">
        <span className="spend-label">Eyðsla þennan mánuð</span>
        <span className="spend-big">{kr(monthTotal)}</span>
      </div>

      {purchases.length === 0 && <p className="empty">Engar kvittanir enn — skráðu þá fyrstu með „📸 Skrá kvittun".</p>}

      <div className="group">
        {purchases.map(p => (
          <div className="spend-item" key={p.id}>
            <button className="spend-head" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <span className="spend-store">{p.store || 'Verslun'}</span>
              <span className="spend-date">{fmtDate(p.purchased_at)}</span>
              <span className="spend-amt">{kr(p.total)}</span>
              <span className="spend-chev">{open === p.id ? '▴' : '▾'}</span>
            </button>
            {open === p.id && (
              <div className="spend-lines">
                {(p.items || []).length === 0 && <div className="spend-line muted">Engar vörulínur skráðar</div>}
                {(p.items || []).map((it, i) => (
                  <div className="spend-line" key={i}>
                    <span>{it.name}</span>
                    <span>{kr(it.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {scanning && (
        <ReceiptScanner
          onSave={async (purchase) => { await onSave(purchase) }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  )
}
