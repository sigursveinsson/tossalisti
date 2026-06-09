// Sýnishorns-auglýsingar fyrir rúllandi banner (demo fyrir fund).
// Raunverulegar auglýsingar kæmu úr Supabase + listaverk frá auglýsanda.
//
// ALVÖRU MYND: bættu við `image: '/ads/malt.jpg'` á auglýsingu (settu myndina
// í public/ads/). Þá birtir bannerinn heilu myndina í stað stílaða sýnishornsins.
// Notaðu aðeins myndefni sem þú hefur leyfi fyrir (t.d. eigin vörur Ölgerðinnar).
export const DEMO_ADS = [
  { id: 'malt',    brand: 'Egils Malt',        text: 'Jólastemning allt árið — fáðu þér Malt.',         cta: 'Sjá nánar', bg: '#6B2A1B', fg: '#F7E6C4', accent: '#F5A623' },
  { id: 'pepsi',   brand: 'Pepsi Max',         text: 'Hámarks bragð, núll sykur.',                       cta: 'Sjá nánar', bg: '#0E4C92', fg: '#FFFFFF', accent: '#E32934' },
  { id: 'hatting', brand: 'Hatting pítubrauð', text: 'Mjúkt og fljótlegt — fullkomið í kvöldmatinn.',    cta: 'Sjá nánar', bg: '#9A6512', fg: '#FFF6E6', accent: '#F5A623' },
]
