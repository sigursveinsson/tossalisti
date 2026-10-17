import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import GriptuOffers, { APP_URL } from './GriptuOffers.jsx'
import {
  IconReceipt, IconListCheck, IconTarget, IconLock, IconChartBar, IconLogin, IconMail, IconX,
  IconBuildingStore, IconShieldCheck, IconArrowRight, IconDeviceMobile, IconLogout, IconGift, IconCamera, IconCoin,
} from '@tabler/icons-react'

// griptu.is — framdyr fyrir vörumerki og heildsala (B2B) + stutt kynning fyrir neytendur.
// Sama kóði og appið: innskráning samstarfsaðila opnar vörumerkja-mælaborðið beint.
// Birtist þegar lénið er griptu.is eða slóðin hefur ?griptu (til að keyra local).

const CONTACT = 'sigursveinsson@gmail.com'

const PILLARS = [
  { Icon: IconReceipt, title: 'Staðfest kaup, ekki birtingar', text: 'Hver kaup eru staðfest af kassakvittun — þvert á Bónus, Krónuna, Nettó, Hagkaup og allar hinar. Þú greiðir aðeins fyrir vöru sem fór yfir kassann.' },
  { Icon: IconListCheck, title: 'Á lista → keypt', text: 'Gríptu sér hvað heimilið ætlaði að kaupa og hvort það gerðist. Ásetningur sem ekki varð að kaupum er tækifæri sem engin verslun getur sýnt þér.' },
  { Icon: IconTarget, title: 'Herferðir sem þú stýrir', text: 'Tímabil, þak á innlausnum og fjárhagsrammi. Herferðin stöðvast sjálf þegar rammanum er náð — engin óvænt reikningur.' },
  { Icon: IconLock, title: 'Nafnlaust og samanlagt', text: 'Vörumerki sjá aðeins samanteknar tölur úr hópum með að lágmarki 5 kaupendum. Engin persónugögn, engin verð eftir búðum.' },
]

const STEPS = [
  ['1', 'Heimilið setur vöru á lista', 'Innkaupalistinn í Tossalista — raddstýrður, deildur með fjölskyldunni.'],
  ['2', 'Varan fer yfir kassann', 'Kvittunin er skönnuð. Gervigreindin þekkir vöruna þína, líka þegar strimillinn styttir heitið.'],
  ['3', 'Þú sérð hvað gerðist', 'Nýir kaupendur, endurkaup, á lista → keypt, stig veitt. Í mælaborðinu þínu, sama dag.'],
]
const HOW = [
  [IconListCheck, 'Settu vöruna á listann', 'Hér á síðunni eða í appinu. Gríptu merkir vörur sem gefa stig með gjöf.'],
  [IconCamera, 'Skannaðu kvittunina', 'Eftir búðarferðina — í hvaða búð sem er. Gríptu þekkir vörurnar sjálfkrafa.'],
  [IconCoin, 'Gríptu safnar fyrir þig', 'Stigin safnast í appinu og þú leysir þau út í gjafakörfu eða gjafabréf — eða lætur renna til góðs málefnis.'],
]

// Hero: gæsin á hlaupum fyrst, svo gæsin með talblöðru — rúllar á 4,5 sek fresti með mjúkri yfirfærslu.
const SLIDES = ['/griptu/hero-gaes.png', ...['01-ai-gaes', '02-kvittun', '03-til-baka', '04-bonus-kronan', '05-listi', '06-abyrgd', '07-gjafabref', '08-radd'].map(n => `/griptu/tal/${n}.png`)]
function HeroSlides() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI(x => (x + 1) % SLIDES.length), 4500)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="gl-hero-img gl-slides" aria-hidden="true">
      {SLIDES.map((src, k) => <img key={src} src={src} alt="" className={(k === i ? 'on' : '') + (k === 0 ? ' goose' : ' card')} loading={k < 2 ? 'eager' : 'lazy'} />)}
      <div className="gl-dots">{SLIDES.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={'Mynd ' + (k + 1)} />)}</div>
    </div>
  )
}

function Login({ onClose, onNotBrand }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async () => {
    if (!email || !password) { setErr('Sláðu inn netfang og lykilorð.'); return }
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setErr(/invalid/i.test(error.message) ? 'Rangt netfang eða lykilorð.' : error.message)
    // Annars sér App.jsx um að opna mælaborðið (onAuthStateChange).
  }
  return (
    <div className="sheet-bg center" onClick={onClose}>
      <div className="modal gl-login" onClick={e => e.stopPropagation()}>
        <h2>Innskráning samstarfsaðila <button className="x" onClick={onClose} aria-label="Loka"><IconX size={20} stroke={1.75} /></button></h2>
        <p className="muted-p">Notaðu netfangið sem Gríptu skráði fyrir vörumerkið þitt. Þú ferð beint í mælaborðið — hvorki listar né kvittanir annarra eru sýnilegar.</p>
        <input className="dialog-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="netfang@fyrirtaeki.is" type="email" autoComplete="email" autoFocus />
        <input className="dialog-input" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Lykilorð" type="password" autoComplete="current-password" />
        {err && <p className="signin-error">{err}</p>}
        <button className="primary-btn" onClick={submit} disabled={busy}><IconLogin size={18} stroke={2} /> {busy ? '…' : 'Skrá inn'}</button>
        <p className="gl-login-note">Ekki með aðgang? <a href={`mailto:${CONTACT}?subject=Gríptu – aðgangur fyrir vörumerki`}>Hafðu samband</a> og við stofnum hann samdægurs.</p>
      </div>
    </div>
  )
}

