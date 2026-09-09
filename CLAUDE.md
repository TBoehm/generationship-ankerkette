# Ankerkette, Generationenschiff nach Proxima Centauri

Interaktive Visualisierungen eines physikalisch durchgerechneten Generationenschiffs.
Diese Datei enthält den vollständigen Auslegungsstand. Alle Zahlen sind hergeleitet,
nicht geraten. Wenn du etwas änderst, das eine dieser Größen berührt, rechne die
abhängigen Werte mit nach und aktualisiere diese Datei.

## Arbeitsweise und Konventionen

- Alle Texte in der Oberfläche auf Deutsch, deutsche Zahlformatierung (`toLocaleString('de-DE')`).
- **Keine Gedankenstriche (—)** in Texten. Stattdessen Komma, Doppelpunkt, Klammern oder Punkt.
- Keine rhetorischen Schlusspointen am Absatzende, Texte enden mit dem letzten Sachinhalt.
- Der Entwicklungsablauf steht in `webapp-entwicklungsablauf.md`, die abgeleiteten
  Skills unter `.claude/skills/`. Die Gates sind Teil jeder Aufgabe, nicht ein
  Schritt danach.
- Build über Vite, three.js r128 als npm-Abhängigkeit. Die Regel "kein Build-Schritt"
  galt für die Einzeldokumente unter `legacy/` und ist mit TASK-001 abgelöst.
- Nur Tests, die unbeaufsichtigt auf der GitHub CI laufen: Vitest in jsdom. Kein
  Browser-Level, kein End-to-End-Level. Eine WebGL-Szene wird über ihre nach
  `src/domain/` gezogene Mathematik geprüft, nicht durch Rendern.
- three.js r128: kein `OrbitControls`, keine `CapsuleGeometry`. Kamerasteuerung ist
  handgeschrieben (Pointer-Events plus Pinch).
- Mobil zuerst: alle Bedienelemente sind mit dem Daumen erreichbar, `touch-action:none`
  auf dem Canvas, `env(safe-area-inset-*)` in den Rändern.
- Farbwelt: Rumpfgrau `#05070a`, Schrift `#e6e2d8`, Akzent Messing `#c9a253`.

## Kernannahmen

| Annahme | Wert | Begründung |
|---|---|---|
| Besatzung | 1.000 Personen | genetisches Minimum bei Kryobank liegt bei 150 bis 200; Faktor 3 bis 5 als Katastrophenpuffer |
| Kryobank | Gameten und Embryonen von 3.000 bis 5.000 Spendern | entkoppelt genetische Vielfalt von der Populationsgröße |
| Reisegeschwindigkeit | 1 % c = 2.998 km/s | Obergrenze für ein Schiff dieser Masse mit in 100 Jahren absehbarer Technik |
| Antrieb | Fusions-Puls (Orion-Prinzip), Austrittsgeschwindigkeit ca. 1.000 km/s | einziges Konzept, das mit der Masse skaliert |
| Bremsen | Magsegel (Zubrin/Andrews 1989) | mit Raketenantrieb wäre das Massenverhältnis 402 statt 20 |
| Generationsabstand | 26 Jahre | ergibt 18 Generationen |

### Warum kein Raketenbremsen
Δv = 2.998 km/s je Richtung. Bei vₑ = 1.000 km/s:
- nur Beschleunigen: Massenverhältnis e³ = 20 → ca. 10 Mio. t Treibstoff
- Beschleunigen und Bremsen: e⁶ = 402 → ca. 216 Mio. t, ausgeschlossen

Von den 10 Mio. t sind nur 0,4 bis 1,4 % echter Fusionsbrennstoff
(E/kg Ausstoß = ½vₑ² = 5·10¹¹ J/kg, Fusionsausbeute 3,5·10¹⁴ J/kg, Wirkungsgrad 10 bis 40 %),
also 36.000 bis 143.000 t Deuterium. Der Rest ist beliebige Reaktionsmasse.

## Schiffsauslegung

