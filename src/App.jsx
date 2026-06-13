import React, { useEffect, useState, useRef } from 'react'
import { store, isCloud } from './lib/store.js'
import { supabase } from './lib/supabaseClient.js'
import ListView from './components/ListView.jsx'
import HomeView from './components/HomeView.jsx'
import BudgetView from './components/BudgetView.jsx'
import BudgetIntro from './components/BudgetIntro.jsx'
import RecipesView from './components/RecipesView.jsx'
import SpendingView from './components/SpendingView.jsx'
import ReceiptScanner from './components/ReceiptScanner.jsx'
import AdminView from './components/AdminView.jsx'
import Onboarding from './components/Onboarding.jsx'
import ListsPanel from './components/ListsPanel.jsx'
import AddToListModal from './components/AddToListModal.jsx'
import ShareModal from './components/ShareModal.jsx'
import ProfileSetup from './components/ProfileSetup.jsx'
import Dialog from './components/Dialog.jsx'
import Auth from './components/Auth.jsx'
import { useBackClose } from './lib/backstack.js'

const INVITE_TOKEN = new URLSearchParams(window.location.search).get('invite')
const readHash = () => {
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const list = h.get('list') || null
  return { view: h.get('view') || (list ? 'list' : 'home'), list, tab: h.get('tab') || 'list' }
}
const HASH0 = readHash()
const startOfTodayISO = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }
const startOfWeekISO = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d.toISOString() }
// Kemur í veg fyrir tvöfaldan sjálfgefinn lista ef reload() keyrir tvisvar samtímis við innskráningu.
let defaultListPromise = null
import { ingredientLine } from './data/recipes.js'
import { TEMPLATES } from './data/templates.js'
import { suggestChorePoints, suggestChoreEmoji } from './data/chores.js'
import { makeEmojiImage } from './lib/img.js'
import { departmentFor } from './data/products.js'
import { matchListItems } from './lib/receipt.js'
import { celebrate, celebrateLevelUp } from './lib/celebrate.js'
import { totalPoints, levelFor } from './lib/gamify.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!isCloud)
  const [lists, setLists] = useState([])
  const [currentId, setCurrentId] = useState(HASH0.list)
  const [tab, setTab] = useState(HASH0.tab)
  const [view, setView] = useState(HASH0.view) // 'home' | 'list'
  const [homeSum, setHomeSum] = useState(null)
  const [homeUnseen, setHomeUnseen] = useState(false)
  const [showLists, setShowLists] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingRecipe, setPendingRecipe] = useState(null)
  const [members, setMembers] = useState([])
  const [kids, setKids] = useState([])
  const [sharing, setSharing] = useState(null)
  const [inviteDone, setInviteDone] = useState(false)
  const [completions, setCompletions] = useState([])
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [dialog, setDialog] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(!isCloud)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [customProducts, setCustomProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptListId, setReceiptListId] = useState(null) // bókhald: tengja kvittun við hóp
  const [showBudgetIntro, setShowBudgetIntro] = useState(false)

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
      // Deilum einni create-loforði svo samtímis-reload búi ekki til tvo lista.
      if (isCloud && all.length === 0) {
        if (!defaultListPromise) defaultListPromise = store.createList('Vikuinnkaup')
        await defaultListPromise
        all = await store.getLists()
      }
      setLists(all)
      setCurrentId(prev => {
        // Varðveita valinn lista við refresh: keepId → núverandi → listinn úr upphafsslóðinni.
        const want = keepId ?? prev ?? HASH0.list
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
    if (isCloud) loadHome()
  }, [session])

  // Heimaskjár: uppfæra við opnun og merkja virkni sem séða (ping hverfur).
  useEffect(() => {
    if (view !== 'home') return
    setShowLists(false) // tryggja að listavalmyndin sé lokuð á heimaskjá (t.d. við innskráningu)
    if (isCloud) loadHome()
  }, [view])
  // Bókhald: sýna kynningu í fyrsta sinn.
  useEffect(() => {
    if (view !== 'budget') return
    try { if (!localStorage.getItem('korfan.budgetintro')) setShowBudgetIntro(true) } catch (e) {}
  }, [view])
  useEffect(() => {
    if (view !== 'home' || !homeSum) return
    const latest = homeSum.feed && homeSum.feed[0] && homeSum.feed[0].at
    if (latest) { try { localStorage.setItem('korfan.home.seen', latest) } catch (e) {} }
    setHomeUnseen(false)
  }, [view, homeSum])

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

  // Leiðsögn fyrir nýja notendur (fyrsta heimsókn)
  useEffect(() => {
    if (isCloud && (!session || !profile || !profile.name)) return
    try { if (!localStorage.getItem('korfan.onboarded')) setShowOnboarding(true) } catch (e) {}
  }, [session, profile])
  const finishOnboarding = () => {
    try { localStorage.setItem('korfan.onboarded', '1') } catch (e) {}
    setShowOnboarding(false)
  }

  const saveProfile = async (name, color) => {
    await store.updateProfile({ name, color })
    setProfile(p => ({ ...(p || {}), name, color }))
  }

  // Eigin vörur notanda (fyrir sjálfvirka flokkun)
  useEffect(() => {
    if (isCloud && !session) return
    store.getCustomProducts().then(setCustomProducts).catch(() => {})
  }, [session])

  // Kvittanir / eyðsla
  const loadPurchases = () => store.getPurchases().then(setPurchases).catch(() => setPurchases([]))
  useEffect(() => {
    if (isCloud && !session) return
    loadPurchases()
  }, [session])

  // Sameiginlegur vörubanki (myndir úr skönnun)
  const [catalog, setCatalog] = useState({})
  useEffect(() => {
    if (isCloud && !session) return
    store.getCatalogImages().then(rows => {
      const m = {}
      for (const r of rows) if (r.image_url) m[r.name_norm] = r.image_url
      setCatalog(m)
    }).catch(() => {})
  }, [session])

  const saveToCatalog = ({ barcode, name, image, dept }) => {
    if (!name) return
    store.upsertCatalog({ barcode, name, image: image || null, dept: dept || departmentFor(name) }).catch(() => {})
    if (image) setCatalog(prev => ({ ...prev, [name.toLowerCase().trim()]: image }))
  }
  const catalogLookup = (code) => store.lookupCatalogBarcode(code).catch(() => null)

  // Meðlimir, krakkar og afrek núverandi lista (ábyrgðarmenn + stigatafla)
  const loadHome = () => store.homeSummary().then(d => {
    const data = d || { week_points: 0, week_done: 0, feed: [] }
    setHomeSum(data)
    const latest = (data.feed && data.feed[0] && data.feed[0].at) || ''
    let seen = ''
    try { seen = localStorage.getItem('korfan.home.seen') || '' } catch (e) {}
    setHomeUnseen(!!latest && latest > seen)
  }).catch(() => setHomeSum({ week_points: 0, week_done: 0, feed: [] }))

  const loadKids = (id) => store.getKids(id).then(setKids).catch(() => setKids([]))
  const loadRewards = (id) => store.getRewards(id).then(setRewards).catch(() => setRewards([]))
  const loadRedemptions = (id) => store.getRedemptions(id).then(setRedemptions).catch(() => setRedemptions([]))
  useEffect(() => {
    if (!currentId) { setMembers([]); setKids([]); setCompletions([]); setRewards([]); setRedemptions([]); return }
    store.getListMembers(currentId).then(setMembers).catch(() => setMembers([]))
    loadKids(currentId)
    store.getCompletions(currentId).then(setCompletions).catch(() => setCompletions([]))
    loadRewards(currentId)
    loadRedemptions(currentId)
  }, [currentId])

  // Sameinaður listi af „fólki": innskráðir meðlimir + krakka-prófílar.
  const people = [
    ...members.map(m => ({ kind: 'user', id: m.user_id, name: m.name || null, email: m.email || null, color: m.color || null })),
    ...kids.map(k => ({ kind: 'kid', id: k.id, name: k.name, color: k.color || null, avatar_url: k.avatar_url || null })),
  ]

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

  // ---- Vafrasaga fyrir lista/flipa: refresh heldur sér, back/forward virkar ----
  const navRef = useRef({ first: true, fromPop: false })
  const currentIdRef = useRef(currentId); currentIdRef.current = currentId
  const tabRef = useRef(tab); tabRef.current = tab
  const viewRef = useRef(view); viewRef.current = view
  const restoredRef = useRef(false)

  // Örugg endurheimt: þegar listar hafa hlaðist, gakktu úr skugga um að valinn listi
  // sé sá úr upphafsslóðinni (varnar race í reload sem gæti fallið á all[0]).
  useEffect(() => {
    if (restoredRef.current || !lists.length) return
    restoredRef.current = true
    navRef.current.fromPop = true // ekki búa til nýja sögufærslu við endurheimt
    setView(HASH0.view)
    if (HASH0.list && lists.some(l => l.id === HASH0.list)) {
      setCurrentId(HASH0.list)
      setTab(HASH0.tab)
    }
  }, [lists])

  // Skrifa lista/flipa í slóðina. pushState við notenda-skipti (svo back/forward virki),
  // en replaceState við fyrstu hleðslu og þegar breytingin kom frá back/forward sjálfu.
  useEffect(() => {
    let next
    if (view === 'home') next = '#view=home'
    else if (view === 'budget') next = '#view=budget'
    else if (currentId) {
      const p = new URLSearchParams()
      p.set('list', currentId)
      if (tab && tab !== 'list') p.set('tab', tab)
      next = '#' + p.toString()
    } else next = '#view=home'
    if (window.location.hash === next) { navRef.current.first = false; navRef.current.fromPop = false; return }
    if (navRef.current.first || navRef.current.fromPop) {
      window.history.replaceState(window.history.state, '', next)
    } else {
      window.history.pushState(window.history.state, '', next)
    }
    navRef.current.first = false
    navRef.current.fromPop = false
  }, [view, currentId, tab])

  // Back/forward: lesa lista/flipa úr slóðinni. Gluggar breyta ekki hash-inu, svo þetta
  // truflar ekki glugga-bakkstaflann (backstack.js) — hash breytist bara við listaskipti.
  useEffect(() => {
    const onPop = () => {
      const h = readHash()
      if (h.view !== viewRef.current || h.list !== currentIdRef.current || h.tab !== tabRef.current) {
        navRef.current.fromPop = true
        setView(h.view)
        if (h.list) setCurrentId(h.list)
        setTab(h.tab)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Vélræni „til baka"-hnappurinn lokar opnum glugga í stað þess að fara úr appinu.
  // Athugið: listavalmyndin er VILJANDI ekki í bakkstaflanum — listaskipti nota
  // vafrasöguna (pushState) og það myndi kapphlaupa við glugga-bakk. Hún lokast
  // samt með X eða með því að smella utan á hana.
  useBackClose(!!sharing, () => setSharing(null))
  useBackClose(!!pendingRecipe, () => setPendingRecipe(null))
  useBackClose(!!dialog, () => setDialog(null))
  // ReceiptScanner skráir sig sjálfur í bakk-staflann (engin tvískráning hér).

  const addItem = async (name, weekday, time, assignee, image, scannedDept) => {
    if (list.items.some(i => i.name === name.toLowerCase().trim())) { flash(name + ' er nú þegar á listanum'); return }
    const isChore = list.type === 'task' || list.type === 'schedule'
    const pts = isChore ? suggestChorePoints(name) : undefined
    const dept = list.type === 'shopping' ? (customDept[name.toLowerCase().trim()] || scannedDept || departmentFor(name)) : undefined
    // Stinga upp á tákni fyrir verk (fyrir þá sem ekki lesa) ef ekkert var valið
    let img = image
    if (isChore && !img) { const e = suggestChoreEmoji(name); if (e) img = makeEmojiImage(e) }
    await store.addItem(list.id, name, { points: pts, dept, weekday, time, assignee, image: img }); await reload(list.id)
  }
  // Skema sem áþreifanleg vika: býr til sjálfstæð verk (daglega = 7 línur, eitt per dag).
  const addSchedule = async (name, days, time, person, image) => {
    if (!list) return
    const pts = suggestChorePoints(name)
    let img = image
    if (!img) { const e = suggestChoreEmoji(name); if (e) img = makeEmojiImage(e) }
    await store.addScheduleTasks(list.id, name, { days, time, assignee: person, points: pts, image: img })
    await reload(list.id)
  }
  // Byrja nýja viku: af-haka allt en halda stigasögu (afrekum).
  const newWeek = async () => {
    if (!list) return
    await store.resetWeek(list.id)
    await reload(list.id)
    store.getCompletions(list.id).then(setCompletions).catch(() => {})
    flash('Ný vika — allt af-hakað ✓')
  }
  const savePurchase = async (purchase) => {
    await store.addPurchase({ ...purchase, list_id: list?.id || null })
    // Merkja vörur á listanum sem keyptar ef þær passa við kvittunina
    if (list && list.type === 'shopping') {
      const ids = matchListItems(list.items, purchase.items)
      const toCheck = list.items.filter(i => ids.includes(i.id) && !i.checked)
      for (const it of toCheck) { try { await store.toggleItem(list.id, it) } catch (e) {} }
      if (toCheck.length) { await reload(list.id); flash(toCheck.length + ' vörur merktar keyptar ✓') }
    }
    await loadPurchases()
  }
  // Skrá kvittun beint úr listavalmynd (engin tenging við ákveðinn lista)
  const scanReceiptMenu = async (purchase) => {
    await store.addPurchase({ ...purchase, list_id: receiptListId || null })
    await loadPurchases()
    setShowReceipt(false); setReceiptListId(null)
    flash('Kvittun skráð ✓')
  }
  const deletePurchase = async (id) => { await store.deletePurchase(id); await loadPurchases() }
  const updatePurchase = async (id, patch) => { await store.updatePurchase(id, patch); await loadPurchases() }
  const setPurchaseCat = async (id, cat) => { await store.setPurchaseCategory(id, cat); await loadPurchases() }
  const setQty = async (it, qty) => { await store.setQty(list.id, it.id, qty); await reload(list.id) }
  const setDue = async (it, due) => { await store.setDue(list.id, it.id, due); await reload(list.id) }
  const setWeekday = async (it, wd) => { await store.setWeekday(list.id, it.id, wd); await reload(list.id) }
  const setTime = async (it, t) => { await store.setTime(list.id, it.id, t); await reload(list.id) }
  const recategorize = async (it, dept) => {
    await store.setItemDept(list.id, it.id, dept)
    try { await store.addCustomProduct(it.name, dept) } catch (e) { /* ekki bagalegt */ }
    await reload(list.id)
    store.getCustomProducts().then(setCustomProducts).catch(() => {})
  }
  const myId = isCloud ? session?.user?.id : 'me'
  const personOf = (it) => it.assignee_kid
    ? { kind: 'kid', id: it.assignee_kid }
    : { kind: 'user', id: it.assignee || myId }
  // Fögnuður þegar verk klárast: konfetti/hljóð + stig, og auka-fögnuður við level-up.
  const cheerCompletion = (it) => {
    const pts = it.points ?? 10
    const person = personOf(it)
    const before = totalPoints(completions, person)
    const crossed = levelFor(before).level !== levelFor(before + pts).level
    if (crossed) { celebrateLevelUp(); flash('🎉 Nýtt borð: ' + levelFor(before + pts).title + '!') }
    else { celebrate(pts); flash('+' + pts + ' stig 🎉') }
  }
  const toggleItem = async (it, done) => {
    const isChore = list.type === 'task' || list.type === 'schedule'
    const recurring = it.recurrence && it.recurrence !== 'none'
    if (recurring) {
      if (done) {
        await store.uncompleteItem(list.id, it, it.recurrence === 'daily' ? startOfTodayISO() : startOfWeekISO())
      } else {
        await store.completeItem(list.id, it)
        cheerCompletion(it)
      }
    } else {
      const wasDone = it.checked
      await store.toggleItem(list.id, it)
      if (!wasDone && isChore) cheerCompletion(it)
    }
    await reload(list.id)
    store.getCompletions(list.id).then(setCompletions).catch(() => {})
  }
  const removeItem = async (it) => { await store.removeItem(list.id, it.id); await reload(list.id) }
  const assignItem = async (it, person) => { await store.assignItem(list.id, it.id, person); await reload(list.id) }
  const setPoints = async (it, pts) => { await store.setPoints(list.id, it.id, pts); await reload(list.id) }
  const setRecurrence = async (it, rec) => { await store.setRecurrence(list.id, it.id, rec); await reload(list.id) }
  const setItemImage = async (it, image) => { await store.setItemImage(list.id, it.id, image); await reload(list.id) }
  const createKid = async (data) => { await store.createKid(list.id, data); await loadKids(list.id) }
  const updateKid = async (id, patch) => { await store.updateKid(id, patch); await loadKids(list.id) }
  const deleteKid = async (id) => { await store.deleteKid(id); await loadKids(list.id); await reload(list.id) }
  const createReward = async (data) => { await store.createReward(list.id, data); await loadRewards(list.id) }
  const updateReward = async (id, patch) => { await store.updateReward(id, patch); await loadRewards(list.id) }
  const deleteReward = async (id) => { await store.deleteReward(id); await loadRewards(list.id) }
  const redeemReward = async (reward, person) => {
    await store.redeemReward(list.id, reward, person)
    await loadRedemptions(list.id)
    celebrate(20); flash('🎁 ' + reward.title + ' leyst út!')
  }
  const deleteRedemption = async (id) => { await store.deleteRedemption(id); await loadRedemptions(list.id) }

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
  const switchList = async (id) => { setView('list'); setCurrentId(id); setShowLists(false); setTab('list') }
  const goHome = () => { setView('home') }
  const goBudget = () => { setView('budget') }
  // Bókhaldssýn: ný útgjaldafærsla er persónuleg (engum lista tengd).
  const addExpense = async (data) => { await store.addPurchase({ ...data, list_id: null }); await loadPurchases() }
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
  if (!list && view !== 'home' && view !== 'budget') return (
    <div className="empty">
      <p>Enginn listi enn.</p>
      <button
        onClick={() => createList('Vikuinnkaup')}
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 15, fontWeight: 600 }}
      >Búa til lista</button>
    </div>
  )

  const showHome = view === 'home'
  const showBudget = view === 'budget'
  const isBudget = list?.type === 'budget'
  const open = list ? list.items.filter(i => !i.checked).length : 0
  const isAdmin = isCloud && session?.user?.email === 'sigursveinsson@gmail.com'
  const isShopping = list?.type === 'shopping'
  const typeIcon = list?.type === 'schedule' ? '📅' : list?.type === 'task' ? '✅' : list?.type === 'budget' ? '📒' : '🛒'
  const firstTabLabel = list?.type === 'schedule' ? 'Skema' : list?.type === 'task' ? 'Verkefni' : list?.type === 'budget' ? 'Bókhald' : 'Innkaupalisti'

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true" style={{ flex: 'none' }}>
            <rect x="6" y="6" width="52" height="52" rx="14" fill="#ffffff" />
            <polyline points="20,33 29,42 45,24" fill="none" stroke="#f5a623" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showHome ? (
            <button className="listbtn" onClick={() => setShowLists(true)} title="Listarnir mínir">
              <span className="lists-ico">☰</span> Heim <span className="chev">▾</span>
            </button>
          ) : showBudget ? (
            <>
              <button className="home-btn" onClick={goHome} title="Heim" aria-label="Heim">🏠{homeUnseen && <span className="home-ping" />}</button>
              <button className="curtitle" onClick={() => setShowLists(true)} title="Listarnir mínir">📒 Bókhald</button>
            </>
          ) : (
            <>
              <button className="home-btn" onClick={goHome} title="Heim" aria-label="Heim">🏠{homeUnseen && <span className="home-ping" />}</button>
              <button className="curtitle" onClick={() => setShowLists(true)} title="Skipta um lista">{typeIcon} {list.name}</button>
              {!isBudget && <span className="count">{open} eftir</span>}
              {isBudget && <span className="count">📒</span>}
              <button className="switch-btn" onClick={() => setShowLists(true)} title="Skipta um lista eða búa til nýjan" aria-label="Skipta um lista"><span className="lists-ico">☰</span><span className="chev">▾</span></button>
            </>
          )}
          {isAdmin && <button className="admin-btn" onClick={() => setShowAdmin(true)} title="Stjórnborð">📊</button>}
        </div>
        {!showHome && !showBudget && !isBudget && (
          <div className="tabs">
            <button className={'tab' + (tab === 'list' ? ' active' : '')} onClick={() => setTab('list')}>{firstTabLabel}</button>
            {isShopping && <button className={'tab' + (tab === 'recipes' ? ' active' : '')} onClick={() => setTab('recipes')}>Uppskriftir</button>}
            {isShopping && <button className={'tab' + (tab === 'spending' ? ' active' : '')} onClick={() => setTab('spending')}>Útgjöld</button>}
          </div>
        )}
      </div>
      <div className="body">
        {showHome
          ? <HomeView name={profile?.name || (session?.user?.email || '').split('@')[0]} summary={homeSum} lists={lists} purchases={purchases} onOpenList={switchList} onOpenSpending={goBudget} />
          : showBudget
          ? <BudgetView purchases={purchases} members={people} currentUserId={myId} onSave={addExpense} onUpdate={updatePurchase} onDelete={deletePurchase} onSetCategory={setPurchaseCat} onScanReceipt={() => { setReceiptListId(null); setShowReceipt(true) }} />
          : tab === 'recipes' && isShopping
            ? <RecipesView onAddRecipe={addRecipe} authorName={session?.user?.email || ''} />
            : tab === 'spending' && isShopping
              ? <SpendingView purchases={purchases} onSave={savePurchase} onDelete={deletePurchase} onUpdate={updatePurchase} />
              : <ListView items={list.items} listId={list.id} listType={list.type} members={people} kids={kids} completions={completions} rewards={rewards} redemptions={redemptions} currentUserId={myId} catalog={catalog} onCatalog={saveToCatalog} onCatalogLookup={catalogLookup} onSetQty={setQty} onAdd={addItem} onToggle={toggleItem} onRemove={removeItem} onAssign={assignItem} onSetPoints={setPoints} onSetRecurrence={setRecurrence} onSetItemImage={setItemImage} onAddSchedule={addSchedule} onNewWeek={newWeek} onCreateKid={createKid} onUpdateKid={updateKid} onDeleteKid={deleteKid} onCreateReward={createReward} onUpdateReward={updateReward} onDeleteReward={deleteReward} onRedeemReward={redeemReward} onDeleteRedemption={deleteRedemption} onRecategorize={recategorize} onSetDue={setDue} onSetWeekday={setWeekday} onSetTime={setTime} />}
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
          onScanReceipt={() => { setShowLists(false); setReceiptListId(null); setShowReceipt(true) }}
          onOpenBudget={() => { setShowLists(false); goBudget() }}
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

      {showReceipt && <ReceiptScanner onSave={scanReceiptMenu} onClose={() => { setShowReceipt(false); setReceiptListId(null) }} />}

      {showBudgetIntro && (
        <BudgetIntro
          onScan={() => { try { localStorage.setItem('korfan.budgetintro', '1') } catch (e) {}; setShowBudgetIntro(false); setReceiptListId(null); setShowReceipt(true) }}
          onClose={() => { try { localStorage.setItem('korfan.budgetintro', '1') } catch (e) {}; setShowBudgetIntro(false) }}
        />
      )}

      {showAdmin && <AdminView onClose={() => setShowAdmin(false)} />}

      {showOnboarding && <Onboarding onClose={finishOnboarding} onInvite={() => list && openShare(list)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
