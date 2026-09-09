---
abgeleitet_aus: TASK-001
feature: praesentation
---

## Kontext

Deckt alle Akzeptanzkriterien von TASK-001 ab. Die Architektur ist das Ergebnis
einer Analyse mit neun Agenten: drei Leser über die Legacy-Dateien und die
Repo-Randbedingungen, drei unabhängige Entwürfe, drei Gutachter mit getrennten
Prüfbrillen. Gewonnen hat der risikogetriebene Entwurf, in zwei von drei
Bewertungen deutlich, in der dritten im Rauschen.

### Die Entscheidung, die alles andere bestimmt

**Ein durchgehender Zoom von der Reiseansicht ins Schiff ist rechnerisch
unmöglich.** Nachgerechnet und von allen drei Entwürfen unabhängig bestätigt:

- `warpLength(268553 AE)` = 107,45 Einheiten
- `warpLength(790 m = 5,28e-9 AE)` = 1,516e-5 Einheiten
- Die Near-Plane der Reisekamera liegt bei 0,02

Das Schiff liegt damit um den Faktor 1300 **unter** der Near-Plane. Senkt man die
Bezugslänge der Stauchung auf Raumgröße, zerfällt die Proportion: ein 3,6 m
großer Raum erschiene bei 2,083 Einheiten in einem 16,216 Einheiten großen Schiff,
Verhältnis 7,79 statt der wahren 219,4. Die Lücke beträgt 5,69 Dekaden und ist
nicht überbrückbar.

**Also: zwei Szenen, zwei Kameras, ein Renderer, ein Kontext, eine Schleife.**
Zwischen den beiden Durchgängen steht `clearDepth()`. Damit gibt es keinen
gemeinsamen Tiefenbereich, um den die beiden Maßstäbe streiten könnten. Der
Übergang ist eine begrenzte, bildlagengleiche Überblendung von 700 ms, ausgelöst
bei 0,0026 AE, also in Mondbahnnähe, wo das Schiff laut `CLAUDE.md` gebaut wird.

Für den Nutzer bleibt es eine Ansicht: `/` zeigt beides, der Wechsel unterbricht
die Bedienung nicht.

## Dateien

### src/domain, rein, in jsdom prüfbar, ohne three, ohne react, ohne Browser

| Pfad | Schicht | Inhalt |
|---|---|---|
| `constants/shipSections.js` | domain | 15 Sektionen, englische Ids, z-Ausdehnung in Metern, keine Farben, keine Prosa |
| `constants/deckLayout.js` | domain | 2 Ringe à 5 Decks, 59 Räume, Ids und Flächen |
| `constants/starSystem.js` | domain | Planeten, Proxima, α Cen AB, Bahnelemente |
| `constants/chapters.js` | domain | 12 Kapitel der Reise als Distanzmarken |
| `usecases/deckPlan.js` | domain | Ausrollen eines Sektors in zwei Raumreihen plus Längsgang |
| `usecases/selection.js` | domain | Auswahlautomat Sektion, Deck, Raum |
| `usecases/viewTransition.js` | domain | `transitionState(progress)` liefert Aktivität, Deckkraft und Eingabeziel beider Szenen |
| `usecases/orbits.js` | domain | Planetenpositionen zur Missionszeit |
| `usecases/ringLayout.js` | domain | Blockwinkel der Räume auf dem Ring, inkl. Sektorindex |

### src/infrastructure/scene, hier und nur hier lebt three.js

| Pfad | Inhalt |
|---|---|
| `renderer.js` | die einzige Stelle mit `new THREE.WebGLRenderer`, hinter einer Fähigkeitsprüfung |
| `stage.js` | der Regisseur: beide Szenen, die Schleife, die Eingabeverteilung, Fokus und Übergang. Bekommt Renderer und Szenenfabriken injiziert |
| `disposal.js` | Register, in das jede Fabrik einträgt, damit `dispose()` nachweislich vollständig ist |
| `palette.js` | die Szenenfarben. Farbe ist Aussehen und gehört nicht in die Domäne |
| `ship/index.js` | `createShipScene(deps)` |
| `flight/index.js` | `createFlightScene(deps)` |
| `input/orbitController.js` | die gemeinsame Kugelkamera, beide Legacy-Dateien nutzen dieselbe Konvention |
| `input/picker.js` | Raycast mit Sichtbarkeitsprüfung über die Elternkette |