- Länge 790 m, Rumpfdurchmesser 280 m, Trockenmasse ca. 539.000 t
- Zwei **gegenläufige** Ringe, dadurch hebt sich der Drehimpuls auf und das Schiff
  hat keinen Kreiselwiderstand beim Kurshalten
- Ringgeometrie: Außenradius 125 m, axiale Breite 30 m, radiale Höhe 25 m, 5 Decks à 5 m
- Drehzahl 1,89 min⁻¹ → 0,50 g außen (r=125), 0,42 g innen (r=105), Randgeschwindigkeit 24,7 m/s
- Coriolis bei 1,5 m/s Gehgeschwindigkeit: 0,59 m/s², also 12 % der lokalen Schwere
- 4 druckdichte Sektoren je Ring, jeder mit eigener Luft- und Wasseraufbereitung

### Deckflächen (wichtig: pro Deck eigener Radius rechnen)
Sektorlänge L = 2πr/4, Sektorfläche = 30·L, Raumfläche = 26·L (Rest ist der 4 m breite Längsgang).

| Deck | r [m] | g | Sektorlänge [m] | Sektorfläche [m²] |
|---|---|---|---|---|
| 1 | 125 | 0,50 | 196,3 | 5.890 |
| 2 | 120 | 0,48 | 188,5 | 5.655 |
| 3 | 115 | 0,46 | 180,6 | 5.419 |
| 4 | 110 | 0,44 | 172,8 | 5.184 |
| 5 | 105 | 0,42 | 165,0 | 4.948 |

Ring gesamt 108.385 m², beide Ringe 216.770 m², 217 m² pro Person.
Ring B (Landwirtschaft) allein: 108 m² pro Person Grundfläche, durch mehrlagige
Terrassen zwei- bis dreifach an Anbaufläche. Zum Vergleich: Biosphere 2 brauchte
250 m² pro Person und hatte trotzdem Kaloriendefizit.

**Häufiger Fehler:** Nicht alle fünf Decks mit r=125 rechnen. Das ergibt 117.800 m²
statt 108.385 m², also 8 % zu viel.

### Sektionen von Bug nach Heck (z-Achse, +z = Flugrichtung)
Bugschild, Vorratstanks, Habitatmantel (nicht rotierend) mit Ring A (Wohnen) und
Ring B (Agrar), Zentralachse mit Naben und Sturmbunker, Kryobank, Werkstatt,
Lebenserhaltung, Reaktor mit Radiatoren, Schattenschild, Treibstoffmagazin,
Pusherplatte, Magsegel.

## Massen- und Materialbilanz

Trockenmasse 539.000 t, mit Tankfüllung 779.000 t, davon zugeordnet 715.000 t:

| Stoff | Masse | Anteil |
|---|---|---|
| Wasser und Eis | 497.000 t | 69,5 % |
| Stahl und Eisenlegierungen | 120.000 t | 16,8 % |
| Aluminium | 45.000 t | 6,3 % |
| Boden, Substrat, Biomasse | 15.000 t | 2,1 % |
| Kohlenstoff und Verbundwerkstoffe | 12.000 t | 1,7 % |
| Titan | 8.000 t | 1,1 % |
| Kupfer | 6.000 t | 0,8 % |
| Silizium, Glas, Keramik | 5.000 t | 0,7 % |
| Stickstoff | 4.000 t | 0,6 % |
| Supraleiter und Sondermetalle | 1.200 t | 0,2 % |
| Kernbrennstoff | 600 t | 0,1 % |

Schwerster Einzelposten ist das Bugschild mit 150.000 t (3 m Wassereis über 53.100 m²
Frontfläche plus Whipple-Lagen). Reines Eis über diese Fläche wiegt 146.078 t, die
Differenz sind die Whipple-Lagen.

