import React, { useState } from 'react'

const DAYS = [
  ['mon', 'Mánudagur'], ['tue', 'Þriðjudagur'], ['wed', 'Miðvikudagur'], ['thu', 'Fimmtudagur'],
  ['fri', 'Föstudagur'], ['sat', 'Laugardagur'], ['sun', 'Sunnudagur'],
]
const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || ''

export default function ScheduleForm({ members = [], defaultDay = 'mon', onCreate, onClose }) {
  const [name, setName] = useState('')
  const [freq, setFreq] = useState('daily')
  const [day, setDay] = useState(DAYS.some(d => d[0] === defaultDay) ? defaultDay : 'mon')
  const [time, setTime] = useState('')
  const [assignee, setAssignee] = useState('')

  const save = () => {
    const v = name.trim()
    if (!v) return
    onCreate(v, freq === 'daily' ? 'daily' : day, time, assignee || null)
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nýtt verk <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        <input className="dialog-input" autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Heiti (t.d. fara út með hund)" />

        <div className="modal-label">Tíðni</div>
        <div className="seg">
          <button className={freq === 'daily' ? 'on' : ''} onClick={() => setFreq('daily')}>Daglega</button>
          <button className={freq === 'weekly' ? 'on' : ''} onClick={() => setFreq('weekly')}>Vikulega</button>
        </div>
        {freq === 'weekly' && (
          <select className="list-select" style={{ marginTop: 8 }} value={day} onChange={e => setDay(e.target.value)}>
            {DAYS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        )}

        <div className="modal-label">Tími (valfrjálst)</div>
        <input className="dialog-input" type="time" value={time} onChange={e => setTime(e.target.value)} />

        {members.length > 1 && (
          <>
            <div className="modal-label">Ábyrgðarmaður</div>
            <select className="list-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Enginn</option>
              {members.map(m => <option key={m.user_id} value={m.user_id}>{displayName(m)}</option>)}
            </select>
          </>
        )}

        <button className="add-recipe-btn" onClick={save} disabled={!name.trim()}>Bæta við</button>
      </div>
    </div>
  )
}
