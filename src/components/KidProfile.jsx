import React from 'react'
import { levelFor, streakDays, totalPoints, balance, earnedBadges, personCompletions, BADGES } from '../lib/gamify.js'

const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || '?'
const initialsOf = (m) => displayName(m).slice(0, 2).toUpperCase()

export default function KidProfile({
  person, completions = [], rewards = [], redemptions = [],
  canRedeem, onRedeem, onDeleteRedemption, onClose,
}) {
  if (!person) return null
  const total = totalPoints(completions, person)
  const lvl = levelFor(total)
  const streak = streakDays(completions, person)
  const bal = balance(completions, redemptions, person)
  const earned = earnedBadges(completions, person)
  const doneCount = personCompletions(completions, person).length
  const myRedemptions = (redemptions || [])
    .filter(r => person.kind === 'kid' ? r.kid_id === person.id : r.user_id === person.id)
    .slice(0, 6)

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal profile" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Loka">×</button>

        <div className="prof-head">
          <span className="prof-avatar" style={{ background: person.color || undefined }}>
            {person.avatar_url ? <img src={person.avatar_url} alt="" /> : initialsOf(person)}
          </span>
          <div className="prof-id">
            <div className="prof-name">{displayName(person)}</div>
            <div className="prof-level">{lvl.icon} {lvl.title}</div>
          </div>
        </div>

        <div className="prof-bar">
          <div className="prof-fill" style={{ width: Math.round(lvl.progress * 100) + '%' }} />
        </div>
        <div className="prof-next">
          {lvl.next ? `${lvl.toNext} stig í ${lvl.next.icon} ${lvl.next.title}` : 'Hæsta borð! 👑'}
        </div>

        <div className="prof-stats">
          <div className="prof-stat"><b>{total}</b><span>stig alls</span></div>
          <div className="prof-stat"><b>{doneCount}</b><span>verk kláruð</span></div>
          <div className="prof-stat"><b>🔥 {streak}</b><span>daga röð</span></div>
          {rewards.length > 0 && <div className="prof-stat"><b>🪙 {bal}</b><span>í buddu</span></div>}
        </div>

        <div className="prof-section">Merki</div>
        <div className="badge-grid">
          {BADGES.map(b => {
            const has = earned.has(b.id)
            return (
              <div key={b.id} className={'badge-cell' + (has ? '' : ' locked')} title={b.name + ' — ' + b.desc}>
                <span className="badge-ico">{has ? b.icon : '🔒'}</span>
                <span className="badge-name">{b.name}</span>
              </div>
            )
          })}
        </div>

        {rewards.length > 0 && (
          <>
            <div className="prof-section">Verðlaun {canRedeem ? '— leystu út stig' : ''}</div>
            <div className="reward-list">
              {rewards.map(r => {
                const affordable = bal >= (r.cost ?? 0)
                return (
                  <div className={'reward-row' + (affordable ? '' : ' poor')} key={r.id}>
                    <span className="reward-emoji">{r.emoji || '🎁'}</span>
                    <span className="reward-title">{r.title}</span>
                    <span className="reward-cost">{r.cost} 🪙</span>
                    {canRedeem && (
                      <button className="reward-redeem" disabled={!affordable} onClick={() => onRedeem(r, person)}>
                        {affordable ? 'Leysa út' : 'Vantar'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {myRedemptions.length > 0 && (
          <>
            <div className="prof-section">Nýlega leyst út</div>
            <div className="redeem-hist">
              {myRedemptions.map(r => (
                <div className="redeem-row" key={r.id}>
                  <span className="redeem-title">{r.title || 'Verðlaun'}</span>
                  <span className="redeem-cost">−{r.cost} 🪙</span>
                  {onDeleteRedemption && <button className="del" onClick={() => onDeleteRedemption(r.id)} aria-label="Afturkalla">×</button>}
                </div>
              ))}
            </div>
          </>
        )}

        <button className="add-recipe-btn" style={{ marginTop: 14 }} onClick={onClose}>Loka</button>
      </div>
    </div>
  )
}