export default function GriptuLanding({ session, onSignOut, onOpenDashboard }) {
  const [login, setLogin] = useState(false)
  const [offerCount, setOfferCount] = useState(0)
  const signedIn = !!session
  return (
    <div className="gl">
      <header className="gl-nav">
        <a className="gl-brand" href="#top"><img src="/griptu/ord-navy.png" alt="Gríptu" height="26" /></a>
        <nav>
          <a href="#tilbod">Tilboðin</a>
          <a href="#svona">Svona virkar það</a>
          <a href="#vorumerki">Fyrir vörumerki</a>
        </nav>
        {signedIn
          ? <div className="gl-nav-btns">
              {onOpenDashboard && <button className="gl-btn primary" onClick={onOpenDashboard}><IconChartBar size={17} stroke={2} /> Mælaborð</button>}
              <button className="gl-btn ghost" onClick={onSignOut}><IconLogout size={16} stroke={2} /> Útskrá</button>
            </div>
          : <div className="gl-nav-btns">
              <button className="gl-btn ghost" onClick={() => setLogin(true)}><IconLogin size={16} stroke={2} /> <span>Samstarfsaðilar</span></button>
              <a className="gl-btn primary" href={APP_URL}><IconDeviceMobile size={17} stroke={2} /> <span>Opna appið</span></a>
            </div>}
      </header>

      <section className="gl-hero" id="top">
        <div className="gl-hero-txt">
          <span className="gl-kicker">Stig fyrir innkaupin · í öllum búðum</span>
          <h1>Fáðu <em>til baka</em> af vörunum sem þú kaupir hvort eð er.</h1>
          <p className="gl-lead">Settu vöruna á listann, skannaðu kvittunina eftir búðarferðina — og Gríptu safnar fyrir þig. Sama hvort þú verslar í Bónus, Krónunni, Nettó eða Hagkaup.</p>
          <div className="gl-cta">
            <a className="gl-btn primary big" href="#tilbod"><IconGift size={19} stroke={2} /> Sjá tilboðin{offerCount ? ` (${offerCount})` : ''}</a>
            <a className="gl-btn ghost big" href={APP_URL}><IconDeviceMobile size={18} stroke={1.9} /> Opna appið</a>
          </div>
          <div className="gl-trust"><IconShieldCheck size={16} stroke={2} /> Ókeypis · engin kort, engin klippimiði — bara kvittunin þín · hluti af Tossalista</div>
        </div>
        <HeroSlides />
      </section>

      <section className="gl-sec" id="tilbod">
        <div className="gl-sec-h"><span>Tilboð í gangi núna</span><h2>Gríptu þessar vörur</h2></div>
        <GriptuOffers onCount={setOfferCount} />
        <p className="gl-small">Tilboðin eru lifandi — þau sem birtast hér gilda núna. Kostaðar vörur eru alltaf merktar og þú getur alltaf valið aðra vöru.</p>
      </section>

      <section className="gl-sec gl-how" id="svona">
        <div className="gl-sec-h"><span>Svona virkar það</span><h2>Þrjú skref — engir punktar að muna</h2></div>
        <div className="gl-steps">
          {HOW.map(([Icon, t, d]) => <div className="gl-step" key={t}><span className="gl-step-ico"><Icon size={22} stroke={1.75} /></span><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>

      <section className="gl-sec gl-b2b" id="vorumerki">
        <div className="gl-sec-h"><span>Fyrir vörumerki og heildsala</span><h2>Það sem enginn annar getur mælt</h2>
          <p className="gl-lead">Gríptu sér hvað heimilið ætlaði að kaupa og hvort það gerðist — í öllum verslanakeðjum — og þú greiðir aðeins fyrir staðfest kaup.</p></div>
        <div className="gl-grid4">
          {PILLARS.map(p => (
            <div className="gl-card" key={p.title}>
              <div className="gl-card-ico"><p.Icon size={22} stroke={1.75} /></div>
              <h3>{p.title}</h3><p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gl-sec gl-dash">
        <div className="gl-dash-txt">
          <span className="gl-kicker">Mælaborðið þitt</span>
          <h2>Tölur sem þú getur sent til framleiðandans — sama dag.</h2>
          <ul>
            <li><IconArrowRight size={16} stroke={2} /> Staðfest kaup, kaupendur, endurkaup og nýir kaupendur</li>
            <li><IconArrowRight size={16} stroke={2} /> Á lista → keypt: hversu oft ásetningur varð að kaupum</li>
            <li><IconArrowRight size={16} stroke={2} /> Hvað er keypt í sömu körfu — hugmyndir að samtilboðum</li>
            <li><IconArrowRight size={16} stroke={2} /> Gervigreind sem útskýrir tölurnar — og býr aldrei til nýjar</li>
            <li><IconArrowRight size={16} stroke={2} /> Herferðir með þaki og ramma, sem þú stofnar sjálf(ur)</li>
          </ul>
          <div className="gl-cta">
            <button className="gl-btn primary" onClick={() => signedIn ? onOpenDashboard() : setLogin(true)}><IconChartBar size={17} stroke={2} /> {signedIn ? 'Opna mælaborðið' : 'Innskráning samstarfsaðila'}</button>
            <a className="gl-btn ghost" href={`mailto:${CONTACT}?subject=Gríptu – kynning`}><IconMail size={17} stroke={1.9} /> Bóka kynningu</a>
          </div>
        </div>
        <div className="gl-dash-mock" aria-hidden="true">
          <div className="gl-mock-top"><b>Nathan</b><span>síðustu 90 dagar</span></div>
          <div className="gl-mock-kpis">
            <div><b>1.323</b><small>staðfest kaup</small></div>
            <div><b>622</b><small>kaupendur</small></div>
            <div className="g"><b>38%</b><small>endurkaup</small></div>
            <div className="g"><b>57%</b><small>nýir kaupendur</small></div>
          </div>
          <div className="gl-mock-listed">
            <div className="gl-mock-lh"><IconListCheck size={14} stroke={2} /> Á lista → keypt</div>
            <div className="gl-mock-kpis three">
              <div><b>1.786</b><small>sett á lista</small></div>
              <div className="g"><b>62%</b><small>keypt eftir lista</small></div>
              <div className="o"><b>679</b><small>ekki keypt — tækifæri</small></div>
            </div>
          </div>
          <div className="gl-mock-bars">{[3, 5, 4, 7, 6, 8, 9, 7, 10, 9, 11, 12].map((h, i) => <i key={i} style={{ height: h * 7 + '%' }} />)}</div>
          <div className="gl-mock-note">Sýnidæmi — ekki raunveruleg sala</div>
        </div>
      </section>

      <section className="gl-sec" id="virkar">
        <div className="gl-sec-h"><span>Fyrir vörumerki</span><h2>Þrjú skref frá lista að staðfestum kaupum</h2></div>
        <div className="gl-steps">
          {STEPS.map(([n, t, d]) => <div className="gl-step" key={n}><span className="gl-step-n">{n}</span><h3>{t}</h3><p>{d}</p></div>)}
        </div>
        <div className="gl-pilot">
          <IconBuildingStore size={22} stroke={1.75} />
          <div><b>Byrjaðu með tilraunaverkefni.</b> 2–3 vörur, 8–12 vikur, fast kostnaðarþak. Greitt aðeins fyrir staðfest kaup. Mælt með samanburðarhópi sem fær ekki tilboðið — svo þú sjáir hvað Gríptu bætti við, ekki bara hvað seldist.</div>
          <a className="gl-btn primary" href={`mailto:${CONTACT}?subject=Gríptu – tilraunaverkefni`}>Ræða tilraunaverkefni</a>
        </div>
      </section>

      <section className="gl-sec gl-consumer">
        <div className="gl-consumer-img"><img src="/griptu/mascot-gaes.png" alt="" /></div>
        <div>
          <span className="gl-kicker">Appið</span>
          <h2>Gríptu býr í Tossalista.</h2>
          <p className="gl-lead">Innkaupalistinn, verkin, kvittanirnar og ábyrgðirnar á einum stað — og Gríptu stigin safnast þar. Ókeypis, íslenskt, virkar í síma og vafra.</p>
          <a className="gl-btn primary big" href={APP_URL}><IconDeviceMobile size={18} stroke={2} /> Opna Tossalista</a>
        </div>
      </section>

      <footer className="gl-foot">
        <img src="/griptu/ord-navy.png" alt="Gríptu" height="18" />
        <span>Hluti af Tossalista · <a href="https://tossalisti.is">tossalisti.is</a> · <a href={`mailto:${CONTACT}`}>{CONTACT}</a></span>
        <span>© 2026 Gríptu</span>
      </footer>

      {login && <Login onClose={() => setLogin(false)} />}
    </div>
  )
}
