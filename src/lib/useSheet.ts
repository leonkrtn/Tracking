import { useEffect, useRef } from 'react'

// Sheets können sich überlagern (Auftrag → Buchung). Der Zähler sorgt dafür,
// dass die Hintergrund-Sperre erst fällt, wenn das letzte Sheet zu ist.
let openSheets = 0

/**
 * Verhalten, das jedes Sheet braucht: Hintergrund-Scroll sperren und mit
 * Escape schließen. Ohne die Sperre scrollt auf dem Handy die Seite hinter
 * dem geöffneten Sheet weiter.
 */
export function useSheet(onClose: () => void): void {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    openSheets++
    document.documentElement.classList.add('sheet-open')

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      openSheets = Math.max(0, openSheets - 1)
      if (openSheets === 0) {
        document.documentElement.classList.remove('sheet-open')
      }
    }
  }, [])
}
