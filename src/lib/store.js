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
      id: uid(), name: 'Vikuinnkaup', created_at: Date.now(), shared: false,
      items: [
        { id: uid(), name: 'mjólk', dept: 'dairy', checked: false },
        { id: uid(), name: 'banani', dept: 'produce', checked: false },
        { id: uid(), name: 'kjúklingabringur', dept: 'meat', checked: false },
        { id: uid(), name: 'kaffi', dept: 'pantry', checked: true },
      ],
    },
    { id: uid(), name: 'Matarboð', created_at: Date.now() + 1, shared: false, items: [] },
    { id: uid(), name: 'Afmæli', created_at: Date.now() + 2, shared: false, items: [] },
  ]
  lsWrite(lists)
  return lists
}

const local = {
  async getLists() { return lsRead() || lsSeed() },
  async createList(name) {
    const lists = lsRead() || []
    const list = { id: uid(), name, created_at: Date.now(), shared: false, items: [] }
    lsWrite([...lists, list]); return list
  },
  async deleteList(id) { lsWrite((lsRead() || []).filter(l => l.id !== id)) },
  async addItem(listId, name) {
    const lists = lsRead() || []
    const list = lists.find(l => l.id === listId); if (!list) return
    const n = name.toLowerCase().trim()
    if (list.items.some(i => i.name === n)) return
    list.items.push({ id: uid(), name: n, dept: departmentFor(name), checked: false })
    lsWrite(lists)
  },
  async toggleItem(listId, itemId) {
    const lists = lsRead() || []
    const it = lists.find(l => l.id === listId)?.items.find(i => i.id === itemId)
    if (it) { it.checked = !it.checked; lsWrite(lists) }
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
      id: uid(), name: name || ((src ? src.name : 'Listi') + ' (afrit)'), created_at: Date.now(), shared: false,
      items: (src ? src.items : []).map(i => ({ id: uid(), name: i.name, dept: i.dept, checked: false })),
    }
    lsWrite([...lists, nl]); return nl
  },
  async renameList(id, name) {
    const lists = lsRead() || []
    const l = lists.find(x => x.id === id); if (l) { l.name = name; lsWrite(lists) }
  },
  async shareList() { throw new Error('local') }, // deiling krefst innskráningar
  subscribe() { return () => {} },
}

/* ---------------- Ský (Supabase) ---------------- */
const cloud = {
  async getLists() {
    const { data: lists, error } = await supabase.from('lists').select('id,name,created_at').order('created_at')
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
  async createList(name) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('lists').insert({ name, owner: user.id }).select().single()
    if (error) throw error
    const { error: mErr } = await supabase.from('list_members').insert({ list_id: data.id, user_id: user.id, role: 'owner' })
    if (mErr) throw mErr
    return { ...data, shared: false, items: [] }
  },
  async deleteList(id) { await supabase.from('lists').delete().eq('id', id) },
  async addItem(listId, name) {
    await supabase.from('list_items').insert({
      list_id: listId, name: name.toLowerCase().trim(), dept: departmentFor(name), checked: false,
    })
  },
  async toggleItem(listId, itemId, checked) {
    await supabase.from('list_items').update({ checked: !checked }).eq('id', itemId)
  },
  async removeItem(listId, itemId) { await supabase.from('list_items').delete().eq('id', itemId) },
  async addManyItems(listId, names) {
    const rows = names.map(n => ({ list_id: listId, name: n.toLowerCase().trim(), dept: departmentFor(n), checked: false }))
    await supabase.from('list_items').insert(rows)
  },
  async duplicateList(id, name) {
    const all = await cloud.getLists()
    const src = all.find(l => l.id === id)
    const nl = await cloud.createList(name || ((src ? src.name : 'Listi') + ' (afrit)'))
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