**Achtung, Geometrie stimmt nicht überein:** 53.100 m² entsprechen einem Kreis von
260 m Durchmesser, der Rumpf misst aber 280 m. Der Rumpfquerschnitt beträgt 61.575 m²,
es bleibt ein 10 m breiter Ring von 8.475 m² ungedeckt. Entweder liegt das Schild
absichtlich nur über dem Druckkörper und der Mantelrand wird anders geschützt, oder
die Fläche gehört auf 61.575 m² und die Schildmasse auf ca. 169.000 t korrigiert.
Ungeklärt.

## Prüfung des Bugschilds

Die 3 m sind nachgerechnet. Ergebnis: sie sind **nicht durch Erosion begründet**,
sondern durch Strahlung. Als Erosionsschild wären Zentimeter genug, als Schutz gegen
galaktische kosmische Strahlung sind die 3 m großzügig, aber für 18 Generationen
vertretbar.

### Energieeintrag je Streckenabschnitt
Flächenbezogene Trefferenergie ½·(ρ·s)·v², Staubdichten aus Grün-Modell (Zodiakalstaub),
New-Horizons-SDC (Kuiper) und Ulysses/Galileo-Fluss (interstellarer Staub).

| Abschnitt | v beim Durchflug | Staubsäule | Energie | Anteil |
|---|---|---|---|---|
| Asteroidengürtel 2,1 bis 3,3 AE | 51 km/s | 2,5·10⁻⁸ kg/m² | 32 J/m² | 0,0054 % |
| Kuipergürtel 30 bis 50 AE | 195 km/s | 3,0·10⁻⁹ kg/m² | 57 J/m² | 0,0095 % |
| Proxima-Staubgürtel 1 bis 4 AE | 38 km/s | 4,5·10⁻⁹ kg/m² | 3 J/m² | 0,0005 % |
| **interstellare Marschstrecke** | **2.998 km/s** | **1,3·10⁻⁷ kg/m²** | **5,96·10⁵ J/m²** | **100 %** |

Alle drei Gürtel zusammen liegen unter 0,02 % der Marschstrecke. Das ist kein
Rundungsfehler im Entwurf, sondern eine Eigenschaft des Flugprofils: die 30 Jahre
Beschleunigung und 50 Jahre Bremsung liegen genau dort, wo der Staub sitzt, deshalb
wird jeder Gürtel langsam durchflogen.

| Ort | Geschwindigkeit |
|---|---|
| 2,1 AE (Beginn Asteroidengürtel) | 45 km/s |
| 3,3 AE (Ende) | 56 km/s |
| Jupiter, 5,2 AE | 70 km/s |
| Neptun, 30 AE | 169 km/s |
| 50 AE (Ende Kuipergürtel) | 218 km/s |
| 100 AE Restweg (einlaufend) | 239 km/s |
| 4 AE Restweg | 48 km/s |
| Proxima b | 5 km/s |

**Die Start- und Endgeschwindigkeiten müssen also nicht angepasst werden.** Ein
Bremsen vor den Gürteln würde 0,02 % der Belastung gegen ein Vielfaches an Reisezeit
tauschen.

### Abtrag über die volle Strecke
Staub, Verdampfungsenergie Q (3·10⁶ J/kg ist volle Kopplung mit Sublimationswärme,
10⁹ J/kg berücksichtigt, dass der größte Teil der Energie als Plasma und Strahlung
wieder abgeht):

| Q [J/kg] | Abtrag |
|---|---|
| 3·10⁶ | 0,217 mm |
| 10⁷ | 0,065 mm |
| 10⁸ | 0,007 mm |
| 10⁹ | 0,001 mm |

Gas: Protonenfluenz 8,0·10²¹ je m² (n_H = 0,2 cm⁻³). Bei Sputterausbeuten von 1 bis
100 H₂O je Proton sind das 0,0003 bis 0,026 mm. Die 47-keV-Protonen bleiben nach
etwa 1 µm im Eis stecken, sie durchdringen nichts.

Abtrag insgesamt also **deutlich unter einem Millimeter**, bei jeder vertretbaren
Annahme. Ein Erosionsschild bräuchte Zentimeter, nicht Meter.

