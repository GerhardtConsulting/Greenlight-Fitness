# DSGVO & EU-Compliance — Übersicht für den Betreiber

**Greenlight Fitness Plattform**  
Stand: Februar 2026

> **Hinweis:** Dieses Dokument stellt **keine Rechtsberatung** dar. Es dient als verständliche Übersicht über alle technischen und organisatorischen Maßnahmen, die in der App implementiert wurden. Der Betreiber sollte die Angaben mit einem Rechtsanwalt oder Datenschutzbeauftragten prüfen und die mit ⚠️ markierten Platzhalter vor dem Go-Live ersetzen.

---

## Inhaltsverzeichnis

1. [Was wurde eingebaut? (Kurzübersicht)](#1-was-wurde-eingebaut)
2. [Die vier Rechtstexte im Detail](#2-die-vier-rechtstexte)
3. [Technische DSGVO-Maßnahmen](#3-technische-dsgvo-maßnahmen)
4. [EU AI Act Compliance](#4-eu-ai-act-compliance)
5. [Finanzdaten & steuerliche Aufbewahrung](#5-finanzdaten--steuerliche-aufbewahrung)
6. [Nutzerrechte — Was kann der Nutzer tun?](#6-nutzerrechte)
7. [Checkliste: Was muss der Betreiber noch liefern?](#7-checkliste-platzhalter)
8. [Checkliste: Regelmäßige Pflichten](#8-checkliste-regelmäßige-pflichten)

---

## 1. Was wurde eingebaut?

Hier eine einfache Übersicht über alle Compliance-Bausteine, die in die App integriert sind:

| Baustein | Was ist das? | Wo in der App? |
|----------|-------------|----------------|
| **Datenschutzerklärung** | Erklärt Nutzern, welche Daten gesammelt werden und warum | `/legal/privacy` — 17 Abschnitte, 2.0 |
| **AGB (Allgemeine Geschäftsbedingungen)** | Regelt die Nutzungsbedingungen der Plattform | `/legal/terms` — 21 Paragraphen, 2.0 |
| **Transparenzerklärung** | Erklärt den Einsatz von KI und Automatisierung (EU AI Act) | `/legal/transparency` — 9 Abschnitte, 1.0 |
| **Impressum** | Gesetzlich vorgeschriebene Anbieterkennzeichnung | `/legal/imprint` — vollständig nach §5 DDG |
| **Consent-Logging** | Speichert, wann ein Nutzer welcher Version zugestimmt hat | Datenbank-Tabelle `consent_logs` |
| **Rechtstext-Versionierung** | Jede Änderung an Rechtstexten wird versioniert und nachvollziehbar | Datenbank-Tabelle `legal_versions` |
| **Audit-Log** | Protokolliert sicherheitsrelevante Aktionen (Login, Änderungen, Löschungen) | Datenbank-Tabelle `audit_logs` |
| **Datenexport** | Nutzer können alle ihre Daten als JSON herunterladen (Art. 20 DSGVO) | Profil-Seite → „Daten exportieren" |
| **Löschantrag** | Nutzer können die Löschung ihres Kontos beantragen (Art. 17 DSGVO) | Profil-Seite → „Konto löschen" |
| **Anonymisierung statt Löschung** | Bei Löschung werden Daten anonymisiert, Finanzdaten bleiben (§147 AO) | Datenbank-Funktion `anonymize_user()` |
| **Purchase Ledger** | Alle Käufe/Abos werden doppelt gespeichert (Stripe + eigene DB) | Datenbank-Tabelle `purchase_ledger` |
| **E-Mail Opt-out** | Jeder E-Mail-Typ einzeln abwählbar + One-Click-Unsubscribe | Einstellungen + Link in jeder E-Mail |
| **Keine Tracking-Cookies** | Die App verwendet keine Cookies, kein Analytics, kein Tracking | Dokumentiert in Datenschutzerklärung |
| **Row Level Security (RLS)** | Jeder Nutzer sieht nur seine eigenen Daten in der Datenbank | Auf allen Tabellen aktiviert |

---

## 2. Die vier Rechtstexte

### 2.1 Datenschutzerklärung (Privacy Policy)

**Pfad:** `/legal/privacy` | **Version:** 2.0 | **Gültig ab:** 01.02.2026

Was steht drin (17 Abschnitte):

1. **Datenschutz auf einen Blick** — Zusammenfassung der wichtigsten Punkte
2. **Verantwortliche Stelle** — Wer ist für die Daten verantwortlich (→ Betreiber-Daten ⚠️)
3. **Datenschutzbeauftragter** — Kontaktdaten für Datenschutz-Anfragen (⚠️)
4. **Betroffenenrechte** — Alle Rechte nach Art. 15–22 DSGVO mit konkreter Umsetzung in der App
5. **Registrierung & Anmeldung** — Welche Daten bei der Registrierung erfasst werden
6. **Profildaten** — Was im Nutzerprofil gespeichert wird
7. **Gesundheitsdaten (Art. 9)** — Besonders geschützte Daten (Gewicht, Körperfett etc.) — nur mit Einwilligung
8. **Trainingsdaten** — Workout-Logs, Pläne, Fortschritte
9. **Check-In-Daten** — Wöchentliche Wellness-Daten (Stimmung, Energie, Stress)
10. **Chat-Kommunikation** — Coach-Athlet-Nachrichten
11. **Zahlungsdaten** — Stripe als Zahlungsdienstleister (keine Kreditkartendaten bei uns)
12. **Technische Daten** — Was der Browser automatisch sendet
13. **Auftragsverarbeiter** — Wer unsere Daten verarbeitet (Supabase, Vercel, Stripe, Resend, Google Gemini)
14. **Internationale Datenübermittlung** — Daten in die USA (mit Schutzmaßnahmen)
15. **Cookies und Local Storage** — Keine Tracking-Cookies, nur funktionale Daten
16. **Automatisierte Entscheidungsfindung** — Churn-Erkennung und KPIs (nur informativ, keine Konsequenzen)
17. **Speicherdauer, Sicherheit, Aufsichtsbehörde** — Wie lange Daten gespeichert werden, TOM, Beschwerderecht

### 2.2 AGB (Terms of Service)

**Pfad:** `/legal/terms` | **Version:** 2.0 | **Gültig ab:** 01.02.2026

Was steht drin (21 Paragraphen):

- **§1–3:** Geltungsbereich, Vertragsschluss, Leistungsbeschreibung
- **§4–6:** Nutzerrollen (Athlet, Coach, Admin) mit spezifischen Rechten und Pflichten
- **§7:** Zahlungen und Abonnements via Stripe
- **§8:** Vollständige Widerrufsbelehrung (14 Tage, mit Muster-Formular)
- **§9:** Preisänderungen (30 Tage Vorlauf)
- **§10–12:** Nutzerrechte, verbotene Nutzung, geistiges Eigentum
- **§13:** Verfügbarkeit (99% Ziel, geplante Wartung)
- **§14:** Gesundheitshinweis (App ersetzt keinen Arzt)
- **§15:** Haftungsbeschränkung
- **§16–18:** Benachrichtigungen, Datenschutz-Verweis, Kündigung und Kontolöschung
- **§19–21:** AGB-Änderungen, Streitbeilegung, Schlussbestimmungen

### 2.3 Transparenzerklärung (EU AI Act)

**Pfad:** `/legal/transparency` | **Version:** 1.0 | **Gültig ab:** 01.02.2026

Was steht drin (9 Abschnitte):

- Welche **KI-Systeme** eingesetzt werden (Google Gemini für Übungsbeschreibungen)
- Welche **automatisierten Systeme** laufen (Churn-Erkennung, KPI-Berechnung, E-Mail-Dispatch, Attention-Alerts)
- **Risikobewertung** nach EU AI Act — alle Systeme sind als „minimales Risiko" eingestuft
- **Keine Hochrisiko-KI** — keine biometrische Identifizierung, kein Social Scoring
- **Menschliche Aufsicht** — KI macht Vorschläge, Menschen entscheiden
- **Nutzerrechte** bei automatisierter Verarbeitung
- **Datenminimierung** — KI erhält keine personenbezogenen Daten

### 2.4 Impressum

**Pfad:** `/legal/imprint` | **Version:** 2.0

Was steht drin:

- Angaben gemäß §5 DDG/TMG (⚠️ Platzhalter)
- Vertretungsberechtigter Geschäftsführer (⚠️)
- Kontaktdaten (Telefon, E-Mail, Website)
- Registergericht und Handelsregisternummer (⚠️)
- Umsatzsteuer-Identifikationsnummer (⚠️)
- Inhaltlich Verantwortlicher nach §18 MStV
- EU-Streitschlichtung und VSBG
- Haftung für Inhalte und Links
- Urheberrecht

---

## 3. Technische DSGVO-Maßnahmen

### 3.1 Consent-System (Art. 7 DSGVO — Nachweispflicht)

**Was es tut:** Wenn sich ein Nutzer registriert, wird in der Datenbank gespeichert:
- Welchem Dokument er zugestimmt hat (AGB, Datenschutz)
- Welche **Version** des Dokuments gültig war
- Wann die Zustimmung erfolgte
- Von welchem Gerät (User-Agent)

**Warum:** Die DSGVO verlangt, dass der Betreiber jederzeit **nachweisen** kann, dass ein Nutzer zugestimmt hat.

### 3.2 Rechtstext-Versionierung

**Was es tut:** Jede Version jedes Rechtstexts wird in einer eigenen Datenbank-Tabelle (`legal_versions`) gespeichert mit:
- Dokumenttyp (PRIVACY, TERMS, TRANSPARENCY, IMPRINT)
- Versionsnummer (z.B. 2.0)
- Zusammenfassung der Änderungen
- Gültigkeitsdatum
- Ob es die aktuelle Version ist

**Warum:** Wenn sich Rechtstexte ändern, muss nachvollziehbar sein, welcher Version ein Nutzer zugestimmt hat. Alte Versionen dürfen nicht gelöscht werden.

### 3.3 Audit-Log (Art. 30 DSGVO — Verarbeitungsverzeichnis)

**Was es tut:** Protokolliert automatisch sicherheitsrelevante Aktionen:
- Konto erstellt
- Profil geändert
- Datenexport durchgeführt
- Löschantrag gestellt
- Nutzer anonymisiert

**Warum:** Der Betreiber muss nachweisen können, wer wann was mit Daten gemacht hat.

### 3.4 Datenexport (Art. 20 DSGVO — Datenportabilität)

**Was der Nutzer tun kann:** In den Profileinstellungen auf „Daten exportieren" klicken. Er erhält eine JSON-Datei mit allen seinen Daten (Profil, Workouts, Check-Ins, etc.).

**Warum:** Jeder Nutzer hat das Recht, seine Daten in einem maschinenlesbaren Format zu erhalten.

### 3.5 Löschantrag und Anonymisierung (Art. 17 DSGVO)

**Was der Nutzer tun kann:** In den Profileinstellungen „Konto löschen" beantragen.

**Was dann passiert:**
1. Der Antrag wird in der Datenbank gespeichert
2. Ein Admin führt die Anonymisierung durch (Funktion `anonymize_user()`)
3. **Persönliche Daten werden anonymisiert:** Name → „Gelöschter Nutzer", E-Mail → Hash, alle PII → NULL
4. **Finanzdaten bleiben erhalten** (anonymisiert, ohne Personenbezug) — gesetzlich vorgeschrieben für 10 Jahre (§147 AO)
5. **Chat-Nachrichten, Workouts, Check-Ins werden gelöscht**
6. **Coaching-Beziehungen werden aufgelöst**
7. Ein Audit-Log-Eintrag dokumentiert den Vorgang

**Warum beides (Anonymisierung + Archivierung)?**  
Die DSGVO sagt: „Lösche persönliche Daten." Das Steuerrecht (§147 AO) sagt: „Bewahre Finanzdaten 10 Jahre auf." Die Lösung: Finanzdaten bleiben, aber ohne Personenbezug (anonymisiert).

### 3.6 Row Level Security (RLS)

**Was es tut:** Auf Datenbankebene ist sichergestellt, dass jeder Nutzer nur seine eigenen Daten sehen und bearbeiten kann. Auch wenn jemand die API direkt aufruft (ohne die App), kann er keine fremden Daten abrufen.

**Warum:** Technische Sicherung gegen unbefugten Zugriff — eine der wichtigsten DSGVO-Maßnahmen (Art. 32).

### 3.7 E-Mail-Benachrichtigungen (DSGVO-konform)

**Was eingebaut ist:**
- Jeder E-Mail-Typ (Trainings-Erinnerung, Check-In-Reminder, Wochen-Report) kann **einzeln** an- und abgewählt werden
- Es gibt einen **globalen E-Mail-Killswitch** (alles aus)
- Jede E-Mail enthält einen **One-Click-Unsubscribe-Link**
- Vor jedem Versand wird geprüft, ob der Nutzer diesen Typ aktiviert hat
- Maximal 1 E-Mail pro Typ pro 20 Stunden (Spam-Schutz)

### 3.8 Keine Tracking-Cookies

Die App verwendet **keine** Cookies für Tracking, Analytics oder Werbung. Es werden nur funktionale Daten im Local Storage gespeichert (Auth-Token, Spracheinstellung). Deshalb ist **kein Cookie-Banner** notwendig.

---

## 4. EU AI Act Compliance

Die EU hat 2024 das weltweit erste KI-Gesetz verabschiedet (Verordnung (EU) 2024/1689). Hier ist, was das für die App bedeutet:

### Was nutzt die App an KI?

| System | Was es tut | Risiko-Einstufung |
|--------|-----------|-------------------|
| **Google Gemini** | Generiert Übungsbeschreibungen und Anleitungen | Minimales Risiko |

### Was nutzt die App an Automatisierung (ohne KI)?

| System | Was es tut | Risiko-Einstufung |
|--------|-----------|-------------------|
| **Churn-Erkennung** | Informiert Coaches, wenn ein Athlet inaktiv wird | Minimales Risiko |
| **E-Mail-Dispatch** | Versendet Erinnerungen und Reports | Minimales Risiko |
| **Attention-Alerts** | Informiert Coach bei kritischen Check-In-Werten | Minimales Risiko |
| **KPI-Berechnung** | Berechnet Statistiken für Dashboard | Minimales Risiko |

### Wichtig zu wissen:
- Die KI (Gemini) erhält **keine personenbezogenen Daten** — nur Übungsnamen und Kategorien
- KI-generierte Inhalte werden als solche **gekennzeichnet**
- Die Churn-Erkennung hat **keine Konsequenzen** für den Athleten — der Coach wird nur informiert
- Alle automatisierten Benachrichtigungen sind **abwählbar**
- Es gibt **keine Hochrisiko-KI-Systeme** in der App

---

## 5. Finanzdaten & steuerliche Aufbewahrung

### Doppelte Buchführung (Stripe + Purchase Ledger)

Alle Zahlungsvorgänge werden an zwei Orten gespeichert:

1. **Stripe** — Der Zahlungsdienstleister speichert alle Transaktionen (PCI DSS Level 1 zertifiziert)
2. **Purchase Ledger** — Eine eigene Datenbank-Tabelle, die jede Transaktion nochmal protokolliert

### Was wird im Purchase Ledger gespeichert?
- Kaufabschlüsse (Checkout completed)
- Abo-Erstellungen, -Änderungen, -Kündigungen
- Bezahlte und fehlgeschlagene Rechnungen
- Beträge, Währung, MwSt.
- Stripe-Referenz-IDs (für Abgleich)
- Produktname (überlebt auch Produktlöschung)

### Warum doppelt?
- **§147 AO** verlangt 10 Jahre Aufbewahrung von Geschäftsunterlagen
- Wenn Stripe-Zugang verloren geht, hat der Betreiber immer noch alle Daten
- Bei Löschung eines Nutzers wird die `user_id` entfernt, aber der Finanzeintrag bleibt (anonymisiert)

---

## 6. Nutzerrechte

Was kann ein Nutzer in der App selbst tun (ohne den Betreiber kontaktieren zu müssen)?

| Recht | DSGVO-Artikel | In der App |
|-------|---------------|------------|
| **Auskunft** | Art. 15 | Profil → „Daten exportieren" (JSON-Download) |
| **Berichtigung** | Art. 16 | Profil → Daten bearbeiten |
| **Löschung** | Art. 17 | Profil → „Konto löschen" (Löschantrag) |
| **Datenportabilität** | Art. 20 | Profil → „Daten exportieren" (maschinenlesbares JSON) |
| **Widerspruch (E-Mails)** | Art. 21 | Einstellungen → Benachrichtigungen einzeln abwählen |
| **Einschränkung** | Art. 18 | Per E-Mail an datenschutz@... (⚠️) |
| **Widerruf der Einwilligung** | Art. 7(3) | Per E-Mail an datenschutz@... (⚠️) |
| **Beschwerde** | Art. 77 | Bei der zuständigen Aufsichtsbehörde (⚠️) |

---

## 7. Checkliste: Was muss der Betreiber noch liefern?

> ⚠️ = Platzhalter, die vor dem Go-Live durch echte Daten ersetzt werden müssen

### Unternehmensdaten (in `Legal.tsx`, Konstante `COMPANY`)

| Feld | Aktueller Platzhalter | Was einsetzen? |
|------|----------------------|----------------|
| ⚠️ **Firmenname** | `Greenlight Fitness GmbH` | Echter Firmenname |
| ⚠️ **Rechtsform** | `GmbH` | Echte Rechtsform (GmbH, UG, Einzelunternehmen...) |
| ⚠️ **Straße** | `Musterstraße 11` | Echte Geschäftsadresse |
| ⚠️ **PLZ + Stadt** | `10115 Berlin` | Echter Standort |
| ⚠️ **Telefon** | `+49 (0) 123 44 55 66` | Echte Telefonnummer |
| ⚠️ **E-Mail** | `info@greenlight-fitness.de` | Echte Kontakt-E-Mail |
| ⚠️ **Datenschutz-E-Mail** | `datenschutz@greenlight-fitness.de` | Echte Datenschutz-E-Mail |
| ⚠️ **Support-E-Mail** | `support@greenlight-fitness.de` | Echte Support-E-Mail |
| ⚠️ **Geschäftsführer** | `Max Mustermann` | Echter Name des Vertretungsberechtigten |
| ⚠️ **Registergericht** | `Amtsgericht Charlottenburg, HRB 000000` | Echtes Registergericht + HRB-Nummer |
| ⚠️ **USt-IdNr.** | `DE000000000` | Echte Umsatzsteuer-ID |
| ⚠️ **Website-URL** | `https://greenlight-fitness.de` | Echte Domain |
| ⚠️ **App-URL** | `https://app.greenlight-fitness.de` | Echte App-Domain |

**Wo ändern?**  
Datei: `pages/Legal.tsx`, Zeilen 6–22 — die `COMPANY`-Konstante. Alle Rechtstexte verwenden diese Konstante, d.h. **eine Änderung reicht für alle vier Dokumente**.

### Weitere Pflichten vor Go-Live

| # | Aufgabe | Status | Priorität |
|---|---------|--------|-----------|
| 1 | ⚠️ **Echte Unternehmensdaten** in `COMPANY`-Konstante eintragen | Offen | KRITISCH |
| 2 | ⚠️ **E-Mail-Adressen einrichten** (info@, datenschutz@, support@) | Offen | KRITISCH |
| 3 | ⚠️ **Datenschutzbeauftragten benennen** (ab 20 Mitarbeitern Pflicht, bei Gesundheitsdaten empfohlen) | Offen | HOCH |
| 4 | ⚠️ **Verarbeitungsverzeichnis erstellen** (Art. 30 DSGVO) — Vorlage beim LDA | Offen | HOCH |
| 5 | ⚠️ **Auftragsverarbeitungsverträge (AVV)** abschließen mit: Supabase, Vercel, Stripe, Resend | Offen | KRITISCH |
| 6 | ⚠️ **Stripe Live-Keys** eintragen (aktuell Test-Modus) | Offen | KRITISCH |
| 7 | ⚠️ **Stripe Webhook Secret** für Produktion konfigurieren | Offen | KRITISCH |
| 8 | ⚠️ **Domain & SSL** einrichten (HTTPS ist Pflicht) | Offen | KRITISCH |
| 9 | ⚠️ **Zuständige Aufsichtsbehörde** in DSE eintragen (je nach Bundesland) | Offen | MITTEL |
| 10 | ⚠️ **Rechtstexte durch Anwalt prüfen** lassen | Offen | HOCH |
| 11 | ⚠️ **Datenschutz-Folgenabschätzung** prüfen (Art. 35 DSGVO, bei Gesundheitsdaten empfohlen) | Offen | HOCH |
| 12 | ⚠️ **Backup-Strategie** umsetzen (siehe `docs/BACKUP_AND_DATA_HANDLING.md`) | Offen | HOCH |
| 13 | ⚠️ **Supabase Pro Plan** für Point-in-Time Recovery (Backups) | Offen | HOCH |
| 14 | ⚠️ **Resend Domain verifizieren** (damit E-Mails nicht im Spam landen) | Offen | MITTEL |
| 15 | ⚠️ **Impressums-Pflicht prüfen** — je nach Rechtsform ggf. weitere Angaben nötig | Offen | MITTEL |

---

## 8. Checkliste: Regelmäßige Pflichten

### Monatlich

- [ ] Offene Löschanträge prüfen und bearbeiten (Frist: 30 Tage!)
- [ ] Datenbank-Backup erstellen und verschlüsselt speichern
- [ ] Purchase Ledger mit Stripe-Dashboard abgleichen
- [ ] Audit-Logs auf verdächtige Aktivitäten prüfen

### Quartalsweise

- [ ] Aufbewahrungsfristen prüfen → abgelaufene Daten bereinigen
- [ ] Rechtstexte auf Aktualität prüfen (neue Gesetze? neue Dienstleister?)
- [ ] AVV mit Dienstleistern auf Gültigkeit prüfen

### Jährlich

- [ ] Datenschutz-Folgenabschätzung überprüfen
- [ ] Sicherheits-Audit der Plattform
- [ ] Mitarbeiter-Schulung Datenschutz (falls Mitarbeiter vorhanden)
- [ ] Backup-Strategie evaluieren

### Bei Rechtstext-Änderungen

1. Neuen Eintrag in `legal_versions`-Tabelle erstellen
2. Änderungen in `Legal.tsx` einpflegen + Versionsnummer hochzählen
3. Alle Nutzer **30 Tage vorher** per E-Mail informieren
4. `consent_version` in `Register.tsx` aktualisieren
5. Am Gültigkeitstag: `is_current` in der Datenbank umschalten

### Bei Löschanträgen

1. Antrag in der Datenbank prüfen (`data_deletion_requests`)
2. Identität des Antragstellers verifizieren
3. Offene Abonnements kündigen
4. `SELECT public.anonymize_user('USER_ID')` ausführen
5. Stripe-Kundendaten separat löschen
6. Bestätigung an den Nutzer senden
7. **Alles innerhalb von 30 Tagen** (Art. 12 Abs. 3 DSGVO)

---

## Weiterführende Dokumente

| Dokument | Pfad | Beschreibung |
|----------|------|-------------|
| Backup & Datenhandhabung | `docs/BACKUP_AND_DATA_HANDLING.md` | Detaillierte Backup-Strategie, Aufbewahrungsfristen, SQL-Referenz |
| DB-Schema | `supabase-schema.sql` | Komplettes Datenbankschema |
| Compliance-Migration | `scripts/create-compliance-tables.sql` | SQL für legal_versions, purchase_ledger, archived_users, anonymize_user() |
| API-Dokumentation | `docs/API_DOCUMENTATION.md` | Alle Serverless Functions |
| E-Mail-System | `docs/EMAIL_LANDING_PAGES.md` | E-Mail-Templates und Landing Pages |

---

*Erstellt: Februar 2026 | Dieses Dokument stellt keine Rechtsberatung dar.*
