import React, { useState } from 'react'
import { TIME_OPTIONS, EMOJI_CHOICES, suggestChoreEmoji } from '../data/chores.js'
import { resizeImageFile, isEmojiImage, emojiOf, makeEmojiImage } from '../lib/img.js'

const DAYS = [
  ['mon', 'Mánudagur'], ['tue', 'Þriðjudagur'], ['wed', 'Miðvikudagur'], ['thu', 'Fimmtudagur'],
  ['fri', 'Föstudagur'], ['sat', 'Laugardagur'], ['sun', 'Sunnudagur'],
]
const displayName = (m) => (m && (m.name || (m.email || '').split('@')[0])) || ''

export default function ScheduleForm({ members = [], currentUserId, defaultDay = 'mon', onManageKids, onCreate, onClose }) {
  const [name, setName] = useState('')
  const [freq, setFreq] = useState('daily')
  const [day, setDay] = useState(DAYS.some(d => d[0] === defaultDay) ? defaultDay : 'mon')
  const [time, setTime] = useState('')
  const [assignee, setAssignee] = useState('') // "kind:id" eða ''
  const [image, setImage] = useState(null)
  const [imgTouched, setImgTouched] = useState(false)

  // Sjálfvirk táknatillaga út frá heiti (má yfirskrifa)
  const effImage = image || (!imgTouched && name.trim() ? (() => { const e = suggestChoreEmoji(name); return e ? makeEmojiImage(e) : null })() : null)

  const pickPhoto = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return
    try { setImage(await resizeImageFile(f, 256)); setImgTouched(true) } catch (err) {}
  }

  const save = () => {
    const v = name.trim()
    if (!v) return
    let person = null
    if (assignee) { const [kind, id] = assignee.split(':'); person = { kind, id } }
    onCreate(v, freq === 'daily' ? 'daily' : day, time, person, effImage)
  }

  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nýtt verk <button className="x" onClick={onClose} aria-label="Loka">×</button></h2>

        <input className="dialog-input" autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Heiti (t.d. fara út með hund)" />

        <div className="modal-label">Mynd eða tákn</div>
        <div className="emoji-grid">
          {EMOJI_CHOICES.map(em => (
            <button key={em} className={'emoji-opt' + (emojiOf(effImage) === em ? ' on' : '')} onClick={() => { setImage(makeEmojiImage(em)); setImgTouched(true) }}>{em}</button>
          ))}
        </div>
        <div className="emoji-actions">
          <label className="emoji-photo-btn">📷 Taka mynd
            <input type="file" accept="image/*" capture="environment" hidden onChange={pickPhoto} />
          </label>
          {effImage && !isEmojiImage(effImage) && <img className="item-img" src={effImage} alt="" style={{ width: 34, height: 34 }} />}
          {(image || effImage) && <button className="emoji-clear" onClick={() => { setImage(null); setImgTouched(true) }}>Fjarlægja</button>}
        </div>

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
        <select className="list-select" value={time} onChange={e => setTime(e.target.value)}>
          <option value="">— enginn tími —</option>
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {members.length > 1 && (
          <>
            <div className="modal-label">Ábyrgðarmaður</div>
            <select className="list-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Enginn</option>
              {members.map(p => (
                <option key={p.kind + ':' + p.id} value={p.kind + ':' + p.id}>
                  {displayName(p)}{p.kind === 'user' && p.id === currentUserId ? ' (þú)' : ''}{p.kind === 'kid' ? ' 🧒' : ''}
                </option>
              ))}
            </select>
          </>
        )}
        {onManageKids && <button className="kids-btn" style={{ marginTop: 10 }} onClick={onManageKids}>🧒 Stýra krökkum</button>}

        <button className="add-recipe-btn" onClick={save} disabled={!name.trim()}>Bæta við</button>
      </div>
    </div>
  )
}
