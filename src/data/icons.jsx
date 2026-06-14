import React from 'react'

// Stílhreint íkonakerfi: blár fleti, hvít lína. Eitt almennt vöruíkon (poki)
// + 8 flokkaíkon. Kemur í stað ~49 ólíkra generic-mynda.
const PATHS = {
  bag: ['M6 8h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z', 'M9 8V6.5a3 3 0 0 1 6 0V8'],
  produce: ['M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z', 'M5.5 18.5 13 11'],
  dairy: ['M8 9.5h8V19a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9.5Z', 'M8 9.5 9.5 5h5L16 9.5', 'M12 5V3.5'],
  meat: ['M3.5 12C7 7.5 13 7.5 16.5 12 13 16.5 7 16.5 3.5 12Z', 'M16.5 12 20.5 9v6l-4-3Z'],
  bakery: ['M5.5 13a3.5 3.5 0 0 1 3.5-3.5h6a3.5 3.5 0 0 1 0 7h-6A3.5 3.5 0 0 1 5.5 13Z', 'M9.5 9.7V16', 'M12.5 9.5V16.5'],
  drinks: ['M10 3.5h4V6l1.4 2v10.5a1.5 1.5 0 0 1-1.5 1.5h-3.8a1.5 1.5 0 0 1-1.5-1.5V8L10 6V3.5Z', 'M8.6 11.5h6.8'],
  household: ['M9 9.5h4.2l1.8 1.8V19a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V9.5Z', 'M9 9.5V6h4', 'M13 6 16 4.2', 'M17.2 5.4h.6', 'M17.4 7.2h.6'],
  frozen: ['M12 4v16', 'M4.7 8 19.3 16', 'M19.3 8 4.7 16'],
}

// Búðardeild → flokkaíkon (annars almenni pokinn).
const DEPT_TO_ICON = {
  produce: 'produce', bakery: 'bakery', baking: 'bakery', meat: 'meat', dairy: 'dairy',
  frozen: 'frozen', beverages: 'drinks', alcohol: 'drinks',
  cleaning: 'household', personalcare: 'household', household: 'household',
}

export function iconKeyForDept(dept) { return DEPT_TO_ICON[dept] || 'bag' }

export function CatIcon({ dept, size = 52, fill = false, className = '', onClick }) {
  const key = iconKeyForDept(dept)
  const paths = PATHS[key] || PATHS.bag
  const spanStyle = fill ? undefined : { width: size, height: size }
  const isz = fill ? '56%' : Math.round(size * 0.56)
  return (
    <span className={'cat-icon ' + (fill ? 'cat-icon-fill ' : '') + className} style={spanStyle} onClick={onClick}>
      <svg width={isz} height={isz} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {paths.map((d, i) => <path key={i} d={d} />)}
        {key === 'meat' && <circle cx="8" cy="11.5" r="0.7" />}
      </svg>
    </span>
  )
}
