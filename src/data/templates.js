// Tilbúin lista-sniðmát. type: 'task' eða 'shopping'.
// items eru einföld heiti; fyrir innkaupasniðmát flokkast þau sjálfkrafa í deildir.
export const TEMPLATES = [
  {
    id: 'brudkaup', name: 'Brúðkaup', emoji: '💍', type: 'task',
    items: ['Bóka veislusal', 'Velja dagsetningu', 'Senda boðskort', 'Panta blóm', 'Bóka ljósmyndara',
      'Velja veitingar', 'Panta köku', 'Velja tónlist/DJ', 'Kaupa hringa', 'Skipuleggja brúðkaupsferð'],
  },
  {
    id: 'utilega', name: 'Útilega', emoji: '⛺', type: 'task',
    items: ['Tjald', 'Svefnpokar', 'Dýnur', 'Prímus og gas', 'Vasaljós', 'Kælibox', 'Grill og kol',
      'Sólarvörn', 'Skordýravörn', 'Sjúkrakassi', 'Vatnsbrúsi', 'Spil'],
  },
  {
    id: 'solarfri', name: 'Sólarfrí', emoji: '🏖️', type: 'task',
    items: ['Vegabréf', 'Flugmiðar', 'Hótelbókun', 'Ferðatrygging', 'Sólarvörn', 'Sundföt', 'Sólgleraugu',
      'Hleðslutæki og millistykki', 'Lyf', 'Reiðufé/gjaldeyrir'],
  },
  {
    id: 'flutningar', name: 'Flutningar', emoji: '📦', type: 'task',
    items: ['Panta flutningabíl', 'Kaupa kassa', 'Tilkynna nýtt heimilisfang', 'Flytja rafmagn og net',
      'Segja upp/flytja tryggingar', 'Þrífa gamla íbúð', 'Pakka eldhúsi', 'Pakka svefnherbergi'],
  },
  {
    id: 'veisla', name: 'Veisla', emoji: '🎉', type: 'shopping',
    items: ['gos', 'snakk', 'kex', 'ostar', 'kæfa', 'brauð', 'kaka', 'kaffi', 'servíettur', 'einnota glös'],
  },
  {
    id: 'skolabyrjun', name: 'Skólabyrjun', emoji: '🎒', type: 'task',
    items: ['Skólataska', 'Stílabækur', 'Pennaveski', 'Pennar og blýantar', 'Yddari og strokleður',
      'Reiknivél', 'Nesti box', 'Íþróttaföt', 'Inniskór'],
  },
]
