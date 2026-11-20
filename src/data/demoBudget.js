// Sýnigögn fyrir /syning: tilbúið heimili með heilt ár af kvittunum (engin raunveruleg gögn).
// Hver almanaksdagur hefur fast sæði → sömu „kvittanir“ þann dag alltaf; sýnd eru síðustu 365 dagar frá deginum í dag.

function rng(seed) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const pad = (n) => String(n).padStart(2, '0')
const dk = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())

// [heiti, verð, flokkur, vægi]
const GROCERY = [
  ['Nýmjólk 1 l', 239, 'matur', 9], ['Léttmjólk 1 l', 235, 'matur', 5], ['AB mjólk', 399, 'matur', 3], ['Skyr hreint 500 g', 449, 'matur', 4],
  ['Smjör 500 g', 899, 'matur', 3], ['Gouda ostur 26%', 1890, 'matur', 4], ['Rjómi 250 ml', 459, 'matur', 2], ['Egg 10 stk', 899, 'matur', 4],
  ['Heimilisbrauð', 549, 'matur', 7], ['Samlokubrauð', 469, 'matur', 3], ['Bananar', 389, 'matur', 6], ['Epli rauð', 499, 'matur', 4],
  ['Agúrka', 289, 'matur', 5], ['Tómatar 500 g', 549, 'matur', 4], ['Paprika rauð', 329, 'matur', 3], ['Kartöflur 2 kg', 699, 'matur', 3],
  ['Laukur', 199, 'matur', 2], ['Gulrætur 1 kg', 399, 'matur', 2], ['Kjúklingabringur 900 g', 2798, 'matur', 4], ['Nautahakk 500 g', 1590, 'matur', 4],
  ['Lambalæri', 4990, 'matur', 1], ['Laxaflök', 2890, 'matur', 2], ['Ýsuflök', 2390, 'matur', 2], ['Pylsur 10 stk', 899, 'matur', 2],
  ['Skinka', 399, 'matur', 3], ['Pasta 500 g', 329, 'matur', 3], ['Hrísgrjón 1 kg', 499, 'matur', 1], ['Pastasósa', 549, 'matur', 2],
  ['Tómatsósa', 459, 'matur', 1], ['Cheerios', 899, 'matur', 2], ['Haframjöl', 399, 'matur', 1], ['Hveiti 2 kg', 499, 'matur', 1],
  ['Kaffi 500 g', 1299, 'matur', 3], ['Jógúrt 4 stk', 599, 'matur', 3], ['Frosin pizza', 899, 'matur', 2], ['Frosin bláber', 799, 'matur', 1],
  ['Tortillur 8 stk', 549, 'matur', 2], ['Taco sósa', 499, 'matur', 1], ['Ólífuolía', 1490, 'matur', 1], ['Salat í poka', 449, 'matur', 3],
  ['Pepsi Max 2 l', 399, 'drykkir', 4], ['Kristall 2 l', 329, 'drykkir', 3], ['Appelsínusafi 1 l', 449, 'drykkir', 3], ['Collab', 299, 'drykkir', 3], ['Egils Appelsín 2 l', 399, 'drykkir', 1],
  ['Doritos', 549, 'snakk', 2], ['Nóa Kropp', 499, 'snakk', 2], ['Síríus súkkulaði', 399, 'snakk', 2], ['Lakkrís', 449, 'snakk', 1],
  ['Ritz kex', 499, 'snakk', 2], ['Hob Nobs', 449, 'snakk', 1], ['Örbylgjupopp', 399, 'snakk', 1], ['Vanilluís 1 l', 899, 'snakk', 1],
  ['Uppþvottalögur', 549, 'hreinlaeti', 1], ['Þvottaefni', 1890, 'hreinlaeti', 1], ['Uppþvottavélatöflur', 1990, 'hreinlaeti', 1], ['Hreinsisprey', 699, 'hreinlaeti', 1], ['Ruslapokar', 499, 'hreinlaeti', 1],
  ['Klósettpappír 12 rúllur', 1498, 'heimili', 2], ['Eldhúsrúllur', 899, 'heimili', 1], ['Bökunarpappír', 399, 'heimili', 1], ['Burðarpoki', 53, 'heimili', 4],
  ['Sjampó', 899, 'snyrti', 1], ['Tannkrem', 549, 'snyrti', 1], ['Handsápa', 399, 'snyrti', 1], ['Bleyjur', 2490, 'born', 1],
]
const GSTORES = [['Bónus Fiskislóð', 1, 26], ['Bónus Skeifunni', 1, 18], ['Krónan Granda', 1.04, 20], ['Krónan Bíldshöfða', 1.04, 10], ['Hagkaup Kringlu', 1.16, 10], ['Nettó Granda', 1.08, 10], ['10-11 Austurstræti', 1.4, 6]]

