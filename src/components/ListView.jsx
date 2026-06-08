import React, { useState } from 'react'
import { DEPARTMENTS, DEPT_ORDER } from '../data/departments.js'
import { suggest } from '../data/products.js'
import { RECURRENCE_LABELS } from '../data/chores.js'

const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || '?'
const initialsOf = (m) => displayName(m).slice(0, 2).toUpperCase()
const POINTS_OPTIONS = [5, 10, 20, 30, 50]
const WEEKDAYS = [
  ['daily', 'Daglega'], ['mon', 'Mánudagur'], ['tue', 'Þriðjudagur'], ['wed', 'Miðvikudagur'],
  ['thu', 'Fimmtudagur'], ['fri', 'Föstudagur'], ['sat', 'Laugardagur'], ['sun', 'Sunnudagur'],
]
const WEEKDAY_LABEL = Object.fromEntries(WEEKDAYS)

function weekStartMs() {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(now.getDate() - day)
  return d.getTime()
}

function dueTag(it) {
  if (!it.due_at) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(it.due_at + 'T00:00:00')
  const diff = Math.round((due - today) / 86400000)
  let label, overdue = false
  if (diff < 0) { label = 'Yfir tími'; overdue = true }
  else if (diff === 0) label = 'Í dag'
  else if (diff === 1) label = 'Á morgun'
  else label = due.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })
  return <span className={'due-tag' + (overdue ? ' overdue' : '')}>📅 {label}</span>
}