### Was die 3 m wirklich leisten
2.751 kg/m², also **275 g/cm²**. Empfohlen werden gegen galaktische kosmische
Strahlung 20 bis 100 g/cm², das Schild liegt beim 2,8-fachen der oberen Empfehlung.
Das ist die eigentliche Begründung der Dicke, nicht der Staub. Es deckt allerdings
nur die Frontfläche ab, die seitliche Abschirmung des Habitatmantels ist davon
unberührt.

### Der offene Rest: seltene große Körner
Über die gesamte Reise fängt die Frontfläche zusammen **7,1 g** interstellaren Staub
ab. Die Verteilung dieser Masse über die Korngrößen ist die einzige wirklich offene
Frage. Unter der Annahme, dass 1 % der Masse in einer Korngröße steckt:

| Kornradius | Masse je Korn | Energie je Treffer | erwartete Treffer |
|---|---|---|---|
| 0,01 mm | 1,0·10⁻¹¹ kg | 47 J | 6,7 Mio. |
| 0,1 mm | 1,0·10⁻⁸ kg | 4,7·10⁴ J | 6.700 |
| 1 mm | 1,0·10⁻⁵ kg | 4,7·10⁷ J (11 kg TNT) | 7 |
| 5 mm | 1,3·10⁻³ kg | 5,9·10⁹ J (1,4 t TNT) | 0,05 |

Ein Millimeterkorn schlägt einen lokalen Krater, den 3 m Eis aushalten; sieben davon
in 385 Jahren sind reparierbar. Ein Fünf-Millimeter-Korn wäre ein Strukturschaden,
und ob es eines gibt, hängt an einer Verteilung, die niemand bei diesen Größen
gemessen hat. Die Gegenmaßnahme ist Vorausdetektion und seitliches Ausweichen um
Meter, nicht mehr Eis.

## Bauphase

**Ort:** Bahn um den Mond. 98 % der Masse kommt vom Mond, also baut man dort.
- LEO scheidet aus: 67.200 m² Querschnitt, Restatmosphäre, Trümmerflug, Strahlungsgürtel
- Mondoberfläche scheidet aus: Ringe tragen ihr Eigengewicht nicht, Mondstaub zerstört Drehlager
- EML-2: billiger Einfang der Massentreiber-Lieferungen, aber instabil
  (7 m/s pro Jahr → 2.500 t Stützmasse jährlich, 100.000 t über 40 Jahre)
- Mond-DRO: über Jahrzehnte stabil, ca. 7.000 t über die Bauzeit, dafür teurerer Einfang
- Wahrscheinlich beides: Auffangstation in EML-2, Montage im DRO

**Oberth-Effekt ist irrelevant.** Bei 3.000 km/s Zielgeschwindigkeit spart ein
Perigäumsdurchgang genau 11,2 km/s, also 0,37 %. Der Abflugort ist physikalisch beliebig.

**Beschaffung:**
- Mond liefert Struktur (42 % Sauerstoff im Regolith, Al aus Anorthosit, Fe/Ti aus Ilmenit),
  Wasser (Poleis, LCROSS maß 5,6 ± 2,9 % im Cabeus-Krater; 8,9 Mio. t Eisregolith für
  500.000 t Wasser = 0,05 bis 0,5 % der geschätzten Reserve) und die gesamte inerte Antriebsmasse
- Mond liefert **kein** C und N: nur 80 bis 150 ppm implantierter Sonnenwind,
  für 12.000 t C wären 80 Mio. t Regolith nötig
- Phobos oder kohlige NEAs für C, N und organisches Material. Ob Phobos karbonatisch ist,
  entscheidet JAXAs MMX-Mission: Start 20. Oktober 2026, Proben 2031
- Deuterium nur aus den Erdozeanen: 34,8 g D je m³ Wasser, für 150.000 t braucht es
  4.300 km³. Das gesamte Mondpoleis ergäbe höchstens 35 t