// Aðrar verslanir: [verslun, á mánuði, [[heiti, verð, flokkur], …], mest margar línur]
const OTHER = [
  ['Vínbúðin', 2.2, [['Rauðvín', 2990, 'afengi'], ['Bjór 6 stk', 2390, 'afengi'], ['Hvítvín', 2790, 'afengi']], 2],
  ['Apótekarinn', 1, [['Paratabs', 899, 'heilsa'], ['D-vítamín', 2490, 'heilsa'], ['Plástrar', 699, 'heilsa'], ['Nefúði', 1290, 'heilsa']], 2],
  ['N1 Hringbraut', 3, [['Bensín', 11200, 'samgongur']], 1],
  ['Te & Kaffi', 4, [['Cappuccino', 790, 'veitingar'], ['Croissant', 690, 'veitingar'], ['Latte', 820, 'veitingar']], 2],
  ['Domino\'s', 1.2, [['Pizza stór', 3990, 'veitingar'], ['Brauðstangir', 1290, 'veitingar'], ['Gos 2 l', 590, 'veitingar']], 3],
  ['Hamborgarabúllan', 1, [['Tilboð aldarinnar', 2890, 'veitingar'], ['Barnaborgari', 1690, 'veitingar'], ['Franskar', 890, 'veitingar']], 3],
  ['Saffran', 0.8, [['Kjúklingaréttur', 2990, 'veitingar'], ['Naan brauð', 790, 'veitingar']], 3],
  ['Brauð & Co', 3, [['Súrdeigsbrauð', 1290, 'matur'], ['Kanilsnúður', 690, 'matur'], ['Croissant', 590, 'matur']], 3],
  ['JYSK', 0.5, [['Sængurverasett', 5990, 'heimili'], ['Koddi', 3990, 'heimili'], ['Kerti', 1290, 'heimili'], ['Handklæði', 1990, 'heimili']], 3],
  ['Húsasmiðjan', 0.7, [['Málning 3 l', 8990, 'heimili'], ['LED perur', 1290, 'heimili'], ['Skrúfur', 890, 'heimili'], ['Penslasett', 1990, 'heimili']], 3],
  ['IKEA', 0.3, [['Hilla', 7990, 'heimili'], ['Glös 6 stk', 1990, 'heimili'], ['Geymslubox', 1490, 'heimili'], ['Kjötbollur', 1290, 'veitingar']], 4],
  ['Elko', 0.2, [['Heyrnartól', 12990, 'afthreying'], ['HDMI snúra', 2490, 'heimili'], ['Hleðslutæki', 3990, 'heimili']], 2],
  ['H&M', 0.9, [['Peysa', 4990, 'fot'], ['Bolur', 1990, 'fot'], ['Barnabuxur', 2990, 'fot'], ['Sokkar', 1490, 'fot']], 3],
  ['Penninn Eymundsson', 0.8, [['Kilja', 3990, 'afthreying'], ['Afmæliskort', 790, 'afthreying'], ['Tímarit', 1890, 'afthreying']], 2],
  ['Sambíóin', 0.8, [['Bíómiði', 1990, 'afthreying'], ['Bíómiði', 1990, 'afthreying'], ['Popp og gos', 1690, 'afthreying']], 3],
]
// Árstíðabundið: desember (jól) og júlí (ferðalög)
const SEASON = [
  [11, 'Kids Coolshop', [['LEGO sett', 8990, 'born'], ['Dúkka', 4990, 'born'], ['Spil', 3990, 'afthreying']], 3],
  [11, '66°Norður', [['Úlpa', 34990, 'fot']], 1],
  [11, 'Blómaval', [['Jólatré', 9990, 'heimili'], ['Jólastjarna', 2490, 'heimili']], 2],
  [6, 'Tjaldsvæðið Ásbyrgi', [['Gisting 2 nætur', 7600, 'ferdalog']], 1],
  [6, 'N1 Staðarskáli', [['Bensín', 13400, 'samgongur'], ['Pylsa og gos', 1890, 'veitingar']], 2],
  [6, 'Jarðböðin við Mývatn', [['Aðgangur fullorðnir', 13800, 'ferdalog']], 1],
]