### src/presentation

| Pfad | Inhalt |
|---|---|
| `pages/PresentationPage.jsx` | die eine Seite für `/`, `/ship` und `/flight` |
| `components/SceneCanvas.jsx` | leeres div mit ref, React rendert nichts hinein, hier liegt das einzige `useEffect` zur Szene |
| `hooks/useScene.js` | der Lebenszyklusvertrag an einer Stelle |
| `components/SectionSheet.jsx` | Verzeichnis, Sektion, Deck, Raum |
| `components/DeckPlan.jsx` | der Deckplan als echtes JSX-SVG, nicht als `innerHTML` |
| `components/FlightControls.jsx` | Zeitregler, Kapitel, Kameramodi |
| `components/FlightReadout.jsx` | Zeit, Tempo, Abstände, Generation |

Der Canvas hängt **über** `<Routes>`. Ein Routenwechsel setzt nur den Fokus und
baut nie den Renderer ab. Das ist die Entscheidung, an der das Kriterium
„genau ein Kontext" hängt.

## Verträge

```
createStage({ host, createRenderer, createShipScene, createFlightScene, now, reducedMotion })
  -> { start, stop, step(t), setFocus('ship'|'flight'), setDistance(au),
       setSelection({section, deck, room}), setCameraMode(mode),
       setBoostSizes(bool), setShowLabels(bool),
       onSelect(cb), onFocusSettled(cb), resize(w, h), dispose() }

createShipScene(deps)   -> { root, camera, controller, update(dt), setSelection, dispose }
createFlightScene(deps) -> { root, camera, controller, update(au), dispose }

transitionState(progress) -> { shipActive, flightActive, shipOpacity, flightOpacity,
                               inputTarget, shipDistance, flightDistance }
```

`step(t)` in dieser Reihenfolge, `autoClear` ist einmalig aus:

1. `transitionState(progress)` (rein, aus der Domäne)
2. `flightScene.update(distance)` nur wenn aktiv, sonst gar nicht aufgerufen
3. `shipScene.update(dt)` nur wenn aktiv
4. `renderer.clear()`
5. Reisedurchgang, wenn Deckkraft grösser null
6. `renderer.clearDepth()`
7. Schiffsdurchgang, wenn Deckkraft grösser null

Schritt 6 ist die vollständige Antwort auf das Tiefenproblem über sechzehn
Größenordnungen: es gibt keinen gemeinsamen Tiefenbereich.

**Zwei Einheitensysteme, nie vermischt.** Schiff: eine Welteinheit ist ein Meter,
Kamera 42 Grad, near 1, far 9000. Reise: eine Welteinheit ist eine gestauchte AE,
Kamera 50 Grad, near 0,05 statt der Legacy-0,02, far 6000. Die Stauchung deckelt
den Inhalt bei etwa 115 Einheiten, es geht nichts verloren und die Tiefenverteilung
wird besser.

**Eine Zuhörermenge.** `stage.js` hält die einzigen Listener auf
`renderer.domElement` und verteilt nach `transitionState(progress).inputTarget`.
Tippen gegen Ziehen bleibt bei der Legacy-Schwelle von 7 Pixeln Manhattan-Abstand,
als Konstante herausgezogen und geprüft. Pointer-Capture wird bei `up` **und**
`cancel` freigegeben, was die Schiffsdatei nie tat.

## Testmatrix

Nur Vitest in jsdom. WebGL wird nicht gerendert, deshalb ist alles, was geprüft
werden muss, reine Logik.