**Massentreiber:** 10,7 Mio. t auf 2,4 km/s = 3,08·10¹⁶ J, über 50 Jahre bei 50 %
Wirkungsgrad 39 MW Dauerleistung, also 0,0013 % der Missionsenergie. Abbauvolumen
7,1 Mio. m³, entspricht einer Grube von 800 × 800 m und 11 m Tiefe.

**Erste Zündung erst weit außerhalb.** Der Vertrag von 1963 verbietet nukleare
Explosionen im Weltraum. Das fertige Schiff wird solarelektrisch aus dem Erde-Mond-System
geschleppt, Besatzung kommt zuletzt an Bord.

## Flugprofil (Ziel Proxima Centauri b)

| Phase | Dauer | Strecke |
|---|---|---|
| Schlepp | 1,5 a | wenige Mio. km |
| Beschleunigung, 3,166 mm/s² = 0,00032 g | 30,0 a | 9.487 AE |
| Marschfahrt bei 2.998 km/s | 384,6 a | 243.266 AE |
| Magsegel-Bremsung, 1,901 mm/s² | 50,0 a | 15.800 AE |
| **Gesamt** | **466,1 a** | **268.553 AE = 4,2465 Lj** |

18 Generationen. Neptunbahn nach 1,7 Jahren bei 169 km/s, gezählt ab der Zündung.
Auf der Missionsuhr, die beim Ablegen startet, sind das 3,2 Jahre. Der Legacy-Code
addierte beide Uhren stumm zu einer Zahl, `flightStateAt` gibt sie getrennt zurück.

**Keine Swing-bys.** Die Ablenkung fällt mit steigender Geschwindigkeit:
Jupitervorbeiflug bei 10 km/s bringt 18,4 km/s (0,61 % der Zielgeschwindigkeit),
bei 3.000 km/s nur noch 0,8 km/s (0,03 %). Ein Sonnen-Oberth bei 0,1 AE Perihel
brächte 4,3 %, setzt aber einen impulsiven Brennvorgang voraus, während der Antrieb
30 Jahre läuft. Erst am Ziel, wenn das Magsegel auf einige hundert km/s heruntergebremst hat,
werden Vorbeiflüge an Centauri A oder B nützlich.

**Interstellares Medium:** bei 3.000 km/s trägt jedes Proton 47 keV, Fluss
3·10¹¹ pro m² und Sekunde, Fluenz über 400 Jahre 3,8·10²¹ pro m².

**Navigation:** Querfehler von 1 m/s summiert sich über 437 Jahre auf 0,09 AE.
Zielgenauigkeit von 100 AE auf 4,25 Lj entspricht 75 Bogensekunden. Aberration
bei 1 % c beträgt 0,57 Grad.

## Zielsystem

Koordinaten in Ekliptikkoordinaten, hergeleitet aus RA/Dec:

| Objekt | ekl. Breite | ekl. Länge | Distanz | Einheitsvektor (x, y, z) |
|---|---|---|---|---|
| Proxima Centauri | -44,76° | 239,11° | 4,2465 Lj = 268.553 AE | (-0,36447, -0,60934, -0,70418) |
| α Cen AB | -42,59° | 239,48° | 4,3441 Lj = 274.726 AE | (-0,37386, -0,63417, -0,67680) |

Winkelabstand am Himmel 2,185°, räumlicher Abstand Proxima zu AB 12.058 AE = 0,1907 Lj.
Die Flugbahn führt 45 Grad unter die Ekliptik, deshalb kommt kein Planet in ihre Nähe.

**Proxima:** roter Zwerg, Radius 107.000 km (0,154 R☉), absolute Helligkeit 15,60 mag.
Von der Erde aus 11,17 mag, also mit bloßem Auge unsichtbar. Größenklasse 6 wird erst
bei 24.798 AE Restweg erreicht, das ist nach 400 Jahren ab der Zündung, auf der
Missionsuhr nach 402. Die früher hier notierten 380 Jahre waren falsch. Bis dahin ist der
helle Punkt voraus immer α Cen A, nicht das Ziel.

