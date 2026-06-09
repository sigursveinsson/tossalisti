// Gagnalag appsins. Eitt viðmót, tvær útfærslur:
//  - Staðbundið (localStorage): virkar strax, engin uppsetning.
//  - Ský (Supabase): margir notendur, deiling, rauntíma-samstilling.
import { supabase, isCloud } from './supabaseClient.js'
import { departmentFor } from '../data/products.js'

const LS_KEY = 'korfan.lists.v1'
const uid = () => Math.random().toString(36).slice(2, 10)

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
    const { points, dept, weekday, time, assignee } = opts
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    const n = name.toLowerCase().trim()
    if (list.items.some(i => i.name === n)) return
    const rec = weekday === 'daily' ? 'daily' : (weekday ? 'weekly' : 'none')
    list.items.push({ id: uid(), name: n, dept: dept || departmentFor(name), checked: false, points: points ?? 10, recurrence: rec, weekday: weekday || null, time: time || null, assignee: assignee || null, due_at: null, completed_by: null })
    lsWrite(lists)
  },
  async setItemDept(listId, itemId, dept) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.dept = dept; lsWrite(lists) }
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
    if (it.recurrence && it.recurrence !== 'none') { it.checked = false }
    else { it.checked = !it.checked; it.completed_by = it.checked ? 'me' : null }
    lsWrite(lists)
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
    const comp = JSON.parse(localStorage.getItem('korfan.comp') || '[]')
    comp.push({ list_id: listId, item_id: item.id, user_id: 'me', points: item.points ?? 10, completed_at: new Date().toISOString() })
    localStorage.setItem('korfan.comp', JSON.stringify(comp))
  },
  async uncompleteItem(listId, item, sinceISO) {
    const comp = JSON.parse(localStorage.getItem('korfan.comp') || '[]')
      .filter(c => !(c.item_id === item.id && c.user_id === 'me' && c.completed_at >= sinceISO))
    localStorage.setItem('korfan.comp', JSON.stringify(comp))
  },
  async removeItem(listId, itemId) {
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    list.items = list.items.filter(i => i.id !== itemId); lsWrite(lists)
  },
  async addManyItems(listId, names) { for (const n of names) await local.addItem(listId, n) },
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
  async getListMembers() { return [] }, // engir aðrir meðlimir staðbundið
  async createInvite() { throw new Error('local') },
  async acceptInvite() { return null },
  async getMyProfile() { return JSON.parse(localStorage.getItem('korfan.profile') || 'null') },
  async updateProfile(p) { localStorage.setItem('korfan.profile', JSON.stringify(p)) },
  async assignItem(listId, itemId, userId) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.assignee = userId || null; lsWrite(lists) }
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
    const { points, dept, weekday, time, assignee } = opts
    const row = { list_id: listId, name: name.toLowerCase().trim(), dept: dept || departmentFor(name), checked: false }
    if (points != null) row.points = points
    if (weekday) { row.weekday = weekday; row.recurrence = weekday === 'daily' ? 'daily' : 'weekly' }
    if (time) row.time = time
    if (assignee) row.assignee = assignee
    await supabase.from('list_items').insert(row)
  },
  async setItemDept(listId, itemId, dept) {
    await supabase.from('list_items').update({ dept }).eq('id', itemId)
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
    if (!item.checked) {
      // Verk klárað → skrá afrek og gefa stig
      await supabase.from('completions').insert({ list_id: listId, item_id: item.id, user_id: user?.id, points: item.points ?? 10 })
      await supabase.from('list_items').update({ checked: recurring ? false : true, completed_by: user?.id }).eq('id', item.id)
    } else {
      // Af-haka (einnota verk) → fjarlægja nýjasta afrek
      await supabase.from('list_items').update({ checked: false, completed_by: null }).eq('id', item.id)
      const { data: c } = await supabase.from('completions').select('id').eq('item_id', item.id).eq('user_id', user?.id).order('completed_at', { ascending: false }).limit(1)
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
    const { data } = await supabase.from('completions').select('item_id,user_id,points,completed_at').eq('list_id', listId)
    return data || []
  },
  async completeItem(listId, item) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('completions').insert({ list_id: listId, item_id: item.id, user_id: user?.id, points: item.points ?? 10 })
  },
  async uncompleteItem(listId, item, sinceISO) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('completions').delete().eq('item_id', item.id).eq('user_id', user?.id).gte('completed_at', sinceISO)
  },
  async removeItem(listId, itemId) { await supabase.from('list_items').delete().eq('id', itemId) },
  async addManyItems(listId, names) {
    const rows = names.map(n => ({ list_id: listId, name: n.toLowerCase().trim(), dept: departmentFor(n), checked: false }))
    await supabase.from('list_items').insert(rows)
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
  async assignItem(listId, itemId, userId) {
    await supabase.from('list_items').update({ assignee: userId || null }).eq('id', itemId)
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
