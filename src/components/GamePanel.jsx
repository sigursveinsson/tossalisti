import React, { useState } from 'react'
import { levelFor, streakDays, totalPoints, balance } from '../lib/gamify.js'

const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || '?'
const initialsOf = (m) => displayName(m).slice(0, 2).toUpperCase()
const MEDAL = ['🥇', '🥈', '🥉']

function weekStartMs() {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(now.getDate() - day)
  return d.getTime()
}

function Chip({ p }) {
  const style = { pointerEvents: 'none', background: (p && p.color) || undefined }
  if (p && p.avatar_url) return <span className="assign-chip has-avatar" style={style}><img src={p.avatar_url} alt="" /></span>
  return <span className="assign-chip" style={style}>{initialsOf(p)}</span>
}

// Vikuleg fjölskyldu-áskorun: sameiginlegt stigamarkmið.
function FamilyChallenge({ listId, completions }) {
  const key = 'korfan.weekgoal.' + listId
  const [goal, setGoal] = useState(() => { try { return parseInt(localStorage.getItem(key) || '200', 10) || 200 } catch { return 200 } })
  const since = weekStartMs()
  const earned = (completions || [])
    .filter(c => new Date(c.completed_at).getTime() >= since)
    .reduce((s, c) => s + (c.points || 0), 0)
  const pct = Math.min(100, Math.round((earned / Math.max(1, goal)) * 100))
  const done = earned >= goal
  const edit = () => {
    const v = window.prompt('Stigamarkmið fjölskyldunnar fyrir vikuna:', String(goal))
    if (v == null) return
    const n = Math.max(10, parseInt(v, 10) || goal)
    setGoal(n); try { localStorage.setItem(key, String(n)) } catch (e) {}
  }
  return (
    <div className="fam-challenge">
      <div className="fam-head">
        <span className="fam-title">{done ? '🎉 Markmiði náð!' : '🎯 Áskorun vikunnar'}</span>
        <button className="fam-edit" onClick={edit} aria-label="Breyta markmiði">{earned} / {goal} stig ✏️</button>
      </div>
      <div className="fam-bar"><div className={'fam-fill' + (done ? ' done' : '')} style={{ width: pct + '%' }} /></div>
    </div>
  )
}

export default function GamePanel({
  listId, people = [], completions = [], redemptions = [], rewards = [],
  currentUserId, onOpenProfile, onManageRewards,
}) {
  const [win, setWin] = useState('week')
  const hasRewards = rewards.length > 0
  if (people.length === 0) return null

  const since = weekStartMs()
  const scores = people.map(m => ({
    ...m,
    points: completions
      .filter(c => (m.kind === 'kid' ? c.kid_id === m.id : c.user_id === m.id) && (win === 'all' || new Date(c.completed_at).getTime() >= since))
      .reduce((s, c) => s + (c.points || 0), 0),
    streak: streakDays(completions, m),
    level: levelFor(totalPoints(completions, m)),
    bal: balance(completions, redemptions, m),
  })).sort((a, b) => b.points - a.points)

  return (
    <div className="gpanel">
      <FamilyChallenge listId={listId} completions={completions} />

      <div className="leaderboard">
        <div className="lb-head">
          <span className="lb-title">🏆 Stigatafla</span>
          <div className="lb-toggle">
            <button className={win === 'week' ? 'on' : ''} onClick={() => setWin('week')}>Vika</button>
            <button className={win === 'all' ? 'on' : ''} onClick={() => setWin('all')}>Allt</button>
          </div>
        </div>

        {scores.map((s, idx) => (
          <button className="lb-row tap" key={s.kind + s.id} onClick={() => onOpenProfile && onOpenProfile(s)}>
            <span className="lb-rank">{idx < 3 ? MEDAL[idx] : idx + 1}</span>
            <Chip p={s} />
            <span className="lb-info">
              <span className="lb-name">{displayName(s)}{s.kind === 'user' && s.id === currentUserId ? ' (þú)' : ''}</span>
              <span className="lb-sub">
                <span className="lb-lvl">{s.level.icon} {s.level.title}</span>
                {s.streak > 0 && <span className="lb-streak">🔥 {s.streak}</span>}
                {hasRewards && <span className="lb-bal">🪙 {s.bal}</span>}
              </span>
            </span>
            <span className="lb-points">{s.points}<small> stig</small></span>
          </button>
        ))}

        {onManageRewards && (
          <button className="rewards-manage-btn" onClick={onManageRewards}>🎁 Verðlaun</button>
        )}
      </div>
    </div>
  )
}
