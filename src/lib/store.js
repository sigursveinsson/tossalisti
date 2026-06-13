// Gagnalag appsins. Eitt viðmót, tvær útfærslur:
//  - Staðbundið (localStorage): virkar strax, engin uppsetning.
//  - Ský (Supabase): margir notendur, deiling, rauntíma-samstilling.
import { supabase, isCloud } from './supabaseClient.js'
import { departmentFor } from '../data/products.js'

const LS_KEY = 'korfan.lists.v1'
const KIDS_KEY = 'korfan.kids'
const uid = () => Math.random().toString(36).slice(2, 10)

// Tilvísun á einstakling: annað hvort innskráður notandi eða krakka-prófíll.
//  - null/undefined  → enginn
//  - strengur        → notanda-id (eldri kallanir)
//  - { kind, id }     → 'user' eða 'kid'
function personRef(ref) {
  if (!ref) return { user: null, kid: null }
  if (typeof ref === 'string') return { user: ref, kid: null }
  if (ref.kind === 'kid') return { user: null, kid: ref.id }
  return { user: ref.id || null, kid: null }
}

/* ---------------- Staðbundið (localStorage) ---------------- */
function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null } catch { return null }
}
function lsWrite(lists) { localStorage.setItem(LS_KEY, JSON.stringify(lists)) }

function lsSeed() {
  const lists = [
    {
      id: uid(), name: 'Vikuinnkaup', type: 'shopping', created_at: Date.now(), shared: false,
      items: [
        { id: uid(), name: 'mjólk', dept: 'dairy', checked: false },
        { id: uid(), name: 'banani', dept: 'produce', checked: false },
        { id: uid(), name: 'kjúklingabringur', dept: 'meat', checked: false },
        { id: uid(), name: 'kaffi', dept: 'pantry', checked: true },
      ],
    },
    { id: uid(), name: 'Matarboð', type: 'shopping', created_at: Date.now() + 1, shared: false, items: [] },
    { id: uid(), name: 'Verkefni heima', type: 'task', created_at: Date.now() + 2, shared: false, items: [] },
  ]
  lsWrite(lists)
  return lists
}

