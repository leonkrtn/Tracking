// Wandelt technische Supabase/Auth-Fehlermeldungen in verständliche
// deutsche Hinweise um. Unbekannte Meldungen werden unverändert durchgereicht.
export function friendlyError(message: string): string {
  if (/issued.*future|clock skew|jwt.*future/i.test(message)) {
    return (
      'Die Uhrzeit deines Geräts scheint falsch eingestellt zu sein, ' +
      'dadurch lehnt der Server die Anmeldung ab. Bitte auf dem Gerät ' +
      'unter Einstellungen → Datum & Uhrzeit „Automatisch einstellen" ' +
      'aktivieren und die App neu öffnen.'
    )
  }
  return message
}
