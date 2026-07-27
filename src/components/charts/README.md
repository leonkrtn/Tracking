# Diagramm-Komponenten (Bklit UI)

Diese Dateien stammen aus **Bklit UI** (MIT-Lizenz) und wurden als
shadcn-Registry in das Projekt übernommen:

- Projekt: https://github.com/bklit/bklit-ui
- Registry: `npx shadcn@latest add @bklit/bar-chart` usw.

Übernommen sind die Registry-Einträge `bar-chart`, `pie-chart`,
`ring-chart`, `chart-context`, `chart-animation`, `grid`, `chart-tooltip`
und `utils` (letzterer als `src/lib/utils.ts`).

## Warum kopiert statt per CLI installiert

Bklit UI wird als shadcn-Registry ausgeliefert – die Komponenten landen
per Design als Quelltext im Projekt und werden dort angepasst. Das ist
also der vorgesehene Weg, nicht ein Workaround.

## Eigene Änderungen

Damit spätere Aktualisierungen nachvollziehbar bleiben, hier die
Abweichungen vom Original:

- `chart-stat-flow.tsx`: Zahlen werden fest mit `de-DE` formatiert
  (`LOCALE`). Im Original nutzt `Intl.NumberFormat` die Browsersprache,
  wodurch Beträge je nach Gerät als `€5,976` statt `5.976 €` erschienen.

## Voraussetzungen im Projekt

- Alias `@/*` → `src/*` (in `tsconfig.json` und `vite.config.ts`)
- Tailwind-Plugin `@tailwindcss/container-queries` (die Mittelbeschriftung
  skaliert über `@container` und `cqw`)
- Die `--chart-*`-Farbwerte in `src/index.css`