const local = {
  async getLists() { return lsRead() || lsSeed() },
  async createList(name, type = 'shopping') {
    const lists = lsRead() || []
    const list = { id: uid(), name, type, created_at: Date.now(), shared: false, items: [] }
    lsWrite([...lists, list]); return list
  },
  async deleteList(id) { lsWrite((lsRead() || []).filter(l => l.id !== id)) },
  async addItem(listId, name, opts = {}) {
    const { points, dept, weekday, time, assignee, image } = opts
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    const n = name.toLowerCase().trim()
    if (list.items.some(i => i.name === n)) return
    const rec = weekday === 'daily' ? 'daily' : (weekday ? 'weekly' : 'none')
    const a = personRef(assignee)
    list.items.push({ id: uid(), name: n, dept: dept || departmentFor(name), checked: false, qty: 1, points: points ?? 10, recurrence: rec, weekday: weekday || null, time: time || null, assignee: a.user, assignee_kid: a.kid, due_at: null, completed_by: null, completed_by_kid: null, image_url: image || null })
    lsWrite(lists)
  },
  async setItemDept(listId, itemId, dept) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.dept = dept; lsWrite(lists) }
  },
  async setQty(listId, itemId, qty) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.qty = Math.max(1, qty); lsWrite(lists) }
  },
  async lookupCatalogBarcode(barcode) {
    const c = JSON.parse(localStorage.getItem('korfan.catalog') || '{}')
    for (const v of Object.values(c)) { if (v.barcode && String(v.barcode) === String(barcode)) return { name: v.name, image: v.image || null, dept: v.dept || null } }
    return null
  },
  async setDue(listId, itemId, due) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.due_at = due || null; lsWrite(lists) }
  },
  async setWeekday(listId, itemId, weekday) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.weekday = weekday; it.recurrence = weekday === 'daily' ? 'daily' : 'weekly'; lsWrite(lists) }
  },
  async setTime(listId, itemId, time) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.time = time || null; lsWrite(lists) }
  },
  async getCustomProducts() { return JSON.parse(localStorage.getItem('korfan.customprod') || '[]') },
  async addCustomProduct(name, dept) {
    const list = JSON.parse(localStorage.getItem('korfan.customprod') || '[]').filter(p => p.name !== name.toLowerCase().trim())
    list.push({ name: name.toLowerCase().trim(), dept })
    localStorage.setItem('korfan.customprod', JSON.stringify(list))
  },
  async toggleItem(listId, item) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === item.id)
    if (!it) return
    const recurring = it.recurrence && it.recurrence !== 'none'
    const kidId = it.assignee_kid || null
    if (recurring) { it.checked = false; lsWrite(lists); return }
    const comp = JSON.parse(localStorage.getItem('korfan.comp') || '[]')
    if (!it.checked) {
      it.checked = true; it.completed_by = kidId ? null : 'me'; it.completed_by_kid = kidId
      lsWrite(lists)
      comp.push({ list_id: listId, item_id: it.id, user_id: kidId ? null : 'me', kid_id: kidId, points: it.points ?? 10, completed_at: new Date().toISOString() })
    } else {
      it.checked = false; it.completed_by = null; it.completed_by_kid = null
      lsWrite(lists)
      for (let i = comp.length - 1; i >= 0; i--) { if (comp[i].item_id === it.id) { comp.splice(i, 1); break } }
    }
    localStorage.setItem('korfan.comp', JSON.stringify(comp))
  },
  async setPoints(listId, itemId, points) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.points = points; lsWrite(lists) }
  },
  async setRecurrence(listId, itemId, recurrence) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.recurrence = recurrence; lsWrite(lists) }
  },
  async getCompletions(listId) {
    return (JSON.parse(localStorage.getItem('korfan.comp') || '[]')).filter(c => c.list_id === listId)
  },
  async completeItem(listId, item) {
    const kidId = item.assignee_kid || null
    const comp = JSON.parse(localStorage.getItem('korfan.comp') || '[]')
    comp.push({ list_id: listId, item_id: item.id, user_id: kidId ? null : 'me', kid_id: kidId, points: item.points ?? 10, completed_at: new Date().toISOString() })
    localStorage.setItem('korfan.comp', JSON.stringify(comp))
  },
  async uncompleteItem(listId, item, sinceISO) {
    const comp = JSON.parse(localStorage.getItem('korfan.comp') || '[]')
      .filter(c => !(c.item_id === item.id && c.completed_at >= sinceISO))
    localStorage.setItem('korfan.comp', JSON.stringify(comp))
  },
  async removeItem(listId, itemId) {
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    list.items = list.items.filter(i => i.id !== itemId); lsWrite(lists)
  },
  async addManyItems(listId, names) { for (const n of names) await local.addItem(listId, n) },
  async getPurchases() {
    const all = JSON.parse(localStorage.getItem('korfan.purchases') || '[]')
    return all.sort((a, b) => (b.purchased_at || '').localeCompare(a.purchased_at || ''))
  },
  async addPurchase(p) {
    const all = JSON.parse(localStorage.getItem('korfan.purchases') || '[]')
    const rec = {
      id: uid(), list_id: p.list_id || null, store: p.store || '',
      purchased_at: p.purchased_at || new Date().toISOString().slice(0, 10),
      total: p.total ?? null, category: p.category || null, user_id: 'me',
      items: (p.items || []).map(i => ({ id: uid(), name: i.name, price: i.price ?? null, qty: i.qty ?? null, category: i.category || null })),
    }
    all.push(rec); localStorage.setItem('korfan.purchases', JSON.stringify(all)); return rec
  },
  async deletePurchase(id) {
    const all = JSON.parse(localStorage.getItem('korfan.purchases') || '[]').filter(p => p.id !== id)
    localStorage.setItem('korfan.purchases', JSON.stringify(all))
  },
  async updatePurchase(id, patch) {
    const all = JSON.parse(localStorage.getItem('korfan.purchases') || '[]')
    const p = all.find(x => x.id === id)
    if (!p) return
    if (patch.store != null) p.store = patch.store
    if (patch.purchased_at) p.purchased_at = patch.purchased_at
    if (patch.total !== undefined) p.total = patch.total
    if (patch.category !== undefined) p.category = patch.category
    if (patch.items) p.items = patch.items
    localStorage.setItem('korfan.purchases', JSON.stringify(all))
  },
  async setPurchaseCategory(id, category) {
    const all = JSON.parse(localStorage.getItem('korfan.purchases') || '[]')
    const p = all.find(x => x.id === id); if (!p) return
    p.category = category || null
    localStorage.setItem('korfan.purchases', JSON.stringify(all))
  },
  async setItemCategory(itemId, category) {
    const all = JSON.parse(localStorage.getItem('korfan.purchases') || '[]')
    for (const p of all) { const it = (p.items || []).find(i => i.id === itemId); if (it) { it.category = category || null; break } }
    localStorage.setItem('korfan.purchases', JSON.stringify(all))
  },
  async upsertCatalog({ barcode, name, image, dept } = {}) {
    if (!name) return
    const c = JSON.parse(localStorage.getItem('korfan.catalog') || '{}')
    c[name.toLowerCase().trim()] = { image: image || null, barcode: barcode || null, dept: dept || null, name }
    localStorage.setItem('korfan.catalog', JSON.stringify(c))
  },
  async getCatalogImages() {
    const c = JSON.parse(localStorage.getItem('korfan.catalog') || '{}')
    return Object.entries(c).map(([name_norm, v]) => ({ name_norm, image_url: v.image }))
  },
  async getGenericImages() {
    const g = JSON.parse(localStorage.getItem('korfan.generic') || '{}')
    return Object.entries(g).filter(([, v]) => v).map(([name_norm, image_url]) => ({ name_norm, image_url }))
  },
  async ensureGenericImage() { return null },
  async adminStats() { return null },
  async adminActivity() { return [] },
  async homeSummary() { return { week_points: 0, week_done: 0, feed: [] } },
  async duplicateList(id, name) {
    const lists = lsRead() || []
    const src = lists.find(l => l.id === id)
    const nl = {
      id: uid(), name: name || ((src ? src.name : 'Listi') + ' (afrit)'),
      type: src ? src.type : 'shopping', created_at: Date.now(), shared: false,
      items: (src ? src.items : []).map(i => ({ id: uid(), name: i.name, dept: i.dept, checked: false })),
    }
    lsWrite([...lists, nl]); return nl
  },
  async renameList(id, name) {
    const lists = lsRead() || []
    const l = lists.find(x => x.id === id); if (l) { l.name = name; lsWrite(lists) }
  },
  async recordRecipeUse(recipeId) {
    const u = JSON.parse(localStorage.getItem('korfan.uses') || '{}')
    u[recipeId] = (u[recipeId] || 0) + 1
    localStorage.setItem('korfan.uses', JSON.stringify(u))
  },
  async getMyRecipeUses() {
    const u = JSON.parse(localStorage.getItem('korfan.uses') || '{}')
    return Object.entries(u).map(([recipe_id, uses]) => ({ recipe_id, uses }))
  },
  async getPopular() {
    const u = JSON.parse(localStorage.getItem('korfan.uses') || '{}')
    return Object.entries(u).map(([recipe_id, total]) => ({ recipe_id, total }))
  },
  async getRatingStats() {
    const r = JSON.parse(localStorage.getItem('korfan.ratings') || '{}')
    return Object.entries(r).map(([recipe_id, stars]) => ({ recipe_id, avg_stars: stars, num: 1 }))
  },
  async getMyRatings() {
    const r = JSON.parse(localStorage.getItem('korfan.ratings') || '{}')
    return Object.entries(r).map(([recipe_id, stars]) => ({ recipe_id, stars }))
  },
  async rateRecipe(recipeId, stars) {
    const r = JSON.parse(localStorage.getItem('korfan.ratings') || '{}')
    r[recipeId] = stars
    localStorage.setItem('korfan.ratings', JSON.stringify(r))
  },
  async getRecipes() {
    return (JSON.parse(localStorage.getItem('korfan.recipes') || '[]')).map(r => ({ ...r, custom: true, mine: true }))
  },
  async createRecipe(data) {
    const list = JSON.parse(localStorage.getItem('korfan.recipes') || '[]')
    const r = { id: uid(), ...data }
    list.unshift(r); localStorage.setItem('korfan.recipes', JSON.stringify(list))
    return r
  },
  async deleteRecipe(id) {
    const list = JSON.parse(localStorage.getItem('korfan.recipes') || '[]').filter(r => r.id !== id)
    localStorage.setItem('korfan.recipes', JSON.stringify(list))
  },
  async getListMembers() { return [{ user_id: 'me', name: 'Ég' }] },
  async getKids(listId) {
    return (JSON.parse(localStorage.getItem(KIDS_KEY) || '[]')).filter(k => k.list_id === listId)
  },
  async createKid(listId, { name, color, avatar_url } = {}) {
    const kids = JSON.parse(localStorage.getItem(KIDS_KEY) || '[]')
    const k = { id: uid(), list_id: listId, name: (name || '').trim(), color: color || null, avatar_url: avatar_url || null }
    kids.push(k); localStorage.setItem(KIDS_KEY, JSON.stringify(kids)); return k
  },
  async updateKid(id, patch = {}) {
    const kids = JSON.parse(localStorage.getItem(KIDS_KEY) || '[]')
    const k = kids.find(x => x.id === id); if (!k) return
    if (patch.name != null) k.name = patch.name.trim()
    if (patch.color !== undefined) k.color = patch.color
    if (patch.avatar_url !== undefined) k.avatar_url = patch.avatar_url
    localStorage.setItem(KIDS_KEY, JSON.stringify(kids))
  },
  async deleteKid(id) {
    const kids = JSON.parse(localStorage.getItem(KIDS_KEY) || '[]').filter(x => x.id !== id)
    localStorage.setItem(KIDS_KEY, JSON.stringify(kids))
  },
  async setItemImage(listId, itemId, image) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.image_url = image || null; lsWrite(lists) }
  },
  // ---- Skema sem áþreifanleg vika (staðbundið) ----
  // Býr til sjálfstæð verk (recurrence 'none') — daglega = ein lína á hvern valinn dag.
  async addScheduleTasks(listId, name, { days = ['mon'], time, assignee, points, image } = {}) {
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    const n = (name || '').toLowerCase().trim(); if (!n) return
    const a = personRef(assignee)
    for (const wd of days) {
      list.items.push({ id: uid(), name: n, dept: 'other', checked: false, qty: 1, points: points ?? 10, recurrence: 'none', weekday: wd, time: time || null, assignee: a.user, assignee_kid: a.kid, due_at: null, completed_by: null, completed_by_kid: null, image_url: image || null })
    }
    lsWrite(lists)
  },
  // Byrja nýja viku: af-haka öll verk en halda afrekum (stigasögu).
  async resetWeek(listId) {
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    for (const it of list.items) { it.checked = false; it.completed_by = null; it.completed_by_kid = null }
    lsWrite(lists)
  },
  // ---- Verðlaunabúð (staðbundið) ----
  async getRewards(listId) {
    return (JSON.parse(localStorage.getItem('korfan.rewards') || '[]')).filter(r => r.list_id === listId && r.active !== false)
  },
  async createReward(listId, { title, emoji, cost } = {}) {
    const all = JSON.parse(localStorage.getItem('korfan.rewards') || '[]')
    const r = { id: uid(), list_id: listId, title: (title || '').trim(), emoji: emoji || null, cost: Math.max(0, cost ?? 50), active: true }
    all.push(r); localStorage.setItem('korfan.rewards', JSON.stringify(all)); return r
  },
  async updateReward(id, patch = {}) {
    const all = JSON.parse(localStorage.getItem('korfan.rewards') || '[]')
    const r = all.find(x => x.id === id); if (!r) return
    if (patch.title != null) r.title = patch.title.trim()
    if (patch.emoji !== undefined) r.emoji = patch.emoji
    if (patch.cost != null) r.cost = Math.max(0, patch.cost)
    if (patch.active !== undefined) r.active = patch.active
    localStorage.setItem('korfan.rewards', JSON.stringify(all))
  },
  async deleteReward(id) {
    localStorage.setItem('korfan.rewards', JSON.stringify(
      (JSON.parse(localStorage.getItem('korfan.rewards') || '[]')).filter(r => r.id !== id)))
  },
  async getRedemptions(listId) {
    return (JSON.parse(localStorage.getItem('korfan.redemptions') || '[]')).filter(r => r.list_id === listId)
  },
  async redeemReward(listId, reward, person) {
    const all = JSON.parse(localStorage.getItem('korfan.redemptions') || '[]')
    const a = personRef(person)
    const rec = { id: uid(), list_id: listId, reward_id: reward.id, title: reward.title, cost: reward.cost ?? 0, user_id: a.user, kid_id: a.kid, redeemed_at: new Date().toISOString() }
    all.push(rec); localStorage.setItem('korfan.redemptions', JSON.stringify(all)); return rec
  },
  async deleteRedemption(id) {
    localStorage.setItem('korfan.redemptions', JSON.stringify(
      (JSON.parse(localStorage.getItem('korfan.redemptions') || '[]')).filter(r => r.id !== id)))
  },
  async createInvite() { throw new Error('local') },
  async acceptInvite() { return null },
  async getMyProfile() { return JSON.parse(localStorage.getItem('korfan.profile') || 'null') },
  async updateProfile(p) { localStorage.setItem('korfan.profile', JSON.stringify(p)) },
  async assignItem(listId, itemId, person) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { const a = personRef(person); it.assignee = a.user; it.assignee_kid = a.kid; lsWrite(lists) }
  },
  async shareList() { throw new Error('local') }, // deiling krefst innskráningar
  subscribe() { return () => {} },
}