**Planeten (Stand 2025, NIRPS-Bestätigung):**
- Proxima d: a = 0,02881 AE, P = 5,12338 d, ≥0,26 M⊕, Radius ca. 0,81 R⊕
- Proxima b: a = 0,04856 AE, P = 11,186 d, ≥1,06 M⊕, in der habitablen Zone
- Proxima c (Kandidat von 2020 bei 1,5 AE) wurde durch dieselben NIRPS-Messungen
  **widerlegt** und darf nicht dargestellt werden
- habitable Zone ca. 0,042 bis 0,082 AE

**α Cen B** umläuft A in 79,91 a, a = 23,52 AE, e = 0,5179, Abstand schwankt 11 bis 36 AE.
Aus Proxima gesehen hat α Cen A die Helligkeit -6,8 mag.

## Darstellungsmathematik

Das ist der heikelste Teil des Codes. Acht Größenordnungen (0,0026 AE bis 268.553 AE)
passen nicht linear in eine Szene.

### Logarithmische Raumstauchung
```
L' = WS · log10(1 + L / WL0)
Position' = Richtung · L'      (Richtungen bleiben exakt erhalten)
```
`WL0` wächst mit dem Abstand zum nächstgelegenen Ende der Reise mit:
`WL0 = clamp(min(d, D_TOT - d) / 2000, 0.002, 300)`, `WS = 115 / log10(1 + 1e6/WL0)`.
Die obere Klammer greift auf dieser Bahn nie: das Maximum liegt bei der Halbstrecke
und beträgt 134.276,6 / 2000 = 67,1. Der Wert 300 ist toter Code.
Dadurch ist am Start das Planetensystem aufgelöst, in der Mitte die Oortwolke,
am Ziel das Proxima-System.

### Bekannte Verzerrung
Die Abbildung ist radial um das Zentrum, also **anisotrop**. Verhältnis radialer zu
tangentialer Vergrößerung ist etwa `1 / ln(L/L0)`, bei 1 AE und L0 = 0,002 also 1/6,2.
Kreise, die nicht um das Abbildungszentrum liegen, werden dadurch zu flachen Ellipsen
gequetscht. Das ist unvermeidbar, nicht reparierbar.

**Gegenmittel: Systemansicht.** Verlegt das Zentrum der Stauchung ins Zentralgestirn
(Sonne vor der Halbstrecke, Proxima danach). Dann liegen alle Planetenbahnen konzentrisch
um das Zentrum, alle ihre Punkte haben denselben Abstand und werden identisch skaliert,
die Kreise bleiben Kreise. In dieser Ansicht `WL0 = 0.002` fest halten.

### Winkelgrößen
Radien werden mit demselben Faktor skaliert wie die Abstände, dadurch bleibt der
Winkeldurchmesser vom Schiff aus exakt. Weil dann aber alles unter ein Pixel fällt,
werden kleine Winkel logarithmisch angehoben:
```
α' = max(α, 0.0042 · log10(1 + α / 1e-9))
```
Die beiden Zweige schneiden sich bei 0,031492 rad, also 1,80 Grad: darüber echte
Größe, darunter angehoben. Der Code verzweigt nicht auf diese Schwelle, sondern
nimmt das Maximum beider Terme. Eine von Hand notierte Schwelle liefert sonst
knapp darunter zu kleine Radien, bei 1,6 Grad bis zu 10,8 %.
Umschaltbar über den Knopf "Größen betont / Größen echt".

### Logarithmischer Zeitregler
Zwei Hälften, beide logarithmisch, damit Anfangs- und Endphase fein aufgelöst sind
und die leere Mitte durchrauscht:
```
s ≤ 0.5:  d = D_START · (D_HALF/D_START)^(s/0.5)
s > 0.5:  d = D_TOT - D_HALF · (D_END/D_HALF)^((s-0.5)/0.5)
```
7,7 Dekaden je Hälfte.

