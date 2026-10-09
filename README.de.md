# IntentKit / 意译

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

**Aus „Es soll sich so anfühlen“ wird ein sichtbarer, anpassbarer Designentwurf für deinen Coding-Assistenten.**

[Website](https://vibe-design-labs.github.io/Vibe-UI-UX/) · [Studio ausprobieren](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html) · [Änderungen](CHANGELOG.md)

**v0.4.1.2.1 · 75 Designeinträge · 75 eigene Vorschauvorlagen · 5 lokale Rezeptfamilien · MIT + OFL**

[![Echte Studioaufnahme: Blattzeiger, warmes Spotlight, Klickwelle und gestaffeltes Erscheinen](docs/media/effects.gif)](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html?item=custom-cursor)

Mit den tatsächlichen Renderern des Projekts aufgenommen, ohne KI-generierte Bilder. Das GIF ist eine Aufnahme. Im [Studio](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html) kannst du interagieren und Werte einstellen; die Einstellung für reduzierte Bewegung wird berücksichtigt.

## Was ist IntentKit?

Beim Vibe Coding ist es oft schwierig, ein Gefühl präzise zu beschreiben. Bedeutet „leichter“ weniger Anhebung beim Hover, eine Größenänderung oder mehr Freiraum? IntentKit verbindet Alltagssprache mit UI/UX-Begriffen, Aliasnamen, Beispielen und Parametern, damit Design, Entwicklung und Einsteiger dasselbe Ergebnis meinen.

Design Compiler arbeitet nach **Alltagssprache → bearbeitbares Verständnis (Design IR) → geprüftes Rezept → echte Vorschau → Designbeschreibung / Agent-Beschreibung / JSON**. Es ist ein Werkzeug zum Prüfen eines Entwurfs, kein Generator vollständiger Seiten. Beliebiger Modellcode wird nicht ausgeführt.

| Funktion | Aktueller Umfang |
| --- | --- |
| Bibliothek | 75 Einträge mit Begriffen, gepflegten Aliasnamen, Definitionen, Einsatzhinweisen und Quellen |
| Effektstudio | 75 passende Vorlagen, geprüfte Parameter, Beschreibungen, JSON und teilbare Links für einzelne Effekte |
| Design Compiler | 5 lokale Familien: leichte Anhebung, warmes Licht mit Anhebung, Druckfeedback, gestaffelter Eintritt und Klickwelle |
| Mauszeiger | 8 Formen; Farbe, Größe, Nachführung, Klickreaktion und getrennte Spotlight-Einstellungen |
| Sprachen | Oberfläche auf Chinesisch, Englisch, Japanisch, Koreanisch und Deutsch; README-Wechsel über die Links oben |
| Optionale KI | Eigene TokenDance-Verbindung für die Absichtserkennung und bekannte Effektvorschläge |

## Zuerst ohne Schlüssel ausprobieren

1. Öffne das [Studio](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html) und wähle oben rechts Deutsch.
2. Wähle das lokale Beispiel **Karte sanft anheben**. Du kannst auch einen Wunsch eingeben und **Verstehen & erstellen** anklicken. Ohne eingerichteten Key gelten lokale Regeln.
3. Prüfe das Verständnis und öffne die bearbeitbaren Felder für Ziel, Auslöser und Stärke. Standardwerte und Schlussfolgerungen werden getrennt von deiner Aussage angezeigt.
4. Bewege die Maus über die Karte und passe rechts die Werte an. Vorschau, Beschreibung und Rezept verwenden dieselben endgültigen Parameter. Bei einem Widerspruch zur Absicht musst du die aktuellen Werte ausdrücklich bestätigen.
5. Kopiere die **Agent-Beschreibung** aus dem Compiler-Ergebnis in deinen Coding-Assistenten oder exportiere die **Kompilierungs-JSON**. Der bisherige Export rechts bleibt eine getrennte **Einzeleffekt-JSON**.

Für Begriffe kannst du links etwa `frosted glass` oder `backdrop-filter` suchen. **Jeder öffentliche Eintrag hat eine passende Vorschau.** Stile zeigen eigene Materialien und Layouts, Bewegungseinträge echte Animationen, Dashboards klar markierte Beispieldaten und UX-Prinzipien Aufgaben und Zustände. Allgemeine Platzhalter entfallen. Siehe den [Vorschauvertrag](docs/PREVIEW_SCENES.md) (Chinesisch).

![Design Compiler: Verständnis, Vorschau, Parameter und Agent-Beschreibung](docs/media/studio.png)

## TokenDance nur bei Bedarf verbinden

1. Klicke auf TokenDance verbinden. Das Panel lädt den öffentlichen Modellkatalog; dabei wird kein Modell aufgerufen.
2. Autorisiere im Popup einen neuen Key oder gib deinen vorhandenen Key aus der [TokenDance-Keyverwaltung](https://tokendance.space/keys) ein. Die Autorisierung erstellt einen Key nach deiner Bestätigung.
3. Wähle ein Modell mit Chat-Protokoll und **Nur auf dieser Seite behalten**. Wenn der Katalog nicht lädt, kannst du eine offizielle Modell-ID eingeben.
4. Erst ein eingerichteter Key plus ein ausdrücklicher Klick auf **Effekte finden** oder **Verstehen & erstellen** ruft ein Modell auf. TokenDance berechnet die Nutzung. Die fünf lokalen Beispiele bleiben auch mit Key lokal.
5. Mit **Schlüssel löschen** trennst du die Verbindung. **Keys bleiben nur im Seitenspeicher und verschwinden beim Neuladen.** Es gibt kein Kontosystem; Keys werden weder in localStorage oder sessionStorage noch im Repository oder in GitHub Secrets gespeichert. Die Sprachwahl kann gespeichert werden.

GitHub Pages verbindet den Browser direkt mit TokenDance; die lokale Serverversion leitet über die aktuelle Instanz weiter. Gib Keys nur in vertrauenswürdigen Instanzen ein. Bei ungültiger Analyse greifen lokale Regeln, ohne automatische kostenpflichtige Wiederholung. Kostenpflichtige Ende-zu-Ende-Tests mit einem echten Key stehen noch aus. [Integration und Testgrenzen](docs/TOKENDANCE.md) (Chinesisch).

## Fork lokal starten

Benötigt **Node.js 20+**; Inhaltsprüfung und Quellcodepaket zusätzlich **Python 3**. Es gibt keine npm-Abhängigkeiten, daher ist npm install nicht nötig. Zum Start brauchst du keinen Key.

```sh
git clone https://github.com/Vibe-Design-Labs/Vibe-UI-UX.git
cd Vibe-UI-UX
npm run dev
```

Öffne [http://localhost:4173/studio.html](http://localhost:4173/studio.html). Ersetze beim Klonen die URL durch deinen Fork. Nach Änderungen am Quellcode den Server stoppen und neu starten, damit neu gebaut wird.

Prüfen und statische Bereitstellung nachstellen:

```sh
npm test
npm run check:content
npm run check:docs
python scripts/package-source.py
npm run build:pages
npm run preview:pages
```

Statische Vorschau: [http://localhost:4174/Vibe-UI-UX/](http://localhost:4174/Vibe-UI-UX/). Ausgabe: `dist/pages/`. Nutze python3, falls python nicht verfügbar ist. Diese Schritte rufen kein Modell auf.

## Eigene GitHub Pages veröffentlichen

1. Forke das Repository und aktiviere Actions in deinem Fork.
2. Wähle **Settings → Pages → Source → GitHub Actions**.
3. Starte erstmals **Actions → Deploy GitHub Pages → Run workflow**.
4. Öffne nach Erfolg die tatsächliche URL aus Pages oder der Deployment-Ausgabe. Weitere Pushes auf main veröffentlichen automatisch.

Relative Pfade unterstützen Forks und Repository-Unterpfade. **Kein Modell-Key und kein GitHub Secret erforderlich**: Besucher verbinden ihren eigenen TokenDance-Zugang. [Bereitstellungsanleitung](docs/GITHUB_PAGES.md) (Chinesisch).

## Begriffe, Rezepte und Effekte pflegen

Gib den [Pflege-Skill](skills/ui-ux-content-maintainer/SKILL.md) an eine KI mit Dateizugriff oder bearbeite selbst. Für vorhandene Vorlagen ergänzt du JSON in `content/items/`. Neue Renderer brauchen auch Änderungen an Registry und Renderer. Siehe [Rezeptpflege](skills/ui-ux-content-maintainer/references/compiler-recipes.md).

Führe `npm run check:content`, `npm test` und `npm run check:docs` aus. Baue bei Bedarf [Schrift-Teilmengen](docs/FONTS.md), Quellarchiv und Pages neu. Die Skripte brauchen keinen GPT-Key und kein Modellkontingent; andere KI-Dienste können eigene Kosten haben. [Pflegeablauf](docs/CONTENT_MAINTENANCE.md) (Chinesisch).

| Ort | Zweck |
| --- | --- |
| `content/items/` | Begriffe, Aliasnamen, Übersetzungen, Quellen, Prüfstatus |
| `previews/registry.json` + `public/previews.js` | Parameterregeln und Renderer |
| `compiler/` + `public/compiler-*.js` | IR, fünfsprachige Ausdrücke, Rezepte, Prüfung, Oberfläche |
| `public/` | Statische Website, Studio, Übersetzungen, TokenDance |
| `server/worker.js` | Optionaler lokaler Relay; für Pages nicht nötig |
| `.github/workflows/pages.yml` | Prüfung, Verpackung, Build, Veröffentlichung |

## Aktuelle Grenzen

- Eintragstexte sind überwiegend chinesische/englische Entwürfe. Japanische, koreanische und deutsche Inhalte fallen ausdrücklich auf Englisch zurück. Fünf Oberflächensprachen bedeuten keine fünf vollständig geprüften Wissensbestände.
- Lokale Regeln decken fünf Rezeptfamilien ab. Unklare und nicht unterstützte Wünsche werden aufgeführt. Kombinationen mehrerer Vorlagen, Federn und die automatische Übernahme exakter Zahlen aus Sätzen fehlen noch.
- Strukturprüfung bestätigt weder Fakten noch Übersetzungen. Die strenge Inhaltsfreigabe scheitert weiterhin an Entwürfen. Nicht lesbare WeChat-Artikel wurden nicht als gelesene Quellen ausgegeben.
- Vorschauen zeigen Konzepte und speichern keine echten Daten. Prüfe Exporte vor der Umsetzung. Reduzierte Bewegung, Touch und Tastatur werden berücksichtigt.

[Compiler-Details](docs/DESIGN_COMPILER.md) · [50 neue Einträge und Quellen](docs/CONTENT_EXPANSION_2026-10-07.md) · [Release-Prüfungen](docs/RELEASE_0.4.1.2.0.md) · [Fünfteilige Versionen](docs/VERSIONING.md) — die Detaildokumentation ist derzeit Chinesisch.

## Lizenz und Dank

Anwendungscode: [MIT](LICENSE). Die Schriften Ma Shan Zheng, LXGW WenKai und Caveat: **SIL OFL 1.1**, mit vollständigen Hinweisen und Build-Schritten in der [Schriftdokumentation](docs/FONTS.md). README-Bilder zeigen die tatsächliche Projektoberfläche.

Die frühe Interaktionsrichtung orientierte sich an Hyperknow; Papier, Tusche, Zinnoberrot und Handschrift an Nutzerreferenzen. Layout und Code sind eigenständig; Bilder, Marken und Komponentenquellen der Referenzseite wurden nicht übernommen. Verlässliche Quellen, Übersetzungen, reproduzierbare Effekte und Fehlerberichte sind über [Issues](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/issues) willkommen.
