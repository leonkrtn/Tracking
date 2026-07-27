import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // Dark-Mode deaktiviert (helles Theme)
  future: {
    // hover: greift nur noch auf Geräten mit echtem Zeiger. Ohne das bleibt
    // auf dem Handy nach jedem Antippen der Hover-Hintergrund stehen.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      spacing: {
        // Tab-Leiste ist ~60px hoch. Der FAB sitzt darüber, der Inhalt endet
        // dort, wo der FAB beginnt – so verdeckt nichts die letzte Zeile.
        fab: 'calc(5.5rem + env(safe-area-inset-bottom))',
        'content-b': 'calc(9rem + env(safe-area-inset-bottom))',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sheet: '0 -8px 40px -12px rgba(15, 23, 42, 0.25)',
      },
      minHeight: {
        // Mindestgröße für Tap-Ziele
        touch: '44px',
      },
    },
  },
  // Die Chart-Komponenten skalieren ihre Mittelbeschriftung über
  // Container-Queries (@container, cqw-Einheiten).
  plugins: [containerQueries],
}
