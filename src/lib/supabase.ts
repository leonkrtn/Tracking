import { createClient } from '@supabase/supabase-js'

// Diese Werte sind öffentlich (Publishable Key) – der Zugriff ist durch
// Row-Level-Security in der Datenbank geschützt. Über .env.local überschreibbar.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://wzlrtmxhcblgwugaloqm.supabase.co'

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_f9VuOKEq0XJkI2yWk-vrDw_9FI60MB6'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
