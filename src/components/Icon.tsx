// Schlanke Line-Icons (SVG, ohne externe Library). stroke = currentColor.
type IconName =
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
  | 'wallet'
  | 'arrow-up-right'
  | 'arrow-down-right'
  | 'search'
  // Kategorien
  | 'briefcase'
  | 'gift'
  | 'refresh'
  | 'trending-up'
  | 'tag'
  | 'cart'
  | 'home'
  | 'zap'
  | 'car'
  | 'gamepad'
  | 'utensils'
  | 'heart'
  | 'bag'
  | 'repeat'
  | 'shield'
  | 'package'

const PATHS: Record<IconName, string[]> = {
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  chart: ['M3 3v18h18', 'M18 8v9', 'M13 12v5', 'M8 6v11'],
  plus: ['M12 5v14', 'M5 12h14'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  more: ['M12 6h.01', 'M12 12h.01', 'M12 18h.01'],
  wallet: [
    'M21 12V7H5a2 2 0 0 1 0-4h14v4',
    'M3 5v14a2 2 0 0 0 2 2h16v-5',
    'M18 12a2 2 0 0 0 0 4h4v-4Z',
  ],
  'arrow-up-right': ['M7 17 17 7', 'M7 7h10v10'],
  'arrow-down-right': ['M7 7l10 10', 'M17 7v10H7'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M21 21l-4.3-4.3'],
  briefcase: [
    'M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z',
    'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
    'M2 13h20',
  ],
  gift: [
    'M20 12v9H4v-9',
    'M2 7h20v5H2z',
    'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z',
    'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z',
  ],
  refresh: ['M3 12a9 9 0 0 1 15-6.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15 6.7L3 16', 'M3 21v-5h5'],
  'trending-up': ['M22 7l-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  tag: [
    'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z',
    'M7 7h.01',
  ],
  cart: [
    'M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    'M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    'M1 2h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6',
  ],
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z', 'M9 22V12h6v10'],
  zap: ['M13 2L3 14h9l-1 8 10-12h-9l1-8Z'],
  car: [
    'M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
    'M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
    'M5 17H3v-5l2-5h11l3 5h1a2 2 0 0 1 2 2v3h-2',
    'M9 17h6',
  ],
  gamepad: [
    'M6 11h4',
    'M8 9v4',
    'M15 12h.01',
    'M18 10h.01',
    'M17.3 5H6.7a4 4 0 0 0-4 3.6L2 14a3 3 0 0 0 5 2l1.5-1.5h7L17 16a3 3 0 0 0 5-2l-.7-5.4A4 4 0 0 0 17.3 5Z',
  ],
  utensils: ['M4 2v7a3 3 0 0 0 6 0V2', 'M7 9v13', 'M20 2v20', 'M20 2a4 4 0 0 0-4 4v6h4'],
  heart: ['M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z'],
  bag: ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  repeat: ['M17 2l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 22l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'],
  package: [
    'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    'M3.3 7l8.7 5 8.7-5',
    'M12 22V12',
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
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
