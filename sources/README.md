# sources

Zwei Wissensschichten, Autorität fließt nach unten.

| Schicht | Ort | Frage |
|---|---|---|
| Ticket | `sources/tracking/TASK-NNN-<slug>.md` | Warum, für wen, was |
| Spec | `sources/specs/<feature>/SPEC.md` | Wie, wie verifiziert |
| Code | `src/**` | Umsetzung |

`CLAUDE.md` steht über beiden: es hält den Auslegungsstand des Schiffs. Wenn
eine Umsetzung eine dort hergeleitete Größe bewegt, werden die abhängigen
Werte nachgerechnet und `CLAUDE.md` im selben Pull Request mitgeführt.

Eine Spec ist Pflicht ab mehr als einer Datei oder mehr als 30 geänderten
Zeilen, und nur dann, wenn die Aufgabe mehrdeutig ist oder auf parallele
Subagents verteilt wird. Darunter wird direkt gegen das Ticket umgesetzt.

Die dritte Schicht aus `webapp-entwicklungsablauf.md`, das `concept-wiki/`
als Submodule, gibt es in diesem Projekt nicht. Damit entfallen auch
`repo-reconcile`, der Pin-Bump und die Attestation unter `.reconcile/`.
