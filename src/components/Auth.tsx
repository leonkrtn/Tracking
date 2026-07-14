import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Benutzername wird intern auf eine feste "E-Mail" abgebildet – so kannst du
// dich einfach mit Benutzername + Passwort anmelden.
function toEmail(username: string): string {
  return `${username.trim().toLowerCase()}@geldtracker.de`
}

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const email = toEmail(username)

    if (mode === 'register') {
      if (password.length < 6) {
        setBusy(false)
        return setMsg('Passwort muss mindestens 6 Zeichen haben.')
      }
      const { data, error } = await supabase.auth.signUp({ email, password })
      setBusy(false)
      if (error) return setMsg(uebersetze(error.message))
      if (!data.session) {
        setMsg(
          'Konto erstellt, aber Login noch nicht möglich. Bitte in Supabase ' +
            'unter Authentication → Sign In / Providers → Email die Option ' +
            '„Confirm email" deaktivieren – dann erneut anmelden.',
        )
      }
      // Bei Erfolg: App wechselt automatisch via onAuthStateChange.
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) return setMsg(uebersetze(error.message))
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-3xl shadow-lg">
          💶
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Geld-Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Einnahmen &amp; Ausgaben – einfach im Griff
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Benutzername
          </label>
          <input
            type="text"
            required
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="z. B. leon"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Passwort
          </label>
          <input
            type="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-emerald-500 py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy
            ? 'Bitte warten…'
            : mode === 'login'
              ? 'Anmelden'
              : 'Konto anlegen'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === 'login' ? 'register' : 'login'))
          setMsg(null)
        }}
        className="mt-4 text-sm text-emerald-600 dark:text-emerald-400"
      >
        {mode === 'login'
          ? 'Noch kein Konto? Jetzt anlegen'
          : '← Zurück zum Anmelden'}
      </button>

      {msg && (
        <p className="mt-4 max-w-sm text-center text-sm text-red-500">{msg}</p>
      )}
    </div>
  )
}

function uebersetze(m: string): string {
  if (/Invalid login credentials/i.test(m))
    return 'Benutzername oder Passwort falsch.'
  if (/already registered/i.test(m))
    return 'Dieser Benutzername ist bereits vergeben.'
  if (/at least 6/i.test(m)) return 'Passwort muss mindestens 6 Zeichen haben.'
  return m
}