### Planetenbewegung
Positionen aus der Missionszeit `t` (Jahre), Phase ab dem Ablegen (`t - T_TOW`).
Während der gesamten Passage durch das Planetensystem vergehen nur 3,2 Jahre,
deshalb ist die Bewegung dort gut sichtbar. Die letzten 0,1 AE vor Proxima dauern
46 Tage, in denen Proxima b vier Umläufe macht.

## Dateien

Das Projekt ist eine React/Vite-SPA, die statisch auf GitHub Pages ausgeliefert wird.
Die drei ursprünglichen Einzeldokumente liegen unter `legacy/` und dienen als Vorlage
der Portierung, sie werden nicht mehr weiterentwickelt.

| Ort | Inhalt |
|---|---|
| `src/domain/` | Auslegungskonstanten, Flugprofil, Deckgeometrie, Darstellungsmathematik. Frei von three.js und React, vollständig unit-getestet |
| `src/infrastructure/` | three.js-Szenenaufbau, i18n, Build-Konfiguration |
| `src/presentation/` | React-Ansichten, Tokens, Komponenten |
| `sources/` | Tickets und Specs, siehe `sources/README.md` |
| `.claude/skills/` | die zehn Skills des Entwicklungsablaufs |
| `scripts/ci-gates.mjs` | die Quality Gates als Code, gespiegelt von den Actions-Workflows |

| Legacy-Datei | Inhalt | Stand |
|---|---|---|
| `legacy/generationenschiff-grundriss.html` | 3D-Schnittansicht des Schiffs, klickbare Sektionen, Decks und ausgerollte Deckpläne mit Raumaufteilung | Vorlage für TASK-001 |
| `legacy/flug-3d-proxima.html` | 3D-Flug durch Sonnensystem, Heliosphäre, Oortwolke bis Proxima b, vier Kameramodi | Vorlage für TASK-001 |
| `legacy/flugbahn-alpha-centauri.html` | ältere 2D-Fassung der Reise: Korridorstreifen, Himmelsfenster mit Helligkeiten | **veraltet**, zielt noch auf α Cen AB |

## Offene Punkte

1. **`flugbahn-alpha-centauri.html` zielt noch auf α Cen AB (4,344 Lj, 476 a).**
   Muss auf Proxima umgestellt werden (4,2465 Lj, 466 a) oder gelöscht werden.
   Das ist die einzige bekannte Inkonsistenz zwischen den Dateien.
2. Die beiden Artefakte sind getrennt. Eine Zusammenführung (aus der Reiseansicht
   ins Schiff hineinzoomen) wäre der nächste logische Schritt.
3. Die Bugschild-Dicke von 3 m ist als Strahlungsschild begründet (275 g/cm²), nicht
   als Erosionsschild. Offen bleibt die Größenverteilung des interstellaren Staubs
   oberhalb eines Millimeters, siehe "Prüfung des Bugschilds".
4. Im Schiffsgrundriss fehlen die Sektionen von Ring B auf der 3D-Ebene
   noch als eigene Klickziele pro Sektor, aktuell ist nur je Deck auswählbar.
5. Die Systemansicht springt bei der Halbstrecke hart zwischen Sonne und Proxima
   als Abbildungszentrum. Ein weicher Übergang wäre schöner.
6. Die Sektorlänge von Deck 5 steht in der Tabelle mit 165,0 m, gerechnet sind es
   164,9 m. Der Überschuss der Fehlrechnung mit fünfmal r=125 beträgt 8,7 %, nicht
   8 %. Beides ist Rundung in dieser Datei, der Code rechnet die exakten Werte.
7. TASK-001 portiert die beiden Szenen. Bis dahin zeigen `/ship` und `/flight` nur
   einen Platzhalter, die lauffähigen Vorlagen liegen unter `legacy/`.
8. Die Schildfläche von 53.100 m² passt zu 260 m Durchmesser, der Rumpf misst 280 m.
   Ein 10 m breiter Ring ist damit rechnerisch ungedeckt.
