# Ankerkette, Übergabe an Claude Code

## So startest du

1. Diesen Ordner entpacken, zum Beispiel nach `~/projekte/ankerkette`
2. Im Terminal in den Ordner wechseln und `claude` starten
3. Claude Code liest `CLAUDE.md` beim Start automatisch ein und hat damit den
   vollständigen Auslegungsstand: alle Annahmen, hergeleiteten Zahlen, die
   Darstellungsmathematik und die offenen Punkte

## Dateien

- `CLAUDE.md` ist der Projektkontext. Er wird bei jedem Start gelesen. Wenn sich eine
  Auslegungsgröße ändert, muss er mitgepflegt werden.
- `generationenschiff-grundriss.html` ist die Detailansicht des Schiffs mit Decks
  und Raumaufteilung.
- `flug-3d-proxima.html` ist die Reiseansicht bis Proxima b.
- `flugbahn-alpha-centauri.html` ist eine ältere 2D-Fassung der Reise und noch auf
  das falsche Ziel gerechnet, siehe offene Punkte in `CLAUDE.md`.

Alle HTML-Dateien laufen ohne Build-Schritt, einfach im Browser öffnen.

## Erster sinnvoller Auftrag

"Lies CLAUDE.md. Stelle flugbahn-alpha-centauri.html auf Proxima Centauri um,
so dass es zu flug-3d-proxima.html passt, und rechne die Zeiten nach."
