// Schlanke Line-Icons (SVG, ohne externe Library). stroke = currentColor.
type IconName =
  // Navigation / UI
  | 'list'
  | 'chart'
  | 'plus'
  | 'x'
  | 'trash'
  | 'download'
  | 'upload'
  | 'logout'
  | 'chevron-left'
  | 'chevron-right'
  | 'more'
  | 'wrench'
  | 'folder'
  | 'pencil'
  | 'search'
  | 'check'
  | 'rotate'
  | 'clock'
  // Kategorien – Einnahmen
  | 'banknote'
  | 'tag'
  | 'disc'
  | 'clipboard-check'
  | 'settings'
  | 'spray'
  // Kategorien – Ausgaben
  | 'cart'
  | 'droplet'
  | 'home'
  | 'zap'
  | 'users'
  | 'shield'
  | 'car'
  | 'megaphone'
  | 'file-text'
  | 'package'

type Elem =
  | { p: string }
  | { c: [number, number, number] } // cx, cy, r
  | { r: [number, number, number, number, number?] } // x, y, w, h, rx

const ICONS: Record<IconName, Elem[]> = {
  list: [
    { p: 'M8 6h13' }, { p: 'M8 12h13' }, { p: 'M8 18h13' },
    { p: 'M3 6h.01' }, { p: 'M3 12h.01' }, { p: 'M3 18h.01' },
  ],
  chart: [{ p: 'M3 3v18h18' }, { p: 'M18 8v9' }, { p: 'M13 12v5' }, { p: 'M8 6v11' }],
  plus: [{ p: 'M12 5v14' }, { p: 'M5 12h14' }],
  x: [{ p: 'M18 6 6 18' }, { p: 'M6 6l12 12' }],
  trash: [
    { p: 'M3 6h18' },
    { p: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' },
    { p: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
    { p: 'M10 11v6' }, { p: 'M14 11v6' },
  ],
  download: [
    { p: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { p: 'M7 10l5 5 5-5' }, { p: 'M12 15V3' },
  ],
  upload: [
    { p: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { p: 'M17 8l-5-5-5 5' }, { p: 'M12 3v12' },
  ],
  logout: [
    { p: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' },
    { p: 'M16 17l5-5-5-5' }, { p: 'M21 12H9' },
  ],
  'chevron-left': [{ p: 'M15 18l-6-6 6-6' }],
  'chevron-right': [{ p: 'M9 18l6-6-6-6' }],
  more: [{ p: 'M12 6h.01' }, { p: 'M12 12h.01' }, { p: 'M12 18h.01' }],

  wrench: [
    {
      p: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.6 6.6a2.1 2.1 0 0 1-3-3l6.6-6.6a6 6 0 0 1 7.9-7.9l-3.4 3.4Z',
    },
  ],
  folder: [
    { p: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z' },
  ],
  pencil: [
    { p: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' },
  ],
  search: [
    { c: [11, 11, 8] },
    { p: 'M21 21l-4.3-4.3' },
  ],
  check: [{ p: 'M20 6 9 17l-5-5' }],
  clock: [{ c: [12, 12, 10] }, { p: 'M12 6v6l4 2' }],
  rotate: [
    { p: 'M3 12a9 9 0 0 1 15-6.7L21 8' },
    { p: 'M21 3v5h-5' },
    { p: 'M21 12a9 9 0 0 1-15 6.7L3 16' },
    { p: 'M3 21v-5h5' },
  ],

  // Einnahmen
  banknote: [
    { r: [2, 6, 20, 12, 2] },
    { c: [12, 12, 3] },
    { p: 'M6 12h.01' },
    { p: 'M18 12h.01' },
  ],
  tag: [
    { p: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z' },
    { p: 'M7 7h.01' },
  ],
  disc: [{ c: [12, 12, 9] }, { c: [12, 12, 3] }],
  'clipboard-check': [
    { p: 'M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z' },
    { p: 'M6 5h12a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z' },
    { p: 'M9 13l2 2 4-4' },
  ],
  settings: [
    { p: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
    {
      p: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
    },
  ],
  spray: [
    { r: [7, 8, 8, 13, 1] },
    { p: 'M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3' },
    { p: 'M18 6h.01' }, { p: 'M20 9h.01' }, { p: 'M17 3h.01' },
  ],

  // Ausgaben
  cart: [
    { c: [9, 21, 1] }, { c: [20, 21, 1] },
    { p: 'M1 2h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6' },
  ],
  droplet: [
    {
      p: 'M12 2.7c-3 3.6-6 7-6 10.3a6 6 0 0 0 12 0c0-3.3-3-6.7-6-10.3Z',
    },
  ],
  home: [{ p: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z' }, { p: 'M9 22V12h6v10' }],
  zap: [{ p: 'M13 2L3 14h9l-1 8 10-12h-9l1-8Z' }],
  users: [
    { c: [9, 8, 3.2] },
    { p: 'M3 21v-1.5a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5V21' },
    { c: [18, 9.5, 2.4] },
    { p: 'M22 21v-1.3a4 4 0 0 0-3-3.9' },
  ],
  shield: [{ p: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' }],
  car: [
    { c: [6, 17, 2] }, { c: [17, 17, 2] },
    { p: 'M5 17H3v-5l2-5h11l3 5h1a2 2 0 0 1 2 2v3h-2' }, { p: 'M9 17h6' },
  ],
  megaphone: [
    { p: 'M3 10v4h3l6 4V6l-6 4H3Z' },
    { p: 'M14 8a4 4 0 0 1 0 8' },
    { p: 'M18 5a8 8 0 0 1 0 14' },
  ],
  'file-text': [
    { p: 'M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z' },
    { p: 'M14 2v4h4' },
    { p: 'M8 13h8' }, { p: 'M8 17h5' }, { p: 'M8 9h2' },
  ],
  package: [
    {
      p: 'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    },
    { p: 'M3.3 7l8.7 5 8.7-5' },
    { p: 'M12 22V12' },
  ],
}

export type { IconName }

export default function Icon({
  name,
  size = 20,
  className = '',
  strokeWidth = 1.75,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name].map((el, i) => {
        if ('p' in el) return <path key={i} d={el.p} />
        if ('c' in el) {
          const [cx, cy, r] = el.c
          return <circle key={i} cx={cx} cy={cy} r={r} />
        }
        const [x, y, w, h, rx] = el.r
        return <rect key={i} x={x} y={y} width={w} height={h} rx={rx ?? 0} />
      })}
    </svg>
  )
}
