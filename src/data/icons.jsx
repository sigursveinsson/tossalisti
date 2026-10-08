import React from 'react'
import {
  IconApple, IconCarrot, IconLeaf, IconMushroom, IconLemon, IconMeat, IconFish, IconEgg,
  IconMilk, IconCheese, IconBread, IconCoffee, IconCup, IconBottle, IconBeer, IconDroplet,
  IconCandy, IconCookie, IconIceCream, IconPizza, IconSoup, IconSalt, IconToolsKitchen2,
  IconToiletPaper, IconSpray, IconBucket, IconPaw, IconSnowflake, IconShoppingBag,
  IconBowl, IconCake, IconPackage,
  IconGlassFull, IconGlassCocktail, IconHome, IconBabyCarriage, IconPlane, IconCar, IconReceipt, IconPill, IconMovie,
  IconBurger, IconShirt, IconGift, IconBallFootball, IconDeviceTv, IconBuildingStore,
} from '@tabler/icons-react'

const norm = (s) => ' ' + (s || '').toLowerCase().trim() + ' '

// Vöruheiti (eða hluti) → ákveðið íkon. Fyrsta sem passar ræður. Mörg samheiti.
const PRODUCT = [
  [['ostur', 'rjómaostur', 'parmesan', 'mozzarella'], IconCheese],
  [['mjólk', 'mjolk', 'skyr', 'jógúrt', 'jogurt', 'rjómi', 'rjomi', 'súrmjólk', 'undanrenna', 'léttmjólk', 'ab-mjólk', 'sýrður'], IconMilk],
  [['egg'], IconEgg],
  [['brauð', 'braud', 'rúnstykki', 'runnstykki', 'beygla', 'samloka', 'bagga', 'bakkelsi', 'kruðer', 'snúður', 'vínarbrauð', 'kökur'], IconBread],
  [['kjúkling', 'kjukling'], IconMeat],
  [['hakk', 'nautakjöt', 'svínakjöt', 'svinakjot', 'lambakjöt', 'lamb', 'kjöt', 'kjot', 'pylsa', 'pylsur', 'beikon', 'skinka', 'bjúgu', 'bjugu', 'kótilettur', 'snitsel'], IconMeat],
  [['fiskur', 'lax', 'ýsa', 'ysa', 'þorskur', 'thorskur', 'rækjur', 'raekjur', 'silungur', 'túnfiskur', 'tunfiskur', 'fiskibollur'], IconFish],
  [['gulrót', 'gulræt', 'gulrot'], IconCarrot],
  [['salat', 'spínat', 'spinat', 'kál', 'klettasalat', 'rucola'], IconLeaf],
  [['sveppir', 'sveppur'], IconMushroom],
  [['sítrón', 'sitron', 'límóna', 'limona'], IconLemon],
  [['epli', 'banani', 'bananar', 'appelsín', 'appelsin', 'vínber', 'vinber', 'pera', 'melóna', 'jarðarber', 'bláber', 'ber', 'ávext', 'avext', 'mandarín', 'kíví'], IconApple],
  [['tómat', 'tomat', 'gúrka', 'gurka', 'paprika', 'laukur', 'kartöflur', 'kartoflur', 'grænmeti', 'graenmeti', 'blómkál', 'spergil', 'avókadó', 'avocado'], IconCarrot],
  [['kaffi', 'expresso', 'espresso'], IconCoffee],
  [[' te ', 'tepokar'], IconCup],
  [['bjór', 'bjor', 'pilsner', 'lager'], IconBeer],
  [['vín', ' vin ', 'rauðvín', 'hvítvín', 'léttvín', 'brennivín', 'vodka', 'viskí', 'gin', 'romm'], IconBottle],
  [['kók', ' kok', 'pepsi', ' gos', 'sódavatn', 'sodavatn', 'safi', 'djús', 'djus', 'svali', 'malt', 'fanta', 'sprite', 'orkudrykk', 'mjólkurhristing'], IconBottle],
  [['vatn'], IconDroplet],
  [['súkkulaði', 'sukkuladi', 'nammi', 'sælgæti', 'saelgaeti', 'konfekt', 'lakkrís', 'brjóstsykur'], IconCandy],
  [['kex', 'smákökur', 'smakokur', 'snakk', 'franskar', 'flögur', 'flogur', 'popp', 'kartöfluflögur', 'maískex'], IconCookie],
  [[' ís ', 'rjómaís', 'ísbúð', 'frostpinni'], IconIceCream],
  [['pizza', 'pítsa', 'pitsa'], IconPizza],
  [['súpa', 'supa'], IconSoup],
  [['salt', 'pipar', 'krydd'], IconSalt],
  [['pasta', 'spaghetti', 'spagettí', 'núðlur', 'nudlur', 'hrísgrjón', 'hrisgrjon', 'grjón', 'mjöl', 'hveiti', 'sykur', 'haframjöl', 'morgunkorn', 'cheerios', 'múslí'], IconToolsKitchen2],
  [['klósettpappír', 'klosettpappir', 'salernispappír', 'salernispappir', ' wc'], IconToiletPaper],
  [['uppþvottalögur', 'uppthvottalogur', 'sápa', 'sapa', 'handsápa', 'sjampó', 'sjampo', 'tannkrem', 'tannbursti', 'hárnæring', 'sturtusápa', 'rakvél', 'svitalykt'], IconSpray],
  [['þvottaefni', 'thvottaefni', 'mýkingarefni', 'ræstir', 'raestir', 'klór', 'bón', 'svampur', 'tuska', 'ruslapokar', 'álpappír', 'alpappir', 'eldhúsrúlla', 'eldhusrulla', 'plastpokar', 'blautþurrkur'], IconBucket],
  [['hundamatur', 'kattamatur', 'kattasandur', 'gæludýr', 'gaeludyr', 'dýrafóður', 'dyrafodur', 'hundanammi'], IconPaw],
]

