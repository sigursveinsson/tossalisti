import React, { useState } from 'react'

export default function RecipeForm({ defaultAuthor, onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽')
  const [time, setTime] = useState('')
  const [serves, setServes] = useState(4)
  const [ings, setIngs] = useState([{ name: '', qty: '', unit: '' }, { name: '', qty: '', unit: '' }, { name: '', qty: '', unit: '' }])
  const [stepsText, setStepsText] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [authorType, setAuthorType] = useState('user')
  const [authorName, setAuthorName] = useState(defaultAuthor || '')
  const [sourceUrl, setSourceUrl] = useState('')
  const [err, setErr] = useState('')

  const setIng = (i, field, val) => setIngs(a => a.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  const addRow = () => setIngs(a => [...a, { name: '', qty: '', unit: '' }])
  const removeRow = (i) => setIngs(a => a.filter((_, idx) => idx !== i))

  const submit = () => {
    if (!name.trim()) { setErr('Uppskriftin þarf nafn.'); return }
    const ingredients = ings
      .filter(i => i.name.trim())
      .map(i => ({
        name: i.name.trim().toLowerCase(),
        qty: i.qty !== '' ? Number(i.qty) : null,
        unit: i.unit.trim() || (i.qty !== '' ? 'stk' : 'eftir smekk'),
      }))
    if (!ingredients.length) { setErr('Bættu við a.m.k. einu hráefni.'); return }
    if (authorType === 'web' && !sourceUrl.trim()) { setErr('Settu inn slóð á uppskriftina.'); return }
    onSubmit({
      name: name.trim(),
      emoji: emoji.trim() || '🍽',
      time: time.trim(),
      serves: Number(serves) || 4,
      ingredients,
      steps: stepsText.split('\n').map(s => s.trim()).filter(Boolean),
      isPublic,
      authorType,
      authorName: authorType === 'user' ? (authorName.trim() || 'Notandi') : (authorName.trim() || null),
      sourceUrl: authorType === 'web' ? sourceUrl.trim() : null,
    })
  }

  return (
    <div>
      <button className="back" onClick={onClose}>← Hætta við</button>
      <h2 className="recipe-h">Ný uppskrift</h2>

      <div className="frow">
        <input className="femoji" value={emoji} onChange={e => setEmoji(e.target.value)} aria-label="Tákn" />
        <input className="fname" value={name} onChange={e => setName(e.target.value)} placeholder="Nafn uppskriftar" />
      </div>
      <div className="frow">
        <input value={time} onChange={e => setTime(e.target.value)} placeholder="Tími (t.d. 30 mín)" />
        <div className="serv-inline">
          <span>Skammtar</span>
          <input type="number" min="1" value={serves} onChange={e => setServes(e.target.value)} style={{ width: 64 }} />
        </div>
      </div>

      <div className="recipe-section">Hráefni</div>
      {ings.map((ing, i) => (
        <div className="ing-row" key={i}>
          <input value={ing.name} onChange={e => setIng(i, 'name', e.target.value)} placeholder="hráefni" style={{ flex: 1 }} />
          <input value={ing.qty} onChange={e => setIng(i, 'qty', e.target.value)} placeholder="magn" inputMode="decimal" style={{ width: 64 }} />
          <input value={ing.unit} onChange={e => setIng(i, 'unit', e.target.value)} placeholder="g/stk" style={{ width: 64 }} />
          <button className="ico" onClick={() => removeRow(i)} aria-label="Fjarlægja">×</button>
        </div>
      ))}
      <button className="ghost-btn" onClick={addRow}>+ Bæta við hráefni</button>

      <div className="recipe-section">Aðferð</div>
      <textarea
        value={stepsText}
        onChange={e => setStepsText(e.target.value)}
        placeholder="Eitt skref í hverri línu…"
        rows={5}
        className="ftext"
      />

      <div className="recipe-section">Höfundur</div>
      <div className="seg">
        <button className={authorType === 'user' ? 'on' : ''} onClick={() => setAuthorType('user')}>Ég samdi hana</button>
        <button className={authorType === 'web' ? 'on' : ''} onClick={() => setAuthorType('web')}>Fann á netinu</button>
      </div>
      {authorType === 'user'
        ? <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Þitt nafn" style={{ width: '100%', marginTop: 8 }} />
        : (
          <>
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Slóð á uppskriftina (https://…)" style={{ width: '100%', marginTop: 8 }} />
            <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Nafn síðu/höfundar (valfrjálst)" style={{ width: '100%', marginTop: 8 }} />
          </>
        )}

      <div className="recipe-section">Sýnileiki</div>
      <div className="seg">
        <button className={!isPublic ? 'on' : ''} onClick={() => setIsPublic(false)}>🔒 Einka</button>
        <button className={isPublic ? 'on' : ''} onClick={() => setIsPublic(true)}>🌍 Sýnileg öllum</button>
      </div>

      {err && <p style={{ color: 'var(--accent)', fontSize: 14 }}>{err}</p>}
      <button className="add-recipe-btn" onClick={submit}>Vista uppskrift</button>
    </div>
  )
}
