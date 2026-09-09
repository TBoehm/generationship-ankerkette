---
id: TASK-001
titel: Schiffsansicht und Flugansicht zu einer Präsentation vereinen
status: entwurf
ui: ja
abhaengigkeiten: []
---

## Ziel
Aus den beiden getrennten Visualisierungen wird eine zusammenhängende
Präsentation, die auf GitHub Pages läuft.

## Scope
- Die Szenen aus `legacy/generationenschiff-grundriss.html` und
  `legacy/flug-3d-proxima.html` als framework-freie Module nach
  `src/infrastructure/scene/`, ihre Mathematik nach `src/domain/`
- Dünne React-Wrapper in `src/presentation/pages/` für `/schiff` und `/flug`
- Ein gemeinsamer Übergang zwischen beiden Ansichten

## Nicht im Scope
- `legacy/flugbahn-alpha-centauri.html`. Die Datei zielt noch auf α Cen AB
  und ist damit auf ein anderes Ziel gerechnet. Umstellen oder löschen ist
  ein eigenes Ticket
- Neue Auslegungsgrößen. Alle Zahlen kommen aus `CLAUDE.md`

## Akzeptanzkriterien
- [ ] `/schiff` zeigt den Generalplan mit Decks und Raumaufteilung
- [ ] `/flug` zeigt die Reise vom Sonnensystem bis Proxima b
- [ ] Beide Ansichten teilen sich Kopfzeile, Navigation und Tokens
- [ ] Kein globaler Namenskonflikt mehr, jede Szene kapselt ihren Zustand
      und hängt ihre Renderschleife an den Lifecycle ihres Wrappers
- [ ] Die verlassene Ansicht rendert nicht weiter im Hintergrund
- [ ] Die Zahlen in der Oberfläche stammen aus `src/domain/`, nicht aus
      Literalen in der View
- [ ] Auf einem Telefon bedienbar, alle Bedienelemente mit dem Daumen
      erreichbar

## Definition of Ready
- [x] Ziel und Scope eindeutig
- [ ] Akzeptanzkriterien prüfbar
- [x] Abhängigkeiten benannt
- [x] Betroffene Auslegungsgrößen benannt, keine

## Offene Fragen für /plan-task
1. Was heißt Präsentation genau: geführte Kapitel mit Vor und Zurück, oder
   zwei frei bedienbare Ansichten mit gemeinsamer Navigation?
2. Soll der Übergang die in `CLAUDE.md` unter Punkt 2 genannte Idee
   umsetzen, aus der Reiseansicht ins Schiff hineinzuzoomen, oder reicht ein
   Wechsel über die Navigation?
3. Bleibt die Sprache Deutsch allein, oder wird die englische Fassung
   ausgespielt? Die Paritätsprüfung läuft bereits.