const DEPT = {
  produce: IconApple, bakery: IconBread, baking: IconBread, meat: IconMeat, dairy: IconMilk,
  frozen: IconSnowflake, beverages: IconCup, alcohol: IconBeer,
  cleaning: IconSpray, personalcare: IconDroplet, household: IconBucket,
}

function pickIcon(name, dept) {
  const n = norm(name)
  for (const [keys, Icon] of PRODUCT) if (keys.some(k => n.includes(k))) return Icon
  return DEPT[dept] || IconShoppingBag
}

export function CatIcon({ name, dept, size = 52, fill = false, className = '', onClick }) {
  const Icon = pickIcon(name, dept)
  const spanStyle = fill ? undefined : { width: size, height: size }
  const isz = fill ? 40 : Math.round(size * 0.58)
  return (
    <span className={'cat-icon ' + (fill ? 'cat-icon-fill ' : '') + className} style={spanStyle} onClick={onClick}>
      <Icon size={isz} color="currentColor" stroke={1.6} />
    </span>
  )
}

// Deildartákn fyrir flokkafyrirsagnir á innkaupalista (hönnunarkerfi: línutákn, enginn litur).
const DEPT_HEAD = {
  produce: IconCarrot, bakery: IconBread, meat: IconMeat, dairy: IconMilk, frozen: IconSnowflake,
  pantry: IconBowl, baking: IconCake, beverages: IconBottle, alcohol: IconBeer, snacks: IconCookie,
  candy: IconCandy, cleaning: IconSpray, personalcare: IconDroplet, household: IconToiletPaper, other: IconPackage,
}
export function DeptIcon({ dept, size = 15 }) {
  const Icon = DEPT_HEAD[dept] || IconPackage
  return <Icon size={size} stroke={1.75} color="currentColor" />
}

// Útgjaldaflokkar (Bókhald/Útgjöld) — línutákn í stað emoji. Eigin flokkar notanda halda
// sínu emoji (það er efni sem notandinn valdi), sjá ExpIcon.
const EXP = {
  matur: IconToolsKitchen2, drykkir: IconBottle, afengi: IconGlassFull, snakk: IconCandy, hreinlaeti: IconSpray,
  snyrti: IconDroplet, heimili: IconHome, born: IconBabyCarriage, ferdalog: IconPlane, samgongur: IconCar,
  reikningar: IconReceipt, heilsa: IconPill, afthreying: IconMovie, veitingar: IconBurger, skemmtun: IconGlassCocktail,
  fot: IconShirt, gjafir: IconGift, tomstundir: IconBallFootball, askriftir: IconDeviceTv, gaeludyr: IconPaw, annad: IconPackage,
}
export function ExpIcon({ cat, size = 18 }) {
  // cat: { key, icon, custom } eða lykill. Eigin flokkur → emoji notandans.
  const c = typeof cat === 'string' ? { key: cat } : (cat || {})
  if (c.custom && c.icon) return <span className="exp-emoji" style={{ fontSize: Math.round(size * 0.9) }}>{c.icon}</span>
  const Icon = EXP[c.key] || IconPackage
  return <Icon size={size} stroke={1.75} color="currentColor" />
}
export function StoreIcon({ size = 18 }) { return <IconBuildingStore size={size} stroke={1.75} color="currentColor" /> }
