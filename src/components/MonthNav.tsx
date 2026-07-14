import { formatMonth, shiftMonth, currentMonthKey } from '../lib/format'
import Icon from './Icon'

interface Props {
  month: string
  onChange: (month: string) => void
}

export default function MonthNav({ month, onChange }: Props) {
  const isCurrent = month === currentMonthKey()
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        aria-label="Vorheriger Monat"
      >
        <Icon name="chevron-left" size={18} />
      </button>
      <button
        onClick={() => onChange(currentMonthKey())}
        className="min-w-[9.5rem] rounded-lg px-3 py-1.5 text-center text-sm font-medium capitalize text-slate-800 transition hover:bg-slate-50"
      >
        {formatMonth(month)}
      </button>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrent}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Nächster Monat"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  )
}
