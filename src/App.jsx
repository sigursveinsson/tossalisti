import React, { useEffect, useState } from 'react'
import { store, isCloud } from './lib/store.js'
import { supabase } from './lib/supabaseClient.js'
import ListView from './components/ListView.jsx'
import RecipesView from './components/RecipesView.jsx'
import ListsPanel from './components/ListsPanel.jsx'
import AddToListModal from './components/AddToListModal.jsx'
import ShareModal from './components/ShareModal.jsx'
import ProfileSetup from './components/ProfileSetup.jsx'
import Dialog from './components/Dialog.jsx'
import Auth from './components/Auth.jsx'

const INVITE_TOKEN = new URLSearchParams(window.location.search).get('invite')
import { ingredientLine } from './data/recipes.js'
import { TEMPLATES } from './data/templates.js'
import { suggestChorePoints } from './data/chores.js'
import { departmentFor } from './data/products.js'

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
  const [members, setMembers] = useState([])
  const [sharing, setSharing] = useState(null)
  const [inviteDone, setInviteDone] = useState(false)
  const [completions, setCompletions] = useState([])
  const [dialog, setDialog] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(!isCloud)
  const [customProducts, setCustomProducts] = useState([])

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

  // Sækja prófíl notanda (nafn + litur)
  useEffect(() => {
    if (!isCloud || !session) return
    store.getMyProfile().then(p => { setProfile(p); setProfileLoaded(true) }).catch(() => setProfileLoaded(true))
  }, [session])

  const saveProfile = async (name, color) => {
    await store.updateProfile({ name, color })
    setProfile(p => ({ ...(p || {}), name, color }))
  }

  // Eigin vörur notanda (fyrir sjálfvirka flokkun)
  useEffect(() => {
    if (isCloud && !session) return
    store.getCustomProducts().then(setCustomProducts).catch(() => {})
  }, [session])

  // Meðlimir og afrek núverandi lista (ábyrgðarmenn + stigatafla)
  useEffect(() => {
    if (!currentId) { setMembers([]); setCompletions([]); return }
    store.getListMembers(currentId).then(setMembers).catch(() => setMembers([]))
    store.getCompletions(currentId).then(setCompletions).catch(() => setCompletions([]))
  }, [currentId])

  const list = lists.find(l => l.id === currentId) || null
  const customDept = Object.fromEntries(customProducts.map(p => [p.name, p.dept]))
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  // Taka við boðshlekk (?invite=token) eftir innskráningu
  useEffect(() => {
    if (!isCloud || !session || !INVITE_TOKEN || inviteDone) return
    setInviteDone(true)
    store.acceptInvite(INVITE_TOKEN)
      .then((listId) => {
        window.history.replaceState({}, '', window.location.pathname)
        return reload(listId).then(() => { setCurrentId(listId); setTab('list'); flash('Þú gekkst í listann!') })
      })
      .catch((e) => flash('Boð ógilt: ' + (e.message || '')))
  }, [session])

  const addItem = async (name, weekday, time) => {
    if (list.items.some(i => i.name === name.toLowerCase().trim())) { flash(name + ' er nú þegar á listanum'); return }
    const isChore = list.type === 'task' || list.type === 'schedule'
    const pts = isChore ? suggestChorePoints(name) : undefined
    const dept = list.type === 'shopping' ? (customDept[name.toLowerCase().trim()] || departmentFor(name)) : undefined
    await store.addItem(list.id, name, { points: pts, dept, weekday, time }); await reload(list.id)
  }
  const setDue = async (it, due) => { await store.setDue(list.id, it.id, due); await reload(list.id) }
  const setWeekday = async (it, wd) => { await store.setWeekday(list.id, it.id, wd); await reload(list.id) }
  const setTime = async (it, t) => { await store.setTime(list.id, it.id, t); await reload(list.id) }
  const recategorize = async (it, dept) => {
    await store.setItemDept(list.id, it.id, dept)
    try { await store.addCustomProduct(it.name, dept) } catch (e) { /* ekki bagalegt */ }
    await reload(list.id)
    store.getCustomProducts().then(setCustomProducts).catch(() => {})
  }
  const toggleItem = async (it) => {
    const wasDone = it.checked
    await store.toggleItem(list.id, it)
    await reload(list.id)
    store.getCompletions(list.id).then(setCompletions).catch(() => {})
    if (!wasDone && list.type === 'task') flash('+' + (it.points ?? 10) + ' stig 🎉')
  }
  const removeItem = async (it) => { await store.removeItem(list.id, it.id); await reload(list.id) }
  const assignItem = async (it, userId) => { await store.assignItem(list.id, it.id, userId); await reload(list.id) }
  const setPoints = async (it, pts) => { await store.setPoints(list.id, it.id, pts); await reload(list.id) }
  const setRecurrence = async (it, rec) => { await store.setRecurrence(list.id, it.id, rec); await reload(list.id) }

  const confirmAddRecipe = async (recipe, listId, lines) => {
    const target = lists.find(l => l.id === listId)
    const existing = new Set((target ? target.items : []).map(i => i.name))
    const toAdd = lines.filter(n => !existing.has(n.toLowerCase()))
    if (toAdd.length) await store.addManyItems(listId, toAdd)
    try { await store.recordRecipeUse(recipe.id) } catch (e) { /* ekki bagalegt */ }
    setPendingRecipe(null)
    setCurrentId(listId)
    await reload(listId)
    setTab('list')
    flash(toAdd.length
      ? `${toAdd.length} hráefni bætt á „${target ? target.name : ''}“`
      : 'Öll hráefni voru þegar á listanum')
  }
  // Opnar alltaf glugga þar sem hægt er að af-haka hráefni og velja lista.
  const addRecipe = (recipe, servings) => setPendingRecipe({ recipe, servings })

  const createList = async (name, type = 'shopping') => {
    const l = await store.createList(name, type)
    await reload(l.id); setShowLists(false); flash('Listinn „' + name + '“ búinn til')
  }
  const createFromTemplate = async (tpl) => {
    const l = await store.createList(tpl.name, tpl.type)
    if (tpl.items && tpl.items.length) await store.addManyItems(l.id, tpl.items)
    await reload(l.id); setShowLists(false); setTab('list'); flash('Listinn „' + tpl.name + '“ búinn til')
  }
  const switchList = async (id) => { setCurrentId(id); setShowLists(false); setTab('list') }
  const duplicateList = (l) => {
    const proposed = l.name + ' (afrit)'
    setDialog({
      title: 'Afrita lista', input: true, defaultValue: proposed, confirmLabel: 'Afrita',
      onConfirm: async (name) => {
        const nl = await store.duplicateList(l.id, (name || '').trim() || proposed)
        await reload(nl.id); setShowLists(false); flash('Listi afritaður')
      },
    })
  }
  const renameList = (l) => {
    setDialog({
      title: 'Endurnefna lista', input: true, defaultValue: l.name, confirmLabel: 'Vista',
      onConfirm: async (name) => {
        const trimmed = (name || '').trim()
        if (!trimmed || trimmed === l.name) return
        await store.renameList(l.id, trimmed); await reload(l.id); flash('Nafni breytt')
      },
    })
  }
  const signOut = async () => {
    if (isCloud) await supabase.auth.signOut()
    setSession(null); setLists([]); setCurrentId(null); setError(''); setLoading(false)
  }
  const deleteList = (l) => {
    if (lists.length <= 1) { flash('Þú þarft að eiga a.m.k. einn lista'); return }
    setDialog({
      title: 'Eyða lista?', message: 'Eyða „' + l.name + '"? Þetta er ekki hægt að afturkalla.', danger: true, confirmLabel: 'Eyða',
      onConfirm: async () => { await store.deleteList(l.id); await reload() },
    })
  }
  const openShare = (l) => {
    if (!isCloud) { flash('Deiling krefst innskráningar'); return }
    setSharing(l)
  }
  const inviteLink = async (l) => {
    try {
      const token = await store.createInvite(l.id)
      return window.location.origin + '/?invite=' + token
    } catch (e) { flash('Tókst ekki að búa til hlekk'); return '' }
  }
  const emailInvite = async (l, email) => {
    if (!email) return
    try { await store.shareList(l.id, email); await reload(l.id); setSharing(null); flash('Deilt með ' + email) }
    catch (e) { flash(e.message || 'Tókst ekki að deila') }
  }

  if (!authReady) return null
  if (isCloud && !session) return <Auth />
  if (isCloud && session && profileLoaded && (!profile || !profile.name)) {
    return <ProfileSetup initial={profile} onSave={saveProfile} />
  }
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
  const isShopping = list.type === 'shopping'
  const typeIcon = list.type === 'schedule' ? '📅' : list.type === 'task' ? '✅' : '🛒'
  const firstTabLabel = list.type === 'schedule' ? 'Skema' : list.type === 'task' ? 'Verkefni' : 'Innkaupalisti'

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true" style={{ flex: 'none' }}>
            <rect x="6" y="6" width="52" height="52" rx="14" fill="#ffffff" />
            <polyline points="20,33 29,42 45,24" fill="none" stroke="#f5a623" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <button className="listbtn" onClick={() => setShowLists(true)} title="Skipta um lista eða búa til nýjan">
            <span className="lists-ico">☰</span> {typeIcon} {list.name} <span className="chev">▾</span>
          </button>
          <span className="count">{open} eftir</span>
        </div>
        <div className="tabs">
          <button className={'tab' + (tab === 'list' ? ' active' : '')} onClick={() => setTab('list')}>{firstTabLabel}</button>
          {isShopping && <button className={'tab' + (tab === 'recipes' ? ' active' : '')} onClick={() => setTab('recipes')}>Uppskriftir</button>}
        </div>
      </div>
      <div className="body">
        {tab === 'recipes' && isShopping
          ? <RecipesView onAddRecipe={addRecipe} authorName={session?.user?.email || ''} />
          : <ListView items={list.items} listType={list.type} members={members} completions={completions} currentUserId={session?.user?.id} onAdd={addItem} onToggle={toggleItem} onRemove={removeItem} onAssign={assignItem} onSetPoints={setPoints} onSetRecurrence={setRecurrence} onRecategorize={recategorize} onSetDue={setDue} onSetWeekday={setWeekday} onSetTime={setTime} />}
      </div>

      {showLists && (
        <ListsPanel
          lists={lists}
          currentId={currentId}
          onSwitch={switchList}
          onCreate={createList}
          onDelete={deleteList}
          onShare={openShare}
          onDuplicate={duplicateList}
          onRename={renameList}
          templates={TEMPLATES}
          onCreateFromTemplate={createFromTemplate}
          userEmail={session?.user?.email}
          onSignOut={isCloud ? signOut : null}
          onClose={() => setShowLists(false)}
        />
      )}

      {sharing && (
        <ShareModal
          list={sharing}
          inviterName={profile?.name || session?.user?.email || ''}
          onInviteLink={inviteLink}
          onEmail={emailInvite}
          onClose={() => setSharing(null)}
        />
      )}

      {pendingRecipe && (
        <AddToListModal
          recipe={pendingRecipe.recipe}
          servings={pendingRecipe.servings}
          lists={lists}
          defaultListId={currentId}
          onConfirm={(listId, lines) => confirmAddRecipe(pendingRecipe.recipe, listId, lines)}
          onClose={() => setPendingRecipe(null)}
        />
      )}

      {dialog && (
        <Dialog
          {...dialog}
          onConfirm={(v) => { setDialog(null); dialog.onConfirm(v) }}
          onClose={() => setDialog(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
