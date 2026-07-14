import { formatMonth, shiftMonth, currentMonthKey } from '../lib/format'

interface Props {
  month: string
  onChange: (month: string) => void
}

export default function MonthNav({ month, onChange }: Props) {
  const isCurrent = month === currentMonthKey()
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-2 py-1.5 dark:bg-slate-800">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-600 active:bg-slate-200 dark:text-slate-300 dark:active:bg-slate-700"
        aria-label="Vorheriger Monat"
      >
        ‹
      </button>
      <button
        onClick={() => onChange(currentMonthKey())}
        className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100"
      >
        {formatMonth(month)}
      </button>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrent}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-600 active:bg-slate-200 disabled:opacity-30 dark:text-slate-300 dark:active:bg-slate-700"
        aria-label="Nächster Monat"
      >
        ›
      </button>
    </div>
  )
}
