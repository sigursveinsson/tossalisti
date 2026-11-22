// Býr til efnissíður fyrir leitarvélar í public/:
//   /uppskriftir/ (yfirlit) og /uppskriftir/<id>/ fyrir hverja uppskrift í src/data/recipes.js
//   /verdvakt.html, /oskalisti.html, /jolainnkaup.html, /vikumatsedill.html
// og uppfærir sitemap.xml og „Fleiri leiðbeiningar“ á eldri síðum.
// Keyrsla: node scripts/gen-seo.mjs   (keyrið aftur ef uppskriftum er breytt)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RECIPES } from '../src/data/recipes.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUB = path.join(ROOT, 'public')
const SITE = 'https://tossalisti.is'
const FACEBOOK = 'https://www.facebook.com/profile.php?id=61590431443377' // sjá src/lib/social.js
const INSTAGRAM = 'https://www.instagram.com/tossalisti.is/'
const TODAY = new Date().toISOString().slice(0, 10)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const app = (q) => `${SITE}/?${q}`

// Allar leiðbeiningasíður, í þeirri röð sem þær birtast í „Fleiri leiðbeiningar“
const GUIDES = [
  ['/uppskriftir/', 'Uppskriftir með innkaupalista'],
  ['/jolainnkaup.html', 'Jólainnkaupalisti – allt fyrir jólin'],
  ['/oskalisti.html', 'Óskalisti og gjafalisti fyrir jólin'],
  ['/verdvakt.html', 'Verðvakt – vitaðu þegar verðið lækkar'],
  ['/vikumatsedill.html', 'Vikumatseðill og innkaupalisti'],
  ['/heimilisbokhald.html', 'Heimilisbókhald – sjáðu hvert peningarnir fara'],
  ['/fjarmal-heimilisins.html', 'Fjármál heimilisins – einföld fjárhagsáætlun'],
  ['/matarkostnadur.html', 'Matarkostnaður – lækkaðu matarreikninginn'],
  ['/sparnadur.html', 'Sparnaður á heimilinu – 10 einföld ráð'],
  ['/kvittanir.html', 'Kvittanir og ábyrgðir í símanum'],
  ['/innkaupalisti.html', 'Innkaupalisti fyrir vikuna'],
  ['/utilegulisti.html', 'Útilegulisti – tékklisti'],
]
const relatedNav = (self) => `<nav class="related"><h2>Fleiri leiðbeiningar</h2><ul>${GUIDES.filter(([u]) => u !== self).map(([u, t]) => `<li><a href="${u}">${esc(t)}</a></li>`).join('')}</ul></nav>`

const STYLE = `
  :root{--navy:#15315e;--gold:#f5a623;--muted:#6b7a93;--line:#e1e7f2;--bg:#eef3fb}
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c283c;background:#fff;line-height:1.65}
  header{background:var(--navy);color:#fff;padding:28px 20px;text-align:center}
  header a{color:#fff;text-decoration:none}
  header .brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:18px}
  .wrap{max-width:720px;margin:0 auto;padding:0 20px}
  .crumbs{font-size:14px;color:var(--muted);margin:18px 0 0}
  .crumbs a{color:var(--muted)}
  h1{font-size:30px;color:var(--navy);margin:20px 0 8px;line-height:1.25}
  .lead{font-size:18px;color:var(--muted);margin:0 0 22px}
  h2{font-size:22px;color:var(--navy);margin:30px 0 8px}
  h3{font-size:18px;color:var(--navy);margin:22px 0 6px}
  p{margin:0 0 14px}
  ol,ul{padding-left:22px;margin:0 0 16px}
  li{margin-bottom:8px}
  .cta{display:block;background:var(--gold);color:var(--navy);font-weight:700;font-size:18px;text-align:center;text-decoration:none;padding:16px;border-radius:14px;margin:28px 0}
  .cta small{display:block;font-weight:400;color:#5a4413;font-size:13px;margin-top:3px}
  .note{background:var(--bg);border-radius:12px;padding:16px 18px;color:var(--muted);font-size:15px;margin:20px 0}
  .meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
  .meta span{background:var(--bg);color:var(--navy);border-radius:999px;padding:4px 12px;font-size:14px}
  .ing{list-style:none;padding:0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .ing li{display:flex;justify-content:space-between;gap:12px;margin:0;padding:10px 16px;border-top:1px solid var(--line)}
  .ing li:first-child{border-top:0}
  .ing b{font-weight:600;color:var(--navy)}
  .ing span{color:var(--muted);white-space:nowrap}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:0 0 10px;padding:0;list-style:none}
  .grid li{margin:0}
  .grid a{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;color:var(--navy);text-decoration:none;font-weight:600}
  .grid a:hover{border-color:var(--navy)}
  .grid .e{font-size:22px}
  .src{font-size:14px;color:var(--muted)}
  .src a{color:var(--muted)}
  .faq dt{font-weight:700;color:var(--navy);margin-top:14px}
  .faq dd{margin:4px 0 0}
  footer{text-align:center;color:var(--muted);font-size:14px;padding:30px 20px}
  footer a{color:var(--navy)}
  @media(max-width:560px){h1{font-size:25px}}
  .related{border-top:1px solid var(--line);margin:34px 0 0;padding-top:18px}
  .related h2{font-size:18px;margin-top:0}
  .related a{color:var(--navy)}`

