import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Icon from './Icon'

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
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon name="wallet" size={26} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Geld-Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Einnahmen &amp; Ausgaben im Griff
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
              placeholder="z. B. flavio"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Passwort
            </label>
            <input
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-base font-medium text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
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
          className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          {mode === 'login'
            ? 'Noch kein Konto? Jetzt anlegen'
            : '← Zurück zum Anmelden'}
        </button>

        {msg && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-600">
            {msg}
          </p>
        )}
      </div>
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