export const DEMO_MEMBERS = [{ kind: 'user', id: 'demo-1', name: 'Sigga' }, { kind: 'user', id: 'demo-2', name: 'Jón' }]
export const DEMO_ME = 'demo-1'

export function demoPurchases() {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const out = []
  for (let off = 364; off >= 0; off--) {
    const d = new Date(now); d.setDate(d.getDate() - off)
    const key = dk(d)
    // Hver almanaksdagur á sitt eigið sæði → kvittanir dagsins eru alltaf þær sömu. Glugginn (síðustu 365 dagar)
    // færist bara um einn dag á dag, svo heildartölur breytast hægt og árstíðirnar eru alltaf á réttum stað.
    const r = rng(Number(key.replace(/-/g, '')) * 7919)
    for (let i = 0; i < 4; i++) r()
    const pick = (arr, wi) => { const tot = arr.reduce((a, x) => a + x[wi], 0); let t = r() * tot; for (const x of arr) { t -= x[wi]; if (t <= 0) return x } return arr[arr.length - 1] }
    const price = (base, f) => { const v = base * f * (0.97 + r() * 0.06); return v < 100 ? Math.round(v) : Math.max(9, Math.round(v / 10) * 10 - 1) }
    let n = 0
    const add = (store, lines) => {
      const id = 'demo-' + key + '-' + (++n)
      const items = lines.map(([name, pr, category], i) => ({ id: id + '-' + i, name, price: pr, qty: 1, category }))
      out.push({ id, store, purchased_at: key, user_id: r() < 0.6 ? 'demo-1' : 'demo-2', total: items.reduce((a, x) => a + x.price, 0), items })
    }
    const wd = (d.getDay() + 6) % 7, mo = d.getMonth()
    // Verðlag hækkar um ~6% á ári (miðað við fasta dagsetningu, svo verð sama dags breytist ekki)
    const infl = 1 + 0.06 * ((d.getTime() - new Date(2026, 0, 1).getTime()) / (365 * 86400000))
    const xmas = mo === 11 ? 1.35 : 1
    // Matvara: stór vikuinnkaup (oftast fös/lau) og smærri ferðir
    const big = r() < ([0.1, 0.08, 0.1, 0.14, 0.32, 0.36, 0.2][wd] * xmas)
    const small = r() < 0.3
    for (const kind of [big && 'big', small && 'small'].filter(Boolean)) {
      const [store, f] = pick(GSTORES, 2)
      const count = kind === 'big' ? 11 + Math.floor(r() * 11) : 2 + Math.floor(r() * 5)
      const seen = new Set(); const lines = []
      while (lines.length < count) { const g = pick(GROCERY, 3); if (seen.has(g[0])) continue; seen.add(g[0]); lines.push([g[0], price(g[1], f * infl), g[2]]) }
      add(store, lines)
    }
    for (const [store, perMonth, pool, maxLines] of OTHER) {
      if (r() < (perMonth / 30.4) * (mo === 11 && /H&M|Vínbúðin|Penninn|Elko/.test(store) ? 1.8 : 1)) {
        const k = 1 + Math.floor(r() * maxLines); const lines = []
        for (let i = 0; i < k; i++) { const it = pool[Math.floor(r() * pool.length)]; lines.push([it[0], price(it[1], infl), it[2]]) }
        add(store, lines)
      }
    }
    for (const [m, store, pool, maxLines] of SEASON) {
      if (mo === m && r() < 0.06) { const k = 1 + Math.floor(r() * maxLines); add(store, pool.slice(0, k).map(it => [it[0], price(it[1], infl), it[2]])) }
    }
  }
  return out
}