const LOGO = `<svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="6" width="52" height="52" rx="14" fill="#fff"/><polyline points="20,33 29,42 45,24" fill="none" stroke="#f5a623" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function page({ urlPath, title, description, ogTitle, body, jsonld = [], type = 'article' }) {
  const url = SITE + urlPath.replace(/\.html$/, '') // Netlify ber síðurnar fram án .html
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')
  return `<!DOCTYPE html>
<html lang="is">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="is_IS">
<meta property="og:site_name" content="Tossalisti">
<style>${STYLE}
</style>
${ld}
</head>
<body>
<header><a class="brand" href="/">${LOGO} Tossalisti</a></header>
<div class="wrap">
${body}
${relatedNav(urlPath)}
</div>
<footer>
  <p><a href="https://tossalisti.is/">Tossalisti</a> – íslenskt heimilisapp fyrir innkaupalista, uppskriftir, kvittanir og heimilisbókhald. Frítt.</p>
<p>Fylgdu Tossalista á <a href="${FACEBOOK}" rel="noopener">Facebook</a> og <a href="${INSTAGRAM}" rel="noopener">Instagram</a></p>
<br><small>Tossalisti er rekinn af Wonder ehf., kt. 471119-1560 · <a href="/personuvernd.html">Persónuvernd</a></small></footer>
</body>
</html>
`
}
const write = (rel, html) => {
  const p = path.join(PUB, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, html)
}
const faqLd = (qa) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })
const faqHtml = (qa) => `<h2>Algengar spurningar</h2><dl class="faq">${qa.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>`
const crumbsLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) })

// ---------- Uppskriftir ----------
// Magn eins og það er skráð (án námundunar), t.d. „125 g“, „1,2 l“, „eftir smekk“
function qtyText(ing) {
  if (ing.qty == null) return ing.unit || ''
  const n = Number.isInteger(ing.qty) ? String(ing.qty) : String(ing.qty).replace('.', ',')
  return `${n} ${ing.unit || ''}`.trim()
}
// „90 mín“ / „1 klst + kæling“ → ISO 8601 fyrir schema.org (aðeins ef auðlesið)
function isoTime(t) {
  const m = String(t || '').match(/^(\d+)\s*mín/); if (m) return `PT${m[1]}M`
  const h = String(t || '').match(/^(\d+(?:[.,]\d+)?)\s*klst/); if (h) return `PT${Math.round(parseFloat(h[1].replace(',', '.')) * 60)}M`
  return null
}
const unitWord = (r) => (r.tags || []).includes('Bakstur') && r.serves >= 20 ? 'stykki' : 'skammtar'
const recipeUrl = (r) => `/uppskriftir/${r.id}/`
const TAG_ORDER = ['Jól', 'Íslenskt', 'Súpur', 'Bakstur', 'Ítalskt', 'Mexíkóskt', 'Asískt', 'Grænmeti', 'Vegan', 'Salöt']
const TAG_TITLE = { 'Jól': 'Jólabakstur og jólamatur', 'Íslenskt': 'Íslenskur heimilismatur', 'Súpur': 'Súpur', 'Bakstur': 'Bakstur', 'Ítalskt': 'Ítalskt', 'Mexíkóskt': 'Mexíkóskt', 'Asískt': 'Asískt', 'Grænmeti': 'Grænmetisréttir', 'Vegan': 'Vegan', 'Salöt': 'Salöt' }

function recipePage(r) {
  const name = r.name
  const ings = r.ingredients
  const words = unitWord(r)
  const tags = r.tags || []
  const related = RECIPES.filter((x) => x.id !== r.id && (x.tags || []).some((t) => tags.includes(t))).slice(0, 8)
  const link = app(`uppskrift=${encodeURIComponent(r.id)}&utm_source=seo&utm_medium=uppskrift&utm_campaign=${encodeURIComponent(r.id)}`)
  const ingList = ings.map((i) => cap(i.name) + (i.qty == null && !i.unit ? '' : '')).join(', ')
  const desc = `${name}: uppskrift fyrir ${r.serves} ${words}${r.time ? ', ' + r.time : ''}. Hráefni: ${ings.slice(0, 6).map((i) => i.name).join(', ')}${ings.length > 6 ? ' o.fl.' : ''}. Settu öll hráefnin á innkaupalistann með einum smelli.`
  const ld = {
    '@context': 'https://schema.org', '@type': 'Recipe', name, inLanguage: 'is',
    description: `${name} – uppskrift með innkaupalista.`,
    recipeYield: `${r.serves} ${words}`,
    recipeIngredient: ings.map((i) => `${qtyText(i)} ${i.name}`.trim()),
    recipeInstructions: (r.steps || []).map((s) => ({ '@type': 'HowToStep', text: s })),
    recipeCategory: tags[0] || undefined,
    recipeCuisine: tags.includes('Íslenskt') ? 'Íslensk' : undefined,
    author: r.authorName ? { '@type': 'Organization', name: r.authorName } : { '@type': 'Organization', name: 'Tossalisti' },
    ...(isoTime(r.time) ? { totalTime: isoTime(r.time) } : {}),
  }
  const body = `
  <p class="crumbs"><a href="/">Tossalisti</a> › <a href="/uppskriftir/">Uppskriftir</a> › ${esc(name)}</p>
  <h1>${esc(name)} – uppskrift</h1>
  <div class="meta">${r.time ? `<span>⏱ ${esc(r.time)}</span>` : ''}<span>${esc(r.serves)} ${words}</span><span>${ings.length} hráefni</span>${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
  <a class="cta" href="${esc(link)}">Setja hráefnin á innkaupalistann<small>Frítt í Tossalista · engin skráning · þú hakar af það sem þú átt</small></a>
  <h2>Hráefni</h2>
  <ul class="ing">${ings.map((i) => `<li><b>${esc(cap(i.name))}</b><span>${esc(qtyText(i))}</span></li>`).join('')}</ul>
  <h2>Aðferð</h2>
  <ol>${(r.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  ${r.authorName && r.sourceUrl ? `<p class="src">Innblástur: <a href="${esc(r.sourceUrl)}" rel="noopener">${esc(r.authorName)}</a></p>` : ''}
  <div class="note">💡 Í Tossalista geturðu breytt fjölda skammta og hráefnin skalast sjálfkrafa. Listinn raðast eftir búðardeildum, svo þú gengur búðina í einni umferð, og þú getur deilt honum með fjölskyldunni.</div>
  <a class="cta" href="${esc(link)}">Setja hráefnin á listann</a>
  ${related.length ? `<h2>Fleiri uppskriftir</h2><ul class="grid">${related.map((x) => `<li><a href="${recipeUrl(x)}"><span class="e">${x.emoji || '🍽'}</span>${esc(x.name)}</a></li>`).join('')}</ul>` : ''}`
  return page({
    urlPath: recipeUrl(r),
    title: `${name} – uppskrift og innkaupalisti | Tossalisti`,
    ogTitle: `${name} – uppskrift`,
    description: desc.slice(0, 300),
    body,
    jsonld: [ld, crumbsLd([['Tossalisti', '/'], ['Uppskriftir', '/uppskriftir/'], [name, recipeUrl(r)]])],
  })
}

function recipesHub() {
  const groups = TAG_ORDER.map((t) => [t, RECIPES.filter((r) => (r.tags || [])[0] === t || ((r.tags || []).includes(t) && t === 'Jól'))]).filter(([, l]) => l.length)
  const placed = new Set(groups.flatMap(([, l]) => l.map((r) => r.id)))
  const rest = RECIPES.filter((r) => !placed.has(r.id))
  if (rest.length) groups.push(['Annað', rest])
  const body = `
  <p class="crumbs"><a href="/">Tossalisti</a> › Uppskriftir</p>
  <h1>Uppskriftir – og hráefnin beint á innkaupalistann</h1>
  <p class="lead">${RECIPES.length} uppskriftir að hversdagsmat, jólabakstri og veislumat. Veldu uppskrift og settu öll hráefnin á innkaupalistann með einum smelli – þú hakar af það sem þú átt nú þegar.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=uppskriftir')}">Opna Tossalista – frítt<small>Uppskriftir, innkaupalisti og heimilisbókhald á einum stað</small></a>
  ${groups.map(([t, l]) => `<h2>${esc(TAG_TITLE[t] || t)}</h2><ul class="grid">${l.map((r) => `<li><a href="${recipeUrl(r)}"><span class="e">${r.emoji || '🍽'}</span>${esc(r.name)}</a></li>`).join('')}</ul>`).join('\n  ')}
  <div class="note">💡 Viltu bara segja hvað þú ætlar að elda? Í Tossalista geturðu sagt „taco fyrir fjóra“ eða „allt í kjötsúpu“ og hráefnin fara á listann.</div>`
  return page({
    urlPath: '/uppskriftir/',
    title: 'Uppskriftir með innkaupalista – jólabakstur, heimilismatur og fleira | Tossalisti',
    ogTitle: 'Uppskriftir – og hráefnin beint á innkaupalistann',
    description: `${RECIPES.length} uppskriftir: mömmukökur, piparkökur, kjötsúpa, plokkfiskur, lasagne og fleira. Settu öll hráefnin á innkaupalistann með einum smelli. Frítt.`,
    body, type: 'website',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: RECIPES.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + recipeUrl(r), name: r.name })) }],
  })
}

// ---------- Handskrifaðar síður ----------
const R = (id) => RECIPES.find((r) => r.id === id)
const rlink = (id) => { const r = R(id); return r ? `<a href="${recipeUrl(r)}">${esc(r.name)}</a>` : '' }

function verdvakt() {
  const qa = [
    ['Hvað kostar Verðvaktin?', 'Ekkert. Tossalisti er ókeypis, líka Verðvaktin.'],
    ['Í hvaða verslunum virkar hún?', 'Í flestum íslenskum vefverslunum sem birta verð á vörusíðunni, til dæmis ELKO, IKEA, JYSK, Hagkaup, A4, Epal og Boozt. Í sumum verslunum er verðið sótt á annan hátt og þá er varan vistuð með hlekk en án verðvaktar.'],
    ['Hve oft er verðið athugað?', 'Einu sinni á sólarhring.'],
    ['Hvernig fæ ég að vita af lækkun?', 'Þú færð tilkynningu í appinu, og í tölvupósti ef þú kveikir á því í stillingunum.'],
    ['Þarf ég að kaupa vöruna í gegnum Tossalista?', 'Nei. Þú kaupir beint hjá versluninni eins og venjulega. Tossalisti fær ekkert fyrir það.'],
  ]
  const body = `
  <h1>Verðvakt – fáðu að vita þegar verðið lækkar</h1>
  <p class="lead">Ertu að skoða úlpu, kaffivél eða rúm í mörgum vefverslunum en ætlar að kaupa seinna? Safnaðu vörunum á einn stað í Tossalista. Við sækjum mynd og verð og látum þig vita ef verðið lækkar.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=verdvakt')}">Prófa Kaupa seinna og Verðvakt – frítt<small>Límdu slóð á vöru, við sjáum um restina</small></a>
  <h2>Svona virkar það</h2>
  <ol>
    <li><strong>Afritaðu slóðina</strong> á vöruna í vefversluninni.</li>
    <li><strong>Límdu hana í „Kaupa seinna“</strong> í Tossalista. Mynd, heiti og verð birtast sjálfkrafa.</li>
    <li><strong>Verðvaktin athugar verðið daglega.</strong> Ef það lækkar færðu tilkynningu.</li>
    <li><strong>Keyptu þegar verðið hentar.</strong> Taktu svo mynd af kvittuninni, þá er ábyrgðin skráð og kaupin fara í heimilisbókhaldið.</li>
  </ol>
  <h2>Er þetta í alvöru gott tilboð?</h2>
  <p>Á tilboðsdögum eins og Black Friday er erfitt að vita hvort afslátturinn er raunverulegur. Ef varan hefur verið á Verðvakt í nokkrar vikur sérðu hvað hún kostaði áður og hvort „tilboðið“ er í raun lækkun.</p>
  <h2>Allt sem þú ert að skoða á einum stað</h2>
  <p>Í stað þess að hafa tíu flipa opna og vörur í körfu hjá fimm verslunum geymirðu allt á einum lista, með mynd, verði og hlekk beint á vöruna. Þú getur líka sett vörurnar á <a href="/oskalisti.html">óskalista</a> og deilt honum með fjölskyldunni fyrir jól og afmæli.</p>
  ${faqHtml(qa)}
  <a class="cta" href="${app('utm_source=seo&utm_campaign=verdvakt')}">Byrja að vakta verð</a>`
  return page({ urlPath: '/verdvakt.html', title: 'Verðvakt – fáðu tilkynningu þegar verðið lækkar | Tossalisti', ogTitle: 'Verðvakt – vitaðu þegar verðið lækkar', description: 'Límdu slóð á vöru úr íslenskri vefverslun og Tossalisti lætur þig vita ef verðið lækkar. Kaupa seinna: allt sem þú ert að skoða á einum stað. Frítt.', body, jsonld: [faqLd(qa)] })
}

function oskalisti() {
  const qa = [
    ['Sér sá sem á listann hvað hefur verið tekið frá?', 'Nei. Eigandinn sér óskirnar sínar en aldrei hvað aðrir hafa tekið frá, svo gjafirnar koma á óvart.'],
    ['Þurfa gefendur að skrá sig?', 'Nei. Þeir opna hlekkinn, sjá óskirnar og smella á „Taka frá“.'],
    ['Er hægt að setja vörur úr vefverslunum á listann?', 'Já. Límdu slóð á vöruna og mynd, verð og hlekkur fylgja sjálfkrafa. Verðvaktin lætur þig líka vita ef verðið lækkar.'],
    ['Kostar þetta eitthvað?', 'Nei, Tossalisti er ókeypis.'],
  ]
  const body = `
  <h1>Óskalisti og gjafalisti – enginn gefur það sama</h1>
  <p class="lead">„Hvað viltu í jólagjöf?“ Svaraðu spurningunni í eitt skipti fyrir öll. Búðu til óskalista, deildu hlekknum með fjölskyldunni og hver og einn tekur frá það sem hann ætlar að gefa.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=oskalisti')}">Búa til óskalista – frítt<small>Á Heim í Tossalista: „Búa til óskalista“</small></a>
  <h2>Svona virkar óskalistinn</h2>
  <ol>
    <li><strong>Settu óskirnar á listann.</strong> Skrifaðu þær eða límdu slóð á vöru úr vefverslun – þá fylgja mynd og verð.</li>
    <li><strong>Deildu hlekknum</strong> með fjölskyldu og vinum, til dæmis í Messenger eða fjölskylduhópnum.</li>
    <li><strong>Gefendur taka frá</strong> það sem þeir ætla að gefa. Aðrir sjá „Frátekið“ og kaupa þá eitthvað annað.</li>
    <li><strong>Þú sérð ekkert um frátektir.</strong> Gjafirnar koma á óvart, en enginn fær tvær eins.</li>
  </ol>
  <h2>Fyrir jól, afmæli, fermingar og brúðkaup</h2>
  <p>Óskalisti hentar við öll tilefni þar sem margir gefa sama manninum gjöf. Foreldrar geta búið til lista fyrir börnin, og afar og ömmur sjá strax hvað vantar.</p>
  <h2>Gjafalisti: hverjum á ég eftir að kaupa fyrir?</h2>
  <p>Fyrir þína eigin jólagjafainnkaup geturðu haft venjulegan lista í Tossalista: eina línu á hvern sem þú gefur, og hakað við þegar gjöfin er komin. Og þegar þú kaupir, taktu mynd af kvittuninni – þá er skilafresturinn á sínum stað ef gjöfin passar ekki. Sjá <a href="/kvittanir.html">kvittanir og ábyrgðir</a>.</p>
  ${faqHtml(qa)}
  <a class="cta" href="${app('utm_source=seo&utm_campaign=oskalisti')}">Búa til óskalista</a>`
  return page({ urlPath: '/oskalisti.html', title: 'Óskalisti og gjafalisti fyrir jólin – deildu og enginn gefur það sama | Tossalisti', ogTitle: 'Óskalisti – enginn gefur það sama', description: 'Búðu til óskalista eða jólagjafalista, deildu hlekknum og fjölskyldan tekur frá gjafir nafnlaust. Þú sérð ekki hvað er frátekið. Frítt, engin skráning fyrir gefendur.', body, jsonld: [faqLd(qa)] })
}

function jolainnkaup() {
  const bake = ['mommukokur', 'piparkokur', 'halfmanar', 'cookies', 'kanilsnudar'].filter(R)
  const food = ['hamborgarahryggur', 'lambalaeri', 'mondlugrautur', 'kjotsupa', 'saltkjot'].filter(R)
  const body = `
  <h1>Jólainnkaupalisti – allt fyrir jólin á einum stað</h1>
  <p class="lead">Jólabaksturinn, jólamaturinn og jólagjafirnar. Settu allt á einn lista sem fjölskyldan deilir, svo enginn kaupi tvisvar og ekkert gleymist á Þorláksmessu.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=jolainnkaup')}">Búa til jólalista – frítt<small>Deildu honum með allri fjölskyldunni</small></a>
  <h2>Jólabakstur</h2>
  <p>Veldu sortirnar og settu hráefnin á listann með einum smelli. Hveiti, sykur og smjör leggjast saman ef þú bakar margar sortir.</p>
  <ul class="grid">${bake.map((id) => `<li><a href="${recipeUrl(R(id))}"><span class="e">${R(id).emoji}</span>${esc(R(id).name)}</a></li>`).join('')}</ul>
  <h2>Jólamatur</h2>
  <ul class="grid">${food.map((id) => `<li><a href="${recipeUrl(R(id))}"><span class="e">${R(id).emoji}</span>${esc(R(id).name)}</a></li>`).join('')}</ul>
  <h2>Gleymist oft</h2>
  <ul>
    <li>Rjómi, smjör og mjólk í meira magni en venjulega – búðir loka snemma á aðfangadag.</li>
    <li>Bökunarpappír, álpappír og plastfilma.</li>
    <li>Rafhlöður í leikföngin og kerti.</li>
    <li>Gjafapappír, merkimiðar og límband.</li>
    <li>Möndlugjöfin.</li>
  </ul>
  <h2>Jólagjafirnar</h2>
  <p>Búðu til <a href="/oskalisti.html">óskalista</a> og deildu honum, þá tekur fjölskyldan frá gjafir og enginn gefur það sama. Og ef þú ert að bíða eftir rétta verðinu, settu vöruna á <a href="/verdvakt.html">Verðvakt</a>.</p>
  <h2>Eftir jólin</h2>
  <p>Taktu mynd af kvittununum fyrir stærri gjöfunum. Þá er auðvelt að skila eða skipta, og ábyrgðin er skráð. Sjá <a href="/kvittanir.html">kvittanir og ábyrgðir í símanum</a>. Og í janúar sérðu í <a href="/heimilisbokhald.html">heimilisbókhaldinu</a> hvað jólin kostuðu í raun.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=jolainnkaup')}">Opna Tossalista</a>`
  return page({ urlPath: '/jolainnkaup.html', title: 'Jólainnkaupalisti – jólabakstur, jólamatur og gjafir á einum lista | Tossalisti', ogTitle: 'Jólainnkaupalisti', description: 'Jólainnkaupalisti sem fjölskyldan deilir: hráefni í mömmukökur, piparkökur og hamborgarhrygg með einum smelli, óskalisti fyrir gjafirnar og kvittanir fyrir skilin. Frítt.', body })
}

function vikumatsedill() {
  const week = [['Mánudagur', 'plokkfiskur'], ['Þriðjudagur', 'bolognese'], ['Miðvikudagur', 'kjuklingur-ofn'], ['Fimmtudagur', 'kjotsupa'], ['Föstudagur', 'taco'], ['Laugardagur', 'heimapitsa'], ['Sunnudagur', 'lambalaeri']].filter(([, id]) => R(id))
  const body = `
  <h1>Vikumatseðill og innkaupalisti fyrir vikuna</h1>
  <p class="lead">Ein ferð í búðina, enginn hausverkur um hvað á að vera í matinn klukkan fimm. Hér er tillaga að vikumatseðli fyrir fjölskyldu – hver réttur fer á innkaupalistann með einum smelli.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=vikumatsedill')}">Búa til innkaupalista vikunnar – frítt</a>
  <h2>Tillaga að vikumatseðli</h2>
  <ul class="ing">${week.map(([d, id]) => `<li><b>${esc(d)}</b><span><a href="${recipeUrl(R(id))}">${esc(R(id).name)}</a></span></li>`).join('')}</ul>
  <p>Opnaðu réttinn og smelltu á „Setja hráefnin á innkaupalistann“. Það sem er á listanum fyrir leggst ekki tvisvar á hann.</p>
  <h2>Ráð til að halda kostnaðinum niðri</h2>
  <ul>
    <li><strong>Byrjaðu á ísskápnum.</strong> Skipuleggðu fyrstu dagana út frá því sem þarf að klára.</li>
    <li><strong>Nýttu afganga.</strong> Afgangur af lambalæri sunnudagsins verður að góðri súpu eða samlokum.</li>
    <li><strong>Einn fiskréttur og einn grænmetisréttur</strong> á viku lækka reikninginn.</li>
    <li><strong>Kauptu bara það sem er á listanum.</strong> Þannig minnkar líka matarsóun. Sjá <a href="/matarkostnadur.html">matarkostnaður</a>.</li>
  </ul>
  <p>Fleiri hugmyndir eru í <a href="/uppskriftir/">uppskriftasafninu</a>.</p>
  <a class="cta" href="${app('utm_source=seo&utm_campaign=vikumatsedill')}">Opna Tossalista</a>`
  return page({ urlPath: '/vikumatsedill.html', title: 'Vikumatseðill og innkaupalisti fyrir vikuna | Tossalisti', ogTitle: 'Vikumatseðill og innkaupalisti', description: 'Tillaga að vikumatseðli fyrir fjölskylduna: plokkfiskur, kjötsúpa, taco og fleira. Hvert hráefni fer á innkaupalistann með einum smelli. Frítt.', body })
}

// ---------- Keyrsla ----------
let n = 0
for (const r of RECIPES) { write(`uppskriftir/${r.id}/index.html`, recipePage(r)); n++ }
write('uppskriftir/index.html', recipesHub())
write('verdvakt.html', verdvakt())
write('oskalisti.html', oskalisti())
write('jolainnkaup.html', jolainnkaup())
write('vikumatsedill.html', vikumatsedill())

// Eldri síður: uppfæra „Fleiri leiðbeiningar“
const OLD = ['heimilisbokhald.html', 'fjarmal-heimilisins.html', 'matarkostnadur.html', 'sparnadur.html', 'kvittanir.html', 'innkaupalisti.html', 'utilegulisti.html']
for (const f of OLD) {
  const p = path.join(PUB, f); if (!fs.existsSync(p)) continue
  const s = fs.readFileSync(p, 'utf8')
  const out = s.replace(/<nav class="related">[\s\S]*?<\/nav>/, relatedNav('/' + f))
  if (out !== s) fs.writeFileSync(p, out)
}

// sitemap.xml
const urls = [
  ['/', '1.0', 'weekly'],
  ...GUIDES.map(([u]) => [u, u === '/uppskriftir/' ? '0.9' : '0.8', 'monthly']),
  ...RECIPES.map((r) => [recipeUrl(r), '0.6', 'monthly']),
]
fs.writeFileSync(path.join(PUB, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p, c]) => `  <url><loc>${SITE}${u.replace(/\.html$/, '')}</loc><lastmod>${TODAY}</lastmod><changefreq>${c}</changefreq><priority>${p}</priority></url>`).join('\n')}
</urlset>
`)
console.log(`uppskriftir: ${n} · sitemap: ${urls.length} slóðir`)
