import {
  formatMonth,
  formatMonthShort,
  shiftMonth,
  currentMonthKey,
} from '../lib/format'
import Icon from './Icon'

interface Props {
  month: string
  onChange: (month: string) => void
}

const arrowCls =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ' +
  'border-slate-200 text-slate-600 transition hover:bg-slate-50 ' +
  'active:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent ' +
  'disabled:active:bg-transparent sm:h-9 sm:w-9'

export default function MonthNav({ month, onChange }: Props) {
  const isCurrent = month === currentMonthKey()
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className={arrowCls}
        aria-label="Vorheriger Monat"
      >
        <Icon name="chevron-left" size={18} />
      </button>
      <button
        onClick={() => onChange(currentMonthKey())}
        className="h-11 min-w-[5.5rem] rounded-lg px-2 text-center text-sm font-medium capitalize text-slate-800 transition hover:bg-slate-50 active:bg-slate-100 sm:h-9 sm:min-w-[9.5rem] sm:px-3"
        aria-label="Zum aktuellen Monat"
      >
        <span className="sm:hidden">{formatMonthShort(month)}</span>
        <span className="hidden sm:inline">{formatMonth(month)}</span>
      </button>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrent}
        className={arrowCls}
        aria-label="Nächster Monat"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  )
}
