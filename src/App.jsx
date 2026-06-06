import React, { useEffect, useState } from 'react'
import { store, isCloud } from './lib/store.js'
import { supabase } from './lib/supabaseClient.js'
import ListView from './components/ListView.jsx'
import RecipesView from './components/RecipesView.jsx'
import ListsPanel from './components/ListsPanel.jsx'
import AddToListModal from './components/AddToListModal.jsx'
import Auth from './components/Auth.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!isCloud)
  const [lists, setLists] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [tab, setTab] = useState('list')
  const [showLists, setShowLists] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingRecipe, setPendingRecipe] = useState(null)

  // Auðkenning (aðeins í ský-ham)
  useEffect(() => {
    if (!isCloud) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const reload = async (keepId) => {
    try {
      let all = await store.getLists()
      // Nýr ský-notandi á engan lista — búum til þann fyrsta sjálfkrafa.
      if (isCloud && all.length === 0) {
        await store.createList('Vikuinnkaup')
        all = await store.getLists()
      }
      setLists(all)
      setCurrentId(prev => {
        const want = keepId ?? prev
        if (want && all.some(l => l.id === want)) return want
        return all[0]?.id ?? null
      })
      setError('')
    } catch (e) {
      console.error('Körfan villa:', e)
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isCloud && !session) return
    reload()
  }, [session])

  // Rauntíma-samstilling (ský)
  useEffect(() => {
    if (!isCloud || !currentId) return
    return store.subscribe(currentId, () => reload(currentId))
  }, [currentId])

  const list = lists.find(l => l.id === currentId) || null
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const addItem = async (name) => {
    if (list.items.some(i => i.name === name.toLowerCase().trim())) { flash(name + ' er nú þegar á listanum'); return }
    await store.addItem(list.id, name); await reload(list.id)
  }
  const toggleItem = async (it) => { await store.toggleItem(list.id, it.id, it.checked); await reload(list.id) }
  const removeItem = async (it) => { await store.removeItem(list.id, it.id); await reload(list.id) }

  const addRecipeToList = async (recipe, listId) => {
    const target = lists.find(l => l.id === listId)
    const existing = new Set((target ? target.items : []).map(i => i.name))
    const toAdd = recipe.ingredients.filter(n => !existing.has(n.toLowerCase()))
    if (toAdd.length) await store.addManyItems(listId, toAdd)
    setPendingRecipe(null)
    setCurrentId(listId)
    await reload(listId)
    setTab('list')
    flash(toAdd.length
      ? `${toAdd.length} hráefni bætt á „${target ? target.name : ''}“`
      : 'Öll hráefni voru þegar á listanum')
  }
  // Ef aðeins einn listi er til, bætum beint á hann — annars spyrjum hvaða lista.
  const addRecipe = (recipe) => {
    if (lists.length <= 1) addRecipeToList(recipe, currentId)
    else setPendingRecipe(recipe)
  }

  const createList = async (name) => {
    const l = await store.createList(name)
    await reload(l.id); setShowLists(false); flash('Listinn „' + name + '“ búinn til')
  }
  const switchList = async (id) => { setCurrentId(id); setShowLists(false); setTab('list') }
  const duplicateList = async (l) => {
    const proposed = l.name + ' (afrit)'
    const name = prompt('Nafn á nýja listanum:', proposed)
    if (name === null) return
    const nl = await store.duplicateList(l.id, name.trim() || proposed)
    await reload(nl.id); setShowLists(false); flash('Listi afritaður')
  }
  const renameList = async (l) => {
    const name = prompt('Nýtt nafn á listanum:', l.name)
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === l.name) return
    await store.renameList(l.id, trimmed)
    await reload(l.id); flash('Nafni breytt')
  }
  const signOut = async () => {
    if (isCloud) await supabase.auth.signOut()
    setSession(null); setLists([]); setCurrentId(null); setError(''); setLoading(false)
  }
  const deleteList = async (l) => {
    if (lists.length <= 1) { flash('Þú þarft að eiga a.m.k. einn lista'); return }
    if (!confirm('Eyða listanum „' + l.name + '“?')) return
    await store.deleteList(l.id); await reload()
  }
  const shareList = async (l) => {
    if (!isCloud) { flash('Deiling krefst innskráningar — tengdu Supabase fyrst'); return }
    const email = prompt('Netfang þess sem þú vilt deila „' + l.name + '“ með:')
    if (!email) return
    try { await store.shareList(l.id, email); await reload(l.id); flash('Deilt með ' + email) }
    catch (e) { flash(e.message || 'Tókst ekki að deila') }
  }

  if (!authReady) return null
  if (isCloud && !session) return <Auth />
  if (loading) return <div className="empty">Hleð…</div>
  if (error && !list) return (
    <div className="empty" style={{ padding: '0 24px' }}>
      <p>Eitthvað fór úrskeiðis við að sækja gögnin:</p>
      <p style={{ color: 'var(--accent)', wordBreak: 'break-word' }}>{error}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setLoading(true); reload() }}
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 15, fontWeight: 600 }}
        >Reyna aftur</button>
        {isCloud && (
          <button
            onClick={signOut}
            style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 18px', fontSize: 15 }}
          >Skrá út og inn aftur</button>
        )}
      </div>
    </div>
  )
  if (!list) return (
    <div className="empty">
      <p>Enginn listi enn.</p>
      <button
        onClick={() => createList('Vikuinnkaup')}
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 15, fontWeight: 600 }}
      >Búa til lista</button>
    </div>
  )

  const open = list.items.filter(i => !i.checked).length

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <span className="basket">🧺</span>
          <button className="listbtn" onClick={() => setShowLists(true)} title="Skipta um lista eða búa til nýjan">
            <span className="lists-ico">☰</span> {list.name} <span className="chev">▾</span>
          </button>
          <span className="count">{open} eftir</span>
        </div>
        <div className="tabs">
          <button className={'tab' + (tab === 'list' ? ' active' : '')} onClick={() => setTab('list')}>Innkaupalisti</button>
          <button className={'tab' + (tab === 'recipes' ? ' active' : '')} onClick={() => setTab('recipes')}>Uppskriftir</button>
        </div>
      </div>
      <div className="body">
        {tab === 'list'
          ? <ListView items={list.items} onAdd={addItem} onToggle={toggleItem} onRemove={removeItem} />
          : <RecipesView onAddRecipe={addRecipe} />}
      </div>

      {showLists && (
        <ListsPanel
          lists={lists}
          currentId={currentId}
          onSwitch={switchList}
          onCreate={createList}
          onDelete={deleteList}
          onShare={shareList}
          onDuplicate={duplicateList}
          onRename={renameList}
          onClose={() => setShowLists(false)}
        />
      )}

      {pendingRecipe && (
        <AddToListModal
          recipe={pendingRecipe}
          lists={lists}
          onPick={(id) => addRecipeToList(pendingRecipe, id)}
          onClose={() => setPendingRecipe(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
