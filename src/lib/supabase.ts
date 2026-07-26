import { createClient } from '@supabase/supabase-js'

// Supabase-Projekt "Meister-Kasse" (ref wbbdbzygnlvnzwfwyalj).
// Über .env.local bzw. Environment-Variablen beim Hoster überschreibbar,
// siehe .env.example.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://wbbdbzygnlvnzwfwyalj.supabase.co'

// Publishable Key. Der ist bewusst öffentlich – geschützt wird nicht der
// Key, sondern die Datenbank selbst über die RLS-Policies (siehe
// supabase/migrations/). Er landet im Browser-Bundle und ist dort für
// jeden lesbar.
//
// ACHTUNG: Hier darf NIE ein "sb_secret_..." bzw. service-role-Key
// stehen. Der umgeht RLS komplett und hätte damit vollen Zugriff auf
// alle Daten. Solche Keys gehören ausschließlich in serverseitigen Code.
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_kr6QK1RmKVG-to5gUWcR8Q_7V-oTtXU'

// Schutz gegen den teuersten Konfigurationsfehler: ein versehentlich in
// VITE_SUPABASE_ANON_KEY gesetzter Secret-Key würde sonst unbemerkt
// ausgeliefert werden.
if (/^sb_secret_|service_role/.test(SUPABASE_ANON_KEY)) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY enthält einen Secret-/service-role-Key. ' +
      'Dieser Key darf nicht im Browser landen – bitte den ' +
      'publishable/anon Key verwenden (Supabase → Project Settings → API).',
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