/* ---------------- Ský (Supabase) ---------------- */
const cloud = {
  async getLists() {
    const { data: lists, error } = await supabase.from('lists').select('id,name,created_at,type').order('created_at')
    if (error) throw error
    const ids = (lists || []).map(l => l.id)
    if (!ids.length) return []
    const { data: items } = await supabase.from('list_items').select('*').in('list_id', ids)
    const { data: members } = await supabase.from('list_members').select('list_id').in('list_id', ids)
    const counts = {}
    for (const m of members || []) counts[m.list_id] = (counts[m.list_id] || 0) + 1
    return (lists || []).map(l => ({
      ...l,
      shared: (counts[l.id] || 0) > 1,
      items: (items || []).filter(i => i.list_id === l.id),
    }))
  },
  async createList(name, type = 'shopping') {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('lists').insert({ name, owner: user.id, type }).select().single()
    if (error) throw error
    const { error: mErr } = await supabase.from('list_members').insert({ list_id: data.id, user_id: user.id, role: 'owner' })
    if (mErr) throw mErr
    return { ...data, shared: false, items: [] }
  },
  async deleteList(id) { await supabase.from('lists').delete().eq('id', id) },
  async addItem(listId, name, opts = {}) {
    const { points, dept, weekday, time, assignee, image } = opts
    const { data: { user } } = await supabase.auth.getUser()
    const row = { list_id: listId, name: name.toLowerCase().trim(), dept: dept || departmentFor(name), checked: false, created_by: user?.id }
    if (points != null) row.points = points
    if (weekday) { row.weekday = weekday; row.recurrence = weekday === 'daily' ? 'daily' : 'weekly' }
    if (time) row.time = time
    const a = personRef(assignee)
    if (a.user) row.assignee = a.user
    if (a.kid) row.assignee_kid = a.kid
    if (image) row.image_url = image
    await supabase.from('list_items').insert(row)
  },
  async setItemDept(listId, itemId, dept) {
    await supabase.from('list_items').update({ dept }).eq('id', itemId)
  },
  async setQty(listId, itemId, qty) {
    await supabase.from('list_items').update({ qty: Math.max(1, qty) }).eq('id', itemId)
  },
  async lookupCatalogBarcode(barcode) {
    const { data } = await supabase.from('product_catalog').select('name,image_url,dept').eq('barcode', String(barcode)).maybeSingle()
    return data ? { name: data.name, image: data.image_url || null, dept: data.dept || null } : null
  },
  async setDue(listId, itemId, due) {
    await supabase.from('list_items').update({ due_at: due || null }).eq('id', itemId)
  },
  async setWeekday(listId, itemId, weekday) {
    await supabase.from('list_items').update({ weekday, recurrence: weekday === 'daily' ? 'daily' : 'weekly' }).eq('id', itemId)
  },
  async setTime(listId, itemId, time) {
    await supabase.from('list_items').update({ time: time || null }).eq('id', itemId)
  },
  async getCustomProducts() {
    const { data } = await supabase.from('custom_products').select('name,dept')
    return data || []
  },
  async addCustomProduct(name, dept) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('custom_products').upsert({ user_id: user.id, name: name.toLowerCase().trim(), dept })
  },
  async toggleItem(listId, item) {
    const { data: { user } } = await supabase.auth.getUser()
    const recurring = item.recurrence && item.recurrence !== 'none'
    const kidId = item.assignee_kid || null
    if (!item.checked) {
      // Verk klárað → skrá afrek og gefa stig (krakka ef verk er úthlutað á krakka)
      const comp = { list_id: listId, item_id: item.id, points: item.points ?? 10 }
      if (kidId) comp.kid_id = kidId; else comp.user_id = user?.id
      await supabase.from('completions').insert(comp)
      await supabase.from('list_items').update({
        checked: recurring ? false : true,
        completed_by: kidId ? null : user?.id,
        completed_by_kid: kidId,
      }).eq('id', item.id)
    } else {
      // Af-haka (einnota verk) → fjarlægja nýjasta afrek
      await supabase.from('list_items').update({ checked: false, completed_by: null, completed_by_kid: null }).eq('id', item.id)
      let q = supabase.from('completions').select('id').eq('item_id', item.id).order('completed_at', { ascending: false }).limit(1)
      q = kidId ? q.eq('kid_id', kidId) : q.eq('user_id', user?.id)
      const { data: c } = await q
      if (c && c[0]) await supabase.from('completions').delete().eq('id', c[0].id)
    }
  },
  async setPoints(listId, itemId, points) {
    await supabase.from('list_items').update({ points }).eq('id', itemId)
  },
  async setRecurrence(listId, itemId, recurrence) {
    await supabase.from('list_items').update({ recurrence }).eq('id', itemId)
  },
  async getCompletions(listId) {
    const { data } = await supabase.from('completions').select('item_id,user_id,kid_id,points,completed_at').eq('list_id', listId)
    return data || []
  },
  async completeItem(listId, item) {
    const { data: { user } } = await supabase.auth.getUser()
    const kidId = item.assignee_kid || null
    const comp = { list_id: listId, item_id: item.id, points: item.points ?? 10 }
    if (kidId) comp.kid_id = kidId; else comp.user_id = user?.id
    await supabase.from('completions').insert(comp)
  },
  async uncompleteItem(listId, item, sinceISO) {
    const { data: { user } } = await supabase.auth.getUser()
    const kidId = item.assignee_kid || null
    let q = supabase.from('completions').delete().eq('item_id', item.id).gte('completed_at', sinceISO)
    q = kidId ? q.eq('kid_id', kidId) : q.eq('user_id', user?.id)
    await q
  },
  async removeItem(listId, itemId) { await supabase.from('list_items').delete().eq('id', itemId) },
  async addManyItems(listId, names) {
    const { data: { user } } = await supabase.auth.getUser()
    const rows = names.map(n => ({ list_id: listId, name: n.toLowerCase().trim(), dept: departmentFor(n), checked: false, created_by: user?.id }))
    await supabase.from('list_items').insert(rows)
  },
  async getPurchases() {
    const { data: ps } = await supabase.from('purchases').select('*').order('purchased_at', { ascending: false })
    if (!ps || !ps.length) return ps || []
    const ids = ps.map(p => p.id)
    const { data: its } = await supabase.from('purchase_items').select('*').in('purchase_id', ids)
    const byP = {}
    for (const it of (its || [])) { (byP[it.purchase_id] || (byP[it.purchase_id] = [])).push(it) }
    return ps.map(p => ({ ...p, items: byP[p.id] || [] }))
  },
  async addPurchase(p) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: pr, error } = await supabase.from('purchases').insert({
      user_id: user.id, list_id: p.list_id || null, store: p.store || null,
      purchased_at: p.purchased_at || new Date().toISOString().slice(0, 10), total: p.total ?? null,
      category: p.category || null,
    }).select().single()
    if (error) throw error
    if (p.items && p.items.length) {
      const rows = p.items.map(i => ({ purchase_id: pr.id, name: i.name, price: i.price ?? null, qty: i.qty ?? null, barcode: i.barcode || null, category: i.category || null }))
      await supabase.from('purchase_items').insert(rows)
    }
    return pr
  },
  async deletePurchase(id) {
    await supabase.from('purchases').delete().eq('id', id)
  },
  async updatePurchase(id, patch) {
    const upd = { store: patch.store || null, purchased_at: patch.purchased_at, total: patch.total ?? null }
    if (patch.category !== undefined) upd.category = patch.category
    await supabase.from('purchases').update(upd).eq('id', id)
    await supabase.from('purchase_items').delete().eq('purchase_id', id)
    if (patch.items && patch.items.length) {
      const rows = patch.items.map(i => ({ purchase_id: id, name: i.name, price: i.price ?? null, qty: i.qty ?? null, category: i.category || null }))
      await supabase.from('purchase_items').insert(rows)
    }
  },
  async setPurchaseCategory(id, category) {
    const { error } = await supabase.from('purchases').update({ category: category || null }).eq('id', id)
    if (error) throw error
  },
  async setItemCategory(itemId, category) {
    const { error } = await supabase.from('purchase_items').update({ category: category || null }).eq('id', itemId)
    if (error) throw error
  },
  async upsertCatalog({ barcode, name, image, dept } = {}) {
    if (!barcode || !name) return
    await supabase.from('product_catalog').upsert({
      barcode, name, name_norm: name.toLowerCase().trim(), image_url: image || null, dept: dept || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'barcode' })
  },
  async getCatalogImages() {
    const { data } = await supabase.from('product_catalog').select('name_norm,image_url').not('image_url', 'is', null)
    return data || []
  },
  async getGenericImages() {
    const { data } = await supabase.from('generic_images').select('name_norm,image_url').not('image_url', 'is', null)
    return data || []
  },
  async ensureGenericImage(name) {
    const nn = (name || '').toLowerCase().trim()
    if (!nn) return null
    const { data: existing } = await supabase.from('generic_images').select('image_url').eq('name_norm', nn).maybeSingle()
    if (existing) return existing.image_url || null
    let url = null
    try {
      const { data } = await supabase.functions.invoke('product-image', { body: { name } })
      url = (data && data.url) || null
    } catch (e) { url = null }
    await supabase.from('generic_images').upsert({ name_norm: nn, image_url: url, updated_at: new Date().toISOString() }, { onConflict: 'name_norm' })
    return url
  },
  async adminStats() {
    const { data, error } = await supabase.rpc('admin_stats')
    if (error) throw error
    return data
  },
  async adminActivity() {
    const { data, error } = await supabase.rpc('admin_user_activity')
    if (error) throw error
    return data || []
  },
  async homeSummary() {
    const { data, error } = await supabase.rpc('home_summary')
    if (error) throw error
    return data || { week_points: 0, week_done: 0, feed: [] }
  },
  async duplicateList(id, name) {
    const all = await cloud.getLists()
    const src = all.find(l => l.id === id)
    const nl = await cloud.createList(name || ((src ? src.name : 'Listi') + ' (afrit)'), src ? src.type : 'shopping')
    if (src && src.items.length) {
      const rows = src.items.map(i => ({ list_id: nl.id, name: i.name, dept: i.dept, checked: false }))
      await supabase.from('list_items').insert(rows)
    }
    return nl
  },
  async renameList(id, name) {
    const { error } = await supabase.from('lists').update({ name }).eq('id', id)
    if (error) throw error
  },
  async recordRecipeUse(recipeId) { await supabase.rpc('record_recipe_use', { p_recipe: recipeId }) },
  async getMyRecipeUses() {
    const { data } = await supabase.from('recipe_uses').select('recipe_id,uses').order('uses', { ascending: false })
    return data || []
  },
  async getPopular() { const { data } = await supabase.rpc('popular_recipes'); return data || [] },
  async getRatingStats() { const { data } = await supabase.rpc('recipe_rating_stats'); return data || [] },
  async getMyRatings() { const { data } = await supabase.from('recipe_ratings').select('recipe_id,stars'); return data || [] },
  async rateRecipe(recipeId, stars) { await supabase.rpc('rate_recipe', { p_recipe: recipeId, p_stars: stars }) },
  async getRecipes() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    return (data || []).map(r => ({
      id: r.id, name: r.name, emoji: r.emoji || '🍽', time: r.time || '', serves: r.serves || 4,
      ingredients: r.ingredients || [], steps: r.steps || [],
      isPublic: r.is_public, authorType: r.author_type, authorName: r.author_name, sourceUrl: r.source_url,
      custom: true, mine: r.owner === user?.id,
    }))
  },
  async createRecipe(data) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: row, error } = await supabase.from('recipes').insert({
      owner: user.id, name: data.name, emoji: data.emoji, time: data.time, serves: data.serves,
      ingredients: data.ingredients, steps: data.steps, is_public: data.isPublic,
      author_type: data.authorType, author_name: data.authorName, source_url: data.sourceUrl,
    }).select().single()
    if (error) throw error
    return row
  },
  async deleteRecipe(id) { const { error } = await supabase.from('recipes').delete().eq('id', id); if (error) throw error },
  async getListMembers(listId) { const { data } = await supabase.rpc('list_members_emails', { p_list: listId }); return data || [] },
  async getKids(listId) {
    const { data } = await supabase.from('kids').select('id,name,color,avatar_url').eq('list_id', listId).order('created_at')
    return data || []
  },
  async createKid(listId, { name, color, avatar_url } = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('kids').insert({
      list_id: listId, name: (name || '').trim(), color: color || null, avatar_url: avatar_url || null, created_by: user?.id,
    }).select().single()
    if (error) throw error
    return data
  },
  async updateKid(id, patch = {}) {
    const upd = {}
    if (patch.name != null) upd.name = patch.name.trim()
    if (patch.color !== undefined) upd.color = patch.color
    if (patch.avatar_url !== undefined) upd.avatar_url = patch.avatar_url
    const { error } = await supabase.from('kids').update(upd).eq('id', id)
    if (error) throw error
  },
  async deleteKid(id) { const { error } = await supabase.from('kids').delete().eq('id', id); if (error) throw error },
  async setItemImage(listId, itemId, image) {
    await supabase.from('list_items').update({ image_url: image || null }).eq('id', itemId)
  },
  // ---- Skema sem áþreifanleg vika (Supabase) ----
  async addScheduleTasks(listId, name, { days = ['mon'], time, assignee, points, image } = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    const a = personRef(assignee)
    const base = { list_id: listId, name: (name || '').toLowerCase().trim(), checked: false, recurrence: 'none', created_by: user?.id }
    if (points != null) base.points = points
    if (time) base.time = time
    if (a.user) base.assignee = a.user
    if (a.kid) base.assignee_kid = a.kid
    if (image) base.image_url = image
    const rows = days.map(wd => ({ ...base, weekday: wd }))
    await supabase.from('list_items').insert(rows)
  },
  async resetWeek(listId) {
    await supabase.from('list_items').update({ checked: false, completed_by: null, completed_by_kid: null }).eq('list_id', listId)
  },
  // ---- Verðlaunabúð (Supabase) ----
  async getRewards(listId) {
    const { data } = await supabase.from('rewards').select('id,title,emoji,cost,active').eq('list_id', listId).eq('active', true).order('cost')
    return data || []
  },
  async createReward(listId, { title, emoji, cost } = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('rewards').insert({
      list_id: listId, title: (title || '').trim(), emoji: emoji || null, cost: Math.max(0, cost ?? 50), created_by: user?.id,
    }).select().single()
    if (error) throw error
    return data
  },
  async updateReward(id, patch = {}) {
    const upd = {}
    if (patch.title != null) upd.title = patch.title.trim()
    if (patch.emoji !== undefined) upd.emoji = patch.emoji
    if (patch.cost != null) upd.cost = Math.max(0, patch.cost)
    if (patch.active !== undefined) upd.active = patch.active
    const { error } = await supabase.from('rewards').update(upd).eq('id', id)
    if (error) throw error
  },
  async deleteReward(id) { const { error } = await supabase.from('rewards').delete().eq('id', id); if (error) throw error },
  async getRedemptions(listId) {
    const { data } = await supabase.from('reward_redemptions').select('id,reward_id,title,cost,user_id,kid_id,redeemed_at').eq('list_id', listId).order('redeemed_at', { ascending: false })
    return data || []
  },
  async redeemReward(listId, reward, person) {
    const { data: { user } } = await supabase.auth.getUser()
    const a = personRef(person)
    const row = { list_id: listId, reward_id: reward.id, title: reward.title, cost: reward.cost ?? 0 }
    if (a.kid) row.kid_id = a.kid; else row.user_id = a.user || user?.id
    const { data, error } = await supabase.from('reward_redemptions').insert(row).select().single()
    if (error) throw error
    return data
  },
  async deleteRedemption(id) { const { error } = await supabase.from('reward_redemptions').delete().eq('id', id); if (error) throw error },
  async createInvite(listId) { const { data, error } = await supabase.rpc('create_invite', { p_list: listId }); if (error) throw error; return data },
  async acceptInvite(token) { const { data, error } = await supabase.rpc('accept_invite', { p_token: token }); if (error) throw error; return data },
  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('id,email,name,color').eq('id', user.id).single()
    return data || { id: user.id, email: user.email }
  },
  async updateProfile({ name, color }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, name, color })
    if (error) throw error
  },
  async assignItem(listId, itemId, person) {
    const a = personRef(person)
    await supabase.from('list_items').update({ assignee: a.user, assignee_kid: a.kid }).eq('id', itemId)
  },
  // Deila lista með netfangi. Notar share_list fall í Supabase (sjá schema.sql).
  async shareList(listId, email) {
    const { data, error } = await supabase.rpc('share_list', { p_list: listId, p_email: email.trim().toLowerCase() })
    if (error) throw error
    if (data === false) throw new Error('Notandi með þetta netfang fannst ekki')
    return true
  },
  subscribe(listId, onChange) {
    const ch = supabase.channel('list-' + listId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items', filter: 'list_id=eq.' + listId }, onChange)
      .subscribe()
    return () => supabase.removeChannel(ch)
  },
}

export const store = isCloud ? cloud : local
export { isCloud }