export default function ListView({ items, listType = 'shopping', members = [], completions = [], currentUserId, onAdd, onToggle, onRemove, onAssign, onSetPoints, onSetRecurrence, onRecategorize, onSetDue, onSetWeekday }) {
  const isTask = listType === 'task'
  const isSchedule = listType === 'schedule'
  const [text, setText] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [scheduleDay, setScheduleDay] = useState('daily')
  const [assigning, setAssigning] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deptItem, setDeptItem] = useState(null)
  const [lbWindow, setLbWindow] = useState('week')
  const sugg = (isTask || isSchedule) ? [] : suggest(text)

  const canAssign = members.length > 1 && typeof onAssign === 'function'
  const memberOf = (uid) => members.find(m => m.user_id === uid) || {}

  const add = (name) => {
    const v = (name ?? text).trim()
    if (!v) return
    if (isSchedule) onAdd(v, scheduleDay)
    else if (!isTask && qty.trim()) onAdd(`${v} ${qty.trim()}${unit.trim() ? ' ' + unit.trim() : ''}`)
    else onAdd(v)
    setText(''); setQty('')
  }

  const open = items.filter(i => !i.checked).length

  const assignBtn = (it) => {
    if (!canAssign) return null
    return it.assignee
      ? <button className="assign-chip" style={{ background: memberOf(it.assignee).color || undefined }} onClick={() => setAssigning(it)} title={displayName(memberOf(it.assignee))}>{initialsOf(memberOf(it.assignee))}</button>
      : <button className="assign-add" onClick={() => setAssigning(it)} aria-label="Úthluta">＋</button>
  }

  const itemRow = (it, color, chore) => (
    <div className={'item' + (it.checked ? ' done' : '')} key={it.id}>
      <div className="check" style={{ background: it.checked ? color : 'transparent', borderColor: it.checked ? color : undefined }} onClick={() => onToggle(it)}>{it.checked ? '✓' : ''}</div>
      <span className="label" onClick={() => onToggle(it)}>
        {it.name}
        {chore && it.recurrence && it.recurrence !== 'none' && !isSchedule && <span className="rec-tag">🔁 {RECURRENCE_LABELS[it.recurrence]}</span>}
        {dueTag(it)}
      </span>
      {chore && <button className="points-badge" onClick={() => setEditItem(it)}>{it.points ?? 10} stig</button>}
      {!chore && it.dept === 'other' && onRecategorize && <button className="recat-btn" onClick={() => setDeptItem(it)} title="Flokka vöru">🏷️</button>}
      {assignBtn(it)}
      <button className="del" onClick={() => onRemove(it)} aria-label="Eyða">×</button>
    </div>
  )

  const addBar = (
    <div className="addbar">
      <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={isSchedule ? 'Bættu við verki…' : isTask ? 'Bættu við verki…' : 'Bættu við vöru…'} autoComplete="off" />
      {!isTask && !isSchedule && <input className="qty-in" value={qty} onChange={e => setQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="magn" inputMode="decimal" />}
      {!isTask && !isSchedule && <input className="unit-in" value={unit} onChange={e => setUnit(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="g/stk" />}
      {isSchedule && (
        <select className="day-in" value={scheduleDay} onChange={e => setScheduleDay(e.target.value)}>
          {WEEKDAYS.map(([k, l]) => <option key={k} value={k}>{l.slice(0, 3)}</option>)}
        </select>
      )}
      <button className="add" onClick={() => add()} aria-label="Bæta við">+</button>
      {sugg.length > 0 && <div className="suggest">{sugg.map(s => <div key={s} onClick={() => add(s)}>{s}</div>)}</div>}
    </div>
  )

  const assignModal = assigning && (
    <div className="sheet-bg center" onClick={() => setAssigning(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Hver ber ábyrgð? <button className="x" onClick={() => setAssigning(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 10 }}>{assigning.name}</div>
        {members.map(m => (
          <button className="pick-row" key={m.user_id} onClick={() => { onAssign(assigning, m.user_id); setAssigning(null) }}>
            <span>{displayName(m)}{m.user_id === currentUserId ? ' (þú)' : ''}</span>
            <span className="assign-chip" style={{ pointerEvents: 'none', background: m.color || undefined }}>{initialsOf(m)}</span>
          </button>
        ))}
        <button className="pick-row" onClick={() => { onAssign(assigning, null); setAssigning(null) }}><span>Enginn</span></button>
      </div>
    </div>
  )

  const settingsModal = editItem && (
    <div className="sheet-bg center" onClick={() => setEditItem(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Verk-stillingar <button className="x" onClick={() => setEditItem(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 12 }}>{editItem.name}</div>

        <div className="modal-label">Stig</div>
        <div className="points-options">
          {POINTS_OPTIONS.map(p => (
            <button key={p} className={'points-opt' + ((editItem.points ?? 10) === p ? ' on' : '')} onClick={() => { onSetPoints(editItem, p); setEditItem({ ...editItem, points: p }) }}>{p}</button>
          ))}
        </div>

        {isSchedule ? (
          <>
            <div className="modal-label">Dagur</div>
            <select className="list-select" value={editItem.weekday || 'daily'} onChange={e => { onSetWeekday(editItem, e.target.value); setEditItem({ ...editItem, weekday: e.target.value }) }}>
              {WEEKDAYS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </>
        ) : (
          <>
            <div className="modal-label">Endurtekning</div>
            <div className="rec-options">
              {Object.keys(RECURRENCE_LABELS).map(k => (
                <button key={k} className={'rec-opt' + ((editItem.recurrence || 'none') === k ? ' on' : '')} onClick={() => { onSetRecurrence(editItem, k); setEditItem({ ...editItem, recurrence: k }) }}>{RECURRENCE_LABELS[k]}</button>
              ))}
            </div>
          </>
        )}

        <div className="modal-label">Lokadagur</div>
        <input className="dialog-input" type="date" value={editItem.due_at || ''} onChange={e => { onSetDue(editItem, e.target.value); setEditItem({ ...editItem, due_at: e.target.value }) }} />

        <button className="add-recipe-btn" style={{ marginTop: 4 }} onClick={() => setEditItem(null)}>Loka</button>
      </div>
    </div>
  )

  const deptModal = deptItem && (
    <div className="sheet-bg center" onClick={() => setDeptItem(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Flokka vöru <button className="x" onClick={() => setDeptItem(null)} aria-label="Loka">×</button></h2>
        <div style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'capitalize', marginBottom: 10 }}>{deptItem.name}</div>
        {DEPARTMENTS.filter(d => d.key !== 'other').map(d => (
          <button className="pick-row" key={d.key} onClick={() => { onRecategorize(deptItem, d.key); setDeptItem(null) }}>
            <span>{d.icon} {d.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const leaderboard = members.length > 1 && (() => {
    const since = weekStartMs()
    const scores = members.map(m => ({
      ...m,
      points: completions.filter(c => c.user_id === m.user_id && (lbWindow === 'all' || new Date(c.completed_at).getTime() >= since)).reduce((s, c) => s + (c.points || 0), 0),
    })).sort((a, b) => b.points - a.points)
    return (
      <div className="leaderboard">
        <div className="lb-head">
          <span className="lb-title">🏆 Stigatafla</span>
          <div className="lb-toggle">
            <button className={lbWindow === 'week' ? 'on' : ''} onClick={() => setLbWindow('week')}>Vika</button>
            <button className={lbWindow === 'all' ? 'on' : ''} onClick={() => setLbWindow('all')}>Allt</button>
          </div>
        </div>
        {scores.map((s, idx) => (
          <div className="lb-row" key={s.user_id}>
            <span className="lb-rank">{idx + 1}</span>
            <span className="assign-chip" style={{ pointerEvents: 'none', background: s.color || undefined }}>{initialsOf(s)}</span>
            <span className="lb-name">{displayName(s)}{s.user_id === currentUserId ? ' (þú)' : ''}</span>
            <span className="lb-points">{s.points} stig</span>
          </div>
        ))}
      </div>
    )
  })()

  if (isSchedule) {
    const groups = WEEKDAYS.map(([k, l]) => ({ key: k, label: l, items: items.filter(i => (i.weekday || 'daily') === k) })).filter(g => g.items.length)
    return (
      <div>
        {addBar}
        <span className="badge">{open} eftir</span>
        {leaderboard}
        {items.length === 0 && <p className="empty">Skemað er tómt — bættu við verki og veldu dag.</p>}
        {groups.map(g => (
          <div className="group" key={g.key}>
            <div className="group-head"><span className="name" style={{ color: 'var(--accent)' }}>{g.label}</span></div>
            {g.items.map(it => itemRow(it, 'var(--accent)', true))}
          </div>
        ))}
        {assignModal}
        {settingsModal}
      </div>
    )
  }

  if (isTask) {
    const ordered = [...items].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
    return (
      <div>
        {addBar}
        <span className="badge">{open} eftir</span>
        {leaderboard}
        {items.length === 0 && <p className="empty">Listinn er tómur — bættu við verki að ofan.</p>}
        <div className="group">{ordered.map(it => itemRow(it, 'var(--accent)', true))}</div>
        {assignModal}
        {settingsModal}
      </div>
    )
  }

  const groups = DEPARTMENTS
    .map(d => ({ ...d, items: items.filter(i => i.dept === d.key) }))
    .filter(g => g.items.length)
    .sort((a, b) => DEPT_ORDER[a.key] - DEPT_ORDER[b.key])

  return (
    <div>
      {addBar}
      <span className="badge">{open} vörur eftir</span>
      {groups.length === 0 && <p className="empty">Listinn er tómur — bættu við vöru að ofan.</p>}
      {groups.map(g => (
        <div className="group" key={g.key}>
          <div className="group-head">
            <span className="emoji">{g.icon}</span>
            <span className="name" style={{ color: g.color }}>{g.name}</span>
          </div>
          {g.items.map(it => itemRow(it, g.color, false))}
        </div>
      ))}
      {assignModal}
      {deptModal}
    </div>
  )
}
