import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Transaction } from '../lib/types'
import { exportCSV, exportExcel } from '../lib/exportData'
import Icon, { type IconName } from './Icon'

interface Props {
  transactions: Transaction[]
  onSignOut: () => void
}

export default function MoreMenu({ transactions, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  // Position für das Dropdown ab sm – das Menü hängt im Portal und kann
  // deshalb nicht mehr relativ zum Knopf positioniert werden.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100 sm:h-9 sm:w-9"
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name={open ? 'x' : 'more'} size={18} />
      </button>

      {/* Ins body-Portal, weil der Header backdrop-blur nutzt: ein Element
          mit backdrop-filter wird zum Bezugsrahmen seiner fixed-Kinder.
          Ohne Portal deckte der Backdrop nur den Header ab – daneben tippen
          schloss das Menü dann nicht. */}
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[60] bg-slate-900/20 sm:bg-transparent"
              onClick={close}
            />
            <div
              role="menu"
              className="fixed inset-x-0 bottom-0 z-[61] overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white pt-1 shadow-sheet sm:inset-x-auto sm:bottom-auto sm:right-[var(--menu-right)] sm:top-[var(--menu-top)] sm:w-60 sm:rounded-xl sm:border sm:pt-1 sm:shadow-lg"
              style={
                {
                  '--menu-top': `${pos.top}px`,
                  '--menu-right': `${pos.right}px`,
                  paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
                } as React.CSSProperties
              }
            >
              {/* Auf dem Handy eine eigene Kopfzeile mit X zum Schließen */}
              <div className="flex items-center justify-between px-4 py-1 sm:hidden">
                <span className="text-sm font-semibold text-slate-900">Menü</span>
                <button onClick={close} className="icon-btn -mr-2" aria-label="Menü schließen">
                  <Icon name="x" size={18} />
                </button>
              </div>
              <MenuItem
                icon="download"
                label="Als Excel exportieren"
                onClick={() => {
                  void exportExcel(transactions)
                  close()
                }}
              />
              <MenuItem
                icon="download"
                label="Als CSV exportieren"
                onClick={() => {
                  exportCSV(transactions)
                  close()
                }}
              />
              <div className="my-1 border-t border-slate-100" />
              <MenuItem
                icon="logout"
                label="Abmelden"
                danger
                onClick={() => {
                  close()
                  onSignOut()
                }}
              />
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: IconName
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex min-h-touch w-full items-center gap-3 px-4 py-3 text-left text-base transition hover:bg-slate-50 active:bg-slate-100 sm:py-2.5 sm:text-sm ${
        danger ? 'text-rose-600' : 'text-slate-700'
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  )
}
