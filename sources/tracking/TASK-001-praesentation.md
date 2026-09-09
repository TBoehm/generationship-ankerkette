---
id: TASK-001
titel: Schiff und Flugbahn in einer gemeinsamen Ansicht vereinen
status: ready-for-dev
ui: ja
abhaengigkeiten: []
---

## Ziel
Wer die Seite aufruft, landet direkt in einer Ansicht, in der beides möglich ist:
das Schiff untersuchen und sich durch seine Komponenten klicken, und die Flugbahn
mit ihrer Veränderung über die Zeit verfolgen.

## Scope
- Die Route `/` ist diese gemeinsame Ansicht. Kein vorgeschaltetes Übersichtsblatt,
  keine zwei getrennten Reiter
- Schiff untersuchen: Sektionen von Bug nach Heck, Decks, Räume, jeweils anklickbar
  bis auf Raumebene, wie in `legacy/generationenschiff-grundriss.html`
- Flugbahn verfolgen: Zeitregler über die volle Reise, Planetenbewegung,
  Geschwindigkeit und Missionszeit, Kameramodi, wie in `legacy/flug-3d-proxima.html`
- Der Wechsel zwischen beiden ist Teil derselben Ansicht, nicht ein Seitenwechsel
- Die Szenen werden framework-freie Module unter `src/infrastructure/scene/`, ihre
  Mathematik liegt in `src/domain/` und ist dort unit-getestet
- `/ship` und `/flight` bleiben als Tiefenlinks erhalten und öffnen dieselbe Ansicht
  mit dem jeweiligen Schwerpunkt, damit ein geteilter Link seinen Zustand behält

## Nicht im Scope
- `legacy/flugbahn-alpha-centauri.html`. Zielt noch auf α Cen AB, ist damit auf ein
  anderes Ziel gerechnet. Umstellen oder löschen ist ein eigenes Ticket
- Neue Auslegungsgrößen. Alle Zahlen kommen aus `CLAUDE.md`

## Akzeptanzkriterien
- [ ] `/` zeigt ohne Zwischenschritt die gemeinsame Ansicht
- [ ] Aus dieser Ansicht heraus ist jede Sektion, jedes Deck und jeder Raum
      erreichbar und zeigt seine Kennzahlen
- [ ] Aus derselben Ansicht heraus ist die Reise über die Zeit verfolgbar, von der
      Abfahrt bis Proxima b
- [ ] Der Übergang zwischen Schiffs- und Reiseschwerpunkt ist animiert und
      unterbricht die Bedienung nicht
- [ ] Es läuft genau eine Renderschleife und genau ein WebGL-Kontext
- [ ] Die verlassene Darstellung verbraucht keine Rechenzeit im Hintergrund
- [ ] Kein globaler Namenskonflikt: jede Szene kapselt ihren Zustand und räumt
      beim Abbau vollständig ab, Geometrien und Materialien eingeschlossen
- [ ] Alle Zahlen in der Oberfläche stammen aus `src/domain/`, keine Literale in
      der View
- [ ] Auf einem Telefon bedienbar, alle Bedienelemente mit dem Daumen erreichbar
- [ ] Die acht Gates sind grün, die neue Mathematik ist test-first entstanden

## Definition of Ready
- [x] Ziel und Scope eindeutig
- [x] Akzeptanzkriterien prüfbar
- [x] Abhängigkeiten benannt, keine
- [x] Betroffene Auslegungsgrößen benannt, keine

## Entschieden
1. Präsentation heißt: eine Ansicht, beide Fähigkeiten. So vom Nutzer festgelegt.
2. Der Übergang folgt der in `CLAUDE.md` unter Offener Punkt 2 notierten Absicht,
   aus der Reiseansicht ins Schiff hineinzuzoomen, soweit das mit r128 und auf
   Mobilgeräten tragfähig ist. Die Architekturentscheidung dazu steht in der Spec.
3. Deutsch und Englisch bleiben beide gepflegt, die Paritätsprüfung läuft bereits.