| Datei | Happy Path | Verzweigungen | Fehlerfälle |
|---|---|---|---|
| `deckLayout.js` | Summe der Raumflächen je Deck | gegen `usableRoomArea(r)` je Radius | fehlende Balance schlägt fehl |
| `deckPlan.js` | zwei Reihen plus 4 m Gang | Überlauf einer Reihe wird ausgeglichen | Raum breiter als der Sektor |
| `selection.js` | Verzeichnis zu Raum und zurück | Sektion ohne Ringe hat keine Decks | unbekannte Id |
| `viewTransition.js` | beide Enden, Mitte | Deckkraft summiert nie über eins, Eingabeziel wechselt genau einmal | Fortschritt außerhalb 0 bis 1 |
| `orbits.js` | Umlaufzeiten | Missionszeit vor dem Ablegen | negative Zeit |
| `ringLayout.js` | Winkelsumme je Deck ist 90 Grad | Sektorindex 0 bis 3 | leeres Deck |
| `stage.js` | `step` ruft die inaktive Szene nicht auf | Übergang, beide aktiv | `dispose` räumt alles ab |

`stage.js` wird mit einem eingespritzten Renderer-Doppel geprüft
(`{render, clear, clearDepth, setSize, dispose}` mit Spionen). Dadurch werden fünf
Akzeptanzkriterien zu jsdom-Tests statt zu Review-Meinungen: ein Kontext, eine
Schleife, keine Hintergrundlast, vollständiger Abbau, Eingabe nie blockiert.

`renderer.js` bleibt als einzige Datei ungetestet, sie enthält nur den Aufruf.

## Owns / Forbidden

| Teil | Owns | Forbidden |
|---|---|---|
| Daten | `src/domain/constants/**` | alles unter `usecases`, `infrastructure`, `presentation` |
| Logik | `src/domain/usecases/**` | `constants`, `infrastructure`, `presentation` |
| Szene | `src/infrastructure/scene/**` | `src/domain/**`, `src/presentation/**` |
| Oberfläche | `src/presentation/**`, `src/locales/**` | `src/domain/**`, `src/infrastructure/**` |

## Verifikationskriterien

1. `npm run qa` ist grün, alle acht Gates.
2. `sum(rooms.area)` je Deck gleich `usableRoomArea(radius)`, für alle zehn Decks.
3. `stage.step` ruft die Update-Funktion der inaktiven Szene nachweislich nicht auf.
4. `stage.dispose` leert das Abbauregister vollständig.
5. Kein Zahlenliteral einer Auslegungsgröße in `src/presentation/**`.
6. `npm run lang:check` grün, kein deutscher Text außerhalb von `src/locales`.
7. Der Picker liefert kein Ziel unter einer unsichtbaren Elterngruppe.

## Bekannte Mängel der Vorlagen, die beim Portieren zu beheben sind

Alle nachgeprüft, nicht übernommen:

1. **Picker.** In r128 liefert `intersectObjects` auch Treffer unter einer
   unsichtbaren Gruppe. Der Legacy-Filter `h.object.visible` fängt nur die
   eigene Sichtbarkeit, nicht die der Eltern. Nachgestellt, zwei Treffer statt
   keiner. Der Ersatz läuft die Elternkette hoch.
2. **Pointer-Capture** wird in der Schiffsdatei nie freigegeben.
3. **`RA` ist toter Code**, es dupliziert `DECK_RADII`.
4. **`gAt` dupliziert `gravityAt`** aus der Domäne, numerisch identisch.
5. **Textdrift in den Vorlagen:** „17 Generationen" statt 18, „437 Jahre" statt
   466,1 a, Kopfzeile „216.800 m²" statt 216.770 m². Alle Zahlen kommen künftig
   aus der Domäne, damit ist die Klasse Fehler weg.
6. **Der Anteil eines Raums** wird in der Vorlage gegen die Sektorfläche
   gerechnet und summiert deshalb auf 86,7 %. Richtig ist der Bezug auf die
   Raumfläche `26·L`.

## Offene Fragen

Keine.
